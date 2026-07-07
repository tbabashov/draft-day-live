import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, Crown } from "lucide-react";
import {
  ALL_PLAYERS, FORMATION_433, TIER_STYLES, tierOf, shortName,
  type Player, type Slot, type SlotKind,
} from "@/lib/draft-utils";
import {
  FORMATIONS, ROLES, DEFAULT_ROLE, PRESETS, DEFAULT_TACTICS,
  remapXi, familiarity, slotFitScore,
  type FormationId, type TacticsSettings,
} from "@/lib/tactics-utils";

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
  const [xi, setXi] = useState<Player[]>([]);
  const [tactics, setTactics] = useState<TacticsSettings>(DEFAULT_TACTICS);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Load draft XI + any saved tactics.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let xiList: Player[] = [];
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { assignments?: Assignments };
        if (parsed.assignments) {
          xiList = FORMATION_433.map((s) => parsed.assignments![s.id]).filter(Boolean) as Player[];
        }
      }
    } catch {}
    // Fallback demo XI so page never feels broken.
    if (xiList.length < 11) {
      const byPos = (pos: string) => ALL_PLAYERS.filter((p) => p.position === pos).sort((a, b) => b.overall - a.overall);
      const demo = [
        byPos("GK")[0], byPos("LB")[0], byPos("CB")[0], byPos("CB")[1], byPos("RB")[0],
        byPos("CM")[0], byPos("CM")[1], byPos("CM")[2],
        byPos("LW")[0], byPos("ST")[0], byPos("RW")[0],
      ].filter(Boolean) as Player[];
      xiList = demo;
    }
    setXi(xiList);

    try {
      const rawT = window.localStorage.getItem(TACTICS_KEY);
      if (rawT) {
        const parsed = JSON.parse(rawT);
        if (parsed.tactics) setTactics({ ...DEFAULT_TACTICS, ...parsed.tactics });
        if (parsed.roles) setRoles(parsed.roles);
        if (parsed.captainId) setCaptainId(parsed.captainId);
      }
    } catch {}
    setReady(true);
  }, []);

  const slots = FORMATIONS[tactics.formation];

  // Remap XI to current formation slots.
  const assignments = useMemo(() => remapXi(xi, slots), [xi, slots]);

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

  // Persist.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TACTICS_KEY, JSON.stringify({ tactics, roles, captainId }));
    } catch {}
  }, [tactics, roles, captainId, ready]);

  const fit = familiarity(assignments, slots);
  const avg = xi.length ? Math.round(xi.reduce((a, b) => a + b.overall, 0) / xi.length) : 0;
  const teamRating = Math.round(avg * (0.85 + fit * 0.0015)); // familiarity boosts up to ~+15%

  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setTactics((t) => ({ ...t, ...p.settings }));
  }
  function resetAll() {
    setTactics(DEFAULT_TACTICS);
    setRoles({});
    setCaptainId(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground grain">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/draft" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" /> Draft
            </Link>
            <div className="w-px h-6 bg-border" />
            <div className="font-display text-2xl tracking-widest">TACTICS</div>
            <div className="hidden md:flex items-center gap-2 rounded-full bg-surface border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary ticker-dot" />
              Step 3 · Deploy
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Familiarity</div>
              <div className="font-display text-2xl leading-none">
                {fit}<span className="text-muted-foreground text-base">%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Team rating</div>
              <div className="font-display text-3xl leading-none text-primary">{teamRating || "—"}</div>
            </div>
            <button onClick={resetAll} title="Reset tactics" className="grid place-items-center w-10 h-10 rounded-full border border-border hover:border-primary hover:text-primary transition">
              <RotateCcw className="w-4 h-4" />
            </button>
            <Link
              to="/tournament"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110"
            >
              Enter tournament <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-8">
        {/* Pitch */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-3xl">Deploy your XI</h2>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              {tactics.formation} · click a player to set role
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
                  onClick={() => setSelectedSlot((s) => (s === slot.id ? null : slot.id))}
                />
              );
            })}
          </Pitch>

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
                      <div className="font-mono text-[11px] text-muted-foreground">{slot.kind} · fit {slotFitScore(p, slot.kind)}%</div>
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
          {/* Formation */}
          <Panel title="Formation">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FORMATIONS) as FormationId[]).map((f) => {
                const active = tactics.formation === f;
                return (
                  <button
                    key={f}
                    onClick={() => setTactics((t) => ({ ...t, formation: f }))}
                    className={`py-3 rounded-lg border font-display text-lg tracking-wider transition ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}
                  >
                    {f}
                  </button>
                );
              })}
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
      className="relative w-full aspect-[10/11] rounded-2xl overflow-hidden border border-border"
      style={{ background: "radial-gradient(ellipse at top, oklch(0.28 0.09 145) 0%, oklch(0.18 0.06 145) 60%, oklch(0.14 0.04 145) 100%)" }}
    >
      <div className="absolute inset-0 opacity-20"
        style={{ background: "repeating-linear-gradient(0deg, transparent 0 60px, rgba(255,255,255,0.06) 60px 120px)" }} />
      <svg viewBox="0 0 100 110" className="absolute inset-0 w-full h-full text-white/25" preserveAspectRatio="none">
        <rect x="2" y="2" width="96" height="106" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <line x1="2" y1="55" x2="98" y2="55" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="55" r="9" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="55" r="0.6" fill="currentColor" />
        <rect x="25" y="2" width="50" height="14" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="38" y="2" width="24" height="6" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="25" y="94" width="50" height="14" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="38" y="102" width="24" height="6" fill="none" stroke="currentColor" strokeWidth="0.3" />
      </svg>
      {children}
    </div>
  );
}

function PitchSlot({ slot, player, role, captain, fit, selected, onClick }: {
  slot: Slot; player?: Player; role: string; captain: boolean; fit: number; selected: boolean; onClick: () => void;
}) {
  const fitColor = fit >= 90 ? "text-emerald-400" : fit >= 70 ? "text-amber-300" : "text-rose-400";
  return (
    <motion.button
      layout
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      initial={false}
      animate={{ scale: selected ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {player ? (
        <div className={`relative ${selected ? "ring-2 ring-primary rounded-xl" : ""}`}>
          <MiniCard player={player} />
          {captain && (
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary grid place-items-center text-primary-foreground shadow-lg">
              <Crown className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="mt-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-center">
            <div className="font-mono text-[9px] uppercase tracking-wider text-white/85 truncate max-w-[80px]">{role}</div>
            <div className={`font-mono text-[8px] ${fitColor}`}>fit {fit}%</div>
          </div>
        </div>
      ) : (
        <div className="w-20 aspect-[3/4] rounded-lg border-2 border-dashed border-white/25 grid place-items-center">
          <div className="text-center">
            <div className="text-2xl font-display text-white/40">·</div>
            <div className="font-mono text-[9px] text-white/50 uppercase tracking-widest">{slot.kind}</div>
          </div>
        </div>
      )}
    </motion.button>
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
