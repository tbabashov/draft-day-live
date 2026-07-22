import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RotateCcw, Play, Home, FastForward, Users, X } from "lucide-react";
import { btnGhost, btnPrimary } from "@/lib/ui";
import type { TacticsSettings } from "@/lib/tactics-utils";
import { DEFAULT_TACTICS, FORMATIONS, squadStrength } from "@/lib/tactics-utils";
import {
  buildAiEntries, buildUserEntry, simulateMatch, strengthRank, aggregateScorers,
  type TeamEntry, type MatchEvent, type Verdict, type ScoreEntry,
} from "@/lib/tournament-utils";
import { VerdictChip } from "@/components/VerdictChip";
import { AwardsBlock } from "@/components/AwardsBlock";
import { addHistory } from "@/lib/history";
import { LiveMatch, type LiveResult } from "@/components/LiveMatch";
import { MatchPreview } from "@/components/MatchPreview";
import { loadSquad, loadTactics, buildUserSide, buildAiSide, DRAFT_KEY, TACTICS_KEY, type LoadedSquad, type LiveSides } from "@/lib/squad-load";
import { recordForm, applyMatchDiscipline, SQUAD_STATUS_KEY } from "@/lib/squad-status";
import { UnavailableStrip } from "@/components/UnavailableStrip";
import { clubLogo } from "@/lib/logos";
import { Confetti } from "@/components/Confetti";
import ballIcon from "@/assets/icon-ball.png";

