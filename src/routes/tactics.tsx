import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Crown, Home } from "lucide-react";
import {
  ALL_PLAYERS, TIER_STYLES, tierOf, shortName, pitchY,
  type Player, type Slot, type SlotKind,
} from "@/lib/draft-utils";
import {
  FORMATIONS, ROLES, DEFAULT_ROLE, PRESETS, DEFAULT_TACTICS,
  remapXi, slotFitScore, effectiveOverall, oopSeverity, squadStrength,
  type FormationId, type TacticsSettings,
} from "@/lib/tactics-utils";
import { RestartRunButton } from "@/components/RestartRun";
import { OopArrows } from "@/components/OopArrows";
import { UnavailableStrip } from "@/components/UnavailableStrip";
import { loadSquadStatus, isUnavailable, type SquadStatus } from "@/lib/squad-status";
import { activeCompetition } from "@/lib/run-state";
import { btnGhost, btnPrimary } from "@/lib/ui";

const BENCH_SLOTS: Slot[] = Array.from({ length: 7 }, (_, i) => ({ id: `bench-${i}`, kind: "ANY" as SlotKind, x: 0, y: 0 }));

// Which player positions may fill a slot (keepers stay in goal; outfield is free).
function fits(p: Player, kind: SlotKind): boolean {
  if (kind === "ANY") return true;
  if (kind === "GK") return p.position === "GK";
  return p.position !== "GK";
}

