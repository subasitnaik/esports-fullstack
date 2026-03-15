import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, displayName } = body;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const name = typeof displayName === "string" && displayName.trim()
      ? displayName.trim()
      : email.substring(0, email.indexOf("@")) || "User";
    const user = await getStore().addUser(email.trim(), name);
    if (!user) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
