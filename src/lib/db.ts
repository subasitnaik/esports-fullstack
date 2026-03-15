/**
 * Supabase database layer for app_users, deposits, withdrawals, transactions, admins, settings.
 * Use when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 */

import bcrypt from "bcryptjs";
import { getSupabase } from "./supabase";

// Types matching admin-store
export type DbUser = { id: string; email: string; displayName: string; coins: number; isBlocked?: boolean };
export type DbDepositRequest = { id: string; userId: string; amount: number; utr: string; status: string; createdAt: string };
export type DbWithdrawalRequest = {
  id: string;
  userId: string;
  amount: number;
  upiId: string;
  status: string;
  rejectNote?: string;
  chargePercent?: number;
  createdAt: string;
};
export type DbCoinTransaction = {
  id: string;
  userId: string;
  amount: number;
  type: string;
  referenceId?: string;
  referenceText?: string;
  description?: string;
  createdAt: string;
};
export type DbAdmin = {
  id: string;
  adminname: string;
  passwordHash: string;
  isMasterAdmin: boolean;
  usersAccess: boolean;
  coinsAccess: boolean;
  gamesAccessType: "all" | "specific";
  allowedGameIds: string[];
  createdAt: string;
};

function toUser(row: { id: string; email: string; display_name: string; coins: number; is_blocked?: boolean }): DbUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    coins: row.coins ?? 0,
    isBlocked: row.is_blocked ?? false,
  };
}

function toDepositRequest(row: { id: string; user_id: string; amount: number; utr: string; status: string; created_at: string }): DbDepositRequest {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    utr: row.utr,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toWithdrawalRequest(row: {
  id: string;
  user_id: string;
  amount: number;
  upi_id: string;
  status: string;
  reject_note?: string;
  charge_percent?: number;
  created_at: string;
}): DbWithdrawalRequest {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    upiId: row.upi_id,
    status: row.status,
    rejectNote: row.reject_note,
    chargePercent: row.charge_percent != null ? Number(row.charge_percent) : undefined,
    createdAt: row.created_at,
  };
}

function toTransaction(row: {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  reference_id?: string;
  reference_text?: string;
  description?: string;
  created_at: string;
}): DbCoinTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    type: row.type,
    referenceId: row.reference_id,
    referenceText: row.reference_text,
    description: row.description,
    createdAt: row.created_at,
  };
}

