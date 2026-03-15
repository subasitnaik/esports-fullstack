import { NextResponse } from "next/server";
import { adminStore } from "@/lib/admin-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }
  const modes = adminStore.gameModes(gameId);
  return NextResponse.json(modes);
}
