import { NextResponse } from "next/server";
import { adminStore } from "@/lib/admin-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = adminStore.getMatch(id);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  // Map scheduledAt to startsAt for Android app compatibility
  return NextResponse.json({ ...match, startsAt: match.scheduledAt });
}
