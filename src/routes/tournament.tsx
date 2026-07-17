import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RotateCcw, Play, X, Skull, Home, Users } from "lucide-react";
import { btnGhost, btnPrimary } from "@/lib/ui";
import type { Player } from "@/lib/draft-utils";
import type { TacticsSettings } from "@/lib/tactics-utils";
import { DEFAULT_TACTICS, FORMATIONS, squadStrength } from "@/lib/tactics-utils";
import {
  buildAiEntries, buildUserEntry, seedBracket, simulateMatch, strengthRank, aggregateScorers, ROUND_NAMES,
  type Bracket, type BracketMatch, type TeamEntry, type Verdict,
} from "@/lib/tournament-utils";
import { VerdictChip } from "@/components/VerdictChip";
import { AwardsBlock } from "@/components/AwardsBlock";
import { addHistory, loadHistory } from "@/lib/history";
import { LiveMatch, type LiveResult } from "@/components/LiveMatch";
import { MatchPreview } from "@/components/MatchPreview";
import { loadSquad, loadTactics, buildUserSide, buildAiSide, DRAFT_KEY, TACTICS_KEY, type LoadedSquad, type LiveSides } from "@/lib/squad-load";
import { recordForm, applyMatchDiscipline, SQUAD_STATUS_KEY } from "@/lib/squad-status";
import { UnavailableStrip } from "@/components/UnavailableStrip";
import { clubLogo } from "@/lib/logos";
import { Confetti } from "@/components/Confetti";
import ballIcon from "@/assets/icon-ball.png";
import assistIcon from "@/assets/icon-assist.png";

