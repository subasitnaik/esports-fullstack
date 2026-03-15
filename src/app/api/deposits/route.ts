import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, utr } = body;
    if (!userId || typeof userId !== "string" || !utr || typeof utr !== "string") {
      return NextResponse.json({ error: "userId and utr required" }, { status: 400 });
    }
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }
    const store = getStore();
    const user = await store.getUser(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBlocked) return NextResponse.json({ error: "User is blocked" }, { status: 403 });
    const req = await store.addDepositRequest(userId, num, utr);
    return NextResponse.json(req);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
