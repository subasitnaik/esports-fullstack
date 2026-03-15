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

export async function GET(
  _request: Request,
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
  const participants = adminStore.getParticipantsForMatch(id);
  return NextResponse.json({ ...match, participants });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!checkMatchAccess(admin.id, id)) {
    return NextResponse.json({ error: "No access to this match" }, { status: 403 });
  }
  const ok = adminStore.deleteMatch(id);
  if (!ok) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!checkMatchAccess(admin.id, id)) {
    return NextResponse.json({ error: "No access to this match" }, { status: 403 });
  }
  const body = await request.json();
  const match = adminStore.getMatch(id);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (body.title != null && typeof body.title === "string") {
    adminStore.renameMatch(id, body.title);
  }
  if (match.status === "upcoming" && body.roomCode != null && body.roomPassword != null) {
    adminStore.updateMatchRoomInfo(id, String(body.roomCode), String(body.roomPassword));
  }
  const updated = adminStore.getMatch(id);
  const participants = adminStore.getParticipantsForMatch(id);
  return NextResponse.json({ ...updated, participants });
}
