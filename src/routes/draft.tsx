import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Repeat, X, Crown, Eye, Home } from "lucide-react";
import {
  ALL_PLAYERS, drawFive, eligibleFor, shuffle, tierOf, TIER_STYLES, shortName, pitchY,
  type Player, type Slot, type SlotKind,
} from "@/lib/draft-utils";
import { FORMATIONS, slotFitScore, squadStrength, effectiveOverall, oopSeverity, type FormationId } from "@/lib/tactics-utils";
import { DraftCard } from "@/components/DraftCard";
import { OopArrows } from "@/components/OopArrows";
import { RestartRunButton } from "@/components/RestartRun";
import { clubLogo } from "@/lib/logos";

export const Route = createFileRoute("/draft")({
  head: () => ({
    meta: [
      { title: "Draft — GAFFER" },
      { name: "description", content: "Draft your formation, your captain, your XI. Every choice is permanent." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DraftPage,
});

const BENCH_SLOTS: Slot[] = Array.from({ length: 7 }, (_, i) => ({
  id: `bench-${i}`,
  kind: "ANY" as SlotKind,
  x: 0, y: 0,
}));

type Assignments = Record<string, Player | undefined>;

const STORAGE_KEY = "gaffer.draft.v1";
const CAPTAIN_SLOT = "__captain__";

type SavedDraft = {
  formation?: FormationId;
  formationOptions?: FormationId[];
  captainId?: string;
  assignments?: Assignments;
  usedIds?: string[];
  // A pending draw is persisted the moment it's dealt: refreshing the page
  // can never reroll it. slotId is a formation/bench slot, or CAPTAIN_SLOT.
  pendingPick?: { slotId: string; ids: string[] };
};

function DraftPage() {
  const [pool, setPool] = useState<Player[]>(() => ALL_PLAYERS.slice());
  const [assignments, setAssignments] = useState<Assignments>({});
  const [formation, setFormation] = useState<FormationId | null>(null);
  const [formationOptions, setFormationOptions] = useState<FormationId[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [pendingPick, setPendingPick] = useState<{ slotId: string; ids: string[] } | null>(null);
  const [swapFrom, setSwapFrom] = useState<Slot | null>(null);
  const [dragFrom, setDragFrom] = useState<Slot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedDraft;
        if (parsed.assignments) setAssignments(parsed.assignments);
        if (parsed.usedIds?.length) {
          const used = new Set(parsed.usedIds);
          setPool(ALL_PLAYERS.filter((p) => !used.has(p.id)));
        }
        // Legacy saves predate formation drafting: they were always 4-3-3.
        if (parsed.formation) setFormation(parsed.formation);
        else if (parsed.assignments && Object.values(parsed.assignments).some(Boolean)) setFormation("4-3-3");
        if (parsed.formationOptions) setFormationOptions(parsed.formationOptions);
        if (parsed.captainId) setCaptainId(parsed.captainId);
        else if (parsed.assignments && Object.values(parsed.assignments).some(Boolean) && parsed.formation === undefined) {
          // Legacy save without captain: promote the best player so the flow continues.
          const best = (Object.values(parsed.assignments).filter(Boolean) as Player[]).sort((a, b) => b.overall - a.overall)[0];
          if (best) setCaptainId(best.id);
        }
        if (parsed.pendingPick) setPendingPick(parsed.pendingPick);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    try {
      const usedIds = Object.values(assignments).filter(Boolean).map((p) => (p as Player).id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        formation: formation ?? undefined,
        formationOptions,
        captainId: captainId ?? undefined,
        assignments,
        usedIds,
        pendingPick: pendingPick ?? undefined,
      } satisfies SavedDraft));
    } catch {}
  }, [assignments, formation, formationOptions, captainId, pendingPick, ready]);

  const phase: "formation" | "captain" | "squad" = !formation ? "formation" : !captainId ? "captain" : "squad";

  // Deal the formation options / captain candidates exactly once per run.
  useEffect(() => {
    if (!ready) return;
    if (phase === "formation" && formationOptions.length === 0) {
      const all = Object.keys(FORMATIONS) as FormationId[];
      setFormationOptions(shuffle(all).slice(0, 5));
    }
    if (phase === "captain" && !pendingPick) {
      setPendingPick({ slotId: CAPTAIN_SLOT, ids: shuffle(pool).slice(0, 5).map((p) => p.id) });
    }
  }, [ready, phase, formationOptions.length, pendingPick, pool]);

  const xiSlots = useMemo(() => (formation ? FORMATIONS[formation] : FORMATIONS["4-3-3"]), [formation]);
  const allSlots = useMemo(() => [...xiSlots, ...BENCH_SLOTS], [xiSlots]);
  const filledXi = xiSlots.filter((s) => assignments[s.id]).length;
  const totalFilled = allSlots.filter((s) => assignments[s.id]).length;
  const done = phase === "squad" && totalFilled === allSlots.length;

  const avg = useMemo(() => {
    // Use each player's effective overall in the slot they're deployed in —
    // out-of-position penalties count, so the number matches match strength.
    const placed = xiSlots
      .map((s) => ({ slot: s, p: assignments[s.id] }))
      .filter((x) => x.p);
    if (!placed.length) return 0;
    return Math.round(placed.reduce((a, { slot, p }) => a + effectiveOverall(p!, slot.kind), 0) / placed.length);
  }, [assignments, xiSlots]);

  // Draft summary: pops the moment the squad is complete. "Edit squad"
  // dismisses it without touching state; the header button reopens it.
  const [summaryOpen, setSummaryOpen] = useState(false);
  const wasDone = useRef(false);
  useEffect(() => {
    if (done && !wasDone.current) setSummaryOpen(true);
    wasDone.current = done;
  }, [done]);

  const pickerSlot = useMemo(() => {
    if (!pendingPick || pendingPick.slotId === CAPTAIN_SLOT) return null;
    return allSlots.find((s) => s.id === pendingPick.slotId) ?? null;
  }, [pendingPick, allSlots]);

  const pickerPlayers = useMemo(() => {
    if (!pendingPick) return [];
    const byId = new Map(ALL_PLAYERS.map((p) => [p.id, p]));
    return pendingPick.ids.map((id) => byId.get(id)).filter(Boolean) as Player[];
  }, [pendingPick]);

  // Self-heal: if a saved draw references players that no longer exist in the
  // database (roster updates between sessions), top the hand back up to five.
  useEffect(() => {
    if (!ready || !pendingPick) return;
    const byId = new Map(ALL_PLAYERS.map((p) => [p.id, p]));
    const valid = pendingPick.ids.filter((id) => byId.has(id));
    if (valid.length === pendingPick.ids.length) return;
    const have = new Set(valid);
    const slot = pendingPick.slotId === CAPTAIN_SLOT ? null : allSlots.find((s) => s.id === pendingPick.slotId);
    const source = slot ? eligibleFor(slot.kind, pool) : pool;
    const topUp = shuffle(source.filter((p) => !have.has(p.id))).slice(0, 5 - valid.length);
    setPendingPick({ slotId: pendingPick.slotId, ids: [...valid, ...topUp.map((p) => p.id)] });
  }, [ready, pendingPick, allSlots, pool]);

  function chooseFormation(f: FormationId) {
    setFormation(f);
  }

  function chooseCaptain(p: Player) {
    if (!formation) return;
    // Auto-place into their most natural slot.
    const best = [...FORMATIONS[formation]].sort((a, b) => slotFitScore(p, b.kind) - slotFitScore(p, a.kind))[0];
    setAssignments((a) => ({ ...a, [best.id]: p }));
    setPool((pool) => pool.filter((x) => x.id !== p.id));
    setCaptainId(p.id);
    setPendingPick(null);
  }

  function openPicker(slot: Slot) {
    if (pendingPick) return; // a draw is already on the table — it must be resolved
    setSwapFrom(null);
    const five = drawFive(slot.kind, pool);
    if (five.length === 0) return; // nothing left in the pool for this slot
    setPendingPick({ slotId: slot.id, ids: five.map((p) => p.id) });
  }

  function pick(p: Player) {
    if (!pendingPick || pendingPick.slotId === CAPTAIN_SLOT) return;
    const slotId = pendingPick.slotId;
    setAssignments((a) => ({ ...a, [slotId]: p }));
    setPool((pool) => pool.filter((x) => x.id !== p.id));
    setPendingPick(null);
  }

  function onSlotClick(slot: Slot) {
    const existing = assignments[slot.id];
    if (!existing) {
      openPicker(slot);
      return;
    }
    setSwapFrom(slot);
  }

  function canMove(source: Slot, target: Slot): boolean {
    if (source.id === target.id) return false;
    const a = assignments[source.id];
    const b = assignments[target.id];
    // Swaps only: both slots must hold a drafted player. Empty slots are
    // filled by drafting, never by shuffling your squad into them.
    if (!a || !b) return false;
    const aFitsTarget = target.kind === "ANY" || fits(a, target.kind);
    const bFitsSource = source.kind === "ANY" || fits(b, source.kind);
    return aFitsTarget && bFitsSource;
  }

  function move(source: Slot, target: Slot) {
    if (!canMove(source, target)) return;
    const a = assignments[source.id];
    const b = assignments[target.id];
    setAssignments((s) => ({ ...s, [source.id]: b, [target.id]: a }));
  }

  function swapWith(target: Slot) {
    if (swapFrom) move(swapFrom, target);
    setSwapFrom(null);
  }

  const dnd = (slot: Slot) => ({
    draggable: !!assignments[slot.id],
    onDragStart: (e: React.DragEvent) => {
      if (!assignments[slot.id]) return;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", slot.id);
      setDragFrom(slot);
    },
    onDragEnd: () => setDragFrom(null),
    onDragOver: (e: React.DragEvent) => {
      if (dragFrom && canMove(dragFrom, slot)) e.preventDefault();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragFrom) move(dragFrom, slot);
      setDragFrom(null);
    },
  });

  const dropState = (slot: Slot): "valid" | "invalid" | undefined => {
    if (!dragFrom || dragFrom.id === slot.id) return undefined;
    return canMove(dragFrom, slot) ? "valid" : "invalid";
  };

  return (
    <div className="min-h-screen bg-background text-foreground grain">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="font-display text-xl sm:text-2xl tracking-widest">DRAFT</div>
            <div className="hidden xl:flex items-center gap-2 rounded-full bg-surface border border-border px-3 py-1 font-mono text-xs text-muted-foreground shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary ticker-dot" />
              {formation ?? "Formation TBD"} · Season 26
            </div>
          </div>

          {/* Squad summary */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div className="text-right">
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">Squad</div>
              <div className="font-display text-lg sm:text-2xl leading-none">{totalFilled}<span className="text-muted-foreground">/{allSlots.length}</span></div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">Avg</div>
              <div className={`font-display text-lg sm:text-3xl leading-none ${avg ? "" : "text-muted-foreground"}`}>
                {avg || "—"}
              </div>
            </div>
            <Link to="/home" title="Home" className="grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-border hover:border-primary hover:text-primary transition shrink-0">
              <Home className="w-4 h-4" />
            </Link>
            <RestartRunButton />
            {done && (
              <button onClick={() => setSummaryOpen(true)}
                className="hidden lg:inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-[0_10px_40px_-10px_var(--crimson)] transition-all">
                Squad summary <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-border">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${(totalFilled / allSlots.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-3 sm:px-6 py-4 sm:py-8 pb-24 lg:pb-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 sm:gap-8">
        {/* Pitch */}
        <section>
          <div className="mb-2 sm:mb-3 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl sm:text-3xl">Starting XI</h2>
            <div className="font-mono text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest text-right">
              <span className="sm:hidden">{filledXi}/11 · tap to pick</span>
              <span className="hidden sm:inline">{filledXi}/11 filled · drag to rearrange</span>
            </div>
          </div>
          <Pitch>
            {xiSlots.map((slot) => (
              <PitchSlot
                key={slot.id}
                slot={slot}
                player={assignments[slot.id]}
                captain={!!assignments[slot.id] && assignments[slot.id]!.id === captainId}
                onClick={() => (swapFrom ? swapWith(slot) : onSlotClick(slot))}
                swapping={swapFrom?.id === slot.id}
                drop={dropState(slot)}
                dnd={dnd(slot)}
              />
            ))}
          </Pitch>
        </section>

        {/* Bench + info */}
        <aside className="space-y-5 sm:space-y-6">
          <div>
            <div className="mb-2 sm:mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-2xl sm:text-3xl">Bench</h2>
              <div className="font-mono text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">
                {BENCH_SLOTS.filter((s) => assignments[s.id]).length}/7
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {BENCH_SLOTS.map((slot) => (
                <BenchSlot
                  key={slot.id}
                  slot={slot}
                  player={assignments[slot.id]}
                  onClick={() => (swapFrom ? swapWith(slot) : onSlotClick(slot))}
                  swapping={swapFrom?.id === slot.id}
                  drop={dropState(slot)}
                  dnd={dnd(slot)}
                />
              ))}
            </div>
          </div>

          {/* Tips — collapsed by default on mobile so the pitch stays the hero */}
          <details className="group rounded-xl border border-border bg-surface p-4 lg:open" open>
            <summary className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer list-none flex items-center justify-between lg:cursor-default">
              How this works
              <span className="lg:hidden text-primary transition group-open:rotate-180">▾</span>
            </summary>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary">·</span>Formation first, then your captain, then the squad.</li>
              <li className="flex gap-2"><span className="text-primary">·</span>Tap an empty slot → pick 1 of 5. No rerolls, no backing out.</li>
              <li className="flex gap-2"><span className="text-primary">·</span>Drag players between valid positions, or bench ↔ XI.</li>
            </ul>
          </details>

          {/* Rarity legend — desktop only, it's reference not action */}
          <div className="hidden lg:block rounded-xl border border-border bg-surface p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Rarity tiers</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["icon", "gold", "silver", "bronze"] as const).map((t) => (
                <div key={t}>
                  <div className={`h-8 rounded-md bg-gradient-to-b ${TIER_STYLES[t].grad}`} />
                  <div className="mt-1 font-mono text-[9px] text-muted-foreground">{TIER_STYLES[t].label}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 font-mono text-[10px] text-muted-foreground text-center">88+ · 80+ · 72+ · &lt;72</div>
          </div>
        </aside>
      </main>

      {/* Mobile sticky CTA — the squad is done, get them out of here */}
      {done && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button onClick={() => setSummaryOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
            Squad summary <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Swap hint */}
      <AnimatePresence>
        {swapFrom && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full bg-primary text-primary-foreground px-5 py-3 shadow-[0_20px_60px_-10px_var(--crimson)] flex items-center gap-3 text-sm font-medium"
          >
            <Repeat className="w-4 h-4" />
            Swap <b>{shortName(assignments[swapFrom.id]!)}</b> — pick another slot
            <button onClick={() => setSwapFrom(null)} className="ml-2 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft summary */}
      <AnimatePresence>
        {summaryOpen && done && (
          <DraftSummary
            assignments={assignments}
            xiSlots={xiSlots}
            captainId={captainId}
            onEdit={() => setSummaryOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Phase 1: formation draft */}
      <AnimatePresence>
        {ready && phase === "formation" && formationOptions.length > 0 && (
          <FormationModal options={formationOptions} onPick={chooseFormation} />
        )}
      </AnimatePresence>

      {/* Phase 2: captain draft */}
      <AnimatePresence>
        {ready && phase === "captain" && pendingPick?.slotId === CAPTAIN_SLOT && (
          <PickerModal
            title="Choose your captain"
            subtitle="Five names from the hat. Whoever you pick wears the armband — and takes their natural position."
            kicker="Captain"
            candidates={pickerPlayers}
            onPick={chooseCaptain}
          />
        )}
      </AnimatePresence>

      {/* Phase 3: position draft */}
      <AnimatePresence>
        {ready && phase === "squad" && pickerSlot && (
          <PickerModal
            title={"Five cards.\nOne choice."}
            subtitle="No rerolls, no cancelling. Pick one to lock it in."
            kicker={`Pick your ${pickerSlot.kind === "ANY" ? "substitute" : pickerSlot.kind}`}
            candidates={pickerPlayers}
            onPick={pick}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------- Pitch --------- */
function Pitch({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[860px] mx-auto aspect-[10/13] sm:aspect-[10/8] rounded-2xl overflow-hidden border border-border"
      style={{
        background: "radial-gradient(ellipse at top, oklch(0.28 0.09 145) 0%, oklch(0.18 0.06 145) 60%, oklch(0.14 0.04 145) 100%)",
      }}
    >
      {/* pitch stripes */}
      <div className="absolute inset-0 opacity-20"
        style={{ background: "repeating-linear-gradient(0deg, transparent 0 44px, rgba(255,255,255,0.06) 44px 88px)" }} />
      {/* markings */}
      <svg viewBox="0 0 100 80" className="absolute inset-0 w-full h-full text-white/25" preserveAspectRatio="none">
        <rect x="1.5" y="1.5" width="97" height="77" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <line x1="1.5" y1="40" x2="98.5" y2="40" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="40" r="0.6" fill="currentColor" />
        {/* top penalty area */}
        <rect x="21" y="1.5" width="58" height="12.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="36" y="1.5" width="28" height="4.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="10" r="0.5" fill="currentColor" />
        <path d="M 43 14 A 8 8 0 0 0 57 14" fill="none" stroke="currentColor" strokeWidth="0.3" />
        {/* bottom penalty area */}
        <rect x="21" y="66" width="58" height="12.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="36" y="74" width="28" height="4.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="70" r="0.5" fill="currentColor" />
        <path d="M 43 66 A 8 8 0 0 1 57 66" fill="none" stroke="currentColor" strokeWidth="0.3" />
        {/* corner arcs */}
        <path d="M 1.5 4.5 A 3 3 0 0 0 4.5 1.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <path d="M 95.5 1.5 A 3 3 0 0 0 98.5 4.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <path d="M 98.5 75.5 A 3 3 0 0 0 95.5 78.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <path d="M 4.5 78.5 A 3 3 0 0 0 1.5 75.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
      </svg>
      {children}
    </div>
  );
}

type DndHandlers = {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
};

function PitchSlot({ slot, player, captain, onClick, swapping, drop, dnd }: {
  slot: Slot; player?: Player; captain?: boolean; onClick: () => void; swapping?: boolean;
  drop?: "valid" | "invalid"; dnd: DndHandlers;
}) {
  return (
    <button
      onClick={onClick}
      {...dnd}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${slot.x}%`, top: `${pitchY(slot.y)}%` }}
    >
      {player ? (
        <div className={`relative rounded-xl transition ${swapping ? "ring-2 ring-primary" : ""} ${drop === "valid" ? "ring-2 ring-accent scale-105" : drop === "invalid" ? "opacity-35" : "hover:scale-105"} ${dnd.draggable ? "cursor-grab active:cursor-grabbing" : ""}`}>
          <MiniCard player={player} kind={slot.kind} />
          {captain && (
            <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary grid place-items-center text-primary-foreground shadow-lg">
              <Crown className="w-3 h-3" />
            </div>
          )}
        </div>
      ) : (
        <div className={drop === "valid" ? "ring-2 ring-accent rounded-lg scale-105 transition" : drop === "invalid" ? "opacity-35" : ""}>
          <EmptySlot label={slot.kind} pulse />
        </div>
      )}
    </button>
  );
}

function BenchSlot({ slot, player, onClick, swapping, drop, dnd }: {
  slot: Slot; player?: Player; onClick: () => void; swapping?: boolean;
  drop?: "valid" | "invalid"; dnd: DndHandlers;
}) {
  return (
    <button
      onClick={onClick}
      {...dnd}
      className={`h-24 rounded-xl border border-dashed border-border bg-surface/50 hover:bg-surface hover:border-primary/50 transition-all flex items-center justify-center overflow-hidden relative ${swapping ? "ring-2 ring-primary border-primary" : ""} ${drop === "valid" ? "ring-2 ring-accent border-accent" : drop === "invalid" ? "opacity-35" : ""} ${dnd.draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {player ? (
        <div className="flex items-center gap-3 p-3 w-full">
          <div className={`w-14 aspect-[3/4] rounded-md bg-gradient-to-b ${TIER_STYLES[tierOf(player.overall)].grad} flex flex-col items-center justify-center ${TIER_STYLES[tierOf(player.overall)].text}`}>
            <div className="font-display text-lg leading-none">{player.overall}</div>
            <div className="text-[8px] font-bold">{player.position}</div>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="font-display text-lg leading-tight truncate">{shortName(player)}</div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">{player.club} · {player.age}</div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="font-display text-2xl text-muted-foreground/60">SUB</div>
          <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">any</div>
        </div>
      )}
    </button>
  );
}

function MiniCard({ player, kind }: { player: Player; kind?: SlotKind }) {
  const s = TIER_STYLES[tierOf(player.overall)];
  const eff = kind ? effectiveOverall(player, kind) : player.overall;
  const downgraded = eff < player.overall;
  return (
    <div className={`w-12 sm:w-16 aspect-[3/4] rounded-lg bg-gradient-to-b ${s.grad} ${s.ring} p-1 sm:p-1.5 relative overflow-hidden`}>
      <div className={`font-display leading-none ${s.text}`}>
        <div className="flex items-baseline gap-1">
          <span className="text-base sm:text-xl">{eff}</span>
          {downgraded && <span className="hidden sm:inline text-[8px] line-through opacity-60">{player.overall}</span>}
        </div>
        <div className="text-[7px] sm:text-[8px] font-bold">{player.position}</div>
      </div>
      {downgraded && <OopArrows n={kind ? oopSeverity(player, kind) : 0} />}
      <div className={`absolute inset-x-1 bottom-1 text-center font-black uppercase tracking-tight truncate text-[8px] ${s.text}`}>
        {shortName(player)}
      </div>
    </div>
  );
}

function EmptySlot({ label, pulse }: { label: string; pulse?: boolean }) {
  return (
    <div className="w-16 aspect-[3/4] rounded-lg border-2 border-dashed border-white/25 grid place-items-center hover:border-primary hover:bg-primary/10 transition-all">
      <div className="text-center">
        <div className={`text-2xl font-display text-white/40 ${pulse ? "ticker-dot" : ""}`}>+</div>
        <div className="font-mono text-[8px] text-white/50 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

/* --------- Formation draft modal --------- */
function FormationModal({ options, onPick }: { options: FormationId[]; onPick: (f: FormationId) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl overflow-y-auto"
    >
      {/* Flex wrapper, not `grid place-items-center`: the deck's percentage
          side padding would otherwise inflate the grid item and shove it
          off-centre. */}
      <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative w-full max-w-5xl"
      >
        <div className="text-center mb-5 sm:mb-8">
          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-primary">Step 1 · Formation</div>
          <h2 className="mt-2 font-display text-3xl sm:text-5xl md:text-6xl leading-[0.95]">Shape comes first.</h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">Five shapes from the hat. The one you pick is your system for the whole run — no changing later.</p>
        </div>
        {/* Same swipeable deck as the player picker: one shape at a time on a
            phone, all five side by side once there's room. */}
        <div
          className="flex sm:flex-wrap sm:justify-center gap-3 sm:gap-4 md:gap-5
                     overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none
                     px-[calc(50%-5rem)] sm:px-0 pb-2
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {options.map((f, i) => (
            <motion.button
              key={f}
              initial={{ y: 40, opacity: 0, rotate: -3 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
              onClick={() => onPick(f)}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="shrink-0 snap-center w-40 rounded-xl border border-border bg-surface hover:border-primary/60 p-3 text-left shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]"
            >
              <div className="relative aspect-[10/12] rounded-lg overflow-hidden"
                style={{ background: "radial-gradient(ellipse at top, oklch(0.28 0.09 145), oklch(0.16 0.05 145))" }}>
                <svg viewBox="0 0 100 120" className="absolute inset-0 w-full h-full text-white/20" preserveAspectRatio="none">
                  <rect x="3" y="3" width="94" height="114" fill="none" stroke="currentColor" strokeWidth="1" />
                  <line x1="3" y1="60" x2="97" y2="60" stroke="currentColor" strokeWidth="1" />
                  <circle cx="50" cy="60" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
                {FORMATIONS[f].map((s) => (
                  <span key={s.id}
                    className={`absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${s.kind === "GK" ? "bg-[oklch(0.85_0.15_95)]" : "bg-primary"}`}
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  />
                ))}
              </div>
              <div className="mt-2.5 font-display text-xl leading-tight text-center tracking-wide">{f}</div>
            </motion.button>
          ))}
        </div>
        <div className="sm:hidden mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Swipe through all {options.length} · tap to pick
        </div>
      </motion.div>
      </div>
    </motion.div>
  );
}

/* --------- Picker modal (captain + positions) — no close, no cancel --------- */
function PickerModal({ title, subtitle, kicker, candidates, onPick }: {
  title: string; subtitle: string; kicker: string; candidates: Player[]; onPick: (p: Player) => void;
}) {
  const [line1, line2] = title.split("\n");
  // Hold-to-preview: while held, the modal turns transparent so you can check
  // your squad behind it. The overlay stays mounted, so nothing underneath is
  // clickable and the pick still can't be escaped.
  const [preview, setPreview] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-200 ${preview ? "bg-transparent backdrop-blur-none" : "bg-background/85 backdrop-blur-xl"}`}
    >
      {/* The hold-to-preview button is a sibling of the fading content (so it
          stays visible), and sits in normal flow — `fixed` can't be trusted
          here because backdrop-blur makes this overlay a containing block. */}
      <div className="min-h-full flex flex-col items-center justify-center gap-5 sm:gap-8 p-4 sm:p-6">
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: preview ? 0 : 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 22, opacity: { duration: 0.15 } }}
          className={`relative w-full max-w-6xl ${preview ? "pointer-events-none" : ""}`}
        >
          <div className="text-center mb-5 sm:mb-8">
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-primary">{kicker}</div>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl md:text-6xl leading-[0.95]">
              {line1}{line2 && <><br /><span className="text-primary italic">{line2}</span></>}
            </h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {/* Phones get a swipeable deck (no endless vertical scroll);
              wider screens keep all five side by side. */}
          <div
            className="flex sm:flex-wrap sm:justify-center gap-3 sm:gap-4 md:gap-6
                       overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none
                       px-[calc(50%-5.5rem)] sm:px-0 pb-2
                       [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {candidates.map((p, i) => (
              <motion.div key={p.id}
                initial={{ y: 40, opacity: 0, rotate: -3 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                className="shrink-0 snap-center w-44 flex flex-col items-center"
              >
                <DraftCard player={p} size="lg" interactive onClick={() => onPick(p)} />
                <div className="mt-2 w-full text-center font-mono text-[10px] text-muted-foreground truncate">
                  {p.name.display} · {p.age}y · {p.club}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="sm:hidden mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Swipe through all {candidates.length} · tap to pick
          </div>
        </motion.div>

        <button
          onPointerDown={(e) => { e.preventDefault(); setPreview(true); }}
          onPointerUp={() => setPreview(false)}
          onPointerLeave={() => setPreview(false)}
          onPointerCancel={() => setPreview(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-5 sm:px-6 py-3 text-xs font-semibold select-none touch-none transition ${
            preview
              ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_40px_-10px_var(--crimson)]"
              : "border-border bg-surface/90 backdrop-blur text-foreground hover:border-primary/60"
          }`}
        >
          <Eye className="w-4 h-4" />
          {preview ? "Release to make your pick" : "Hold to preview your squad"}
        </button>
      </div>
    </motion.div>
  );
}

/* --------- Draft summary --------- */
function DraftSummary({ assignments, xiSlots, captainId, onEdit }: {
  assignments: Assignments; xiSlots: Slot[]; captainId: string | null; onEdit: () => void;
}) {
  const xi = xiSlots.map((s) => ({ s, p: assignments[s.id] })).filter((x) => x.p) as { s: Slot; p: Player }[];
  const squad = [...xiSlots, ...BENCH_SLOTS].map((s) => assignments[s.id]).filter(Boolean) as Player[];
  const { rating, fit } = squadStrength(assignments, xiSlots);
  const total = rating + fit;

  const groupAvg = (kinds: SlotKind[]) => {
    const g = xi.filter(({ s }) => kinds.includes(s.kind));
    return g.length ? Math.round(g.reduce((a, { p }) => a + p.overall, 0) / g.length) : 0;
  };
  const fwd = groupAvg(["LW", "RW", "ST", "CF"]);
  const mid = groupAvg(["CDM", "CM", "CAM", "LM", "RM"]);
  const def = groupAvg(["GK", "LB", "RB", "CB", "LWB", "RWB"]);

  const top3 = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 3);
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean) as Player[];

  const clubCounts = new Map<string, { name: string; n: number }>();
  for (const p of squad) {
    const e = clubCounts.get(p.clubId) ?? { name: p.club, n: 0 };
    e.n++;
    clubCounts.set(p.clubId, e);
  }
  const [topClubId, topClub] = [...clubCounts.entries()].sort((a, b) => b[1].n - a[1].n)[0] ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-6 bg-background/90 backdrop-blur-xl overflow-y-auto"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 sm:p-6 md:p-8"
      >
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-primary">Draft complete</div>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl md:text-6xl">YOUR SQUAD IS IN.</h2>
        </div>

        <div className="mt-8 grid md:grid-cols-[auto_1fr] gap-8 items-center">
          {/* Top players podium */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-3">Top players</div>
            <div className="flex items-end justify-center gap-2 scale-[0.82] sm:scale-100 origin-bottom">
              {podium.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className={i === 1 ? "-mt-4" : ""}
                >
                  <div className="relative">
                    <DraftCard player={p} size={i === 1 ? "md" : "sm"} />
                    {p.id === captainId && (
                      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary grid place-items-center text-primary-foreground shadow-lg">
                        <Crown className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Ratings block */}
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <div className="font-display text-4xl leading-none">{fit}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Familiarity</div>
              </div>
              <div className="font-display text-2xl text-muted-foreground">+</div>
              <div className="text-center">
                <div className="font-display text-4xl leading-none text-primary">{rating}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Squad strength</div>
              </div>
              <div className="font-display text-2xl text-muted-foreground">=</div>
              <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-center">
                <div className="font-display text-5xl leading-none text-primary">{total}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Squad rating</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <Ring label="Forwards" value={fwd} delay={0.25} />
              <Ring label="Midfielders" value={mid} delay={0.35} />
              <Ring label="Defence" value={def} delay={0.45} />
            </div>

            {topClubId && topClub && (
              <div className="flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
                {clubLogo(topClubId) && <img src={clubLogo(topClubId)} alt="" className="w-5 h-5 object-contain" />}
                Most represented: {topClub.name} · {topClub.n} players
              </div>
            )}
          </div>
        </div>

        {/* Second beat: actions arrive after the summary settles */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3"
        >
          <button onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold whitespace-nowrap hover:border-primary/60 hover:bg-surface-2 transition">
            <Repeat className="w-4 h-4" /> Edit squad
          </button>
          <Link to="/tactics"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground whitespace-nowrap hover:shadow-[0_10px_40px_-10px_var(--crimson)] transition-all">
            Proceed to tactics <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Ring({ label, value, delay }: { label: string; value: number; delay: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / 99);
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="oklch(0.22 0.016 260)" strokeWidth="5" />
          <motion.circle
            cx="32" cy="32" r={r} fill="none"
            stroke="var(--crimson)" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ delay, duration: 0.7, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center font-display text-2xl">{value}</div>
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

/* --------- helpers --------- */
// Any outfield player can be deployed in any outfield slot — the familiarity
// penalty on their effective rating is the price. Only the GK line is hard:
// no outfielders in goal, no keepers outfield.
function fits(p: Player, kind: SlotKind): boolean {
  if (kind === "ANY") return true;
  if (kind === "GK") return p.position === "GK";
  return p.position !== "GK";
}
