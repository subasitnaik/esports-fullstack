import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const store = getStore();
  const [transactions, withdrawals] = await Promise.all([
    store.transactions(userId),
    store.getWithdrawalRequestsByUser(userId),
  ]);

  const txItems = transactions.map((t) => {
    const isCredit = t.type === "admin_add" || t.type === "refund" || t.type === "deposit" || t.type === "signup_bonus";
    const isWithdraw = t.type === "withdraw" || t.type === "withdraw_failed";
    let status: "pending" | "successful" | "failed" | undefined;
    let note = t.description ?? t.type;
    if (t.type === "withdraw") {
      status = "successful";
      note = "Withdraw";
    } else if (t.type === "withdraw_failed") {
      status = "failed";
      note = t.description ?? "Withdrawal rejected";
    } else if (t.type === "deposit_failed") {
      note = t.description ?? "Deposit rejected";
    }
    return {
      id: t.id,
      amount: t.amount,
      type: isCredit ? "credit" : "debit",
      note,
      status,
      createdAt: t.createdAt,
    };
  });

  const pendingWithdrawals = withdrawals
    .filter((w) => w.status === "pending")
    .map((w) => ({
      id: w.id,
      amount: w.amount,
      type: "debit" as const,
      note: "Withdraw",
      status: "pending" as const,
      createdAt: w.createdAt,
    }));

  const merged = [...txItems, ...pendingWithdrawals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json(merged);
}
