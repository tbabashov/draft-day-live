import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Sliders, MessageSquareText } from "lucide-react";
import type { Player } from "@/lib/draft-utils";
import { FORMATIONS, remapXi, type FormationId, type TacticsSettings } from "@/lib/tactics-utils";
import type { TeamEntry, MatchEvent } from "@/lib/tournament-utils";
import { MatchEngine, type SideInit, type LiveEvent } from "@/lib/match-engine";
import { clubLogo } from "@/lib/logos";
import { shortClubName } from "@/lib/club-names";
import { Confetti } from "@/components/Confetti";
import { PenaltyShootout, type PenAnim } from "@/components/PenaltyShootout";
import { loadSettings } from "@/lib/settings";
import varLogo from "@/assets/var-logo.webp";
import offsideFlag from "@/assets/offside-flag.png";
import goalIcon from "@/assets/icon-goal.png";
import ballIcon from "@/assets/icon-ball.png";
import saveIcon from "@/assets/icon-save.png";
import whistleIcon from "@/assets/icon-whistle.png";
import injurySeriousIcon from "@/assets/icon-injury-serious.png";
import injuryMinorIcon from "@/assets/icon-injury-minor.png";

export type LiveResult = {
  homeScore: number;
  awayScore: number;
  winnerId: string | null; // null = draw (league mode)
  events: MatchEvent[];
  pens?: { home: number; away: number };
  /* user-side match ratings, for form tracking */
  ratings: { id: string; rating: number }[];
  /* user-side cards & injuries, for carry-over suspensions/knocks */
  discipline: { playerId: string; name: string; kind: "yellow" | "red" | "injury"; severity?: number }[];
};

type Props = {
  home: SideInit;
  away: SideInit;
  roundName: string;
  userSide: "home" | "away";
  /* "cup" = knockout (pens on a tie); "league" = draws stand. */
  context?: "cup" | "league";
  onFinish: (r: LiveResult) => void;
};

// 90 minutes play out in ~41 real seconds.
const TICK_MS = 110;
const MIN_PER_TICK = (90 / 41) * (TICK_MS / 1000);