export const Route = createFileRoute("/tournament")({
  head: () => ({
    meta: [
      { title: "Tournament — GAFFER" },
      { name: "description", content: "Sixteen clubs. Four rounds. One trophy. Play your matches live — lose once and the run is over." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TournamentPage,
});

const BRACKET_KEY = "gaffer.bracket.v1";
const LEAGUE_KEY = "gaffer.league.v1";

type SavedBracket = {
  bracket: Bracket;
  championId?: string;
  historyWritten?: boolean;
};

function TournamentPage() {
  const navigate = useNavigate();
  const [squad, setSquad] = useState<LoadedSquad>({ xi: [], bench: [], formation: "4-3-3", assignments: {} });
  const [tactics, setTactics] = useState<TacticsSettings>(DEFAULT_TACTICS);
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [champion, setChampion] = useState<TeamEntry | null>(null);
  const [activeMatch, setActiveMatch] = useState<BracketMatch | null>(null);
  const [liveMatch, setLiveMatch] = useState<BracketMatch | null>(null);
  const [previewMatch, setPreviewMatch] = useState<BracketMatch | null>(null);
  const [liveSidesSnap, setLiveSidesSnap] = useState<LiveSides | null>(null);
  const [showLoss, setShowLoss] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [statusTick, setStatusTick] = useState(0);
  const historyWritten = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadSquad();
    setSquad(loaded);
    // The drafted formation is authoritative for the whole run.
    setTactics({ ...loadTactics(), formation: loaded.formation });
    try {
      const raw = window.localStorage.getItem(BRACKET_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedBracket;
        setBracket(parsed.bracket);
        if (parsed.championId) {
          setChampion(parsed.bracket.seeds.find((s) => s.id === parsed.championId) ?? null);
        }
      }
    } catch {}
    setReady(true);
  }, []);

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
    const slots = FORMATIONS[squad.formation];
    const { rating } = squadStrength(squad.assignments, slots);
    const user = buildUserEntry(squad.xi, undefined, rating || undefined);
    const ai = buildAiEntries(15);
    setBracket(seedBracket([user, ...ai]));
    setChampion(null);
    setActiveMatch(null);
    setShowLoss(false);
  };

  // Lose once → the whole run is over. Wipe everything, back to the draft.
  const restartEverything = () => {
    try {
      window.localStorage.removeItem(BRACKET_KEY);
      window.localStorage.removeItem(LEAGUE_KEY);
      window.localStorage.removeItem(DRAFT_KEY);
      window.localStorage.removeItem(TACTICS_KEY);
      window.localStorage.removeItem(SQUAD_STATUS_KEY);
    } catch {}
    navigate({ to: "/draft" });
  };

  const nextUserMatch = useMemo(() => {
    if (!bracket) return null;
    for (const round of bracket.rounds) {
      for (const m of round) {
        if (!m.played && m.home && m.away && (m.home.id === "user" || m.away.id === "user")) return m;
      }
    }
    return null;
  }, [bracket]);

  const applyMatch = (b: Bracket, played: BracketMatch): Bracket => {
    const rounds = b.rounds.map((r, ri) =>
      r.map((m) => (ri === played.round && m.index === played.index ? played : m))
    );
    if (played.round < 3 && played.winner) {
      const nextRound = played.round + 1;
      const nextIdx = Math.floor(played.index / 2);
      const isHome = played.index % 2 === 0;
      rounds[nextRound] = rounds[nextRound].map((m) =>
        m.index === nextIdx ? { ...m, [isHome ? "home" : "away"]: played.winner } : m
      );
    }
    return { ...b, rounds };
  };

  const simAiMatch = (m: BracketMatch): BracketMatch => {
    const res = simulateMatch(m.home!, m.away!, {});
    return { ...m, homeScore: res.homeScore, awayScore: res.awayScore, winner: res.winner ?? undefined, events: res.events, played: true };
  };

  /* User finished their live match. Apply it, then the rest of the round's
     results simply appear. If they lost, play out the remaining bracket. */
  const onLiveFinish = (result: LiveResult) => {
    if (!bracket || !liveMatch) return;
    recordForm(result.ratings);
    applyMatchDiscipline(result.discipline);
    setStatusTick((t) => t + 1);
    const winner = result.winnerId === liveMatch.home!.id ? liveMatch.home : liveMatch.away;
    const played: BracketMatch = {
      ...liveMatch,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      winner,
      events: result.events,
      pens: result.pens,
      played: true,
    };
    let b = applyMatch(bracket, played);
    // Other fixtures in this round resolve automatically.
    for (const other of b.rounds[played.round]) {
      if (!other.played && other.home && other.away && other.id !== played.id) {
        b = applyMatch(b, simAiMatch(b.rounds[played.round].find((m) => m.id === other.id)!));
      }
    }
    const userWon = winner?.id === "user";
    if (!userWon) {
      // Run over — let the rest of the bracket play out in the background.
      let next: BracketMatch | null;
      while ((next = (() => {
        for (const r of b.rounds) for (const m of r) if (!m.played && m.home && m.away) return m;
        return null;
      })())) {
        b = applyMatch(b, simAiMatch(next));
      }
    }
    const runOver = !userWon || played.round === 3;
    if (runOver && !historyWritten.current) {
      historyWritten.current = true;
      writeCupHistory(b, userWon && played.round === 3);
    }
    setBracket(b);
    setLiveMatch(null);
    setLiveSidesSnap(null);
    if (userWon && played.round === 3) setChampion(played.winner ?? null);
    if (!userWon) setShowLoss(true);
  };

  const writeCupHistory = (b: Bracket, champ: boolean) => {
    // Compute the user's record + how far they got from the finished bracket.
    const um: { gf: number; ga: number; won: boolean; oppAbbr: string }[] = [];
    let eliminatedIn = -1;
    const scorers = new Map<string, number>();
    for (let ri = 0; ri < b.rounds.length; ri++) {
      for (const m of b.rounds[ri]) {
        if (!m.played || !m.home || !m.away) continue;
        const isHome = m.home.id === "user";
        if (!isHome && m.away.id !== "user") continue;
        const side = isHome ? "home" : "away";
        const gf = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
        const ga = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
        const won = m.winner?.id === "user";
        um.push({ gf, ga, won, oppAbbr: (isHome ? m.away : m.home).abbr });
        if (!won) eliminatedIn = ri;
        for (const e of m.events ?? []) if (e.type === "goal" && e.side === side && e.playerName) scorers.set(e.playerName, (scorers.get(e.playerName) ?? 0) + 1);
      }
    }
    const rank = strengthRank(b.seeds, "user");
    const expected = rank <= 1 ? 4 : rank === 2 ? 3 : rank <= 4 ? 2 : rank <= 8 ? 1 : 0;
    const achieved = champ ? 4 : eliminatedIn;
    const w = um.filter((x) => x.won).length, l = um.filter((x) => !x.won).length;
    const gf = um.reduce((a, x) => a + x.gf, 0), ga = um.reduce((a, x) => a + x.ga, 0);
    const best = [...um].filter((x) => x.won).sort((a, b2) => (b2.gf - b2.ga) - (a.gf - a.ga))[0];
    const ts = [...scorers.entries()].sort((a, b2) => b2[1] - a[1])[0];
    addHistory({
      date: Date.now(), mode: "cup",
      outcome: champ ? "Champions" : ROUND_NAMES[eliminatedIn] ?? "Round of 16",
      champion: champ,
      verdict: {
        label: achieved > expected ? "OVERPERFORMED" : achieved < expected ? "UNDERPERFORMED" : "MET EXPECTATIONS",
        detail: `Predicted ${STAGE_NAMES[expected]} · Reached ${STAGE_NAMES[achieved]}`,
      },
      squadRating: b.seeds.find((t) => t.id === "user")?.rating ?? 0,
      formation: squad.formation,
      record: { w, d: 0, l, gf, ga },
      topScorer: ts ? { name: ts[0], goals: ts[1] } : undefined,
      biggestWin: best ? `${best.gf}-${best.ga} vs ${best.oppAbbr}` : undefined,
    });
  };

  const userTeam = useMemo(() => bracket?.seeds.find((s) => s.isUser) ?? null, [bracket]);
  const userStatus = useMemo(() => {
    if (!bracket || !userTeam) return null;
    let lastRound = -1;
    let eliminatedIn: number | null = null;
    for (let ri = 0; ri < bracket.rounds.length; ri++) {
      for (const m of bracket.rounds[ri]) {
        if (!m.played) continue;
        if (m.home?.id === "user" || m.away?.id === "user") {
          lastRound = ri;
          if (m.winner?.id !== "user") eliminatedIn = ri;
        }
      }
    }
    return { lastRound, eliminatedIn };
  }, [bracket, userTeam]);

  const eliminated = userStatus?.eliminatedIn != null;

  // End-of-run overlays should arrive with the page back at the top.
  useEffect(() => {
    if (showLoss || champion) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showLoss, champion]);

  const buildSides = (m: BracketMatch | null): LiveSides | null => {
    if (!m?.home || !m.away) return null;
    const userIsHome = m.home.id === "user";
    const userSide: "home" | "away" = userIsHome ? "home" : "away";
    const user = buildUserSide(userIsHome ? m.home : m.away, squad, squad.bench, tactics);
    const ai = buildAiSide(userIsHome ? m.away : m.home);
    return { home: userIsHome ? user : ai, away: userIsHome ? ai : user, userSide };
  };
  const liveSides = liveSidesSnap;
  // Sides are built once at preview time and reused at kickoff (same lineup).
  const previewSides = useMemo(() => buildSides(previewMatch), [previewMatch, squad, tactics]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl tracking-wide">CHAMPIONS CUP</h1>
          </div>
          <div className="flex items-center gap-2">
            {bracket && !eliminated && !champion && (
              <Link to="/tactics" className={btnGhost}>
                <Users className="w-3.5 h-3.5" /> Manage team
              </Link>
            )}
            {bracket && nextUserMatch && !eliminated && !champion && (
              <button onClick={() => setPreviewMatch(nextUserMatch)} className={btnPrimary}>
                <Play className="w-3.5 h-3.5" /> Play your {ROUND_NAMES[nextUserMatch.round]} tie
              </button>
            )}
            {bracket && (eliminated || bracket.rounds[3][0].played) && (
              <button onClick={() => setShowSummary(true)} className={btnGhost}>
                Run summary
              </button>
            )}
            {bracket && eliminated && (
              <button onClick={restartEverything} className={btnPrimary}>
                <RotateCcw className="w-3.5 h-3.5" /> Start over
              </button>
            )}
            <Link to="/home" title="Home" className={btnGhost}>
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {!bracket ? (
          <SetupPanel xi={squad.xi} onGenerate={generate} />
        ) : (
          <>
            <StatusBar bracket={bracket} userTeam={userTeam} userStatus={userStatus} champion={champion} />
            {!eliminated && !champion && <UnavailableStrip refresh={statusTick} />}
            <BracketView bracket={bracket} activeMatchId={activeMatch?.id ?? null} onOpen={setActiveMatch} />
          </>
        )}
      </main>

      <AnimatePresence>
        {previewMatch && previewSides && !liveMatch && (
          <MatchPreview
            key={`prev-${previewMatch.id}`}
            home={previewSides.home}
            away={previewSides.away}
            userSide={previewSides.userSide}
            roundName={ROUND_NAMES[previewMatch.round]}
            onKickOff={() => { setLiveSidesSnap(previewSides); setLiveMatch(previewMatch); setPreviewMatch(null); }}
            onBack={() => setPreviewMatch(null)}
          />
        )}
        {liveMatch && liveSides && (
          <LiveMatch
            key={liveMatch.id}
            home={liveSides.home}
            away={liveSides.away}
            userSide={liveSides.userSide}
            roundName={ROUND_NAMES[liveMatch.round]}
            onFinish={onLiveFinish}
          />
        )}
        {activeMatch && activeMatch.played && !liveMatch && (
          <MatchModal match={activeMatch} onClose={() => setActiveMatch(null)} />
        )}
        {champion && !liveMatch && !showSummary && (
          <ChampionOverlay champion={champion} onDismiss={() => setChampion(null)} onRestart={restartEverything} onSummary={() => setShowSummary(true)} onHome={() => navigate({ to: "/home" })} />
        )}
        {showLoss && !liveMatch && !showSummary && (
          <LossOverlay
            round={userStatus?.eliminatedIn != null ? ROUND_NAMES[userStatus.eliminatedIn] : undefined}
            onRestart={restartEverything}
            onView={() => setShowLoss(false)}
            onSummary={() => setShowSummary(true)}
            onHome={() => navigate({ to: "/home" })}
          />
        )}
        {showSummary && bracket && (
          <RunSummaryOverlay
            bracket={bracket}
            outcome={
              champion?.isUser
                ? "Champions. Sixteen went in, you walked out with the cup."
                : userStatus?.eliminatedIn != null
                  ? `Knocked out in the ${ROUND_NAMES[userStatus.eliminatedIn]}.`
                  : "The story so far."
            }
            verdict={(() => {
              const achieved = champion?.isUser ? 4 : userStatus?.eliminatedIn ?? null;
              if (achieved == null) return undefined;
              const rank = strengthRank(bracket.seeds, "user");
              const expected = rank <= 1 ? 4 : rank === 2 ? 3 : rank <= 4 ? 2 : rank <= 8 ? 1 : 0;
              return {
                label: achieved > expected ? "OVERPERFORMED" : achieved < expected ? "UNDERPERFORMED" : "MET EXPECTATIONS",
                detail: `Predicted ${STAGE_NAMES[expected]} · Reached ${STAGE_NAMES[achieved]}`,
              } as Verdict;
            })()}
            onClose={() => setShowSummary(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SetupPanel({ xi, onGenerate }: { xi: Player[]; onGenerate: () => void }) {
  const rating = xi.length ? Math.round(xi.reduce((s, p) => s + p.overall, 0) / xi.length) : 0;
  const complete = xi.length === 11;
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-widest">
        <Trophy className="w-3.5 h-3.5" /> Knockout tournament
      </div>
      <h2 className="mt-6 font-display text-5xl sm:text-6xl">SIXTEEN IN. ONE LIFTS IT.</h2>
      <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
        A random draw against fifteen Premier League clubs. You play your matches live from the touchline —
        everyone else's results roll in on their own. Lose once, and the whole run is over.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
        <Stat label="Your XI" value={`${xi.length}/11`} tone={complete ? "ok" : "warn"} />
        <Stat label="Squad OVR" value={rating || "—"} />
        <Stat label="AI Clubs" value={15} />
      </div>
      {!complete && (
        <p className="mt-4 text-xs text-amber-400">
          You need a full XI before the draw. <Link to="/draft" className="underline">Go to draft →</Link>
        </p>
      )}
      <button
        onClick={onGenerate}
        disabled={!complete}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-[var(--shadow-glow)] disabled:opacity-40 disabled:shadow-none">
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

/* ---------- expectations ---------- */
const STAGE_NAMES = ["Round of 16 exit", "Quarter-Finals", "Semi-Finals", "Final", "Champions"];

/* Seeding logic: the #1 side should win it, #2 reach the final, 3-4 the
   semis, 5-8 the quarters, the rest owe nothing past the Round of 16. */
function expectedStage(rank: number): number {
  return rank <= 1 ? 4 : rank === 2 ? 3 : rank <= 4 ? 2 : rank <= 8 ? 1 : 0;
}

function StatusBar({ bracket, userTeam, userStatus, champion }: {
  bracket: Bracket; userTeam: TeamEntry | null;
  userStatus: { lastRound: number; eliminatedIn: number | null } | null;
  champion: TeamEntry | null;
}) {
  let msg = "Awaiting kick-off. Play your tie when you're ready.";
  let tone = "text-muted-foreground";
  if (champion) {
    msg = champion.isUser ? `CHAMPIONS. You lifted the cup.` : `${champion.name} lifted the cup.`;
    tone = champion.isUser ? "text-[oklch(0.85_0.22_140)]" : "text-foreground";
  } else if (userStatus?.eliminatedIn != null) {
    msg = `Knocked out in the ${ROUND_NAMES[userStatus.eliminatedIn]}. The run is over.`;
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
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Your squad</div>
              <div className="font-display text-xl">OVR {userTeam.rating}</div>
            </div>
          </div>
        )}
        <div className="hidden sm:block h-10 w-px bg-border" />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
          <div className={`font-display text-xl ${tone}`}>{msg}</div>
        </div>
        {userTeam && (
          <>
            <div className="hidden sm:block h-10 w-px bg-border" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Prediction</div>
              <div className="font-display text-xl text-muted-foreground">
                #{strengthRank(bracket.seeds, "user")} strongest · {STAGE_NAMES[expectedStage(strengthRank(bracket.seeds, "user"))]}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TeamCrest({ team, size = 32 }: { team: TeamEntry; size?: number }) {
  const logo = clubLogo(team.id);
  if (logo) {
    return (
      <img src={logo} alt={team.name} style={{ width: size, height: size }}
        className={`object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] ${team.isUser ? "scale-110" : ""}`} />
    );
  }
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

/* Real bracket geometry: a 16-row grid where a round-r match spans 2^(r+1)
   rows, so every tie sits exactly centered between its two feeders, joined
   by ⊐-shaped connector lines. */
const GRID_COLS = "minmax(180px,1fr) 28px minmax(180px,1fr) 28px minmax(180px,1fr) 28px minmax(180px,1fr)";

function BracketView({ bracket, activeMatchId, onOpen }: {
  bracket: Bracket; activeMatchId: string | null; onOpen: (m: BracketMatch) => void;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[980px]">
        {/* round labels */}
        <div className="grid mb-3" style={{ gridTemplateColumns: GRID_COLS }}>
          {ROUND_NAMES.map((name, ri) => (
            <div key={name} className="text-[10px] uppercase tracking-widest text-muted-foreground text-center"
              style={{ gridColumn: ri * 2 + 1 }}>
              {name}
            </div>
          ))}
        </div>
        {/* bracket body */}
        <div className="grid" style={{ gridTemplateColumns: GRID_COLS, gridTemplateRows: "repeat(16, minmax(2.75rem, 1fr))" }}>
          {bracket.rounds.map((round, ri) =>
            round.map((m) => {
              const span = 2 ** (ri + 1);
              return (
                <div key={m.id} className="flex items-center px-0.5"
                  style={{ gridColumn: ri * 2 + 1, gridRow: `${m.index * span + 1} / span ${span}` }}>
                  <MatchCard match={m} active={m.id === activeMatchId} onClick={() => m.played && onOpen(m)} />
                </div>
              );
            })
          )}
          {/* connectors: one per next-round match, spanning its feeders */}
          {[0, 1, 2].map((ri) =>
            bracket.rounds[ri + 1].map((m) => {
              const span = 2 ** (ri + 2);
              return (
                <div key={`c-${ri}-${m.index}`} className="relative"
                  style={{ gridColumn: ri * 2 + 2, gridRow: `${m.index * span + 1} / span ${span}` }}>
                  <div className="absolute left-0 w-1/2 top-1/4 bottom-1/4 border-t border-b border-r border-border/70" />
                  <div className="absolute right-0 w-1/2 top-1/2 border-t border-border/70" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, active, onClick }: { match: BracketMatch; active: boolean; onClick: () => void }) {
  const hasTeams = match.home && match.away;
  const isUserMatch = match.home?.id === "user" || match.away?.id === "user";
  return (
    <motion.button
      initial={false}
      animate={match.played ? { opacity: 1 } : { opacity: hasTeams ? 1 : 0.7 }}
      onClick={onClick}
      disabled={!match.played}
      className={`w-full text-left rounded-xl border p-3 transition-all ${
        active ? "border-primary shadow-[var(--shadow-glow)]" :
        isUserMatch && !match.played && hasTeams ? "border-primary/60 bg-surface" :
        match.played ? "border-border bg-surface hover:bg-surface-2 cursor-pointer" :
        hasTeams ? "border-border/70 bg-surface" : "border-dashed border-border/40 bg-transparent"
      }`}
    >
      <TeamRow team={match.home} score={match.homeScore} pens={match.pens?.home} isWinner={match.winner?.id === match.home?.id} />
      <div className="my-1 border-t border-border/40" />
      <TeamRow team={match.away} score={match.awayScore} pens={match.pens?.away} isWinner={match.winner?.id === match.away?.id} />
    </motion.button>
  );
}

function TeamRow({ team, score, pens, isWinner }: { team?: TeamEntry; score?: number; pens?: number; isWinner?: boolean }) {
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
      <div className="font-display text-lg tabular-nums">
        {score ?? "–"}
        {pens != null && <span className="ml-1 font-mono text-[10px] text-muted-foreground">({pens})</span>}
      </div>
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
                  <img src={ballIcon} alt="" className="w-4 h-4 object-contain [filter:brightness(0)_invert(1)]" />
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


/* ---------- run summary ---------- */
function buildRunSummary(bracket: Bracket) {
  const matches: { round: string; opp: TeamEntry; gf: number; ga: number; won: boolean; pens?: string }[] = [];
  const scorers = new Map<string, number>();
  const assisters = new Map<string, number>();
  for (let ri = 0; ri < bracket.rounds.length; ri++) {
    for (const m of bracket.rounds[ri]) {
      if (!m.played || !m.home || !m.away) continue;
      const isHome = m.home.id === "user";
      if (!isHome && m.away.id !== "user") continue;
      const userSide = isHome ? "home" : "away";
      const gf = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
      const ga = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
      matches.push({
        round: ROUND_NAMES[ri],
        opp: isHome ? m.away : m.home,
        gf, ga,
        won: m.winner?.id === "user",
        pens: m.pens ? `${isHome ? m.pens.home : m.pens.away}–${isHome ? m.pens.away : m.pens.home}` : undefined,
      });
      for (const e of m.events ?? []) {
        if (e.type !== "goal" || e.side !== userSide) continue;
        if (e.playerName) scorers.set(e.playerName, (scorers.get(e.playerName) ?? 0) + 1);
        if (e.assistName) assisters.set(e.assistName, (assisters.get(e.assistName) ?? 0) + 1);
      }
    }
  }
  const top = (map: Map<string, number>) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return {
    matches,
    topScorers: top(scorers),
    topAssisters: top(assisters),
    won: matches.filter((x) => x.won).length,
    gf: matches.reduce((s, x) => s + x.gf, 0),
    ga: matches.reduce((s, x) => s + x.ga, 0),
    cleanSheets: matches.filter((x) => x.ga === 0).length,
  };
}

function RunSummaryOverlay({ bracket, outcome, verdict, onClose }: { bracket: Bracket; outcome: string; verdict?: Verdict; onClose: () => void }) {
  const s = buildRunSummary(bracket);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto"
    >
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Season review</div>
          <h2 className="mt-2 font-display text-6xl">YOUR RUN</h2>
          <p className="mt-2 text-sm text-muted-foreground">{outcome}</p>
          {verdict && (
            <div className="mt-4">
              <VerdictChip verdict={verdict} />
            </div>
          )}
        </div>

        {/* totals */}
        <div className="mt-8 grid grid-cols-5 gap-2">
          {[
            ["Played", s.matches.length],
            ["Won", s.won],
            ["Scored", s.gf],
            ["Conceded", s.ga],
            ["Clean sheets", s.cleanSheets],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-xl border border-border bg-surface p-3 text-center">
              <div className="font-display text-3xl">{v}</div>
              <div className="mt-0.5 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>

        {/* results */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Results</div>
          <ul className="space-y-2">
            {s.matches.map((m, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className={`w-6 h-6 shrink-0 rounded-md grid place-items-center font-display text-xs ${m.won ? "bg-[oklch(0.75_0.19_145)]/20 text-[oklch(0.85_0.22_140)]" : "bg-primary/20 text-primary"}`}>
                  {m.won ? "W" : "L"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground w-28 shrink-0">{m.round}</span>
                <TeamCrest team={m.opp} size={22} />
                <span className="flex-1 truncate">{m.opp.name}</span>
                <span className="font-display text-xl tabular-nums">
                  {m.gf}–{m.ga}{m.pens && <span className="font-mono text-[10px] text-muted-foreground ml-1.5">({m.pens} p)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* competition-wide awards */}
        {(() => {
          const played = bracket.rounds.flat()
            .filter((m) => m.played && m.home && m.away)
            .map((m) => ({ home: m.home!.id, away: m.away!.id, events: m.events }));
          const { scorers, assisters } = aggregateScorers(played);
          return (
            <div className="mt-6">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3 text-center">Awards</div>
              <AwardsBlock scorers={scorers} assisters={assisters} />
            </div>
          );
        })()}

        {/* your scorers + assists */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {[
            ["Top scorers", s.topScorers, "goal"] as const,
            ["Top assists", s.topAssisters, "assist"] as const,
          ].map(([title, list, icon]) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">{title}</div>
              {list.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">Nobody troubled the scorers.</div>
              ) : (
                <ul className="space-y-1.5">
                  {list.map(([name, n]) => (
                    <li key={name} className="flex items-center gap-2 text-sm">
                      {icon === "goal" ? <img src={ballIcon} alt="" className="w-3.5 h-3.5 object-contain [filter:brightness(0)_invert(1)]" /> : <img src={assistIcon} alt="" className="w-5 h-5 object-contain [filter:brightness(0)_invert(1)]" />}
                      <span className="flex-1 truncate">{name}</span>
                      <span className="font-display text-lg tabular-nums">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button onClick={onClose} className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ChampionOverlay({ champion, onDismiss, onRestart, onSummary, onHome }: { champion: TeamEntry; onDismiss: () => void; onRestart: () => void; onSummary: () => void; onHome: () => void }) {
  const userWon = champion.isUser;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background: userWon
            ? "radial-gradient(ellipse at 50% 25%, oklch(0.55 0.13 85 / 0.95), oklch(0.13 0.02 80 / 0.98) 72%)"
            : "radial-gradient(ellipse at 50% 25%, oklch(0.3 0.05 260 / 0.95), oklch(0.12 0.015 260 / 0.98) 72%)",
        }}
      />
      {userWon && (
        <Confetti colors={["oklch(0.85 0.17 85)", "oklch(0.72 0.16 80)", "#ffffff", "oklch(0.88 0.22 125)"]} />
      )}
      <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
        <motion.div
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        >
          <Trophy className={`w-20 h-20 ${userWon ? "text-[oklch(0.85_0.17_85)]" : "text-muted-foreground"}`}
            style={userWon ? { filter: "drop-shadow(0 0 30px oklch(0.85 0.17 85 / 0.8))" } : undefined} />
        </motion.div>
        <motion.div
          initial={{ scale: 2.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 15, delay: 0.15 }}
          className="mt-3 font-display leading-[0.85] text-[clamp(3.5rem,12vw,9rem)] text-white"
          style={{ textShadow: userWon ? "0 0 90px oklch(0.85 0.17 85 / 0.8), 0 4px 0 oklch(0.5 0.13 75)" : undefined }}
        >
          {userWon ? "CHAMPIONS!" : "IT'S OVER."}
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}>
          <div className="mt-3 flex items-center justify-center gap-3">
            <TeamCrest team={champion} size={44} />
            <div className="font-display text-3xl text-white">{champion.name}</div>
          </div>
          <p className="mt-3 text-sm text-white/75 max-w-sm mx-auto">
            {userWon
              ? "Sixteen went in. You walked out with the cup. Immortal."
              : `${champion.name} lift the trophy that should have been yours.`}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onSummary} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10">
              Run summary
            </button>
            <button onClick={onDismiss} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10">
              View bracket
            </button>
            <button onClick={onHome} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10">
              <Home className="w-3.5 h-3.5" /> Home
            </button>
            <button onClick={onRestart}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold hover:brightness-110 ${userWon ? "bg-[oklch(0.85_0.17_85)] text-[oklch(0.2_0.06_70)]" : "bg-primary text-primary-foreground"}`}>
              <RotateCcw className="w-3.5 h-3.5" /> Run it back
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function LossOverlay({ round, onRestart, onView, onSummary, onHome }: { round?: string; onRestart: () => void; onView: () => void; onSummary: () => void; onHome: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 30%, oklch(0.33 0.13 25 / 0.95), oklch(0.1 0.02 260 / 0.98) 72%)" }}
      />
      <motion.div
        className="absolute inset-0 bg-primary"
        initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }}
      />
      <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}>
          <Skull className="w-16 h-16 text-primary" style={{ filter: "drop-shadow(0 0 24px oklch(0.63 0.24 25 / 0.7))" }} />
        </motion.div>
        <motion.div
          initial={{ scale: 2.6, opacity: 0, rotate: 3 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 15, delay: 0.15 }}
          className="mt-3 font-display leading-[0.85] text-[clamp(3.5rem,12vw,9rem)] text-white"
          style={{ textShadow: "0 0 80px oklch(0.63 0.24 25 / 0.7), 0 4px 0 oklch(0.35 0.16 25)" }}
        >
          RUN OVER.
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}>
          {round && (
            <div className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-white/70">
              Knocked out in the {round}
            </div>
          )}
          <p className="mt-3 text-sm text-white/75 max-w-sm mx-auto">
            One bad night and it's all gone — draft, tactics, bracket. That's knockout football.
            Build a better one.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onSummary} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10">
              Run summary
            </button>
            <button onClick={onView} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10">
              See how it ended
            </button>
            <button onClick={onRestart} className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-2.5 text-xs font-bold text-primary-foreground hover:brightness-110">
              <RotateCcw className="w-3.5 h-3.5" /> Start everything again
            </button>
            <button onClick={onHome} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10">
              <Home className="w-3.5 h-3.5" /> Home
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
