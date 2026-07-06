import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, ArrowRight, Repeat, X } from "lucide-react";
import {
  ALL_PLAYERS, FORMATION_433, drawFive, tierOf, TIER_STYLES, shortName,
  type Player, type Slot, type SlotKind,
} from "@/lib/draft-utils";
import { DraftCard } from "@/components/DraftCard";

export const Route = createFileRoute("/draft")({
  head: () => ({
    meta: [
      { title: "Draft — GAFFER" },
      { name: "description", content: "Draft your XI. Five cards per slot. One choice. Live with it." },
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

function DraftPage() {
  const [pool, setPool] = useState<Player[]>(() => ALL_PLAYERS.slice());
  const [assignments, setAssignments] = useState<Assignments>({});
  const [openSlot, setOpenSlot] = useState<Slot | null>(null);
  const [picker, setPicker] = useState<Player[]>([]);
  const [swapFrom, setSwapFrom] = useState<Slot | null>(null);

  const allSlots = useMemo(() => [...FORMATION_433, ...BENCH_SLOTS], []);
  const filledXi = FORMATION_433.filter((s) => assignments[s.id]).length;
  const totalFilled = allSlots.filter((s) => assignments[s.id]).length;
  const done = totalFilled === allSlots.length;

  const avg = useMemo(() => {
    const xi = FORMATION_433.map((s) => assignments[s.id]).filter(Boolean) as Player[];
    if (!xi.length) return 0;
    return Math.round(xi.reduce((a, b) => a + b.overall, 0) / xi.length);
  }, [assignments]);

  const chemTier = tierOf(avg || 60);

  // auto-open next empty slot after each pick (unless swap mode)
  useEffect(() => {
    if (swapFrom || openSlot) return;
    if (done) return;
    const next = allSlots.find((s) => !assignments[s.id]);
    if (next) openPicker(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments]);

  function openPicker(slot: Slot) {
    setSwapFrom(null);
    setOpenSlot(slot);
    setPicker(drawFive(slot.kind, pool));
  }

  function pick(p: Player) {
    if (!openSlot) return;
    setAssignments((a) => ({ ...a, [openSlot.id]: p }));
    setPool((pool) => pool.filter((x) => x.id !== p.id));
    setOpenSlot(null);
    setPicker([]);
  }

  function onSlotClick(slot: Slot) {
    const existing = assignments[slot.id];
    if (!existing) {
      openPicker(slot);
      return;
    }
    // filled: start swap mode
    setSwapFrom(slot);
  }

  function swapWith(target: Slot) {
    if (!swapFrom || swapFrom.id === target.id) {
      setSwapFrom(null);
      return;
    }
    // Only allow swap if the mover fits target and vice versa (positional check)
    const a = assignments[swapFrom.id];
    const b = assignments[target.id];
    if (!a) { setSwapFrom(null); return; }

    const aFitsTarget = target.kind === "ANY" || fits(a, target.kind);
    const bFitsSource = !b || swapFrom.kind === "ANY" || fits(b, swapFrom.kind);
    if (!aFitsTarget || !bFitsSource) {
      setSwapFrom(null);
      return;
    }
    setAssignments((s) => ({ ...s, [swapFrom.id]: b, [target.id]: a }));
    setSwapFrom(null);
  }

  function reset() {
    setAssignments({});
    setPool(ALL_PLAYERS.slice());
    setOpenSlot(null);
    setSwapFrom(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground grain">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <div className="w-px h-6 bg-border" />
            <div className="font-display text-2xl tracking-widest">DRAFT</div>
            <div className="hidden md:flex items-center gap-2 rounded-full bg-surface border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary ticker-dot" />
              4-3-3 · Season 26
            </div>
          </div>

          {/* Squad summary */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Progress</div>
              <div className="font-display text-2xl leading-none">{totalFilled}<span className="text-muted-foreground">/{allSlots.length}</span></div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Squad avg</div>
              <div className={`font-display text-3xl leading-none ${avg ? "" : "text-muted-foreground"}`} style={{ color: avg ? `oklch(from ${TIER_STYLES[chemTier].label === "ICON" ? "oklch(0.7_0.25_320)" : "var(--foreground)"} l c h)` : undefined }}>
                {avg || "—"}
              </div>
            </div>
            <button onClick={reset} title="Reset draft" className="grid place-items-center w-10 h-10 rounded-full border border-border hover:border-primary hover:text-primary transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            {done && (
              <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-[0_10px_40px_-10px_var(--crimson)] transition-all">
                Set tactics <ArrowRight className="w-4 h-4" />
              </Link>
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

      <main className="mx-auto max-w-[1600px] px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-8">
        {/* Pitch */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-3xl">Starting XI</h2>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{filledXi}/11 filled</div>
          </div>
          <Pitch>
            {FORMATION_433.map((slot) => (
              <PitchSlot
                key={slot.id}
                slot={slot}
                player={assignments[slot.id]}
                onClick={() => onSlotClick(slot)}
                swapping={swapFrom?.id === slot.id}
                swappable={!!swapFrom && swapFrom.id !== slot.id}
              />
            ))}
          </Pitch>
        </section>

        {/* Bench + info */}
        <aside className="space-y-6">
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-3xl">Bench</h2>
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                {BENCH_SLOTS.filter((s) => assignments[s.id]).length}/7
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BENCH_SLOTS.map((slot) => (
                <BenchSlot
                  key={slot.id}
                  slot={slot}
                  player={assignments[slot.id]}
                  onClick={() => onSlotClick(slot)}
                  swapping={swapFrom?.id === slot.id}
                  swappable={!!swapFrom && swapFrom.id !== slot.id}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">How this works</div>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary">·</span>Click a slot → pick 1 of 5 random eligible players.</li>
              <li className="flex gap-2"><span className="text-primary">·</span>No rerolls. Choose wisely.</li>
              <li className="flex gap-2"><span className="text-primary">·</span>Click a filled slot, then another, to swap.</li>
            </ul>
          </div>

          {/* Rarity legend */}
          <div className="rounded-xl border border-border bg-surface p-4">
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

      {/* Picker modal */}
      <AnimatePresence>
        {openSlot && (
          <PickerModal
            slot={openSlot}
            candidates={picker}
            onPick={pick}
            onClose={() => setOpenSlot(null)}
            canClose={done || totalFilled > 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------- Pitch --------- */
function Pitch({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full aspect-[10/11] rounded-2xl overflow-hidden border border-border"
      style={{
        background: "radial-gradient(ellipse at top, oklch(0.28 0.09 145) 0%, oklch(0.18 0.06 145) 60%, oklch(0.14 0.04 145) 100%)",
      }}
    >
      {/* pitch stripes */}
      <div className="absolute inset-0 opacity-20"
        style={{ background: "repeating-linear-gradient(0deg, transparent 0 60px, rgba(255,255,255,0.06) 60px 120px)" }} />
      {/* markings */}
      <svg viewBox="0 0 100 110" className="absolute inset-0 w-full h-full text-white/25" preserveAspectRatio="none">
        <rect x="2" y="2" width="96" height="106" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <line x1="2" y1="55" x2="98" y2="55" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="55" r="9" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="55" r="0.6" fill="currentColor" />
        {/* boxes */}
        <rect x="25" y="2" width="50" height="14" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="38" y="2" width="24" height="6" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="25" y="94" width="50" height="14" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="38" y="102" width="24" height="6" fill="none" stroke="currentColor" strokeWidth="0.3" />
      </svg>
      {children}
    </div>
  );
}

function PitchSlot({ slot, player, onClick, swapping, swappable }: {
  slot: Slot; player?: Player; onClick: () => void; swapping?: boolean; swappable?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      {player ? (
        <div className={`relative ${swapping ? "ring-2 ring-primary rounded-xl" : ""} ${swappable ? "opacity-95 hover:scale-105 transition" : ""}`}>
          <MiniCard player={player} />
        </div>
      ) : (
        <EmptySlot label={slot.kind} pulse />
      )}
    </button>
  );
}

function BenchSlot({ slot, player, onClick, swapping, swappable }: {
  slot: Slot; player?: Player; onClick: () => void; swapping?: boolean; swappable?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-24 rounded-xl border border-dashed border-border bg-surface/50 hover:bg-surface hover:border-primary/50 transition-all flex items-center justify-center overflow-hidden relative ${swapping ? "ring-2 ring-primary border-primary" : ""} ${swappable ? "border-primary/40" : ""}`}
    >
      {player ? (
        <div className="flex items-center gap-3 p-3 w-full">
          <div className={`w-14 aspect-[3/4] rounded-md bg-gradient-to-b ${TIER_STYLES[tierOf(player.overall)].grad} flex flex-col items-center justify-center ${TIER_STYLES[tierOf(player.overall)].text}`}>
            <div className="font-display text-lg leading-none">{player.overall}</div>
            <div className="text-[8px] font-bold">{player.position}</div>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="font-display text-lg leading-tight truncate">{shortName(player)}</div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">{player.nationality} · {player.age}</div>
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

function MiniCard({ player }: { player: Player }) {
  const s = TIER_STYLES[tierOf(player.overall)];
  return (
    <div className={`w-20 aspect-[3/4] rounded-lg bg-gradient-to-b ${s.grad} ${s.ring} p-1.5 relative overflow-hidden`}>
      <div className={`font-display leading-none ${s.text}`}>
        <div className="text-2xl">{player.overall}</div>
        <div className="text-[8px] font-bold">{player.position}</div>
      </div>
      <div className={`absolute inset-x-1 bottom-1 text-center font-black uppercase tracking-tight truncate text-[9px] ${s.text}`}>
        {shortName(player)}
      </div>
    </div>
  );
}

function EmptySlot({ label, pulse }: { label: string; pulse?: boolean }) {
  return (
    <div className="w-20 aspect-[3/4] rounded-lg border-2 border-dashed border-white/25 grid place-items-center hover:border-primary hover:bg-primary/10 transition-all">
      <div className="text-center">
        <div className={`text-3xl font-display text-white/40 ${pulse ? "ticker-dot" : ""}`}>+</div>
        <div className="font-mono text-[9px] text-white/50 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

/* --------- Picker modal --------- */
function PickerModal({ slot, candidates, onPick, onClose, canClose }: {
  slot: Slot; candidates: Player[]; onPick: (p: Player) => void; onClose: () => void; canClose: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-6 bg-background/85 backdrop-blur-xl"
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative w-full max-w-6xl"
      >
        {canClose && (
          <button onClick={onClose} className="absolute -top-2 -right-2 grid place-items-center w-10 h-10 rounded-full bg-surface border border-border hover:border-primary transition z-10">
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="text-center mb-8">
          <div className="font-mono text-xs uppercase tracking-widest text-primary">Pick your {slot.kind === "ANY" ? "substitute" : slot.kind}</div>
          <h2 className="mt-2 font-display text-5xl md:text-6xl">Five cards.<br /><span className="text-primary italic">One choice.</span></h2>
          <p className="mt-3 text-sm text-muted-foreground">No rerolls. Click a card to lock it in.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {candidates.length === 0 && (
            <div className="text-muted-foreground py-12">No eligible players left in the pool for this slot.</div>
          )}
          {candidates.map((p, i) => (
            <motion.div key={p.id}
              initial={{ y: 40, opacity: 0, rotate: -3 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
            >
              <DraftCard player={p} size="lg" interactive onClick={() => onPick(p)} />
              <div className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                {p.name.display} · {p.age}y · {p.nationality}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* --------- helpers --------- */
function fits(p: Player, kind: SlotKind): boolean {
  if (kind === "ANY") return true;
  const map: Record<SlotKind, string[]> = {
    GK: ["GK"], LB: ["LB", "LWB", "LM"], RB: ["RB", "RWB", "RM"], CB: ["CB"],
    LWB: ["LWB", "LB"], RWB: ["RWB", "RB"],
    CDM: ["CDM", "CM"], CM: ["CM", "CDM", "CAM"], CAM: ["CAM", "CM", "AM"],
    LM: ["LM", "LW", "LB"], RM: ["RM", "RW", "RB"],
    LW: ["LW", "LM"], RW: ["RW", "RM"], ST: ["ST", "CF"], CF: ["CF", "ST", "CAM"],
    ANY: [],
  };
  return map[kind].includes(p.position);
}
