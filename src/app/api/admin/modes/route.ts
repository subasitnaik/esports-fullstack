import { NextResponse } from "next/server";
import { adminStore } from "@/lib/admin-store";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  let modes = adminStore.gameModes(gameId ?? undefined);
  if (gameId && admin.gamesAccessType === "specific" && !admin.isMasterAdmin) {
    if (!admin.allowedGameIds.includes(gameId)) {
      return NextResponse.json({ error: "No access to this game" }, { status: 403 });
    }
  }
  return NextResponse.json(modes);
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminStore.canAccessGames(admin.id)) {
    return NextResponse.json({ error: "No games access" }, { status: 403 });
  }
  const { gameId, name, imageUrl } = await request.json();
  if (!gameId || !name) {
    return NextResponse.json(
      { error: "gameId and name are required" },
      { status: 400 }
    );
  }
  if (admin.gamesAccessType === "specific" && !admin.isMasterAdmin && !admin.allowedGameIds.includes(gameId)) {
    return NextResponse.json({ error: "No access to this game" }, { status: 403 });
  }
  const mode = adminStore.addGameMode(gameId, name, imageUrl ?? null);
  return NextResponse.json(mode);
}
