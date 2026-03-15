import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, upiId } = body;
    if (!userId || typeof userId !== "string" || !upiId || typeof upiId !== "string") {
      return NextResponse.json({ error: "userId and upiId required" }, { status: 400 });
    }
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }
    const store = getStore();
    const user = await store.getUser(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBlocked) return NextResponse.json({ error: "Account is blocked" }, { status: 403 });
    if (user.coins < num) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    const req = await store.addWithdrawalRequest(userId, num, upiId.trim());
    if (!req) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    return NextResponse.json(req);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
