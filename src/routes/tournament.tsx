import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Zap, FastForward, RotateCcw, Play, X } from "lucide-react";
import type { Player } from "@/lib/draft-utils";
import type { TacticsSettings } from "@/lib/tactics-utils";
import { DEFAULT_TACTICS } from "@/lib/tactics-utils";
import {
  CLUBS, buildAiEntries, buildUserEntry, seedBracket, simulateMatch, ROUND_NAMES,
  type Bracket, type BracketMatch, type TeamEntry, type MatchEvent,
} from "@/lib/tournament-utils";

export const Route = createFileRoute("/tournament")({
  head: () => ({
    meta: [
      { title: "Tournament — GAFFER" },
      { name: "description", content: "Sixteen clubs. Four rounds. One trophy. Simulate your run to glory." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TournamentPage,
});

const DRAFT_KEY = "gaffer.draft.v1";
const TACTICS_KEY = "gaffer.tactics.v1";
const BRACKET_KEY = "gaffer.bracket.v1";

type SavedBracket = {
  bracket: Bracket;
  currentMatchId?: string;
  championId?: string;
};

function loadXi(): Player[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { assignments?: Record<string, Player | undefined> };
    return Object.values(parsed.assignments ?? {}).filter(Boolean) as Player[];
  } catch { return []; }
}
function loadTactics(): TacticsSettings {
  if (typeof window === "undefined") return DEFAULT_TACTICS;
  try {
    const raw = window.localStorage.getItem(TACTICS_KEY);
    if (!raw) return DEFAULT_TACTICS;
    return { ...DEFAULT_TACTICS, ...JSON.parse(raw) };
  } catch { return DEFAULT_TACTICS; }
}

function TournamentPage() {
  const [xi, setXi] = useState<Player[]>([]);
  const [tactics, setTactics] = useState<TacticsSettings>(DEFAULT_TACTICS);
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [champion, setChampion] = useState<TeamEntry | null>(null);
  const [activeMatch, setActiveMatch] = useState<BracketMatch | null>(null);
  const [ready, setReady] = useState(false);

  // Load draft + tactics
  useEffect(() => {
    setXi(loadXi());
    setTactics(loadTactics());
    // Try restore bracket
    try {
      const raw = window.localStorage.getItem(BRACKET_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedBracket;
        setBracket(parsed.bracket);
        if (parsed.championId) {
          const champ = parsed.bracket.seeds.find((s) => s.id === parsed.championId) ?? null;
          setChampion(champ);
        }
      }
    } catch {}
    setReady(true);
  }, []);

  // Persist bracket
  useEffect(() => {
    if (!ready || !bracket) return;
    try {
      window.localStorage.setItem(BRACKET_KEY, JSON.stringify({
        bracket,
        championId: champion?.id,
      } satisfies SavedBracket));
    } catch {}
  }, [bracket, champion, ready]);

  const generate = () => {
    const user = buildUserEntry(xi);
    const ai = buildAiEntries(15);
    const b = seedBracket([user, ...ai]);
    setBracket(b);
    setChampion(null);
    setActiveMatch(null);
  };

  const reset = () => {
    setBracket(null);
    setChampion(null);
    setActiveMatch(null);
    try { window.localStorage.removeItem(BRACKET_KEY); } catch {}
  };

  const nextMatch = useMemo(() => {
    if (!bracket) return null;
    for (const round of bracket.rounds) {
      for (const m of round) {
        if (m.home && m.away && !m.played) return m;
      }
    }
    return null;
  }, [bracket]);

  const playMatch = (match: BracketMatch): BracketMatch => {
    if (!match.home || !match.away) return match;
    const res = simulateMatch(match.home, match.away, { userXi: xi, userTactics: tactics });
    return {
      ...match,
      homeScore: res.homeScore,
      awayScore: res.awayScore,
      winner: res.winner,
      events: res.events,
      played: true,
    };
  };

  const applyMatch = (b: Bracket, played: BracketMatch): Bracket => {
    const rounds = b.rounds.map((r, ri) =>
      r.map((m) => (ri === played.round && m.index === played.index ? played : m))
    );
    // Advance winner
    if (played.round < 3 && played.winner) {
      const nextRound = played.round + 1;
      const nextIdx = Math.floor(played.index / 2);
      const isHome = played.index % 2 === 0;
      rounds[nextRound] = rounds[nextRound].map((m) =>
        m.index === nextIdx
          ? { ...m, [isHome ? "home" : "away"]: played.winner }
          : m
      );
    }
    return { ...b, rounds };
  };

  const simOne = () => {
    if (!bracket || !nextMatch) return;
    const played = playMatch(nextMatch);
    const nb = applyMatch(bracket, played);
    setBracket(nb);
    setActiveMatch(played);
    if (played.round === 3) setChampion(played.winner ?? null);
  };

  const simRound = () => {
    if (!bracket) return;
    let b = bracket;
    const round = b.rounds.find((r) => r.some((m) => m.home && m.away && !m.played));
    if (!round) return;
    let last: BracketMatch | null = null;
    for (const m of round) {
      if (m.home && m.away && !m.played) {
        const played = playMatch(m);
        b = applyMatch(b, played);
        last = played;
      }
    }
    setBracket(b);
    setActiveMatch(last);
    if (last?.round === 3) setChampion(last.winner ?? null);
  };

  const simAll = () => {
    if (!bracket) return;
    let b = bracket;
    let last: BracketMatch | null = null;
    while (true) {
      const next = (() => {
        for (const r of b.rounds) for (const m of r) if (m.home && m.away && !m.played) return m;
        return null;
      })();
      if (!next) break;
      const played = playMatch(next);
      b = applyMatch(b, played);
      last = played;
    }
    setBracket(b);
    setActiveMatch(last);
    if (last?.round === 3) setChampion(last.winner ?? null);
  };

  const userTeam = useMemo(() => bracket?.seeds.find((s) => s.isUser) ?? null, [bracket]);
  const userStatus = useMemo(() => {
    if (!bracket || !userTeam) return null;
    // Find user's last played result
    let lastRound = -1;
    let eliminatedIn: number | null = null;
    for (let ri = 0; ri < bracket.rounds.length; ri++) {
      for (const m of bracket.rounds[ri]) {
        if (!m.played) continue;
        const involved = m.home?.id === "user" || m.away?.id === "user";
        if (involved) {
          lastRound = ri;
          if (m.winner?.id !== "user") eliminatedIn = ri;
        }
      }
    }
    return { lastRound, eliminatedIn };
  }, [bracket, userTeam]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/tactics" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Tactics
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-display text-2xl tracking-wide">CHAMPIONS CUP</h1>
          </div>
          <div className="flex items-center gap-2">
            {bracket && (
              <>
                <button onClick={simOne} disabled={!nextMatch}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-2 border border-border px-4 py-2 text-xs font-semibold hover:bg-surface disabled:opacity-40">
                  <Play className="w-3.5 h-3.5" /> Next match
                </button>
                <button onClick={simRound} disabled={!nextMatch}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-2 border border-border px-4 py-2 text-xs font-semibold hover:bg-surface disabled:opacity-40">
                  <FastForward className="w-3.5 h-3.5" /> Round
                </button>
                <button onClick={simAll} disabled={!nextMatch}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40">
                  <Zap className="w-3.5 h-3.5" /> Sim all
                </button>
                <button onClick={reset} title="Reset bracket"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-border bg-surface-2 hover:bg-surface">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {!bracket ? (
          <SetupPanel xi={xi} onGenerate={generate} />
        ) : (
          <>
            <StatusBar bracket={bracket} userTeam={userTeam} userStatus={userStatus} champion={champion} />
            <BracketView bracket={bracket} activeMatchId={activeMatch?.id ?? null} onOpen={setActiveMatch} />
          </>
        )}
      </main>

      <AnimatePresence>
        {activeMatch && activeMatch.played && (
          <MatchModal match={activeMatch} onClose={() => setActiveMatch(null)} />
        )}
        {champion && (
          <ChampionOverlay champion={champion} onDismiss={() => setChampion(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SetupPanel({ xi, onGenerate }: { xi: Player[]; onGenerate: () => void }) {
  const rating = xi.length ? Math.round(xi.reduce((s, p) => s + p.overall, 0) / xi.length) : 0;
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-widest">
        <Trophy className="w-3.5 h-3.5" /> Chunk 4 · Tournament
      </div>
      <h2 className="mt-6 font-display text-5xl sm:text-6xl">SIXTEEN IN. ONE LIFTS IT.</h2>
      <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
        Your XI is seeded against fifteen Premier League clubs. Higher-rated squads get better draws, but this is knockout football — anything can happen.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
        <Stat label="Your XI" value={`${xi.length}/11`} tone={xi.length === 11 ? "ok" : "warn"} />
        <Stat label="Squad OVR" value={rating || "—"} />
        <Stat label="AI Clubs" value={15} />
      </div>
      {xi.length < 11 && (
        <p className="mt-4 text-xs text-amber-400">
          Tip: complete your draft for the best seeding. <Link to="/draft" className="underline">Go to draft →</Link>
        </p>
      )}
      <button
        onClick={onGenerate}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-[var(--shadow-glow)]">
        Draw the bracket <Trophy className="w-4 h-4" />
      </button>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-3xl ${tone === "warn" ? "text-amber-400" : tone === "ok" ? "text-[oklch(0.85_0.22_140)]" : ""}`}>{value}</div>
    </div>
  );
}

function StatusBar({ bracket, userTeam, userStatus, champion }: {
  bracket: Bracket; userTeam: TeamEntry | null;
  userStatus: { lastRound: number; eliminatedIn: number | null } | null;
  champion: TeamEntry | null;
}) {
  const totalPlayed = bracket.rounds.flat().filter((m) => m.played).length;
  const total = 15;
  const seed = userTeam ? bracket.seeds.indexOf(userTeam) + 1 : null;

  let msg = "Awaiting kick-off.";
  let tone = "text-muted-foreground";
  if (champion) {
    msg = champion.isUser
      ? `🏆 CHAMPIONS. You lifted the cup.`
      : `🏆 ${champion.name} lifted the cup.`;
    tone = champion.isUser ? "text-[oklch(0.85_0.22_140)]" : "text-foreground";
  } else if (userStatus?.eliminatedIn != null) {
    msg = `Eliminated in the ${ROUND_NAMES[userStatus.eliminatedIn]}.`;
    tone = "text-[oklch(0.7_0.18_25)]";
  } else if (userStatus && userStatus.lastRound >= 0) {
    msg = `Through to the ${ROUND_NAMES[userStatus.lastRound + 1] ?? "Final"}.`;
    tone = "text-[oklch(0.85_0.22_140)]";
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-4">
        {userTeam && (
          <div className="flex items-center gap-3">
            <TeamCrest team={userTeam} size={40} />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Your seed</div>
              <div className="font-display text-xl">#{seed} · {userTeam.abbr}</div>
            </div>
          </div>
        )}
        <div className="hidden sm:block h-10 w-px bg-border" />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
          <div className={`font-display text-xl ${tone}`}>{msg}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Progress</div>
          <div className="font-display text-xl">{totalPlayed}/{total}</div>
        </div>
        <div className="w-32 h-2 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${(totalPlayed / total) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function TeamCrest({ team, size = 32 }: { team: TeamEntry; size?: number }) {
  return (
    <div
      className="rounded-md flex items-center justify-center font-display text-xs shadow-inner border border-white/10"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${team.primary}, ${team.secondary})`,
        color: contrastColor(team.primary),
      }}
    >
      {team.abbr}
    </div>
  );
}

function contrastColor(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#fff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#111" : "#fff";
}

function BracketView({ bracket, activeMatchId, onOpen }: {
  bracket: Bracket; activeMatchId: string | null; onOpen: (m: BracketMatch) => void;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid grid-cols-4 gap-4 min-w-[900px]">
        {bracket.rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col justify-around gap-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">
              {ROUND_NAMES[ri]}
            </div>
            {round.map((m) => (
              <MatchCard key={m.id} match={m} active={m.id === activeMatchId} onClick={() => m.played && onOpen(m)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, active, onClick }: { match: BracketMatch; active: boolean; onClick: () => void }) {
  const hasTeams = match.home && match.away;
  return (
    <button
      onClick={onClick}
      disabled={!match.played}
      className={`text-left rounded-xl border p-3 transition-all ${
        active ? "border-primary shadow-[var(--shadow-glow)]" :
        match.played ? "border-border bg-surface hover:bg-surface-2 cursor-pointer" :
        hasTeams ? "border-border/70 bg-surface" : "border-dashed border-border/40 bg-transparent"
      }`}
    >
      <TeamRow team={match.home} score={match.homeScore} isWinner={match.winner?.id === match.home?.id} />
      <div className="my-1 border-t border-border/40" />
      <TeamRow team={match.away} score={match.awayScore} isWinner={match.winner?.id === match.away?.id} />
    </button>
  );
}

function TeamRow({ team, score, isWinner }: { team?: TeamEntry; score?: number; isWinner?: boolean }) {
  if (!team) return (
    <div className="flex items-center gap-2 py-1.5 opacity-40">
      <div className="w-6 h-6 rounded-md bg-surface-2 border border-dashed border-border" />
      <div className="text-xs">TBD</div>
    </div>
  );
  return (
    <div className={`flex items-center gap-2 py-1.5 ${isWinner ? "" : score != null ? "opacity-50" : ""}`}>
      <TeamCrest team={team} size={24} />
      <div className="flex-1 truncate text-xs font-semibold flex items-center gap-1">
        {team.abbr}
        {team.isUser && <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary uppercase font-bold">You</span>}
      </div>
      <div className="font-display text-lg tabular-nums">{score ?? "–"}</div>
    </div>
  );
}

function MatchModal({ match, onClose }: { match: BracketMatch; onClose: () => void }) {
  if (!match.home || !match.away || !match.played) return null;
  const goals = (match.events ?? []).filter((e) => e.type === "goal");
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-br from-surface-2 to-surface relative">
          <button onClick={onClose} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-surface-2 border border-border flex items-center justify-center hover:bg-surface">
            <X className="w-4 h-4" />
          </button>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">
            {ROUND_NAMES[match.round]} · Full Time
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <TeamBlock team={match.home} score={match.homeScore ?? 0} winner={match.winner?.id === match.home.id} />
            <div className="font-display text-3xl text-muted-foreground">vs</div>
            <TeamBlock team={match.away} score={match.awayScore ?? 0} winner={match.winner?.id === match.away.id} />
          </div>
        </div>
        <div className="p-6 max-h-[45vh] overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Match events</div>
          {goals.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">0-0. A stalemate of a spectacle.</div>
          ) : (
            <ul className="space-y-2">
              {goals.map((e, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="font-display text-lg w-10 text-muted-foreground tabular-nums">{e.minute}&apos;</span>
                  <span className="text-lg">⚽</span>
                  <span className="flex-1">
                    <b>{e.playerName}</b>
                    <span className="text-muted-foreground"> · {e.side === "home" ? match.home!.abbr : match.away!.abbr}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TeamBlock({ team, score, winner }: { team: TeamEntry; score: number; winner: boolean }) {
  return (
    <div className={`text-center ${winner ? "" : "opacity-60"}`}>
      <div className="flex justify-center"><TeamCrest team={team} size={48} /></div>
      <div className="mt-2 font-display text-sm truncate">{team.abbr}</div>
      <div className="font-display text-5xl mt-1 tabular-nums">{score}</div>
    </div>
  );
}

function ChampionOverlay({ champion, onDismiss }: { champion: TeamEntry; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 pointer-events-none flex items-start justify-center pt-24"
    >
      <motion.div
        initial={{ y: -30, scale: 0.9 }} animate={{ y: 0, scale: 1 }}
        className="pointer-events-auto rounded-2xl border border-primary/40 bg-gradient-to-b from-surface-2 to-surface px-8 py-6 shadow-[var(--shadow-glow)] text-center max-w-md"
      >
        <Trophy className="w-10 h-10 mx-auto text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Champions</div>
        <div className="font-display text-3xl mt-1">{champion.name}</div>
        <p className="text-sm text-muted-foreground mt-2">
          {champion.isUser ? "You lifted the trophy. Immortal." : "Better luck next draw."}
        </p>
        <button onClick={onDismiss} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground">
          Dismiss
        </button>
      </motion.div>
    </motion.div>
  );
}
