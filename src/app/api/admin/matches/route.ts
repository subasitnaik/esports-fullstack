import { NextResponse } from "next/server";
import { adminStore } from "@/lib/admin-store";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const modeId = searchParams.get("modeId");
  let matches = adminStore.matches(modeId ?? undefined);
  if (modeId && admin.gamesAccessType === "specific" && !admin.isMasterAdmin) {
    const mode = adminStore.getMode(modeId);
    if (mode && !admin.allowedGameIds.includes(mode.gameId)) {
      return NextResponse.json({ error: "No access to this mode" }, { status: 403 });
    }
  }
  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminStore.canAccessGames(admin.id)) {
    return NextResponse.json({ error: "No games access" }, { status: 403 });
  }
  const { gameModeId, title, entryFee, maxParticipants, scheduledAt, matchType, prizePool } =
    await request.json();
  if (!gameModeId || !title || entryFee == null) {
    return NextResponse.json(
      { error: "gameModeId, title, and entryFee are required" },
      { status: 400 }
    );
  }
  const validMatchType = ["solo", "duo", "squad"].includes(matchType) ? matchType : "solo";
  const validPrizePool = prizePool && typeof prizePool.coinsPerKill === "number" && Array.isArray(prizePool.rankRewards)
    ? {
        coinsPerKill: Number(prizePool.coinsPerKill),
        totalPrizePool: prizePool.totalPrizePool != null ? Number(prizePool.totalPrizePool) : 0,
        rankRewards: (prizePool.rankRewards as { fromRank: number; toRank: number; coins: number }[])
          .filter((r) => r && typeof r.fromRank === "number" && typeof r.toRank === "number" && typeof r.coins === "number")
          .map((r) => ({ fromRank: r.fromRank, toRank: r.toRank, coins: r.coins })),
      }
    : { coinsPerKill: 5, totalPrizePool: 0, rankRewards: [{ fromRank: 1, toRank: 5, coins: 30 }] };
  const mode = adminStore.getMode(gameModeId);
  if (mode && admin.gamesAccessType === "specific" && !admin.isMasterAdmin && !admin.allowedGameIds.includes(mode.gameId)) {
    return NextResponse.json({ error: "No access to this game" }, { status: 403 });
  }
  const match = adminStore.addMatch(
    gameModeId,
    title,
    Number(entryFee),
    Number(maxParticipants) || 16,
    scheduledAt || new Date().toISOString(),
    validMatchType,
    validPrizePool
  );
  return NextResponse.json(match);
}