export function LiveMatch({ home, away, roundName, userSide, context = "cup", onFinish }: Props) {
  const engineRef = useRef<MatchEngine | null>(null);
  if (!engineRef.current) engineRef.current = new MatchEngine(home, away, { allowDraw: context === "league" });
  const eng = engineRef.current;

  const [, setTick] = useState(0);
  const [tab, setTab] = useState<"feed" | "coach">("feed");
  /* Phones show one pane at a time instead of a cramped stack. */
  const [mobilePane, setMobilePane] = useState<"pitch" | "feed" | "stats" | "coach">("pitch");
  const [userTactics, setUserTactics] = useState<TacticsSettings>(
    userSide === "home" ? home.tactics : away.tactics
  );
  const [subOut, setSubOut] = useState<Player | null>(null);
  const [finished, setFinished] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Main clock
  useEffect(() => {
    const iv = setInterval(() => {
      const e = engineRef.current!;
      if (e.phase === "ht") {
        // brief breather, then second half
        clearInterval(iv);
        setTimeout(() => {
          e.startSecondHalf();
          setTick((t) => t + 1);
        }, 1800);
        return;
      }
      if (e.phase === "pens") {
        clearInterval(iv);
        return;
      }
      if (e.phase === "done") {
        clearInterval(iv);
        setFinished(true);
        return;
      }
      // A spot-kick is on: freeze the clock until it's resolved.
      if (e.pendingPen) return;
      e.step(MIN_PER_TICK);
      setTick((t) => t + 1);
    }, TICK_MS);
    return () => clearInterval(iv);
    // re-arm the interval whenever the phase gate above cleared it
  }, [eng.phase]);

  // Penalties are fully interactive: you shoot your kicks and dive for the
  // opponent's — both in the shootout and for spot-kicks in open play.
  const [penAnim, setPenAnim] = useState<PenAnim | null>(null);
  const [penMode, setPenMode] = useState<"shoot" | "dive">("shoot");

  // --- shootout ---
  const userPenTurn = eng.phase === "pens" && eng.pensUserTurn();     // you shoot
  const userPenDefend = eng.phase === "pens" && eng.pensUserDefend(); // you dive
  const finishPenAnim = () => {
    setPenAnim(null);
    setTick((x) => x + 1);
    if (eng.phase === "done") setFinished(true);
  };
  const shootUserPen = (dir: "left" | "center" | "right") => {
    if (!userPenTurn || penAnim) return;
    setPenMode("shoot");
    const res = eng.takeUserPen(dir);       // { scored, keeperDir }
    setPenAnim({ dir, ...res });
    setTimeout(finishPenAnim, 2000);
  };
  const diveUserPen = (dir: "left" | "center" | "right") => {
    if (!userPenDefend || penAnim) return;
    setPenMode("dive");
    const res = eng.takeUserDive(dir);      // { scored, shotDir }
    setPenAnim({ dir: res.shotDir, keeperDir: dir, scored: res.scored });
    setTimeout(finishPenAnim, 2000);
  };

  // --- open-play spot-kicks ---
  const inPlayPen = eng.pendingPen;
  const userTakesPen = !!inPlayPen && inPlayPen.isUser && !penAnim;   // you won a pen → shoot
  const userDefendsPen = !!inPlayPen && !inPlayPen.isUser && !penAnim; // conceded → dive
  const [spotTaker, setSpotTaker] = useState("");
  const shootInPlayPen = (dir: "left" | "center" | "right") => {
    if (!userTakesPen || penAnim) return;
    setSpotTaker(eng.pendingPen?.taker ?? "");
    setPenMode("shoot");
    const res = eng.takeInPlayPenUser(dir);
    setPenAnim({ dir, ...res });
    setTimeout(() => { setPenAnim(null); setTick((x) => x + 1); }, 2000);
  };
  const diveInPlayPen = (dir: "left" | "center" | "right") => {
    if (!userDefendsPen || penAnim) return;
    setSpotTaker(eng.pendingPen?.taker ?? "");
    setPenMode("dive");
    const res = eng.takeInPlayDiveUser(dir);
    setPenAnim({ dir: res.shotDir, keeperDir: dir, scored: res.scored });
    setTimeout(() => { setPenAnim(null); setTick((x) => x + 1); }, 2000);
  };
  // The spot-kick scene: shown for your pen or a conceded one (and during its
  // animation), i.e. any pen animation while we're not in a shootout.
  const spotScene = !finished && eng.phase !== "pens" && (userTakesPen || userDefendsPen || penAnim);

  const user = eng.side(userSide);
  const containerRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  // The verdict deserves centre stage: glide back to the top when it lands.
  useEffect(() => {
    if (finished) containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [finished]);
  // A penalty (shootout kick or open-play spot-kick) deserves the same — if
  // you're scrolled down the feed, glide back up so the scene is centred.
  const pendingPenId = eng.pendingPen?.id ?? null;
  const inShootout = eng.phase === "pens";
  useEffect(() => {
    if (pendingPenId != null || inShootout) {
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pendingPenId, inShootout]);
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 });
  }, [eng.events.length]);

  const applyTactics = (t: TacticsSettings) => {
    setUserTactics(t);
    eng.setTactics(userSide, t);
  };
  const changeFormation = (f: FormationId) => {
    const t = { ...userTactics, formation: f };
    setUserTactics(t);
    eng.setTactics(userSide, t);
    eng.setFormation(userSide, FORMATIONS[f], remapXi);
  };
  const confirmSub = (inP: Player) => {
    if (!subOut) return;
    eng.makeSub(userSide, subOut.id, inP);
    setSubOut(null);
    setTick((t) => t + 1);
  };

  const done = finished;
  const userWon = done && eng.winner === userSide;
  const drew = done && eng.winner === null;
  const possPct = Math.round((eng.stats.possHome / (eng.stats.possHome + eng.stats.possAway)) * 100);

  // Kit clash: if both teams' primary colours are too similar (red vs red),
  // your team switches to an away kit so the pitch stays readable.
  const kits = useMemo(() => {
    const oppSide = userSide === "home" ? "away" : "home";
    const user = eng.side(userSide).entry;
    const opp = eng.side(oppSide).entry;
    let userKit = user.primary;
    if (hexDist(user.primary, opp.primary) < 110) {
      userKit = [user.secondary, "#FFFFFF", "#B8F53E"].find(
        (c) => hexDist(c, opp.primary) >= 110
      ) ?? "#B8F53E";
    }
    return userSide === "home"
      ? { home: userKit, away: opp.primary }
      : { home: opp.primary, away: userKit };
  }, [eng, userSide]);

  const finishMatch = () => {
    const winnerSide = eng.winner;
    onFinish({
      homeScore: eng.homeScore,
      awayScore: eng.awayScore,
      winnerId: winnerSide ? eng.side(winnerSide).entry.id : null,
      events: eng.goalsLog.map((g) => ({ minute: g.minute, type: "goal" as const, side: g.side, playerName: g.playerName, assistName: g.assistName, ownGoal: g.ownGoal })),
      pens: eng.pens ? { home: eng.pens.home.filter(Boolean).length, away: eng.pens.away.filter(Boolean).length } : undefined,
      ratings: eng.matchRatings().filter((r) => r.side === userSide).map((r) => ({ id: r.id, rating: r.rating })),
      discipline: eng.disciplineLog.filter((d) => d.side === userSide).map((d) => ({ playerId: d.playerId, name: d.name, kind: d.kind, severity: d.severity })),
    });
  };

  // Brief celebration when YOUR team scores.
  const [goalFlash, setGoalFlash] = useState<{ key: number; player: string; minute: number; ownGoal?: boolean } | null>(null);
  const goalCountRef = useRef(0);
  useEffect(() => {
    const log = eng.goalsLog;
    if (log.length > goalCountRef.current) {
      const g = log[log.length - 1];
      if (g.side === userSide) {
        setGoalFlash({ key: Date.now(), player: g.playerName, minute: g.minute, ownGoal: g.ownGoal });
      }
    }
    goalCountRef.current = log.length; // also tracks VAR overturns shrinking the log
  }, [eng.goalsLog.length, eng, userSide]);
  useEffect(() => {
    if (!goalFlash) return;
    const t = setTimeout(() => setGoalFlash(null), loadSettings().fastResults ? 1100 : 2300);
    return () => clearTimeout(t);
  }, [goalFlash]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 bg-background/95 backdrop-blur-md ${done || eng.phase === "pens" || spotScene ? "overflow-hidden" : "overflow-y-auto"}`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-6 min-h-full flex flex-col">
        {/* Scoreboard */}
        <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <ScoreTeam entry={eng.home.entry} align="left" />
          <div className="text-center">
            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground truncate">{roundName}</div>
            <div className="font-display text-4xl sm:text-5xl tabular-nums leading-none mt-1">
              {eng.homeScore}<span className="text-muted-foreground mx-1.5 sm:mx-2">–</span>{eng.awayScore}
            </div>
            {eng.pens && (
              <div className="mt-1 font-mono text-sm tabular-nums text-[oklch(0.82_0.16_85)]">
                pens {eng.pens.home.filter(Boolean).length}–{eng.pens.away.filter(Boolean).length}
              </div>
            )}
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-0.5 font-mono text-xs text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary ticker-dot" />
              {eng.displayMinute()}
            </div>
          </div>
          <ScoreTeam entry={eng.away.entry} align="right" />
        </div>

        {/* Penalty shootout tracker sits directly under the score */}
        {eng.pens && <PensTracker eng={eng} />}

        {/* Mobile pane switcher — one focused view at a time, like a native app */}
        <div className="lg:hidden mt-3 grid grid-cols-4 gap-1 rounded-full bg-surface border border-border p-1">
          {([
            ["pitch", "Pitch"],
            ["feed", "Live"],
            ["stats", "Stats"],
            ["coach", "Touchline"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setMobilePane(id); if (id === "feed" || id === "coach") setTab(id); }}
              className={`rounded-full py-2 font-mono text-[10px] uppercase tracking-wider transition ${
                mobilePane === id ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 sm:mt-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 flex-1">
          {/* Pitch + stats */}
          <div className={`${mobilePane === "pitch" || mobilePane === "stats" ? "block" : "hidden"} lg:block`}>
            <div className={mobilePane === "stats" ? "hidden lg:block" : "block"}>
              <LivePitch eng={eng} kits={kits} />
              {/* On a phone the feed is a separate pane, so surface the latest
                  beat here — you shouldn't have to switch tabs to follow the game. */}
              {eng.events.length > 0 && (
                <div className="lg:hidden mt-3 rounded-xl border border-border bg-surface p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Latest</div>
                  <div className="text-sm leading-snug">{eng.events[eng.events.length - 1].text}</div>
                </div>
              )}
            </div>
            <div className={mobilePane === "pitch" ? "hidden lg:block" : "block"}>
              <StatSheet eng={eng} possPct={possPct} kits={kits} />
            </div>
          </div>

          {/* Right column: commentary / coach */}
          <div className={`${mobilePane === "feed" || mobilePane === "coach" ? "flex" : "hidden"} lg:flex flex-col rounded-2xl border border-border bg-surface overflow-hidden min-h-[62vh] max-h-[70vh] lg:min-h-0 lg:max-h-[calc(100vh-12rem)]`}>
            <div className="hidden lg:flex border-b border-border">
              <TabBtn active={tab === "feed"} onClick={() => setTab("feed")} icon={<MessageSquareText className="w-3.5 h-3.5" />}>
                Commentary
              </TabBtn>
              <TabBtn active={tab === "coach"} onClick={() => setTab("coach")} icon={<Sliders className="w-3.5 h-3.5" />}>
                Touchline
              </TabBtn>
            </div>
            {tab === "feed" ? (
              <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence initial={false}>
                  {[...eng.events].reverse().map((ev) => (
                    <CommentaryLine key={ev.id} ev={ev} userSide={userSide} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <CoachPanel
                eng={eng}
                userSide={userSide}
                tactics={userTactics}
                onTactics={applyTactics}
                onFormation={changeFormation}
                subOut={subOut}
                onSubOut={setSubOut}
                onSubIn={confirmSub}
              />
            )}
          </div>
        </div>
      </div>

      {/* Penalty shootout — you shoot your kicks and dive for theirs */}
      <AnimatePresence>
        {(userPenTurn || userPenDefend || penAnim) && !done && eng.pens && (
          <PenaltyShootout
            taker={eng.currentPenTaker() ?? "Your man"}
            homeAbbr={eng.home.entry.abbr}
            awayAbbr={eng.away.entry.abbr}
            home={eng.pens.home}
            away={eng.pens.away}
            userIsHome={userSide === "home"}
            anim={penAnim}
            onPick={userPenTurn ? shootUserPen : diveUserPen}
            mode={penAnim ? penMode : userPenTurn ? "shoot" : "dive"}
          />
        )}
      </AnimatePresence>

      {/* In-play penalty — same 3D scene: shoot yours, dive theirs */}
      <AnimatePresence>
        {spotScene && (
          <PenaltyShootout
            taker={inPlayPen?.taker || spotTaker || "Your man"}
            homeAbbr={eng.home.entry.abbr}
            awayAbbr={eng.away.entry.abbr}
            home={[]}
            away={[]}
            userIsHome={userSide === "home"}
            anim={penAnim}
            onPick={userTakesPen ? shootInPlayPen : diveInPlayPen}
            mode={penAnim ? penMode : userTakesPen ? "shoot" : "dive"}
            showTracker={false}
            label="Penalty"
            subtitle={`${eng.home.entry.abbr} ${eng.homeScore}–${eng.awayScore} ${eng.away.entry.abbr} · ${eng.displayMinute()}`}
          />
        )}
      </AnimatePresence>

      {/* Goal celebration — quick, punchy, hands-off */}
      <AnimatePresence>
        {goalFlash && !done && (
          <motion.div
            key={goalFlash.key}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[5] pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 50% 45%, oklch(0.5 0.16 145 / 0.4), transparent 62%)" }} />
            <motion.div
              initial={{ scale: 2.1, opacity: 0, rotate: -3 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative text-center"
            >
              <div
                className="font-display leading-none text-[clamp(3.5rem,10vw,7rem)] text-white"
                style={{ textShadow: "0 0 60px oklch(0.8 0.22 145 / 0.9), 0 3px 0 oklch(0.4 0.15 145)" }}
              >
                GOAL!
              </div>
              <div className="mt-1 font-display text-2xl md:text-3xl uppercase tracking-wide text-white/90">
                {goalFlash.player} {goalFlash.ownGoal ? "— own goal!" : "scores!"}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-[0.3em] text-white/70">
                {goalFlash.minute > 90 ? `90+${goalFlash.minute - 90}` : goalFlash.minute}&apos;
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-time verdict — instant, unmistakable */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-10 overflow-hidden"
          >
            {/* colour wash: green glory or crimson doom */}
            <div
              className="absolute inset-0"
              style={{
                background: userWon
                  ? "radial-gradient(ellipse at 50% 30%, oklch(0.45 0.15 145 / 0.92), oklch(0.14 0.03 150 / 0.97) 70%)"
                  : drew
                    ? "radial-gradient(ellipse at 50% 30%, oklch(0.4 0.08 85 / 0.92), oklch(0.13 0.02 80 / 0.97) 70%)"
                    : "radial-gradient(ellipse at 50% 30%, oklch(0.35 0.14 25 / 0.94), oklch(0.1 0.02 260 / 0.98) 70%)",
              }}
            />
            {/* whistle flash */}
            <motion.div
              className="absolute inset-0"
              style={{ background: userWon ? "oklch(0.85 0.2 145)" : drew ? "oklch(0.8 0.14 85)" : "oklch(0.63 0.24 25)" }}
              initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }}
            />
            {userWon && <Confetti />}

            {showReport ? (
              <div className="relative h-full overflow-y-auto p-6">
                <div className="max-w-lg mx-auto">
                  <div className="text-center">
                    <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">
                      {roundName} · Match report
                    </div>
                    <div className="mt-2 font-display text-5xl tabular-nums text-white">
                      {eng.home.entry.abbr} {eng.homeScore}<span className="text-white/50 mx-2">–</span>{eng.awayScore} {eng.away.entry.abbr}
                    </div>
                    {eng.pens && (
                      <div className="mt-1 font-mono text-xs text-white/70">
                        {eng.pens.home.filter(Boolean).length}–{eng.pens.away.filter(Boolean).length} on penalties
                      </div>
                    )}
                  </div>

                  {/* key highlights */}
                  <div className="mt-6 rounded-xl border border-border bg-surface px-4 py-3">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 text-center">Key moments</div>
                    {eng.highlightsLog.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic text-center py-2">A quiet one. No goals, no cards, no drama.</div>
                    ) : (
                      <ul className="space-y-1.5">
                        {eng.highlightsLog.map((h, i) => (
                          <li key={i} className={`flex items-center gap-2 text-sm ${h.side === "away" ? "flex-row-reverse text-right" : ""}`}>
                            <span className="font-display text-base text-muted-foreground tabular-nums w-10 shrink-0">
                              {h.minute > 90 ? `90+${h.minute - 90}` : h.minute}&apos;
                            </span>
                            <span className="shrink-0">
                              {h.kind === "goal" ? <img src={ballIcon} alt="" className="w-4 h-4 object-contain [filter:brightness(0)_invert(1)]" />
                                : h.kind === "red" ? <span className="w-3 h-4 inline-block rounded-[2px] bg-primary align-middle" />
                                : h.kind === "var" ? <img src={varLogo} alt="VAR" className="w-5 h-5 object-contain [filter:brightness(0)_invert(1)]" />
                                : h.kind === "motm" ? <span className="text-[oklch(0.85_0.17_85)]">★</span>
                                : <span className="text-muted-foreground">◎</span>}
                            </span>
                            <span className="min-w-0 truncate">
                              {h.label}
                              <span className="text-muted-foreground"> · {eng.side(h.side).entry.abbr}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* player ratings */}
                  <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-3">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 text-center">Player ratings</div>
                    <div className="grid grid-cols-2 gap-x-6">
                      {(["home", "away"] as const).map((which) => {
                        const list = eng.sideRatings(which);
                        const motmId = eng.matchRatings()[0]?.id;
                        return (
                          <div key={which}>
                            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">{eng.side(which).entry.abbr}</div>
                            <ul className="space-y-0.5">
                              {list.map((r) => (
                                <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                                  <span className={`truncate ${r.rating === null ? "text-muted-foreground" : ""}`}>{r.id === motmId && <span className="text-[oklch(0.85_0.17_85)] mr-0.5">★</span>}{r.name}</span>
                                  {r.rating === null ? (
                                    <span className="font-mono tabular-nums text-muted-foreground">N/A</span>
                                  ) : (
                                    <span className={`font-mono tabular-nums font-bold ${r.rating >= 8 ? "text-[oklch(0.85_0.22_140)]" : r.rating <= 6 ? "text-primary" : ""}`}>
                                      {r.rating.toFixed(1)}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* final stats */}
                  <StatSheet eng={eng} possPct={possPct} kits={kits} />

                  <div className="mt-6 mb-2 flex items-center justify-center gap-3">
                    <button onClick={() => setShowReport(false)}
                      className="rounded-full border border-white/25 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10">
                      Back
                    </button>
                    <button onClick={finishMatch}
                      className={`rounded-full px-7 py-2.5 text-xs font-bold hover:brightness-110 ${userWon ? "bg-[oklch(0.75_0.19_145)] text-[oklch(0.15_0.05_150)]" : "bg-primary text-primary-foreground"}`}>
                      {context === "league" ? "Back to the league" : userWon ? "Back to the bracket" : "Continue"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">
                {roundName} · Full time{eng.pens ? " · penalties" : ""}
              </div>
              <motion.div
                initial={{ scale: 3, opacity: 0, rotate: userWon ? -4 : 3 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 15, delay: 0.05 }}
                className="mt-2 font-display leading-[0.85] text-[clamp(4rem,14vw,10rem)] text-white"
                style={{
                  textShadow: userWon
                    ? "0 0 80px oklch(0.8 0.22 145 / 0.8), 0 4px 0 oklch(0.4 0.15 145)"
                    : drew
                      ? "0 0 80px oklch(0.8 0.15 85 / 0.7), 0 4px 0 oklch(0.45 0.11 80)"
                      : "0 0 80px oklch(0.63 0.24 25 / 0.7), 0 4px 0 oklch(0.35 0.16 25)",
                }}
              >
                {userWon
                  ? (context === "cup" && roundName === "Final" ? "CHAMPIONS!" : "YOU WIN!")
                  : drew ? "ALL SQUARE." : context === "cup" ? "KNOCKED OUT" : "DEFEAT."}
              </motion.div>

              <motion.div
                initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                className="mt-6"
              >
                <div className="font-display text-7xl tabular-nums text-white">
                  {eng.homeScore}<span className="text-white/50 mx-3">–</span>{eng.awayScore}
                </div>
                {eng.pens && (
                  <div className="mt-1 font-mono text-sm text-white/70">
                    {eng.pens.home.filter(Boolean).length}–{eng.pens.away.filter(Boolean).length} on penalties
                  </div>
                )}
                <div className="mt-2 font-mono text-xs uppercase tracking-widest text-white/60">
                  <TeamName entry={eng.home.entry} /> vs <TeamName entry={eng.away.entry} />
                </div>
                <p className="mt-4 text-sm text-white/75 max-w-sm mx-auto">
                  {userWon
                    ? context === "cup"
                      ? roundName === "Final"
                        ? "The cup is yours. Go and lift it."
                        : "Job done. The bracket awaits your next victim."
                      : "Three points in the bag. On to the next one."
                    : drew
                      ? "A point apiece. Not a disaster — but titles are won by twos more."
                      : context === "cup"
                        ? "One bad night and the whole run dies. Knockout football spares no one."
                        : "Points dropped. The table doesn't forgive many of those."}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="/home"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Home
                  </a>
                  <button
                    onClick={() => setShowReport(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Match report
                  </button>
                  <button
                    onClick={finishMatch}
                    className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold transition hover:brightness-110 ${
                      userWon ? "bg-[oklch(0.75_0.19_145)] text-[oklch(0.15_0.05_150)]" : drew ? "bg-[oklch(0.8_0.14_85)] text-[oklch(0.2_0.06_70)]" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {context === "league"
                      ? "Back to the league"
                      : userWon ? (roundName === "Final" ? "Lift the trophy" : "Back to the bracket") : "Continue"}
                  </button>
                </div>
              </motion.div>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------- pieces ---------------- */

/* Phones get the short name, wider screens keep the formal one — there's room
   for it there, and it's the name on the team sheet. */
function TeamName({ entry }: { entry: TeamEntry }) {
  return (
    <>
      <span className="sm:hidden">{shortClubName(entry.name)}</span>
      <span className="hidden sm:inline">{entry.name}</span>
    </>
  );
}

function ScoreTeam({ entry, align }: { entry: TeamEntry; align: "left" | "right" }) {
  const logo = clubLogo(entry.id);
  return (
    <div className={`flex items-center gap-3 min-w-0 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      {logo ? (
        <img src={logo} alt={entry.name} className={`w-12 h-12 object-contain shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] ${entry.isUser ? "scale-110" : ""}`} />
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center font-display text-sm border border-white/10 shrink-0"
          style={{ background: `linear-gradient(135deg, ${entry.primary}, ${entry.secondary})`, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
        >
          {entry.abbr}
        </div>
      )}
      <div className="min-w-0">
        <div className="font-display text-xl truncate"><TeamName entry={entry} /></div>
        {entry.isUser && <div className="text-[9px] font-bold uppercase tracking-widest text-primary">You</div>}
      </div>
    </div>
  );
}

/* Euclidean RGB distance between two #RRGGBB colours. */
function hexDist(a: string, b: string): number {
  const rgb = (h: string) => {
    const s = h.replace("#", "");
    if (s.length !== 6) return null;
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const ca = rgb(a), cb = rgb(b);
  if (!ca || !cb) return 255;
  return Math.hypot(ca[0] - cb[0], ca[1] - cb[1], ca[2] - cb[2]);
}

type Kits = { home: string; away: string };

function LivePitch({ eng, kits }: { eng: MatchEngine; kits: Kits }) {
  return (
    <div
      className="relative w-full aspect-[3/2] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-border"
      style={{ background: "radial-gradient(ellipse at center, oklch(0.3 0.09 145) 0%, oklch(0.2 0.07 145) 65%, oklch(0.15 0.05 145) 100%)" }}
    >
      {/* mow stripes */}
      <div className="absolute inset-0 opacity-20"
        style={{ background: "repeating-linear-gradient(90deg, transparent 0 48px, rgba(255,255,255,0.05) 48px 96px)" }} />
      {/* markings */}
      <svg viewBox="0 0 100 62" className="absolute inset-0 w-full h-full text-white/30" preserveAspectRatio="none">
        <rect x="1.5" y="1.5" width="97" height="59" fill="none" stroke="currentColor" strokeWidth="0.25" />
        <line x1="50" y1="1.5" x2="50" y2="60.5" stroke="currentColor" strokeWidth="0.25" />
        <circle cx="50" cy="31" r="6.5" fill="none" stroke="currentColor" strokeWidth="0.25" />
        <circle cx="50" cy="31" r="0.5" fill="currentColor" />
        <rect x="1.5" y="17" width="10" height="28" fill="none" stroke="currentColor" strokeWidth="0.25" />
        <rect x="1.5" y="24.5" width="4" height="13" fill="none" stroke="currentColor" strokeWidth="0.25" />
        <rect x="88.5" y="17" width="10" height="28" fill="none" stroke="currentColor" strokeWidth="0.25" />
        <rect x="94.5" y="24.5" width="4" height="13" fill="none" stroke="currentColor" strokeWidth="0.25" />
      </svg>

      {/* players */}
      {(["home", "away"] as const).map((which) => {
        const s = eng.side(which);
        return s.players.filter((rp) => !rp.off).map((rp) => (
          <div
            key={`${which}-${rp.p.id}`}
            className="absolute flex flex-col items-center"
            style={{
              left: `${rp.x}%`, top: `${rp.y}%`,
              transform: "translate(-50%, -50%)",
              transition: "left 150ms linear, top 150ms linear",
            }}
          >
            <div className="relative">
              <div
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border shadow-md"
                style={{
                  background: rp.slot.kind === "GK" ? "#e8c930" : kits[which],
                  borderColor: "rgba(255,255,255,0.75)",
                }}
              />
              {rp.booked && (
                <span className="absolute -top-1.5 -right-1 w-[5px] h-[7px] rounded-[1px] bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.9)]" />
              )}
              {rp.subbedOn && rp.subbedOnAt !== undefined && eng.minute - rp.subbedOnAt < 5 && (
                <span
                  className="absolute -top-2 -left-1.5 text-[8px] leading-none font-bold text-[oklch(0.78_0.2_145)] drop-shadow-[0_0_3px_rgba(0,0,0,0.8)] transition-opacity duration-300"
                  style={{ opacity: Math.max(0, Math.min(1, (5 - (eng.minute - rp.subbedOnAt)) / 1.5)) }}
                >
                  ▲
                </span>
              )}
            </div>
            <div className={`mt-0.5 px-1 rounded bg-black/55 font-mono text-[8px] leading-tight whitespace-nowrap max-w-16 truncate hidden sm:block ${rp.booked ? "text-yellow-300" : "text-white/90"}`}>
              {rp.p.name.last || rp.p.name.display}
            </div>
            {/* stamina bar */}
            <div className="mt-[3px] h-[3px] w-4 rounded-full bg-black/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(4, rp.stamina)}%`,
                  background: rp.stamina > 55 ? "oklch(0.78 0.2 145)" : rp.stamina > 30 ? "oklch(0.85 0.17 85)" : "oklch(0.63 0.24 25)",
                }}
              />
            </div>
          </div>
        ));
      })}

      {/* ball */}
      <div
        className="absolute"
        style={{
          left: `${eng.ball.x}%`, top: `${eng.ball.y}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 140ms linear, top 140ms linear",
        }}
      >
        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
      </div>
    </div>
  );
}

function avgStamina(eng: MatchEngine, which: "home" | "away"): number {
  const on = eng.side(which).players.filter((rp) => !rp.off);
  return on.length ? on.reduce((s, rp) => s + rp.stamina, 0) / on.length : 0;
}

function StatSheet({ eng, possPct, kits }: { eng: MatchEngine; possPct: number; kits: Kits }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
        <span>{eng.home.entry.abbr}</span>
        <span>Match stats</span>
        <span>{eng.away.entry.abbr}</span>
      </div>
      <StatRow label="Possession" home={possPct} away={100 - possPct} fmt={(v) => `${Math.round(v)}%`}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="Expected goals" home={eng.stats.xgHome} away={eng.stats.xgAway} fmt={(v) => v.toFixed(1)}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="Shots" home={eng.stats.shotsHome} away={eng.stats.shotsAway}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="On target" home={eng.stats.onTargetHome} away={eng.stats.onTargetAway}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="Saves" home={eng.stats.savesHome} away={eng.stats.savesAway}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="Stamina" home={avgStamina(eng, "home")} away={avgStamina(eng, "away")} fmt={(v) => `${Math.round(v)}%`}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="Corners" home={eng.stats.cornersHome} away={eng.stats.cornersAway}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="Fouls" home={eng.stats.foulsHome} away={eng.stats.foulsAway}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="Offsides" home={eng.stats.offsidesHome} away={eng.stats.offsidesAway}
        homeColor={kits.home} awayColor={kits.away} />
      <StatRow label="Yellow cards" home={eng.stats.yellowsHome} away={eng.stats.yellowsAway}
        homeColor="oklch(0.85 0.17 95)" awayColor="oklch(0.85 0.17 95)" />
      <StatRow label="Red cards" home={eng.stats.redsHome} away={eng.stats.redsAway}
        homeColor="oklch(0.63 0.24 25)" awayColor="oklch(0.63 0.24 25)" />
    </div>
  );
}

function StatRow({ label, home, away, fmt, homeColor, awayColor }: {
  label: string; home: number; away: number; fmt?: (v: number) => string;
  homeColor: string; awayColor: string;
}) {
  const total = home + away;
  const hShare = total > 0 ? home / total : 0;
  const aShare = total > 0 ? away / total : 0;
  const show = fmt ?? ((v: number) => `${Math.round(v)}`);
  return (
    <div className="py-1 border-t border-border/40 first:border-t-0">
      <div className="flex items-baseline justify-between font-mono text-xs tabular-nums">
        <span>{show(home)}</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span>{show(away)}</span>
      </div>
      {/* centre-out share bars */}
      <div className="mt-1 flex items-center gap-1 h-[3px]">
        <div className="flex-1 flex justify-end rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${hShare * 100}%`, background: homeColor }} />
        </div>
        <div className="flex-1 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${aShare * 100}%`, background: awayColor }} />
        </div>
      </div>
    </div>
  );
}

function PensTracker({ eng }: { eng: MatchEngine }) {
  if (!eng.pens) return null;
  const row = (kicks: (boolean | null)[], abbr: string) => (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs w-10">{abbr}</span>
      {Array.from({ length: Math.max(5, kicks.length) }).map((_, i) => (
        <span key={i} className={`w-3 h-3 rounded-full ${i < kicks.length ? (kicks[i] ? "bg-[oklch(0.75_0.19_145)]" : "bg-primary") : "bg-surface-2 border border-border"}`} />
      ))}
    </div>
  );
  return (
    <div className="mt-3 rounded-xl border border-primary/40 bg-surface px-4 py-3 space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-primary font-mono">Penalty shootout</div>
      {row(eng.pens.home, eng.home.entry.abbr)}
      {row(eng.pens.away, eng.away.entry.abbr)}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-widest transition ${active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {icon}{children}
    </button>
  );
}

/* A small at-a-glance symbol for each event, so the feed can be scanned
   without reading every line. */
function eventBadge(ev: LiveEvent, userSide: "home" | "away") {
  const mine = ev.side === userSide;
  const ring = (color: string, node: React.ReactNode) => (
    <span className="grid place-items-center w-6 h-6 rounded-full text-[13px] leading-none"
      style={{ background: `${color}22`, border: `1px solid ${color}` }}>{node}</span>
  );
  const GREEN = "oklch(0.75 0.19 145)";
  const RED = "oklch(0.63 0.24 25)";
  switch (ev.type) {
    case "goal":
      return <img src={goalIcon} alt="Goal" className={`w-6 h-6 object-contain [filter:brightness(0)_invert(1)] ${mine ? "" : "scale-x-[-1]"}`} />;
    case "pen": {
      if (ev.penScored === undefined) return ring("oklch(0.55 0.02 260)", "◎");
      const good = mine === ev.penScored;
      return ring(good ? GREEN : RED, ev.penScored ? "●" : "✕");
    }
    case "yellow":
      return <span className="w-3 h-4 rounded-[2px] bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.7)]" />;
    case "red":
      return <span className="w-3 h-4 rounded-[2px] bg-primary shadow-[0_0_4px_var(--crimson)]" />;
    case "injury":
      // Ambulance when the knock ends their match, plaster when they run it off.
      return ev.injurySerious
        ? <img src={injurySeriousIcon} alt="Serious injury" title="Forced off" className="w-6 h-6 object-contain" />
        : <img src={injuryMinorIcon} alt="Knock" title="Playing on" className="w-5 h-5 object-contain" />;
    case "var": {
      const o = ev.varOutcome;
      return (
        <span className="relative inline-grid place-items-center w-6 h-6">
          <img src={varLogo} alt="VAR" className="w-6 h-6 object-contain [filter:brightness(0)_invert(1)]" />
          {o === "given" && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[oklch(0.78_0.2_145)] border border-white/80" title="Goal given" />
          )}
          {o === "overturned" && (
            <span className="absolute -top-1.5 -right-1.5 grid place-items-center w-3 h-3 rounded-full bg-white border border-primary" title="No goal">
              <span className="text-primary text-[8px] font-bold leading-none">×</span>
            </span>
          )}
        </span>
      );
    }
    case "sub":
      return ring("oklch(0.7 0.05 260)", <span className="text-[11px]">⇅</span>);
    case "offside":
      return <img src={offsideFlag} alt="Offside" className="w-6 h-6 object-contain" />;
    case "save":
      return <img src={saveIcon} alt="Save" className="w-6 h-6 object-contain [filter:brightness(0)_invert(1)]" />;
    case "whistle":
      return <img src={whistleIcon} alt="" className="w-6 h-6 object-contain [filter:brightness(0)_invert(1)]" />;
    default:
      return <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />;
  }
}

function CommentaryLine({ ev, userSide }: { ev: LiveEvent; userSide: "home" | "away" }) {
  // Shootout kicks and goals: green when it's good news for you, red when it's not.
  const penGood = ev.type === "pen" && ev.penScored !== undefined
    ? (ev.side === userSide) === ev.penScored
    : undefined;
  const goalGood = ev.type === "goal" && ev.side ? ev.side === userSide : undefined;
  const style =
    penGood === true || goalGood === true ? "border-[oklch(0.75_0.19_145)]/60 bg-[oklch(0.75_0.19_145)]/10"
    : penGood === false || goalGood === false ? "border-primary/60 bg-primary/10"
    : ev.type === "red" ? "border-primary/60 bg-primary/10"
    : ev.type === "yellow" ? "border-yellow-400/50 bg-yellow-400/10"
    : ev.type === "var" ? "border-[oklch(0.75_0.15_65)]/60 bg-[oklch(0.75_0.15_65)]/10"
    : ev.type === "injury" ? "border-orange-400/50 bg-orange-400/10"
    : ev.type === "whistle" || ev.type === "pen" ? "border-border bg-surface-2"
    : "border-border/60 bg-transparent";
  const badge = eventBadge(ev, userSide);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border px-3 py-2 flex gap-2.5 items-start ${style}`}
    >
      <span className="shrink-0 w-6 h-6 grid place-items-center">{badge}</span>
      <span className="font-display text-lg text-muted-foreground tabular-nums shrink-0 w-8">
        {ev.minute > 90 ? `90+${ev.minute - 90}` : ev.minute}&apos;
      </span>
      <div className="min-w-0">
        <p className="text-sm leading-snug">{ev.text}</p>
        {ev.swaps && (
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {ev.swaps.map((sw, i) => (
              <span key={i} className="inline-flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[oklch(0.78_0.2_145)]">▲ {sw.on}</span>
                <span className="text-primary">▼ {sw.off}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CoachPanel({ eng, userSide, tactics, onTactics, onFormation, subOut, onSubOut, onSubIn }: {
  eng: MatchEngine;
  userSide: "home" | "away";
  tactics: TacticsSettings;
  onTactics: (t: TacticsSettings) => void;
  onFormation: (f: FormationId) => void;
  subOut: Player | null;
  onSubOut: (p: Player | null) => void;
  onSubIn: (p: Player) => void;
}) {
  const side = eng.side(userSide);
  const onPitch = side.players.filter((rp) => !rp.off);
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Formation</div>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(FORMATIONS) as FormationId[]).map((f) => (
            <button key={f} onClick={() => onFormation(f)}
              className={`py-1.5 rounded-md border font-display text-xs leading-tight transition ${tactics.formation === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">In-play tweaks</div>
        {([
          ["mentality", "Mentality"],
          ["pressing", "Pressing"],
          ["tempo", "Tempo"],
        ] as const).map(([key, label]) => (
          <div key={key} className="mb-2.5">
            <div className="flex justify-between text-xs mb-0.5">
              <span>{label}</span>
              <span className="font-mono text-muted-foreground">{tactics[key]}</span>
            </div>
            <input type="range" min={0} max={100} value={tactics[key]}
              onChange={(e) => onTactics({ ...tactics, [key]: Number(e.target.value) })}
              className="w-full" style={{ accentColor: "var(--crimson)" }} />
          </div>
        ))}
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
          <ArrowLeftRight className="w-3 h-3" /> Substitutions · {5 - side.subsMade} left
        </div>
        {subOut ? (
          <>
            <div className="text-xs mb-2">
              Off: <b>{subOut.name.display}</b> — pick who comes on:
              <button onClick={() => onSubOut(null)} className="ml-2 text-muted-foreground underline">cancel</button>
            </div>
            <div className="space-y-1.5">
              {side.bench.length === 0 && <div className="text-xs text-muted-foreground italic">Bench is empty.</div>}
              {side.bench.map((p) => (
                <button key={p.id} onClick={() => onSubIn(p)}
                  className="w-full text-left rounded-lg border border-border hover:border-primary/60 px-3 py-2 text-xs flex justify-between">
                  <span>{p.name.display} <span className="text-muted-foreground">· {p.position}</span></span>
                  <span className="font-display">{p.overall}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            {onPitch.map((rp) => {
              const stam = Math.round(rp.stamina);
              const stamColor = stam > 55 ? "text-[oklch(0.8_0.19_145)]" : stam > 30 ? "text-[oklch(0.85_0.17_85)]" : "text-primary";
              return (
                <button key={rp.p.id} onClick={() => side.subsMade < 5 && onSubOut(rp.p)}
                  disabled={side.subsMade >= 5}
                  className="w-full text-left rounded-lg border border-border hover:border-primary/60 disabled:opacity-40 px-3 py-2 text-xs flex items-center justify-between gap-2">
                  <span className="truncate">
                    {rp.subbedOn && <span className="text-[oklch(0.78_0.2_145)] mr-1">▲</span>}
                    {rp.p.name.display} <span className="text-muted-foreground">· {rp.slot.kind}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-[10px] tabular-nums ${stamColor}`}>{stam}%</span>
                    <span className="font-display">{rp.p.overall}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