export const Route = createFileRoute("/tactics")({
  head: () => ({
    meta: [
      { title: "Tactics — GAFFER" },
      { name: "description", content: "Set your formation, mentality and roles. Then take them to the tournament." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TacticsPage,
});

const DRAFT_KEY = "gaffer.draft.v1";
const TACTICS_KEY = "gaffer.tactics.v1";

type Assignments = Record<string, Player | undefined>;

function TacticsPage() {
  const [assignments, setAssignments] = useState<Assignments>({});
  const [formation, setFormation] = useState<FormationId>("4-3-3");
  const [tactics, setTactics] = useState<TacticsSettings>(DEFAULT_TACTICS);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<Slot | null>(null);
  const [status, setStatus] = useState<SquadStatus>(() => loadSquadStatus());
  const [ready, setReady] = useState(false);
  const realSquad = useRef(false); // true once a genuine drafted XI is loaded

  // Load the drafted squad (formation is locked to the draft for the run)
  // + any saved tactics.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let f: FormationId = "4-3-3";
    let loaded: Assignments = {};
    let draftCaptain: string | null = null;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { formation?: FormationId; assignments?: Assignments; captainId?: string };
        if (parsed.formation && FORMATIONS[parsed.formation]) f = parsed.formation;
        if (parsed.assignments) loaded = parsed.assignments;
        if (parsed.captainId) draftCaptain = parsed.captainId;
      }
    } catch {}
    const slots = FORMATIONS[f];
    const filledCount = slots.filter((s) => loaded[s.id]).length;
    realSquad.current = filledCount >= 11;
    setStatus(loadSquadStatus());
    if (filledCount < 11) {
      // Fallback demo XI so page never feels broken.
      const byPos = (pos: string) => ALL_PLAYERS.filter((p) => p.position === pos).sort((a, b) => b.overall - a.overall);
      const demo = [
        byPos("GK")[0], byPos("LB")[0], byPos("CB")[0], byPos("CB")[1], byPos("RB")[0],
        byPos("CM")[0], byPos("CM")[1], byPos("CM")[2],
        byPos("LW")[0], byPos("ST")[0], byPos("RW")[0],
      ].filter(Boolean) as Player[];
      loaded = remapXi(demo, slots);
    }
    setFormation(f);
    setAssignments(loaded);
    if (draftCaptain) setCaptainId(draftCaptain);

    try {
      const rawT = window.localStorage.getItem(TACTICS_KEY);
      if (rawT) {
        const parsed = JSON.parse(rawT);
        if (parsed.tactics) setTactics({ ...DEFAULT_TACTICS, ...parsed.tactics, formation: f });
        else setTactics((t) => ({ ...t, formation: f }));
        if (parsed.roles) setRoles(parsed.roles);
        if (parsed.captainId) setCaptainId(parsed.captainId);
      } else {
        setTactics((t) => ({ ...t, formation: f }));
      }
    } catch {}
    setReady(true);
  }, []);

  const slots = FORMATIONS[formation];
  const xi = useMemo(() => slots.map((s) => assignments[s.id]).filter(Boolean) as Player[], [slots, assignments]);

  // Default roles per slot when formation changes / first load.
  useEffect(() => {
    setRoles((prev) => {
      const next = { ...prev };
      for (const s of slots) if (!next[s.id]) next[s.id] = DEFAULT_ROLE[s.kind];
      return next;
    });
  }, [slots]);

  // Auto-pick captain (highest overall).
  useEffect(() => {
    if (captainId || !xi.length) return;
    const best = [...xi].sort((a, b) => b.overall - a.overall)[0];
    if (best) setCaptainId(best.id);
  }, [xi, captainId]);

  // Persist tactics/roles/captain.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TACTICS_KEY, JSON.stringify({ tactics, roles, captainId }));
    } catch {}
  }, [tactics, roles, captainId, ready]);

  // Persist squad rearrangements back to the draft so they reach the pitch.
  useEffect(() => {
    if (!ready || !realSquad.current || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      const usedIds = Object.values(assignments).filter(Boolean).map((p) => (p as Player).id);
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...prev, assignments, captainId: captainId ?? prev.captainId, usedIds }));
    } catch {}
  }, [assignments, captainId, ready]);

  const allSlots = useMemo(() => [...slots, ...BENCH_SLOTS], [slots]);

  function canMove(source: Slot, target: Slot): boolean {
    if (source.id === target.id) return false;
    const a = assignments[source.id];
    if (!a) return false;
    const b = assignments[target.id];
    const aFitsTarget = target.kind === "ANY" || fits(a, target.kind);
    const bFitsSource = !b || source.kind === "ANY" || fits(b, source.kind);
    return aFitsTarget && bFitsSource;
  }
  function move(source: Slot, target: Slot) {
    if (!canMove(source, target)) return;
    const a = assignments[source.id];
    const b = assignments[target.id];
    setAssignments((s) => ({ ...s, [source.id]: b, [target.id]: a }));
  }
  const dnd = (slot: Slot) => ({
    draggable: !!assignments[slot.id],
    onDragStart: (e: React.DragEvent) => {
      if (!assignments[slot.id]) return;
      e.dataTransfer.effectAllowed = "move";
      setDragFrom(slot);
    },
    onDragEnd: () => setDragFrom(null),
    onDragOver: (e: React.DragEvent) => { if (dragFrom && canMove(dragFrom, slot)) e.preventDefault(); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (dragFrom) move(dragFrom, slot); setDragFrom(null); },
  });
  const dropState = (slot: Slot): "valid" | "invalid" | undefined => {
    if (!dragFrom || dragFrom.id === slot.id) return undefined;
    return canMove(dragFrom, slot) ? "valid" : "invalid";
  };
  const unavailable = (p?: Player) => !!p && isUnavailable(status, p.id);

  // If a competition is already under way we're in "manage" mode, reached via
  // the in-run Manage team button rather than the initial draft flow. Read after
  // mount so the server render (no localStorage) doesn't mismatch on hydration.
  const [manageMode, setManageMode] = useState<"cup" | "league" | null>(null);
  useEffect(() => setManageMode(activeCompetition()), []);
  const backTo = manageMode === "league" ? "/league" : "/tournament";

  const { rating: teamRating, fit } = squadStrength(assignments, slots);
  const baseRating = xi.length ? Math.round(xi.reduce((a, b) => a + b.overall, 0) / xi.length) : 0;

  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setTactics((t) => ({ ...t, ...p.settings }));
  }
  return (
    <div className="min-h-screen bg-background text-foreground grain">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {!manageMode && (
              <>
                <Link to="/draft" title="Draft" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition shrink-0">
                  <ArrowLeft className="w-4 h-4" /> <span className="hidden lg:inline">Draft</span>
                </Link>
                <div className="hidden lg:block w-px h-6 bg-border" />
              </>
            )}
            <div className="font-display text-lg sm:text-2xl tracking-widest truncate">
              <span className="lg:hidden">{manageMode ? "MANAGE" : "TACTICS"}</span>
              <span className="hidden lg:inline">{manageMode ? "MANAGE TEAM" : "TACTICS"}</span>
            </div>
            {!manageMode && (
              <div className="hidden xl:flex items-center gap-2 rounded-full bg-surface border border-border px-3 py-1 font-mono text-xs text-muted-foreground shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary ticker-dot" />
                Step 3 · Deploy
              </div>
            )}
          </div>
          <div className="flex items-start gap-3 sm:gap-6 shrink-0">
            <div className="text-right">
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="lg:hidden">Fit</span><span className="hidden lg:inline">Familiarity</span>
              </div>
              <div className="flex items-baseline justify-end gap-2">
                <div className="font-display text-lg sm:text-3xl leading-none">{fit}<span className="text-muted-foreground text-xs sm:text-lg leading-none">%</span></div>
              </div>
              <div className="hidden lg:block mt-1 h-1 w-28 rounded-full bg-surface-2 overflow-hidden ml-auto">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: fit >= 90 ? "oklch(0.75 0.19 145)" : fit >= 70 ? "oklch(0.8 0.16 85)" : "oklch(0.63 0.24 25)" }}
                  animate={{ width: `${Math.max(4, fit)}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="lg:hidden">Str</span><span className="hidden lg:inline">Squad strength</span>
              </div>
              <div className="flex items-baseline justify-end gap-2">
                {teamRating > 0 && teamRating < baseRating && (
                  <span className="hidden lg:inline font-mono text-xs text-muted-foreground line-through">{baseRating}</span>
                )}
                <div className="font-display text-lg sm:text-3xl leading-none text-primary">{teamRating || "—"}</div>
              </div>
              <div className="hidden lg:block mt-1 h-1 w-28 rounded-full bg-surface-2 overflow-hidden ml-auto">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: fit >= 90 ? "oklch(0.75 0.19 145)" : fit >= 70 ? "oklch(0.8 0.16 85)" : "oklch(0.63 0.24 25)" }}
                  animate={{ width: `${Math.max(4, ((teamRating - 55) / 45) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
            <Link to="/home" title="Home" className={`${btnGhost} !px-3 lg:!px-7`}>
              <Home className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Home</span>
            </Link>
            <RestartRunButton />
            {/* Primary CTA lives in the sticky bottom bar on mobile */}
            <div className="hidden lg:block">
              {manageMode ? (
                <Link to={backTo} className={btnPrimary}>
                  Go back <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link to="/compete" className={btnPrimary}>
                  Choose competition <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 sm:gap-8">
        {/* Pitch */}
        <section>
          <div className="mb-2 sm:mb-3 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl sm:text-3xl">Deploy your XI</h2>
            <div className="font-mono text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest text-right shrink-0">
              <span className="sm:hidden">{formation} · tap a player</span>
              <span className="hidden sm:inline">{formation} · drag to swap · click to set role</span>
            </div>
          </div>
          <Pitch>
            {slots.map((slot) => {
              const p = assignments[slot.id];
              const fitScore = p ? slotFitScore(p, slot.kind) : 0;
              return (
                <PitchSlot
                  key={slot.id}
                  slot={slot}
                  player={p}
                  role={roles[slot.id] || DEFAULT_ROLE[slot.kind]}
                  captain={p?.id === captainId}
                  fit={fitScore}
                  selected={selectedSlot === slot.id}
                  unavailable={unavailable(p)}
                  drop={dropState(slot)}
                  dnd={dnd(slot)}
                  onClick={() => setSelectedSlot((s) => (s === slot.id ? null : slot.id))}
                />
              );
            })}
          </Pitch>

          {/* Bench — drag anyone up into the XI (e.g. to cover an injury) */}
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="font-display text-2xl">Bench</h3>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Drag onto the pitch to sub</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BENCH_SLOTS.map((slot) => (
                <BenchSlot key={slot.id} slot={slot} player={assignments[slot.id]}
                  unavailable={unavailable(assignments[slot.id])} drop={dropState(slot)} dnd={dnd(slot)} />
              ))}
            </div>
          </div>

          {/* Selected slot editor */}
          <AnimatePresence mode="popLayout">
            {selectedSlot && (() => {
              const slot = slots.find((s) => s.id === selectedSlot);
              const p = slot ? assignments[slot.id] : undefined;
              if (!slot || !p) return null;
              return (
                <motion.div
                  key={selectedSlot}
                  initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                  className="mt-4 rounded-xl border border-primary/50 bg-surface p-5 flex flex-wrap items-center gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 aspect-[3/4] rounded-md bg-gradient-to-b ${TIER_STYLES[tierOf(p.overall)].grad} flex flex-col items-center justify-center ${TIER_STYLES[tierOf(p.overall)].text}`}>
                      <div className="font-display text-lg leading-none">{p.overall}</div>
                      <div className="text-[8px] font-bold">{p.position}</div>
                    </div>
                    <div>
                      <div className="font-display text-2xl">{p.name.display}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {slot.kind} · fit {slotFitScore(p, slot.kind)}% · effective{" "}
                        <span className={effectiveOverall(p, slot.kind) < p.overall ? "text-rose-400" : "text-emerald-400"}>
                          {effectiveOverall(p, slot.kind)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[240px]">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Role</div>
                    <div className="flex flex-wrap gap-2">
                      {ROLES[slot.kind].map((r) => {
                        const active = (roles[slot.id] || DEFAULT_ROLE[slot.kind]) === r;
                        return (
                          <button
                            key={r}
                            onClick={() => setRoles((s) => ({ ...s, [slot.id]: r }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => setCaptainId(p.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border transition ${captainId === p.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    {captainId === p.id ? "Captain" : "Make captain"}
                  </button>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </section>

        {/* Control panel */}
        <aside className="space-y-6">
          <div><UnavailableStrip /></div>

          {/* Formation — drafted, locked for the run */}
          <Panel title="Formation">
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
              <div className="font-display text-2xl tracking-wider">{formation}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Drafted · locked for this run</div>
            </div>
          </Panel>

          {/* Sliders */}
          <Panel title="Style">
            <Slider label="Mentality" left="Defensive" right="Attacking"
              value={tactics.mentality} onChange={(v) => setTactics((t) => ({ ...t, mentality: v }))} />
            <Slider label="Pressing" left="Passive" right="Gegenpress"
              value={tactics.pressing} onChange={(v) => setTactics((t) => ({ ...t, pressing: v }))} />
            <Slider label="Tempo" left="Patient" right="Fast"
              value={tactics.tempo} onChange={(v) => setTactics((t) => ({ ...t, tempo: v }))} />
            <Slider label="Width" left="Narrow" right="Wide"
              value={tactics.width} onChange={(v) => setTactics((t) => ({ ...t, width: v }))} />
            <Slider label="Defensive line" left="Deep" right="High"
              value={tactics.defLine} onChange={(v) => setTactics((t) => ({ ...t, defLine: v }))} />
          </Panel>

          {/* Presets */}
          <Panel title="Presets" icon={<Sparkles className="w-3.5 h-3.5 text-primary" />}>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className="w-full text-left rounded-lg border border-border hover:border-primary/60 px-3 py-2.5 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-display text-lg">{p.name}</div>
                    <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
          </Panel>

          <div className="rounded-xl border border-border bg-surface p-4 text-xs text-muted-foreground">
            <span className="text-primary">Tip.</span> Higher familiarity means players in their natural roles.
            Formation switches auto-remap your XI to best fit — tweak the roles below the pitch.
          </div>
        </aside>
      </main>

      {/* Mobile sticky CTA — the one action that matters, in thumb reach */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {manageMode ? (
          <Link to={backTo} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
            Go back <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link to="/compete" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
            Choose competition <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

/* --------------- panels --------------- */
function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

function Slider({ label, left, right, value, onChange }: {
  label: string; left: string; right: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="font-mono text-xs text-muted-foreground">{value}</div>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--crimson,theme(colors.primary.DEFAULT))]"
        style={{ accentColor: "var(--crimson, hsl(var(--primary)))" }}
      />
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        <span>{left}</span><span>{right}</span>
      </div>
    </div>
  );
}

/* --------------- pitch --------------- */
function Pitch({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full max-w-[860px] mx-auto aspect-[10/13] sm:aspect-[10/8] rounded-2xl overflow-hidden border border-border"
      style={{ background: "radial-gradient(ellipse at top, oklch(0.28 0.09 145) 0%, oklch(0.18 0.06 145) 60%, oklch(0.14 0.04 145) 100%)" }}
    >
      <div className="absolute inset-0 opacity-20"
        style={{ background: "repeating-linear-gradient(0deg, transparent 0 44px, rgba(255,255,255,0.06) 44px 88px)" }} />
      <svg viewBox="0 0 100 80" className="absolute inset-0 w-full h-full text-white/25" preserveAspectRatio="none">
        <rect x="1.5" y="1.5" width="97" height="77" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <line x1="1.5" y1="40" x2="98.5" y2="40" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="40" r="0.6" fill="currentColor" />
        <rect x="21" y="1.5" width="58" height="12.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="36" y="1.5" width="28" height="4.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="10" r="0.5" fill="currentColor" />
        <path d="M 43 14 A 8 8 0 0 0 57 14" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="21" y="66" width="58" height="12.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="36" y="74" width="28" height="4.5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="70" r="0.5" fill="currentColor" />
        <path d="M 43 66 A 8 8 0 0 1 57 66" fill="none" stroke="currentColor" strokeWidth="0.3" />
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

function PitchSlot({ slot, player, role, captain, fit, selected, unavailable, drop, dnd, onClick }: {
  slot: Slot; player?: Player; role: string; captain: boolean; fit: number; selected: boolean;
  unavailable?: boolean; drop?: "valid" | "invalid"; dnd: DndHandlers; onClick: () => void;
}) {
  const fitColor = fit >= 90 ? "text-emerald-400" : fit >= 70 ? "text-amber-300" : "text-rose-400";
  return (
    <button
      onClick={onClick}
      {...dnd}
      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${selected ? "scale-105" : ""} ${dnd.draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ left: `${slot.x}%`, top: `${pitchY(slot.y)}%` }}
    >
      {player ? (
        <div className={`relative rounded-xl transition ${selected ? "ring-2 ring-primary" : ""} ${drop === "valid" ? "ring-2 ring-accent scale-105" : drop === "invalid" ? "opacity-35" : ""}`}>
          <MiniCard player={player} kind={slot.kind} />
          {captain && (
            <div className="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary grid place-items-center text-primary-foreground shadow-lg">
              <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          )}
          {unavailable && (
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary grid place-items-center text-primary-foreground text-[10px] sm:text-xs font-bold shadow-lg" title="Injured or suspended">!</div>
          )}
          {/* Role/fit chip clutters a phone pitch — only on desktop, or when tapped */}
          <div className={`${selected ? "block" : "hidden"} sm:block mt-1 px-1 py-0.5 rounded bg-black/70 backdrop-blur text-center`}>
            <div className={`font-mono text-[8px] uppercase tracking-wider truncate max-w-[64px] ${unavailable ? "text-primary" : "text-white/85"}`}>{unavailable ? "unavailable" : role}</div>
            <div className={`font-mono text-[8px] ${fitColor}`}>fit {fit}%</div>
          </div>
        </div>
      ) : (
        <div className={`w-12 sm:w-16 aspect-[3/4] rounded-lg border-2 border-dashed grid place-items-center ${drop === "valid" ? "border-accent scale-105" : "border-white/25"}`}>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-display text-white/40">·</div>
            <div className="font-mono text-[7px] sm:text-[8px] text-white/50 uppercase tracking-widest">{slot.kind}</div>
          </div>
        </div>
      )}
    </button>
  );
}

function BenchSlot({ slot, player, unavailable, drop, dnd }: {
  slot: Slot; player?: Player; unavailable?: boolean; drop?: "valid" | "invalid"; dnd: DndHandlers;
}) {
  return (
    <div
      {...dnd}
      className={`h-16 rounded-xl border border-dashed border-border bg-surface/50 flex items-center justify-center overflow-hidden relative transition ${drop === "valid" ? "ring-2 ring-accent border-accent" : drop === "invalid" ? "opacity-35" : ""} ${dnd.draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {player ? (
        <div className="flex items-center gap-2 p-2 w-full">
          <div className={`w-9 aspect-[3/4] rounded bg-gradient-to-b ${TIER_STYLES[tierOf(player.overall)].grad} flex flex-col items-center justify-center shrink-0 ${TIER_STYLES[tierOf(player.overall)].text}`}>
            <div className="font-display text-sm leading-none">{player.overall}</div>
            <div className="text-[7px] font-bold">{player.position}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm leading-tight truncate">{shortName(player)}</div>
            <div className={`font-mono text-[9px] truncate ${unavailable ? "text-primary" : "text-muted-foreground"}`}>{unavailable ? "unavailable" : player.position}</div>
          </div>
        </div>
      ) : (
        <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Empty</div>
      )}
    </div>
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
