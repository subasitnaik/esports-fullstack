import { NextResponse } from "next/server";
import { adminStore } from "@/lib/admin-store";
import { getAdminSession } from "@/lib/admin-auth";

function checkGameAccess(adminId: string, gameId: string): boolean {
  const admin = adminStore.getAdminById(adminId);
  if (!admin) return false;
  if (admin.isMasterAdmin || admin.gamesAccessType === "all") return true;
  return admin.allowedGameIds.includes(gameId);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!checkGameAccess(admin.id, id)) {
    return NextResponse.json({ error: "No access to this game" }, { status: 403 });
  }
  const ok = adminStore.deleteGame(id);
  if (!ok) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!checkGameAccess(admin.id, id)) {
    return NextResponse.json({ error: "No access to this game" }, { status: 403 });
  }
  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const game = adminStore.renameGame(id, name);
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  return NextResponse.json(game);
}
