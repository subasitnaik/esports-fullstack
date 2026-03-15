import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }
  const store = getStore();
  const modes = await store.gameModes(gameId);
  return NextResponse.json(modes);
}