export const db = {
  async users(): Promise<DbUser[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from("app_users").select("*").order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map(toUser);
  },

  async addUser(email: string, displayName: string): Promise<DbUser | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: existing } = await supabase.from("app_users").select("id").ilike("email", email).single();
    if (existing) return null;

    const { data: bonusRow } = await supabase.from("app_settings").select("value").eq("key", "signup_bonus").single();
    const bonus = bonusRow?.value ? parseInt(bonusRow.value, 10) : 0;

    let id: string;
    const { data: idFromRpc } = await supabase.rpc("generate_app_user_id");
    if (typeof idFromRpc === "string") {
      id = idFromRpc;
    } else {
      id = String(Math.floor(10000 + Math.random() * 90000));
    }

    const { data: user, error } = await supabase
      .from("app_users")
      .insert({ id, email, display_name: displayName, coins: Math.max(0, bonus) })
      .select()
      .single();
    if (error) return null;

    if (bonus > 0) {
      await supabase.from("app_coin_transactions").insert({
        user_id: id,
        amount: bonus,
        type: "signup_bonus",
        description: "Signup bonus",
      });
    }
    return toUser(user);
  },

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from("app_users").select("*").ilike("email", email).single();
    return data ? toUser(data) : null;
  },

  async getUser(id: string): Promise<DbUser | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from("app_users").select("*").eq("id", id).single();
    return data ? toUser(data) : null;
  },

  async addCoins(userId: string, amount: number, description?: string): Promise<DbUser | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: user } = await supabase.from("app_users").select("*").eq("id", userId).single();
    if (!user) return null;
    await supabase.from("app_users").update({ coins: user.coins + amount }).eq("id", userId);
    await supabase.from("app_coin_transactions").insert({
      user_id: userId,
      amount,
      type: "admin_add",
      description: description ?? "Admin added coins",
    });
    return db.getUser(userId);
  },

  async blockUser(userId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from("app_users").update({ is_blocked: true }).eq("id", userId);
    return !error;
  },

  async unblockUser(userId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from("app_users").update({ is_blocked: false }).eq("id", userId);
    return !error;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from("app_users").delete().eq("id", userId);
    return !error;
  },

  async getDepositRequests(status?: "pending" | "accepted" | "rejected"): Promise<DbDepositRequest[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    let q = supabase.from("app_deposit_requests").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data } = await q;
    return (data ?? []).map(toDepositRequest);
  },

  async getDepositRequest(id: string): Promise<DbDepositRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from("app_deposit_requests").select("*").eq("id", id).single();
    return data ? toDepositRequest(data) : null;
  },

  async addDepositRequest(userId: string, amount: number, utr: string): Promise<DbDepositRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("app_deposit_requests")
      .insert({ user_id: userId, amount, utr, status: "pending" })
      .select()
      .single();
    if (error) return null;
    return toDepositRequest(data);
  },

  async acceptDepositRequest(id: string): Promise<DbDepositRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: req } = await supabase.from("app_deposit_requests").select("*").eq("id", id).eq("status", "pending").single();
    if (!req) return null;
    await supabase.from("app_deposit_requests").update({ status: "accepted" }).eq("id", id);
    const { data: user } = await supabase.from("app_users").select("coins").eq("id", req.user_id).single();
    if (user) {
      await supabase.from("app_users").update({ coins: user.coins + req.amount }).eq("id", req.user_id);
      await supabase.from("app_coin_transactions").insert({
        user_id: req.user_id,
        amount: req.amount,
        type: "deposit",
        description: "Deposited",
        reference_text: req.utr,
      });
    }
    return db.getDepositRequest(id);
  },

  async rejectDepositRequest(id: string): Promise<DbDepositRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: req } = await supabase.from("app_deposit_requests").select("*").eq("id", id).eq("status", "pending").single();
    if (!req) return null;
    await supabase.from("app_deposit_requests").update({ status: "rejected" }).eq("id", id);
    await supabase.from("app_coin_transactions").insert({
      user_id: req.user_id,
      amount: req.amount,
      type: "deposit_failed",
      description: "Deposit rejected",
      reference_text: req.utr,
    });
    return db.getDepositRequest(id);
  },

  async blockDepositRequest(id: string): Promise<DbDepositRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: req } = await supabase.from("app_deposit_requests").select("*").eq("id", id).eq("status", "pending").single();
    if (!req) return null;
    await supabase.from("app_deposit_requests").update({ status: "rejected" }).eq("id", id);
    await supabase.from("app_users").update({ is_blocked: true }).eq("id", req.user_id);
    await supabase.from("app_coin_transactions").insert({
      user_id: req.user_id,
      amount: req.amount,
      type: "deposit_failed",
      description: "Deposit rejected (user blocked)",
      reference_text: req.utr,
    });
    return db.getDepositRequest(id);
  },

  async getWithdrawalCharge(): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) return 0;
    const { data } = await supabase.from("app_settings").select("value").eq("key", "withdrawal_charge").single();
    return data?.value ? parseInt(data.value, 10) : 0;
  },

  async setWithdrawalCharge(percent: number): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) return 0;
    const p = Math.max(0, Math.min(100, percent));
    await supabase.from("app_settings").upsert({ key: "withdrawal_charge", value: String(p), updated_at: new Date().toISOString() }, { onConflict: "key" });
    return p;
  },

  async getWithdrawalRequests(status?: "pending" | "accepted" | "rejected"): Promise<DbWithdrawalRequest[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    let q = supabase.from("app_withdrawal_requests").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data } = await q;
    return (data ?? []).map(toWithdrawalRequest);
  },

  async getWithdrawalRequest(id: string): Promise<DbWithdrawalRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from("app_withdrawal_requests").select("*").eq("id", id).single();
    return data ? toWithdrawalRequest(data) : null;
  },

  async getWithdrawalRequestsByUser(userId: string): Promise<DbWithdrawalRequest[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from("app_withdrawal_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return (data ?? []).map(toWithdrawalRequest);
  },

  async addWithdrawalRequest(userId: string, amount: number, upiId: string): Promise<DbWithdrawalRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: user } = await supabase.from("app_users").select("coins").eq("id", userId).single();
    if (!user || user.coins < amount) return null;
    const charge = await db.getWithdrawalCharge();
    const { data, error } = await supabase
      .from("app_withdrawal_requests")
      .insert({ user_id: userId, amount, upi_id: upiId, status: "pending", charge_percent: charge })
      .select()
      .single();
    if (error) return null;
    return toWithdrawalRequest(data);
  },

  async acceptWithdrawalRequest(id: string): Promise<DbWithdrawalRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: req } = await supabase.from("app_withdrawal_requests").select("*").eq("id", id).eq("status", "pending").single();
    if (!req) return null;
    const { data: user } = await supabase.from("app_users").select("coins").eq("id", req.user_id).single();
    if (!user || user.coins < req.amount) return null;
    await supabase.from("app_withdrawal_requests").update({ status: "accepted" }).eq("id", id);
    await supabase.from("app_users").update({ coins: user.coins - req.amount }).eq("id", req.user_id);
    await supabase.from("app_coin_transactions").insert({
      user_id: req.user_id,
      amount: req.amount,
      type: "withdraw",
      description: "Withdraw",
      reference_text: req.upi_id,
    });
    return db.getWithdrawalRequest(id);
  },

  async rejectWithdrawalRequest(id: string, note: string): Promise<DbWithdrawalRequest | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: req } = await supabase.from("app_withdrawal_requests").select("*").eq("id", id).eq("status", "pending").single();
    if (!req) return null;
    await supabase.from("app_withdrawal_requests").update({ status: "rejected", reject_note: note }).eq("id", id);
    await supabase.from("app_coin_transactions").insert({
      user_id: req.user_id,
      amount: req.amount,
      type: "withdraw_failed",
      description: note || "Withdrawal rejected",
      reference_text: req.upi_id,
    });
    return db.getWithdrawalRequest(id);
  },

  async transactions(userId?: string): Promise<DbCoinTransaction[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    let q = supabase.from("app_coin_transactions").select("*").order("created_at", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    const { data } = await q;
    return (data ?? []).map(toTransaction);
  },

  async getSignupBonus(): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) return 0;
    const { data } = await supabase.from("app_settings").select("value").eq("key", "signup_bonus").single();
    return data?.value ? parseInt(data.value, 10) : 0;
  },

  async setSignupBonus(amount: number): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) return 0;
    const a = Math.max(0, amount);
    await supabase.from("app_settings").upsert({ key: "signup_bonus", value: String(a), updated_at: new Date().toISOString() }, { onConflict: "key" });
    return a;
  },

  async getDepositQrUrl(): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from("app_settings").select("value").eq("key", "deposit_qr_url").single();
    return data?.value ?? null;
  },

  async setDepositQrUrl(url: string | null): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    await supabase.from("app_settings").upsert({ key: "deposit_qr_url", value: url ?? "", updated_at: new Date().toISOString() }, { onConflict: "key" });
    return url;
  },

  async loginAdmin(adminname: string, password: string): Promise<DbAdmin | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: admin } = await supabase.from("admins").select("*").ilike("adminname", adminname).single();
    if (!admin || !admin.password_hash) return null;
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return null;
    const { data: games } = await supabase.from("admin_allowed_games").select("game_id").eq("admin_id", admin.id);
    const allowedGameIds = (games ?? []).map((g) => g.game_id);
    return {
      id: admin.id,
      adminname: admin.adminname,
      passwordHash: admin.password_hash,
      isMasterAdmin: admin.is_master_admin ?? false,
      usersAccess: admin.users_access ?? false,
      coinsAccess: admin.coins_access ?? false,
      gamesAccessType: (admin.games_access_type as "all" | "specific") ?? "all",
      allowedGameIds,
      createdAt: admin.created_at,
    };
  },

  async getAdminById(id: string): Promise<DbAdmin | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: admin } = await supabase.from("admins").select("*").eq("id", id).single();
    if (!admin) return null;
    const { data: games } = await supabase.from("admin_allowed_games").select("game_id").eq("admin_id", admin.id);
    return {
      id: admin.id,
      adminname: admin.adminname,
      passwordHash: "[hidden]",
      isMasterAdmin: admin.is_master_admin ?? false,
      usersAccess: admin.users_access ?? false,
      coinsAccess: admin.coins_access ?? false,
      gamesAccessType: (admin.games_access_type as "all" | "specific") ?? "all",
      allowedGameIds: (games ?? []).map((g) => g.game_id),
      createdAt: admin.created_at,
    };
  },

  async getAllAdmins(): Promise<DbAdmin[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data: admins } = await supabase.from("admins").select("*").not("adminname", "is", null);
    if (!admins) return [];
    const result: DbAdmin[] = [];
    for (const a of admins) {
      const { data: games } = await supabase.from("admin_allowed_games").select("game_id").eq("admin_id", a.id);
      result.push({
        id: a.id,
        adminname: a.adminname ?? "",
        passwordHash: "[hidden]",
        isMasterAdmin: a.is_master_admin ?? false,
        usersAccess: a.users_access ?? false,
        coinsAccess: a.coins_access ?? false,
        gamesAccessType: (a.games_access_type as "all" | "specific") ?? "all",
        allowedGameIds: (games ?? []).map((g) => g.game_id),
        createdAt: a.created_at,
      });
    }
    return result;
  },

  async createAdmin(
    adminname: string,
    password: string,
    opts: { usersAccess: boolean; coinsAccess: boolean; gamesAccessType: "all" | "specific"; allowedGameIds: string[] }
  ): Promise<DbAdmin | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: existing } = await supabase.from("admins").select("id").ilike("adminname", adminname).single();
    if (existing) return null;
    const hash = bcrypt.hashSync(password, 10);
    const { data: admin, error } = await supabase
      .from("admins")
      .insert({
        adminname,
        password_hash: hash,
        is_master_admin: false,
        users_access: opts.usersAccess,
        coins_access: opts.coinsAccess,
        games_access_type: opts.gamesAccessType,
      })
      .select()
      .single();
    if (error || !admin) return null;
    if (opts.gamesAccessType === "specific" && opts.allowedGameIds?.length) {
      await supabase.from("admin_allowed_games").insert(opts.allowedGameIds.map((gid) => ({ admin_id: admin.id, game_id: gid })));
    }
    return db.getAdminById(admin.id);
  },

  async deleteAdmin(adminId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { data: admin } = await supabase.from("admins").select("is_master_admin").eq("id", adminId).single();
    if (!admin || admin.is_master_admin) return false;
    await supabase.from("admin_allowed_games").delete().eq("admin_id", adminId);
    const { error } = await supabase.from("admins").delete().eq("id", adminId);
    return !error;
  },

  async updateAdminPassword(adminId: string, newPassword: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const hash = bcrypt.hashSync(newPassword, 10);
    const { error } = await supabase.from("admins").update({ password_hash: hash }).eq("id", adminId);
    return !error;
  },
};

export function isDbConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
