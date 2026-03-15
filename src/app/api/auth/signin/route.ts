import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const user = await getStore().getUserByEmail(email.trim());
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.isBlocked) {
      return NextResponse.json({ error: "Account is blocked" }, { status: 403 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
