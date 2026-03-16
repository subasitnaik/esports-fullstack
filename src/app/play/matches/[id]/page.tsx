"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { brand } from "@config/brand";

type User = { id: string; email: string; displayName: string; coins: number; isBlocked?: boolean };
type MatchDetail = {
  id: string;
  title: string;
  entryFee: number;
  status: string;
  matchType?: string;
  maxParticipants?: number;
  startsAt?: string;
  roomCode?: string | null;
  roomPassword?: string | null;
  prizePool?: { coinsPerKill?: number; totalPrizePool?: number; rankRewards?: { fromRank: number; toRank: number; coins: number }[] };
};
type Participant = {
  id: string;
  userId?: string;
  teamMembers: { inGameName: string; inGameUid: string; kills?: number }[];
  joinedAt: string;
  rank?: number;
};

const USER_KEY = "esports_play_user";
const JOINED_KEY_PREFIX = "esports_joined_";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function getStoredJoined(matchId: string, userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${JOINED_KEY_PREFIX}${matchId}_${userId}`) === "1";
  } catch {
    return false;
  }
}

function setStoredJoined(matchId: string, userId: string, joined: boolean) {
  if (typeof window === "undefined") return;
  try {
    const key = `${JOINED_KEY_PREFIX}${matchId}_${userId}`;
    if (joined) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {}
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function formatMatchDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MatchTypeTag({ type }: { type: string }) {
  const t = (type || "solo").toLowerCase();
  const styles =
    t === "solo"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      : t === "duo"
        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
        : "bg-violet-500/20 text-violet-400 border-violet-500/40";
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${styles}`}>
      {t}
    </span>
  );
}

function MatchDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const modeId = searchParams.get("modeId");
  const modeName = searchParams.get("modeName") || "Matches";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inGameName, setInGameName] = useState("");
  const [inGameUid, setInGameUid] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasJoinedOverride, setHasJoinedOverride] = useState(false);

  const refreshUser = useCallback(() => {
    api<User>("/api/users/me")
      .then((u) => setUser(u))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!id) return;
    api<MatchDetail>(`/api/matches/${id}`)
      .then(setMatch)
      .catch(() => setMatch(null));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api<Participant[]>(`/api/matches/${id}/participants`)
      .then(setParticipants)
      .catch(() => setParticipants([]));
  }, [id]);

  useEffect(() => {
    if (user?.id && id) {
      setHasJoinedOverride(getStoredJoined(id, user.id));
    } else {
      setHasJoinedOverride(false);
    }
  }, [user?.id, id]);

  const hasJoined = (user && participants.some((p) => p.userId === user.id)) || hasJoinedOverride;

  const fetchParticipants = useCallback(() => {
    if (!id) return;
    api<Participant[]>(`/api/matches/${id}/participants`)
      .then(setParticipants)
      .catch(() => setParticipants([]));
  }, [id]);

  const handleJoin = async () => {
    if (!inGameName.trim() || !inGameUid.trim()) {
      setJoinError("Enter in-game name and UID");
      return;
    }
    setJoinLoading(true);
    setJoinError(null);
    try {
      await api(`/api/matches/${id}/join`, {
        method: "POST",
        body: JSON.stringify({
          inGameName: inGameName.trim(),
          inGameUid: inGameUid.trim(),
        }),
      });
      setInGameName("");
      setInGameUid("");
      setHasJoinedOverride(true);
      if (user?.id && id) setStoredJoined(id, user.id, true);
      refreshUser();
      await fetchParticipants();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to join";
      if (msg.toLowerCase().includes("already registered")) {
        setInGameName("");
        setInGameUid("");
        setHasJoinedOverride(true);
        if (user?.id && id) setStoredJoined(id, user.id, true);
        await fetchParticipants();
      } else {
        setJoinError(msg);
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const canJoin =
    match?.status === "upcoming" &&
    user &&
    user.coins >= (match?.entryFee ?? 0) &&
    !user.isBlocked &&
    !hasJoined &&
    !hasJoinedOverride;
  const backHref = modeId ? `/play?tab=games&modeId=${modeId}` : "/play";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f97316] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0c0c0e]/95 px-4 py-3 backdrop-blur">
          <Link
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#94A3B8] transition hover:bg-white/10 hover:text-white"
            aria-label="Back"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-ultimatum font-semibold text-white">{brand.appName}</span>
          <div className="w-10" />
        </header>
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <p className="text-[#94A3B8]">Sign in to view match details</p>
          <Link
            href="/play"
            className="mt-4 rounded-xl bg-[#f97316] px-6 py-2 font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </>
    );
  }

  if (!match) {
    return (
      <>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0c0c0e]/95 px-4 py-3 backdrop-blur">
          <Link
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#94A3B8] transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-ultimatum font-semibold text-white">{brand.appName}</span>
          <div className="w-10" />
        </header>
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <p className="text-[#94A3B8]">Match not found</p>
        </div>
      </>
    );
  }

  const cpk = match.prizePool?.coinsPerKill ?? 0;
  const prizePool = match.prizePool?.totalPrizePool ?? 0;
  const type = match.matchType || "solo";

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0c0c0e]/95 px-4 py-3 backdrop-blur">
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#94A3B8] transition hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="font-ultimatum font-semibold text-white">{brand.appName}</span>
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{match.title}</h1>
            <MatchTypeTag type={type} />
          </div>
          <p className="mt-2 text-sm text-[#94A3B8]">{formatMatchDateTime(match.startsAt ?? "")}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Entry Fee</p>
              <p className="mt-1 font-bold text-[#f97316]">{match.entryFee}</p>
              <p className="text-xs text-[#94A3B8]">coins</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Prize Pool</p>
              <p className="mt-1 font-bold text-emerald-400">{prizePool}</p>
              <p className="text-xs text-[#94A3B8]">coins</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Coins/Kill</p>
              <p className="mt-1 font-bold text-amber-400">{cpk}</p>
              <p className="text-xs text-[#94A3B8]">per kill</p>
            </div>
          </div>

          {match.status === "ongoing" && match.roomCode && match.roomPassword && (
            <div className="mt-6 rounded-xl border border-[#f97316]/30 bg-[#f97316]/10 p-4">
              <p className="text-sm font-semibold text-[#f97316]">Room Details</p>
              <p className="mt-1 font-mono text-white">Code: {match.roomCode}</p>
              <p className="font-mono text-white">Password: {match.roomPassword}</p>
            </div>
          )}

          {match.prizePool?.rankRewards && match.prizePool.rankRewards.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-white">Rank Rewards</p>
              <div className="mt-2 space-y-1">
                {match.prizePool.rankRewards.map((r, i) => (
                  <div key={i} className="flex justify-between text-sm text-[#94A3B8]">
                    <span>Rank {r.fromRank}–{r.toRank}</span>
                    <span className="text-emerald-400">{r.coins} coins</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {hasJoined && match.status === "upcoming" && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <p className="flex items-center gap-2 font-semibold text-emerald-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You have already registered for this match
            </p>
          </div>
        )}

        {canJoin && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Join Match</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">Enter your in-game details</p>
            <input
              value={inGameName}
              onChange={(e) => setInGameName(e.target.value)}
              placeholder="In-game Name"
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#0c0c0e] px-4 py-3 text-white placeholder-[#64748B] outline-none focus:border-[#f97316]"
            />
            <input
              value={inGameUid}
              onChange={(e) => setInGameUid(e.target.value)}
              placeholder="In-game UID"
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#0c0c0e] px-4 py-3 text-white placeholder-[#64748B] outline-none focus:border-[#f97316]"
            />
            {joinError && <p className="mt-2 text-sm text-red-400">{joinError}</p>}
            <button
              onClick={handleJoin}
              disabled={joinLoading}
              className="mt-4 w-full rounded-xl bg-[#f97316] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {joinLoading ? "Joining..." : `Join for ${match.entryFee} coins`}
            </button>
          </div>
        )}

        {match.status === "upcoming" && !hasJoined && !canJoin && user.coins < (match.entryFee ?? 0) && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <p className="font-medium text-amber-400">
              You need {match.entryFee} coins to join. You have {user.coins} coins.
            </p>
            <p className="mt-1 text-sm text-[#94A3B8]">Add coins from the Coins tab to join this match.</p>
          </div>
        )}

        {match.status !== "upcoming" && !hasJoined && user.coins < (match.entryFee ?? 0) && (
          <p className="mt-6 text-center text-sm text-[#94A3B8]">
            Registration closed. You need {match.entryFee} coins to join upcoming matches.
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Participants ({participants.length}/{match.maxParticipants ?? 100})
            </h2>
            <button
              onClick={fetchParticipants}
              className="rounded-lg px-3 py-1.5 text-sm text-[#94A3B8] hover:bg-white/5 hover:text-white"
            >
              Refresh
            </button>
          </div>
          {participants.length === 0 ? (
            <p className="mt-4 text-sm text-[#94A3B8]">No participants yet</p>
          ) : (
            <div className="mt-4 space-y-2">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-[#0c0c0e]/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#64748B]">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-white">{p.teamMembers[0]?.inGameName ?? "—"}</p>
                      <p className="text-xs text-[#94A3B8]">UID: {p.teamMembers[0]?.inGameUid ?? "—"}</p>
                    </div>
                  </div>
                  {p.teamMembers[0]?.kills != null && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
                      {p.teamMembers[0].kills} kills
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function MatchDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0c0c0e]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f97316] border-t-transparent" />
        </div>
      }
    >
      <MatchDetailContent />
    </Suspense>
  );
}
