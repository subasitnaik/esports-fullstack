import { NextResponse } from "next/server";
import { adminStore } from "@/lib/admin-store";
import { getAdminSession } from "@/lib/admin-auth";

function checkMatchAccess(adminId: string, matchId: string): boolean {
  const admin = adminStore.getAdminById(adminId);
  const match = adminStore.getMatch(matchId);
  if (!admin || !match) return false;
  const mode = adminStore.getMode(match.gameModeId);
  if (!mode) return false;
  if (admin.isMasterAdmin || admin.gamesAccessType === "all") return true;
  return admin.allowedGameIds.includes(mode.gameId);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!checkMatchAccess(admin.id, id)) {
    return NextResponse.json({ error: "No access to this match" }, { status: 403 });
  }
  const match = adminStore.getMatch(id);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  let roomCode = match.roomCode;
  let roomPassword = match.roomPassword;
  try {
    const body = await request.json();
    if (body?.roomCode) roomCode = body.roomCode;
    if (body?.roomPassword) roomPassword = body.roomPassword;
  } catch {
    // No body - use room from match
  }
  if (!roomCode || !roomPassword) {
    return NextResponse.json(
      { error: "Room code and password must be set first. Update the match with room info, then start." },
      { status: 400 }
    );
  }
  const updated = adminStore.startMatch(id, roomCode, roomPassword);
  if (!updated) {
    return NextResponse.json({ error: "Match not found or not upcoming" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
