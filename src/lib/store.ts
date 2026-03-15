/**
 * Unified store: uses Supabase db when configured, otherwise in-memory admin-store.
 * API routes should use getStore() and await the async methods.
 */

import { adminStore } from "./admin-store";
import { db, isDbConfigured } from "./db";

export function getStore() {
  if (isDbConfigured()) {
    return {
      loginAdmin: (adminname: string, password: string) => db.loginAdmin(adminname, password),
      getAdminById: (id: string) => db.getAdminById(id),
      users: () => db.users(),
      addUser: (email: string, displayName: string) => db.addUser(email, displayName),
      getUserByEmail: (email: string) => db.getUserByEmail(email),
      getUser: (id: string) => db.getUser(id),
      addCoins: (userId: string, amount: number, desc?: string) => db.addCoins(userId, amount, desc),
      blockUser: (userId: string) => db.blockUser(userId),
      unblockUser: (userId: string) => db.unblockUser(userId),
      deleteUser: (userId: string) => db.deleteUser(userId),
      getDepositRequests: (status?: "pending" | "accepted" | "rejected") => db.getDepositRequests(status),
      getDepositRequest: (id: string) => db.getDepositRequest(id),
      addDepositRequest: (userId: string, amount: number, utr: string) => db.addDepositRequest(userId, amount, utr),
      acceptDepositRequest: (id: string) => db.acceptDepositRequest(id),
      rejectDepositRequest: (id: string) => db.rejectDepositRequest(id),
      blockDepositRequest: (id: string) => db.blockDepositRequest(id),
      getWithdrawalCharge: () => db.getWithdrawalCharge(),
      setWithdrawalCharge: (p: number) => db.setWithdrawalCharge(p),
      getWithdrawalRequests: (status?: "pending" | "accepted" | "rejected") => db.getWithdrawalRequests(status),
      getWithdrawalRequest: (id: string) => db.getWithdrawalRequest(id),
      getWithdrawalRequestsByUser: (userId: string) => db.getWithdrawalRequestsByUser(userId),
      addWithdrawalRequest: (userId: string, amount: number, upiId: string) => db.addWithdrawalRequest(userId, amount, upiId),
      acceptWithdrawalRequest: (id: string) => db.acceptWithdrawalRequest(id),
      rejectWithdrawalRequest: (id: string, note: string) => db.rejectWithdrawalRequest(id, note),
      transactions: (userId?: string) => db.transactions(userId),
      getSignupBonus: () => db.getSignupBonus(),
      setSignupBonus: (a: number) => db.setSignupBonus(a),
      getDepositQrUrl: () => db.getDepositQrUrl(),
      setDepositQrUrl: (url: string | null) => db.setDepositQrUrl(url),
      getAllAdmins: () => db.getAllAdmins(),
      createAdmin: (adminname: string, password: string, opts: { usersAccess: boolean; coinsAccess: boolean; gamesAccessType: "all" | "specific"; allowedGameIds: string[] }) =>
        db.createAdmin(adminname, password, opts),
      deleteAdmin: (id: string) => db.deleteAdmin(id),
      updateAdminPassword: (id: string, newPassword: string) => db.updateAdminPassword(id, newPassword),
    };
  }
  return {
    loginAdmin: (adminname: string, password: string) => adminStore.login(adminname, password),
    getAdminById: (id: string) => Promise.resolve(adminStore.getAdminById(id)),
    getAllAdmins: () => Promise.resolve(adminStore.getAllAdmins()),
    createAdmin: (adminname: string, password: string, opts: { usersAccess: boolean; coinsAccess: boolean; gamesAccessType: "all" | "specific"; allowedGameIds: string[] }) =>
      Promise.resolve(adminStore.createAdmin(adminname, password, opts)),
    deleteAdmin: (id: string) => Promise.resolve(adminStore.deleteAdmin(id)),
    updateAdminPassword: (id: string, newPassword: string) => Promise.resolve(adminStore.updateAdminPassword(id, newPassword)),
    users: () => Promise.resolve(adminStore.users()),
    addUser: (email: string, displayName: string) => Promise.resolve(adminStore.addUser(email, displayName)),
    getUserByEmail: (email: string) => Promise.resolve(adminStore.getUserByEmail(email)),
    getUser: (id: string) => Promise.resolve(adminStore.getUser(id)),
    addCoins: (userId: string, amount: number, desc?: string) => Promise.resolve(adminStore.addCoins(userId, amount, desc)),
    blockUser: (userId: string) => Promise.resolve(adminStore.blockUser(userId)),
    unblockUser: (userId: string) => Promise.resolve(adminStore.unblockUser(userId)),
    deleteUser: (userId: string) => Promise.resolve(adminStore.deleteUser(userId)),
    getDepositRequests: (status?: "pending" | "accepted" | "rejected") => Promise.resolve(adminStore.getDepositRequests(status)),
    getDepositRequest: (id: string) => Promise.resolve(adminStore.getDepositRequest(id)),
    addDepositRequest: (userId: string, amount: number, utr: string) => Promise.resolve(adminStore.addDepositRequest(userId, amount, utr)),
    acceptDepositRequest: (id: string) => Promise.resolve(adminStore.acceptDepositRequest(id)),
    rejectDepositRequest: (id: string) => Promise.resolve(adminStore.rejectDepositRequest(id)),
    blockDepositRequest: (id: string) => Promise.resolve(adminStore.blockDepositRequest(id)),
    getWithdrawalCharge: () => Promise.resolve(adminStore.getWithdrawalCharge()),
    setWithdrawalCharge: (p: number) => Promise.resolve(adminStore.setWithdrawalCharge(p)),
    getWithdrawalRequests: (status?: "pending" | "accepted" | "rejected") => Promise.resolve(adminStore.getWithdrawalRequests(status)),
    getWithdrawalRequest: (id: string) => Promise.resolve(adminStore.getWithdrawalRequest(id)),
    getWithdrawalRequestsByUser: (userId: string) => Promise.resolve(adminStore.getWithdrawalRequestsByUser(userId)),
    addWithdrawalRequest: (userId: string, amount: number, upiId: string) => Promise.resolve(adminStore.addWithdrawalRequest(userId, amount, upiId)),
    acceptWithdrawalRequest: (id: string) => Promise.resolve(adminStore.acceptWithdrawalRequest(id)),
    rejectWithdrawalRequest: (id: string, note: string) => Promise.resolve(adminStore.rejectWithdrawalRequest(id, note)),
    transactions: (userId?: string) => Promise.resolve(adminStore.transactions(userId)),
    getSignupBonus: () => Promise.resolve(adminStore.getSignupBonus()),
    setSignupBonus: (a: number) => Promise.resolve(adminStore.setSignupBonus(a)),
    getDepositQrUrl: () => Promise.resolve(adminStore.getDepositQrUrl()),
    setDepositQrUrl: (url: string | null) => Promise.resolve(adminStore.setDepositQrUrl(url)),
  };
}
