import { NextResponse } from "next/server";
import { adminStore } from "@/lib/admin-store";

export async function GET() {
  const games = adminStore.games();
  return NextResponse.json(games);
}
