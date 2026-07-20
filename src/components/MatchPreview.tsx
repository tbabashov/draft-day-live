import { motion } from "framer-motion";
import { effectiveOverall, oopSeverity } from "@/lib/tactics-utils";
import { clubLogo } from "@/lib/logos";
import { faceFor } from "@/lib/faces";
import type { SideInit } from "@/lib/match-engine";
import type { Player, Slot } from "@/lib/draft-utils";

function sideStrength(side: SideInit): number {
  const xi = side.xi;
  if (!xi.length) return 60;
  return xi.reduce((s, p, i) => s + effectiveOverall(p, side.slots[i]?.kind ?? "CM"), 0) / xi.length;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Crest colours can clash (two reds, two blues); when they're too close the
// weaker segment is unreadable, so we swap the user's bar to white instead.
function colorsClash(a: string, b: string): boolean {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2) < 90;
}

function keyPlayer(side: SideInit): { p: Player; slot: Slot } | null {
  let best: { p: Player; slot: Slot; ovr: number } | null = null;
  side.xi.forEach((p, i) => {
    const slot = side.slots[i];
    if (!slot || slot.kind === "GK") return;
    const cur = best;
    if (!cur || p.overall > cur.ovr) best = { p, slot, ovr: p.overall };
  });
  const b = best as { p: Player; slot: Slot; ovr: number } | null;
  return b ? { p: b.p, slot: b.slot } : null;
}

export function MatchPreview({ home, away, userSide, roundName, onKickOff, onBack }: {
  home: SideInit; away: SideInit; userSide: "home" | "away"; roundName: string;
  onKickOff: () => void; onBack: () => void;
}) {
  const hs = sideStrength(home);
  const as = sideStrength(away);
  // Home advantage baked in (+1.5), logistic on the strength gap.
  const pHome = 1 / (1 + Math.pow(10, -(hs - as + 1.5) / 12));
  const homePct = Math.round(pHome * 100);

  const clash = colorsClash(home.entry.primary, away.entry.primary);
  const homeColor = clash && userSide === "home" ? "#FFFFFF" : home.entry.primary;
  const awayColor = clash && userSide === "away" ? "#FFFFFF" : away.entry.primary;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto"
    >
      <div className="mx-auto max-w-4xl px-3 sm:px-6 py-5 sm:py-8 min-h-full flex flex-col">
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{roundName} · Preview</div>
        </div>

        {/* crests + names */}
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamHead side={home} align="left" isUser={userSide === "home"} />
          <div className="font-display text-3xl text-muted-foreground">VS</div>
          <TeamHead side={away} align="right" isUser={userSide === "away"} />
        </div>

        {/* win probability */}
        <div className="mt-8">
          <div className="flex justify-between font-mono text-xs mb-1.5">
            <span className="tabular-nums font-bold">{homePct}%</span>
            <span className="text-muted-foreground uppercase tracking-widest">Win probability</span>
            <span className="tabular-nums font-bold">{100 - homePct}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex bg-surface-2">
            <div className="h-full transition-all" style={{ width: `${homePct}%`, background: homeColor }} />
            <div className="h-full transition-all" style={{ width: `${100 - homePct}%`, background: awayColor }} />
          </div>
        </div>

        {/* key players */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <KeyPlayer side={home} />
          <KeyPlayer side={away} />
        </div>

        {/* lineups */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Lineup side={home} />
          <Lineup side={away} />
        </div>

        <div className="mt-8 mb-2 flex items-center justify-center gap-3">
          <button onClick={onBack}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface-2">
            Not yet
          </button>
          <button onClick={onKickOff}
            className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground hover:brightness-110 shadow-[var(--shadow-glow)]">
            Kick off
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TeamHead({ side, align, isUser }: { side: SideInit; align: "left" | "right"; isUser: boolean }) {
  const logo = clubLogo(side.entry.id);
  return (
    <div className={`flex items-center gap-3 min-w-0 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      {logo ? (
        <img src={logo} alt="" className={`w-14 h-14 object-contain shrink-0 ${side.entry.isUser ? "scale-110" : ""}`} />
      ) : (
        <div className="w-14 h-14 rounded-lg shrink-0 grid place-items-center font-display border border-white/10"
          style={{ background: `linear-gradient(135deg, ${side.entry.primary}, ${side.entry.secondary})`, color: "#fff" }}>
          {side.entry.abbr}
        </div>
      )}
      <div className="min-w-0">
        <div className="font-display text-2xl truncate">{side.entry.name}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {side.tactics.formation}{isUser && " · You"}
        </div>
      </div>
    </div>
  );
}

function KeyPlayer({ side }: { side: SideInit }) {
  const kp = keyPlayer(side);
  if (!kp) return <div />;
  const face = faceFor(kp.p.name.display);
  return (
    <div className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
      {face ? (
        <img src={face} alt="" className="w-12 h-12 object-contain object-bottom shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-surface-2 grid place-items-center font-display shrink-0">{kp.p.name.last[0]}</div>
      )}
      <div className="min-w-0">
        <div className="font-mono text-[9px] uppercase tracking-widest text-primary">Danger man</div>
        <div className="font-display text-lg truncate">{kp.p.name.display}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{kp.p.position} · {kp.p.overall} OVR</div>
      </div>
    </div>
  );
}

function Lineup({ side }: { side: SideInit }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">{side.entry.abbr} · Starting XI</div>
      <ul className="space-y-0.5">
        {side.xi.map((p, i) => {
          const kind = side.slots[i]?.kind ?? "CM";
          const eff = effectiveOverall(p, kind);
          const oop = eff < p.overall;
          const sev = oopSeverity(p, kind);
          return (
            <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate">
                <span className="font-mono text-[9px] text-muted-foreground mr-1.5 inline-block w-7">{kind}</span>
                {p.name.last || p.name.display}
              </span>
              <span className={`font-mono tabular-nums ${oop ? "text-primary" : ""}`}>{eff}{oop && " " + "▼".repeat(sev)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