export const Route = createFileRoute("/league")({
  head: () => ({
    meta: [
      { title: "League — GAFFER" },
      { name: "description", content: "Twenty-one clubs, one table. Every point counts — most of them lifts the title." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeaguePage,
});

const LEAGUE_KEY = "gaffer.league.v1";
const BRACKET_KEY = "gaffer.bracket.v1";
const BYE = "__bye__";

type Fixture = {
  round: number;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  events?: MatchEvent[];
};

type LeagueState = {
  teams: TeamEntry[];
  fixtures: Fixture[];
};

/* Single round-robin via the circle method; odd team counts get a bye. */
function makeFixtures(ids: string[]): Fixture[] {
  const list = [...ids];
  if (list.length % 2) list.push(BYE);
  const n = list.length;
  const rot = list.slice(1);
  const fixtures: Fixture[] = [];
  for (let r = 0; r < n - 1; r++) {
    const left = [list[0], ...rot.slice(0, n / 2 - 1)];
    const right = rot.slice(n / 2 - 1).reverse();
    for (let i = 0; i < n / 2; i++) {
      const [a, b] = [left[i], right[i]];
      if (a === BYE || b === BYE) continue;
      // Alternate venues so nobody plays every game at home.
      const flip = (r + i) % 2 === 1;
      fixtures.push({ round: r, home: flip ? b : a, away: flip ? a : b, played: false });
    }
    rot.unshift(rot.pop()!);
  }
  return fixtures;
}

type Row = { team: TeamEntry; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number };

function buildTable(league: LeagueState): Row[] {
  const rows = new Map<string, Row>(league.teams.map((t) => [t.id, { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
  for (const f of league.fixtures) {
    if (!f.played) continue;
    const h = rows.get(f.home)!, a = rows.get(f.away)!;
    h.p++; a.p++;
    h.gf += f.homeScore!; h.ga += f.awayScore!;
    a.gf += f.awayScore!; a.ga += f.homeScore!;
    if (f.homeScore! > f.awayScore!) { h.w++; a.l++; h.pts += 3; }
    else if (f.homeScore! < f.awayScore!) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  return [...rows.values()].sort((x, y) =>
    y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.team.name.localeCompare(y.team.name)
  );
}

function LeaguePage() {
  const navigate = useNavigate();
  const [squad, setSquad] = useState<LoadedSquad>({ xi: [], bench: [], formation: "4-3-3", assignments: {} });
  const [tactics, setTactics] = useState<TacticsSettings>(DEFAULT_TACTICS);
  const [league, setLeague] = useState<LeagueState | null>(null);
  const [liveFixture, setLiveFixture] = useState<Fixture | null>(null);
  const [previewFixture, setPreviewFixture] = useState<Fixture | null>(null);
  const [resultFixture, setResultFixture] = useState<Fixture | null>(null);
  const [liveSidesSnap, setLiveSidesSnap] = useState<LiveSides | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [statusTick, setStatusTick] = useState(0);
  const historyWritten = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadSquad();
    setSquad(loaded);
    setTactics({ ...loadTactics(), formation: loaded.formation });
    try {
      const raw = window.localStorage.getItem(LEAGUE_KEY);
      if (raw) setLeague(JSON.parse(raw) as LeagueState);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !league) return;
    try { window.localStorage.setItem(LEAGUE_KEY, JSON.stringify(league)); } catch {}
  }, [league, ready]);

  const teamById = useMemo(() => new Map((league?.teams ?? []).map((t) => [t.id, t])), [league]);
  const table = useMemo(() => (league ? buildTable(league) : []), [league]);
  const totalRounds = useMemo(() => (league ? Math.max(...league.fixtures.map((f) => f.round)) + 1 : 0), [league]);
  const seasonOver = !!league && league.fixtures.every((f) => f.played);
  const userRow = table.findIndex((r) => r.team.isUser);

  const nextRound = useMemo(() => {
    if (!league) return -1;
    const f = league.fixtures.find((x) => !x.played);
    return f ? f.round : -1;
  }, [league]);

  const userFixture = useMemo(() => {
    if (!league || nextRound < 0) return null;
    return league.fixtures.find((f) => f.round === nextRound && !f.played && (f.home === "user" || f.away === "user")) ?? null;
  }, [league, nextRound]);

  const generate = () => {
    const slots = FORMATIONS[squad.formation];
    const { rating } = squadStrength(squad.assignments, slots);
    const user = buildUserEntry(squad.xi, undefined, rating || undefined);
    const ai = buildAiEntries(20); // every club in the league
    const teams = [user, ...ai];
    setLeague({ teams, fixtures: makeFixtures(teams.map((t) => t.id)) });
    setShowEnd(false);
  };

  const simFixture = (f: Fixture): Fixture => {
    const res = simulateMatch(teamById.get(f.home)!, teamById.get(f.away)!, { allowDraw: true });
    return { ...f, homeScore: res.homeScore, awayScore: res.awayScore, played: true, events: res.events };
  };

  const applyRound = (playedUser?: Fixture) => {
    if (!league || nextRound < 0) return;
    const fixtures = league.fixtures.map((f) => {
      if (f.round !== nextRound || f.played) return f;
      if (playedUser && f.home === playedUser.home && f.away === playedUser.away) return playedUser;
      return simFixture(f);
    });
    const next = { ...league, fixtures };
    setLeague(next);
    if (fixtures.every((f) => f.played)) setShowEnd(true);
  };

  const playNext = () => {
    if (!league || nextRound < 0) return;
    if (userFixture) setPreviewFixture(userFixture);
    else applyRound(); // bye week: results just roll in
  };

  const onLiveFinish = (result: LiveResult) => {
    if (!liveFixture) return;
    recordForm(result.ratings);
    applyMatchDiscipline(result.discipline);
    setStatusTick((t) => t + 1);
    applyRound({
      ...liveFixture,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      played: true,
      events: result.events,
    });
    setLiveFixture(null);
    setLiveSidesSnap(null);
  };

  const restartEverything = () => {
    try {
      window.localStorage.removeItem(LEAGUE_KEY);
      window.localStorage.removeItem(BRACKET_KEY);
      window.localStorage.removeItem(DRAFT_KEY);
      window.localStorage.removeItem(TACTICS_KEY);
      window.localStorage.removeItem(SQUAD_STATUS_KEY);
    } catch {}
    navigate({ to: "/draft" });
  };

  const buildSides = (f: Fixture | null): LiveSides | null => {
    if (!f) return null;
    const homeEntry = teamById.get(f.home)!;
    const awayEntry = teamById.get(f.away)!;
    const userIsHome = homeEntry.isUser;
    const userSide: "home" | "away" = userIsHome ? "home" : "away";
    const user = buildUserSide(userIsHome ? homeEntry : awayEntry, squad, squad.bench, tactics);
    const ai = buildAiSide(userIsHome ? awayEntry : homeEntry);
    return { home: userIsHome ? user : ai, away: userIsHome ? ai : user, userSide };
  };
  const liveSides = liveSidesSnap;
  const previewSides = useMemo(() => buildSides(previewFixture), [previewFixture, teamById, squad, tactics]);

  const champion = seasonOver && userRow === 0;
  const leagueScorers = useMemo(() => {
    if (!league) return { scorers: [], assisters: [] };
    return aggregateScorers(league.fixtures.filter((f) => f.played).map((f) => ({ home: f.home, away: f.away, events: f.events })));
  }, [league]);

  useEffect(() => {
    if (showEnd) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showEnd]);

  // Paper prediction: where each squad "should" finish on strength alone.
  const predictedRank = useMemo(() => {
    if (!league) return new Map<string, number>();
    return new Map(league.teams.map((t) => [t.id, strengthRank(league.teams, t.id)]));
  }, [league]);
  const userPredicted = predictedRank.get("user") ?? 0;
  const verdict: Verdict | undefined = seasonOver
    ? (() => {
        const diff = userPredicted - (userRow + 1); // positive = finished higher than predicted
        return {
          label: diff >= 2 ? "OVERPERFORMED" : diff <= -2 ? "UNDERPERFORMED" : "MET EXPECTATIONS",
          detail: `Predicted #${userPredicted} · Finished #${userRow + 1}`,
        };
      })()
    : undefined;

  useEffect(() => {
    if (!seasonOver || !league || historyWritten.current) return;
    historyWritten.current = true;
    const ur = table[userRow];
    // biggest win among the user's fixtures
    let best: { gf: number; ga: number; opp: string } | null = null;
    for (const f of league.fixtures) {
      if (!f.played) continue;
      const isHome = f.home === "user", isAway = f.away === "user";
      if (!isHome && !isAway) continue;
      const gf = isHome ? f.homeScore! : f.awayScore!;
      const ga = isHome ? f.awayScore! : f.homeScore!;
      if (gf > ga && (!best || gf - ga > best.gf - best.ga)) {
        best = { gf, ga, opp: teamById.get(isHome ? f.away : f.home)?.abbr ?? "" };
      }
    }
    const ts = leagueScorers.scorers.find((e) => e.teamId === "user");
    addHistory({
      date: Date.now(), mode: "league",
      outcome: champion ? "Champions" : `${ordinal(userRow + 1)} of ${league.teams.length}`,
      champion,
      verdict,
      squadRating: league.teams.find((t) => t.id === "user")?.rating ?? 0,
      formation: squad.formation,
      record: ur ? { w: ur.w, d: ur.d, l: ur.l, gf: ur.gf, ga: ur.ga } : { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      topScorer: ts ? { name: ts.name, goals: ts.goals } : undefined,
      biggestWin: best ? `${best.gf}-${best.ga} vs ${best.opp}` : undefined,
    });
  }, [seasonOver, league, table, userRow, champion, verdict, leagueScorers, squad.formation, teamById]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-display text-lg sm:text-2xl tracking-wide truncate">DRAFT LEAGUE</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-2">
              {league && !seasonOver && (
                <Link to="/tactics" className={btnGhost}>
                  <Users className="w-3.5 h-3.5" /> Manage team
                </Link>
              )}
              {league && !seasonOver && nextRound >= 0 && (
                <button onClick={playNext} className={btnPrimary}>
                  {userFixture ? <Play className="w-3.5 h-3.5" /> : <FastForward className="w-3.5 h-3.5" />}
                  {userFixture ? `Play matchday ${nextRound + 1}` : `Sim matchday ${nextRound + 1} (bye)`}
                </button>
              )}
              {seasonOver && (
                <button onClick={restartEverything} className={btnPrimary}>
                  <RotateCcw className="w-3.5 h-3.5" /> Start over
                </button>
              )}
            </div>
            {/* Mobile: icon only — matchday button lives in the bottom bar */}
            <div className="flex lg:hidden items-center gap-2">
              {league && !seasonOver && (
                <Link to="/tactics" title="Manage team" className={`${btnGhost} !px-3`}>
                  <Users className="w-4 h-4" />
                </Link>
              )}
            </div>
            <Link to="/home" title="Home" className={`${btnGhost} !px-3 lg:!px-7`}>
              <Home className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 sm:px-6 py-5 sm:py-8 pb-28 lg:pb-8">
        {!league ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-widest">
              <Trophy className="w-3.5 h-3.5" /> League season
            </div>
            <h2 className="mt-6 font-display text-5xl sm:text-6xl">ONE TABLE. NO HIDING.</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              You and all twenty Premier League clubs, each played once. Draws count, points add up,
              and there's no lifeline — just wherever the table says you belong.
            </p>
            <button
              onClick={generate}
              disabled={squad.xi.length < 11}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-[var(--shadow-glow)] disabled:opacity-40 disabled:shadow-none">
              Start the season <Trophy className="w-4 h-4" />
            </button>
            {squad.xi.length < 11 && (
              <p className="mt-4 text-xs text-amber-400">
                You need a full XI first. <Link to="/draft" className="underline">Go to draft →</Link>
              </p>
            )}
          </div>
        ) : (
          <>
            {/* status */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-2xl border border-border bg-surface p-3 sm:p-4">
              <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-6">
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="sm:hidden">Pos</span><span className="hidden sm:inline">Position</span>
                  </div>
                  <div className="font-display text-xl sm:text-2xl">#{userRow + 1}</div>
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="sm:hidden">Pts</span><span className="hidden sm:inline">Points</span>
                  </div>
                  <div className="font-display text-xl sm:text-2xl">{table[userRow]?.pts ?? 0}</div>
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="sm:hidden">MD</span><span className="hidden sm:inline">Matchday</span>
                  </div>
                  <div className="font-display text-xl sm:text-2xl">{Math.min(nextRound + 1, totalRounds) || totalRounds}/{totalRounds}</div>
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="sm:hidden">Pred</span><span className="hidden sm:inline">Predicted finish</span>
                  </div>
                  <div className="font-display text-xl sm:text-2xl text-muted-foreground">#{userPredicted}</div>
                </div>
              </div>
              {!seasonOver && (
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">Next</div>
                  {userFixture ? (
                    (() => {
                      const oppId = userFixture.home === "user" ? userFixture.away : userFixture.home;
                      const opp = teamById.get(oppId)!;
                      return (
                        <div className="flex items-center gap-2 min-w-0">
                          {clubLogo(opp.id) && <img src={clubLogo(opp.id)} alt="" className="w-6 h-6 object-contain shrink-0" />}
                          <span className="font-display text-lg sm:text-xl truncate">{opp.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground uppercase shrink-0">{userFixture.home === "user" ? "home" : "away"}</span>
                        </div>
                      );
                    })()
                  ) : (
                    <span className="font-display text-lg sm:text-xl text-muted-foreground">Bye week</span>
                  )}
                </div>
              )}
            </div>

            {!seasonOver && <UnavailableStrip refresh={statusTick} />}

            {/* standings */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="text-left px-2 sm:px-4 py-2.5 w-8 sm:w-10">#</th>
                    <th className="text-center px-2 py-2.5 w-10 hidden md:table-cell" title="Predicted position">PR</th>
                    <th className="text-left px-2 py-2.5">Club</th>
                    <th className="text-center px-1.5 sm:px-2 py-2.5 w-8 sm:w-10">P</th>
                    <th className="text-center px-2 py-2.5 w-10 hidden sm:table-cell">W</th>
                    <th className="text-center px-2 py-2.5 w-10 hidden sm:table-cell">D</th>
                    <th className="text-center px-2 py-2.5 w-10 hidden sm:table-cell">L</th>
                    <th className="text-center px-2 py-2.5 w-12 hidden md:table-cell">GF</th>
                    <th className="text-center px-2 py-2.5 w-12 hidden md:table-cell">GA</th>
                    <th className="text-center px-1.5 sm:px-2 py-2.5 w-10 sm:w-12">GD</th>
                    <th className="text-center px-2 sm:px-4 py-2.5 w-11 sm:w-14">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((r, i) => (
                    <tr key={r.team.id}
                      className={`border-b border-border/40 last:border-b-0 ${r.team.isUser ? "bg-primary/10" : i % 2 ? "bg-surface-2/40" : ""}`}>
                      <td className={`px-2 sm:px-4 py-2 font-display ${i === 0 ? "text-[oklch(0.82_0.16_85)]" : "text-muted-foreground"}`}>{i + 1}</td>
                      <td className="text-center px-2 py-2 font-mono text-[10px] text-muted-foreground tabular-nums hidden md:table-cell">{predictedRank.get(r.team.id)}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {clubLogo(r.team.id)
                            ? <img src={clubLogo(r.team.id)} alt="" className={`w-5 h-5 object-contain shrink-0 ${r.team.isUser ? "scale-110" : ""}`} />
                            : <span className="w-5 h-5 shrink-0 rounded grid place-items-center text-[8px] font-display border border-white/10"
                                style={{ background: `linear-gradient(135deg, ${r.team.primary}, ${r.team.secondary})`, color: "#fff" }}>{r.team.abbr}</span>}
                          {/* abbreviation on phones, full name once there's room */}
                          <span className="sm:hidden truncate font-semibold">{r.team.abbr}</span>
                          <span className="hidden sm:inline truncate font-semibold">{r.team.name}</span>
                          {r.team.isUser && <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary uppercase font-bold shrink-0">You</span>}
                        </div>
                      </td>
                      <td className="text-center px-1.5 sm:px-2 py-2 tabular-nums">{r.p}</td>
                      <td className="text-center px-2 py-2 tabular-nums hidden sm:table-cell">{r.w}</td>
                      <td className="text-center px-2 py-2 tabular-nums hidden sm:table-cell">{r.d}</td>
                      <td className="text-center px-2 py-2 tabular-nums hidden sm:table-cell">{r.l}</td>
                      <td className="text-center px-2 py-2 tabular-nums hidden md:table-cell">{r.gf}</td>
                      <td className="text-center px-2 py-2 tabular-nums hidden md:table-cell">{r.ga}</td>
                      <td className="text-center px-1.5 sm:px-2 py-2 tabular-nums">{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</td>
                      <td className="text-center px-2 sm:px-4 py-2 font-display text-base sm:text-lg tabular-nums">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* your results so far */}
            <UserResults league={league} teamById={teamById} />

            {/* around the grounds — the other matches this matchday */}
            <AroundTheGrounds league={league} teamById={teamById} onOpen={setResultFixture} />

            {/* league top scorers */}
            {leagueScorers.scorers.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Top scorers</div>
                <ul className="space-y-1.5">
                  {leagueScorers.scorers.slice(0, 5).map((e, i) => (
                    <li key={e.teamId + e.name} className="flex items-center gap-2 text-sm">
                      <span className="font-display text-muted-foreground w-5 tabular-nums">{i + 1}</span>
                      {clubLogo(e.teamId) && <img src={clubLogo(e.teamId)} alt="" className="w-4 h-4 object-contain" />}
                      <span className="flex-1 truncate">{e.name}</span>
                      <span className="font-display text-lg tabular-nums">{e.goals}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile bottom action bar — advance the season from thumb reach */}
      {league && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {!seasonOver && nextRound >= 0 ? (
            <button onClick={playNext}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
              {userFixture ? <Play className="w-4 h-4" /> : <FastForward className="w-4 h-4" />}
              {userFixture ? `Play matchday ${nextRound + 1}` : `Sim matchday ${nextRound + 1} (bye)`}
            </button>
          ) : seasonOver ? (
            <button onClick={restartEverything}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
              <RotateCcw className="w-4 h-4" /> Start over
            </button>
          ) : null}
        </div>
      )}

      <AnimatePresence>
        {previewFixture && previewSides && !liveFixture && (
          <MatchPreview
            key={`prev-${previewFixture.round}-${previewFixture.home}`}
            home={previewSides.home}
            away={previewSides.away}
            userSide={previewSides.userSide}
            roundName={`Matchday ${previewFixture.round + 1}`}
            onKickOff={() => { setLiveSidesSnap(previewSides); setLiveFixture(previewFixture); setPreviewFixture(null); }}
            onBack={() => setPreviewFixture(null)}
          />
        )}
        {liveFixture && liveSides && (
          <LiveMatch
            key={`${liveFixture.round}-${liveFixture.home}`}
            home={liveSides.home}
            away={liveSides.away}
            userSide={liveSides.userSide}
            roundName={`Matchday ${liveFixture.round + 1}`}
            context="league"
            onFinish={onLiveFinish}
          />
        )}
        {showEnd && !liveFixture && league && (
          <SeasonEndOverlay
            position={userRow + 1}
            row={table[userRow]}
            champion={champion}
            verdict={verdict}
            scorers={leagueScorers.scorers}
            assisters={leagueScorers.assisters}
            onRestart={restartEverything}
            onView={() => setShowEnd(false)}
            onHome={() => navigate({ to: "/home" })}
          />
        )}
        {resultFixture && (
          <LeagueResultModal fixture={resultFixture} teamById={teamById} onClose={() => setResultFixture(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* The other results from the most recent matchday — the AI's games you didn't
   play in. Tap one to see how it unfolded. */
function AroundTheGrounds({ league, teamById, onOpen }: {
  league: LeagueState; teamById: Map<string, TeamEntry>; onOpen: (f: Fixture) => void;
}) {
  const played = league.fixtures.filter((f) => f.played).map((f) => f.round);
  if (!played.length) return null;
  const lastRound = Math.max(...played);
  const others = league.fixtures.filter(
    (f) => f.round === lastRound && f.played && f.home !== "user" && f.away !== "user"
  );
  if (!others.length) return null;
  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-primary ticker-dot" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Around the grounds · Matchday {lastRound + 1}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {others.map((f) => {
          const home = teamById.get(f.home)!;
          const away = teamById.get(f.away)!;
          const homeWon = f.homeScore! > f.awayScore!;
          const awayWon = f.awayScore! > f.homeScore!;
          return (
            <button
              key={`${f.round}-${f.home}-${f.away}`}
              onClick={() => onOpen(f)}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm hover:border-primary/50 transition text-left"
            >
              {clubLogo(home.id) && <img src={clubLogo(home.id)} alt="" className="w-5 h-5 object-contain shrink-0" />}
              <span className={`flex-1 truncate ${homeWon ? "font-semibold" : "text-muted-foreground"}`}>{home.abbr}</span>
              <span className="font-display tabular-nums px-1.5">{f.homeScore}–{f.awayScore}</span>
              <span className={`flex-1 truncate text-right ${awayWon ? "font-semibold" : "text-muted-foreground"}`}>{away.abbr}</span>
              {clubLogo(away.id) && <img src={clubLogo(away.id)} alt="" className="w-5 h-5 object-contain shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LeagueResultModal({ fixture, teamById, onClose }: {
  fixture: Fixture; teamById: Map<string, TeamEntry>; onClose: () => void;
}) {
  const home = teamById.get(fixture.home)!;
  const away = teamById.get(fixture.away)!;
  const goals = (fixture.events ?? []).filter((e) => e.type === "goal");
  const crest = (t: TeamEntry, win: boolean) => (
    <div className={`text-center ${win ? "" : "opacity-60"}`}>
      {clubLogo(t.id)
        ? <img src={clubLogo(t.id)} alt="" className="w-12 h-12 object-contain mx-auto" />
        : <div className="w-12 h-12 mx-auto rounded grid place-items-center font-display" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: "#fff" }}>{t.abbr}</div>}
      <div className="mt-2 font-display text-sm truncate">{t.abbr}</div>
    </div>
  );
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
            Matchday {fixture.round + 1} · Full Time
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {crest(home, fixture.homeScore! > fixture.awayScore!)}
            <div className="font-display text-5xl tabular-nums">{fixture.homeScore}–{fixture.awayScore}</div>
            {crest(away, fixture.awayScore! > fixture.homeScore!)}
          </div>
        </div>
        <div className="p-6 max-h-[45vh] overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Goals</div>
          {goals.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">0–0. A stalemate of a spectacle.</div>
          ) : (
            <ul className="space-y-2">
              {goals.map((e, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="font-display text-lg w-10 text-muted-foreground tabular-nums">{e.minute}&apos;</span>
                  <img src={ballIcon} alt="" className="w-4 h-4 object-contain [filter:brightness(0)_invert(1)]" />
                  <span className="flex-1">
                    <b>{e.playerName}</b>{e.ownGoal && <span className="text-muted-foreground"> (o.g.)</span>}
                    <span className="text-muted-foreground"> · {e.side === "home" ? home.abbr : away.abbr}</span>
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

function UserResults({ league, teamById }: { league: LeagueState; teamById: Map<string, TeamEntry> }) {
  const results = league.fixtures
    .filter((f) => f.played && (f.home === "user" || f.away === "user"))
    .sort((a, b) => a.round - b.round);
  if (!results.length) return null;
  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Your results</div>
      <div className="flex flex-wrap gap-2">
        {results.map((f) => {
          const isHome = f.home === "user";
          const gf = isHome ? f.homeScore! : f.awayScore!;
          const ga = isHome ? f.awayScore! : f.homeScore!;
          const opp = teamById.get(isHome ? f.away : f.home)!;
          const tone = gf > ga ? "border-[oklch(0.75_0.19_145)]/50 bg-[oklch(0.75_0.19_145)]/10"
            : gf < ga ? "border-primary/50 bg-primary/10"
            : "border-[oklch(0.8_0.14_85)]/50 bg-[oklch(0.8_0.14_85)]/10";
          return (
            <div key={f.round} title={`Matchday ${f.round + 1} vs ${opp.name}`}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-mono tabular-nums ${tone}`}>
              {clubLogo(opp.id) && <img src={clubLogo(opp.id)} alt="" className="w-4 h-4 object-contain" />}
              {gf}–{ga}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeasonEndOverlay({ position, row, champion, verdict, scorers, assisters, onRestart, onView, onHome }: {
  position: number; row?: Row; champion: boolean; verdict?: Verdict;
  scorers: ScoreEntry[]; assisters: ScoreEntry[]; onRestart: () => void; onView: () => void; onHome: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 overflow-hidden"
    >
      <div className="absolute inset-0"
        style={{
          background: champion
            ? "radial-gradient(ellipse at 50% 25%, oklch(0.55 0.13 85 / 0.95), oklch(0.13 0.02 80 / 0.98) 72%)"
            : "radial-gradient(ellipse at 50% 25%, oklch(0.3 0.05 260 / 0.95), oklch(0.12 0.015 260 / 0.98) 72%)",
        }} />
      {champion && <Confetti colors={["oklch(0.85 0.17 85)", "oklch(0.72 0.16 80)", "#ffffff", "oklch(0.88 0.22 125)"]} />}
      <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}>
          <Trophy className={`w-20 h-20 ${champion ? "text-[oklch(0.85_0.17_85)]" : "text-muted-foreground"}`}
            style={champion ? { filter: "drop-shadow(0 0 30px oklch(0.85 0.17 85 / 0.8))" } : undefined} />
        </motion.div>
        <motion.div
          initial={{ scale: 2.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 15, delay: 0.15 }}
          className="mt-3 font-display leading-[0.85] text-[clamp(3.5rem,12vw,9rem)] text-white"
          style={{ textShadow: champion ? "0 0 90px oklch(0.85 0.17 85 / 0.8), 0 4px 0 oklch(0.5 0.13 75)" : undefined }}
        >
          {champion ? "CHAMPIONS!" : "SEASON OVER."}
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}>
          <div className="mt-3 font-display text-3xl text-white">
            {champion ? "Top of the pile. Untouchable." : `You finished #${position}`}
          </div>
          {row && (
            <div className="mt-2 font-mono text-sm text-white/75">
              {row.w}W · {row.d}D · {row.l}L · {row.gf}:{row.ga} · {row.pts} pts
            </div>
          )}
          {verdict && (
            <div className="mt-4">
              <VerdictChip verdict={verdict} />
            </div>
          )}
          <div className="mt-6 w-full max-w-2xl mx-auto">
            <AwardsBlock scorers={scorers} assisters={assisters} />
          </div>
          <div className="mt-7 flex items-center justify-center gap-3">
            <button onClick={onView} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10">
              View the table
            </button>
            <button onClick={onRestart}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold hover:brightness-110 ${champion ? "bg-[oklch(0.85_0.17_85)] text-[oklch(0.2_0.06_70)]" : "bg-primary text-primary-foreground"}`}>
              <RotateCcw className="w-3.5 h-3.5" /> Run it back
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

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
