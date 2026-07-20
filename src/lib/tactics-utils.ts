import type { Player, Slot, SlotKind } from "@/lib/draft-utils";

export type FormationId = "4-3-3" | "4-3-3 Attack" | "4-3-3 Holding" | "4-4-2" | "4-2-3-1" | "3-5-2" | "3-4-3" | "5-3-2" | "4-1-4-1";

export const FORMATIONS: Record<FormationId, Slot[]> = {
  "4-3-3": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lb", kind: "LB", x: 15, y: 72 },
    { id: "lcb", kind: "CB", x: 37, y: 76 },
    { id: "rcb", kind: "CB", x: 63, y: 76 },
    { id: "rb", kind: "RB", x: 85, y: 72 },
    { id: "lcm", kind: "CM", x: 28, y: 50 },
    { id: "cm", kind: "CM", x: 50, y: 54 },
    { id: "rcm", kind: "CM", x: 72, y: 50 },
    { id: "lw", kind: "LW", x: 18, y: 22 },
    { id: "st", kind: "ST", x: 50, y: 16 },
    { id: "rw", kind: "RW", x: 82, y: 22 },
  ],
  "4-3-3 Attack": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lb", kind: "LB", x: 15, y: 72 },
    { id: "lcb", kind: "CB", x: 37, y: 76 },
    { id: "rcb", kind: "CB", x: 63, y: 76 },
    { id: "rb", kind: "RB", x: 85, y: 72 },
    { id: "lcm", kind: "CM", x: 30, y: 56 },
    { id: "rcm", kind: "CM", x: 70, y: 56 },
    { id: "cam", kind: "CAM", x: 50, y: 40 },
    { id: "lw", kind: "LW", x: 18, y: 22 },
    { id: "st", kind: "ST", x: 50, y: 16 },
    { id: "rw", kind: "RW", x: 82, y: 22 },
  ],
  "4-3-3 Holding": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lb", kind: "LB", x: 15, y: 72 },
    { id: "lcb", kind: "CB", x: 37, y: 76 },
    { id: "rcb", kind: "CB", x: 63, y: 76 },
    { id: "rb", kind: "RB", x: 85, y: 72 },
    { id: "cdm", kind: "CDM", x: 50, y: 60 },
    { id: "lcm", kind: "CM", x: 33, y: 46 },
    { id: "rcm", kind: "CM", x: 67, y: 46 },
    { id: "lw", kind: "LW", x: 18, y: 22 },
    { id: "st", kind: "ST", x: 50, y: 16 },
    { id: "rw", kind: "RW", x: 82, y: 22 },
  ],
  "4-4-2": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lb", kind: "LB", x: 15, y: 72 },
    { id: "lcb", kind: "CB", x: 37, y: 76 },
    { id: "rcb", kind: "CB", x: 63, y: 76 },
    { id: "rb", kind: "RB", x: 85, y: 72 },
    { id: "lm", kind: "LM", x: 15, y: 46 },
    { id: "lcm", kind: "CM", x: 38, y: 50 },
    { id: "rcm", kind: "CM", x: 62, y: 50 },
    { id: "rm", kind: "RM", x: 85, y: 46 },
    { id: "lst", kind: "ST", x: 38, y: 18 },
    { id: "rst", kind: "ST", x: 62, y: 18 },
  ],
  "4-2-3-1": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lb", kind: "LB", x: 15, y: 72 },
    { id: "lcb", kind: "CB", x: 37, y: 76 },
    { id: "rcb", kind: "CB", x: 63, y: 76 },
    { id: "rb", kind: "RB", x: 85, y: 72 },
    { id: "ldm", kind: "CDM", x: 36, y: 56 },
    { id: "rdm", kind: "CDM", x: 64, y: 56 },
    { id: "lam", kind: "CAM", x: 22, y: 32 },
    { id: "cam", kind: "CAM", x: 50, y: 34 },
    { id: "ram", kind: "CAM", x: 78, y: 32 },
    { id: "st", kind: "ST", x: 50, y: 14 },
  ],
  "3-5-2": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lcb", kind: "CB", x: 26, y: 76 },
    { id: "ccb", kind: "CB", x: 50, y: 78 },
    { id: "rcb", kind: "CB", x: 74, y: 76 },
    { id: "lwb", kind: "LWB", x: 10, y: 52 },
    { id: "rwb", kind: "RWB", x: 90, y: 52 },
    { id: "lcm", kind: "CM", x: 30, y: 50 },
    { id: "cm", kind: "CDM", x: 50, y: 56 },
    { id: "rcm", kind: "CM", x: 70, y: 50 },
    { id: "lst", kind: "ST", x: 38, y: 18 },
    { id: "rst", kind: "ST", x: 62, y: 18 },
  ],
  "3-4-3": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lcb", kind: "CB", x: 26, y: 76 },
    { id: "ccb", kind: "CB", x: 50, y: 78 },
    { id: "rcb", kind: "CB", x: 74, y: 76 },
    { id: "lm", kind: "LM", x: 12, y: 48 },
    { id: "lcm", kind: "CM", x: 38, y: 52 },
    { id: "rcm", kind: "CM", x: 62, y: 52 },
    { id: "rm", kind: "RM", x: 88, y: 48 },
    { id: "lw", kind: "LW", x: 22, y: 20 },
    { id: "st", kind: "ST", x: 50, y: 16 },
    { id: "rw", kind: "RW", x: 78, y: 20 },
  ],
  "5-3-2": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lwb", kind: "LWB", x: 10, y: 66 },
    { id: "lcb", kind: "CB", x: 30, y: 78 },
    { id: "ccb", kind: "CB", x: 50, y: 80 },
    { id: "rcb", kind: "CB", x: 70, y: 78 },
    { id: "rwb", kind: "RWB", x: 90, y: 66 },
    { id: "lcm", kind: "CM", x: 30, y: 46 },
    { id: "cm", kind: "CM", x: 50, y: 50 },
    { id: "rcm", kind: "CM", x: 70, y: 46 },
    { id: "lst", kind: "ST", x: 38, y: 18 },
    { id: "rst", kind: "ST", x: 62, y: 18 },
  ],
  "4-1-4-1": [
    { id: "gk", kind: "GK", x: 50, y: 92 },
    { id: "lb", kind: "LB", x: 15, y: 72 },
    { id: "lcb", kind: "CB", x: 37, y: 76 },
    { id: "rcb", kind: "CB", x: 63, y: 76 },
    { id: "rb", kind: "RB", x: 85, y: 72 },
    { id: "cdm", kind: "CDM", x: 50, y: 58 },
    { id: "lm", kind: "LM", x: 15, y: 38 },
    { id: "lcm", kind: "CM", x: 38, y: 40 },
    { id: "rcm", kind: "CM", x: 62, y: 40 },
    { id: "rm", kind: "RM", x: 85, y: 38 },
    { id: "st", kind: "ST", x: 50, y: 14 },
  ],
};

// Roles available per slot kind.
export const ROLES: Record<SlotKind, string[]> = {
  GK: ["Sweeper Keeper", "Shot Stopper"],
  LB: ["Full Back", "Wing Back", "Inverted FB"],
  RB: ["Full Back", "Wing Back", "Inverted FB"],
  CB: ["Stopper", "Ball-Playing", "Cover"],
  LWB: ["Attacking", "Balanced", "Defensive"],
  RWB: ["Attacking", "Balanced", "Defensive"],
  CDM: ["Anchor", "Deep-Lying Playmaker", "Ball Winner"],
  CM: ["Box-to-Box", "Playmaker", "Carrilero"],
  CAM: ["Advanced Playmaker", "Shadow Striker", "Trequartista"],
  LM: ["Winger", "Wide Midfielder", "Inside Forward"],
  RM: ["Winger", "Wide Midfielder", "Inside Forward"],
  LW: ["Inside Forward", "Winger", "Inverted Winger"],
  RW: ["Inside Forward", "Winger", "Inverted Winger"],
  ST: ["Poacher", "Target Man", "False 9", "Complete Forward"],
  CF: ["False 9", "Complete Forward", "Target Man"],
  ANY: ["Balanced"],
};

export const DEFAULT_ROLE: Record<SlotKind, string> = {
  GK: "Shot Stopper", LB: "Full Back", RB: "Full Back", CB: "Stopper",
  LWB: "Balanced", RWB: "Balanced", CDM: "Anchor", CM: "Box-to-Box",
  CAM: "Advanced Playmaker", LM: "Winger", RM: "Winger",
  LW: "Inside Forward", RW: "Inside Forward", ST: "Complete Forward",
  CF: "Complete Forward", ANY: "Balanced",
};

export type TacticsSettings = {
  formation: FormationId;
  mentality: number;    // 0..100 (defensive→attacking)
  pressing: number;     // 0..100
  tempo: number;        // 0..100
  width: number;        // 0..100 (narrow→wide)
  defLine: number;      // 0..100 (deep→high)
};

export const PRESETS: { id: string; name: string; desc: string; settings: Omit<TacticsSettings, "formation"> }[] = [
  { id: "park", name: "Park the Bus", desc: "Deep block. Kill the game.", settings: { mentality: 15, pressing: 25, tempo: 30, width: 30, defLine: 20 } },
  { id: "balanced", name: "Balanced", desc: "Measured. Two-way football.", settings: { mentality: 50, pressing: 50, tempo: 50, width: 50, defLine: 50 } },
  { id: "tiki", name: "Tiki-Taka", desc: "Possession & short passing.", settings: { mentality: 60, pressing: 65, tempo: 40, width: 40, defLine: 70 } },
  { id: "gegen", name: "Gegenpress", desc: "Win it back. Immediately.", settings: { mentality: 75, pressing: 95, tempo: 80, width: 55, defLine: 85 } },
  { id: "route", name: "Route One", desc: "Straight to the striker.", settings: { mentality: 70, pressing: 55, tempo: 90, width: 70, defLine: 60 } },
];

export const DEFAULT_TACTICS: TacticsSettings = {
  formation: "4-3-3",
  mentality: 55, pressing: 60, tempo: 55, width: 55, defLine: 55,
};

// Fit score for placing a player in a slot kind (higher = better).
const POS_FIT: Record<SlotKind, Record<string, number>> = {
  GK: { GK: 100 },
  // Full-back and wing-back on the same flank are interchangeable (no cost);
  // switching flanks (LB↔RB) costs ~2.
  // A centre-back shifted out to full-back costs ~4.
  LB: { LB: 100, LWB: 100, LM: 75, RB: 75, RWB: 70, CB: 58 },
  RB: { RB: 100, RWB: 100, RM: 75, LB: 75, LWB: 70, CB: 58 },
  // A full-back tucked in at centre-back costs ~4.
  CB: { CB: 100, CDM: 55, LB: 58, RB: 58 },
  LWB: { LWB: 100, LB: 100, LM: 75 },
  RWB: { RWB: 100, RB: 100, RM: 75 },
  // CAM/CM/CDM are one family: swapping within it costs ~1 point.
  // CDM↔CAM specifically (opposite ends of the family) costs ~4.
  CDM: { CDM: 100, CM: 85, CAM: 58, CB: 55 },
  CM: { CM: 100, CDM: 85, CAM: 85 },
  // CAM out wide to a wing (and back) costs ~3.
  CAM: { CAM: 100, CM: 85, CDM: 58, ST: 55, LW: 66, RW: 66 },
  // Wide midfield and wing are mutually natural: no penalty either way.
  // Full-backs pushing to wide midfield (and back) cost ~2.
  LM: { LM: 100, LW: 100, LB: 75, LWB: 80 },
  RM: { RM: 100, RW: 100, RB: 75, RWB: 80 },
  // Winger on the wrong flank (LW↔RW) costs ~2; dropping to CAM costs ~3.
  LW: { LW: 100, LM: 100, RW: 74, CAM: 66, ST: 55 },
  RW: { RW: 100, RM: 100, LW: 74, CAM: 66, ST: 55 },
  ST: { ST: 100, CF: 90, CAM: 55, LW: 55, RW: 55 },
  CF: { CF: 100, ST: 90, CAM: 65 },
  ANY: {},
};

export function slotFitScore(p: Player, kind: SlotKind): number {
  if (kind === "ANY") return 50;
  return POS_FIT[kind]?.[p.position] ?? 20;
}

// Greedy remap: for each slot in new formation, choose best-fit XI player not yet placed.
export function remapXi(xi: Player[], slots: Slot[]): Record<string, Player | undefined> {
  const assigned: Record<string, Player | undefined> = {};
  const remaining = new Set(xi);
  // Sort slots by specificity: GK first, then most restrictive.
  const order = [...slots].sort((a, b) => (a.kind === "GK" ? -1 : b.kind === "GK" ? 1 : 0));
  for (const slot of order) {
    let best: Player | null = null;
    let bestScore = -1;
    for (const p of remaining) {
      const s = slotFitScore(p, slot.kind);
      if (s > bestScore) { bestScore = s; best = p; }
    }
    if (best) { assigned[slot.id] = best; remaining.delete(best); }
  }
  return assigned;
}

export function familiarity(assignments: Record<string, Player | undefined>, slots: Slot[]): number {
  const xi = slots.map((s) => ({ s, p: assignments[s.id] })).filter((x) => x.p) as { s: Slot; p: Player }[];
  if (!xi.length) return 0;
  const avg = xi.reduce((sum, { s, p }) => sum + slotFitScore(p, s.kind), 0) / xi.length;
  return Math.round(avg); // 0..100
}

// A player's rating when deployed in a given slot. The penalty curve is
// gentle near a natural fit (a CDM/CAM playing CM loses ~1-2) and only bites
// hard when the position is genuinely foreign (e.g. a striker at CB).
const MAX_POSITION_PENALTY = 15;
export function effectiveOverall(p: Player, kind: SlotKind): number {
  const fit = slotFitScore(p, kind);
  const penalty = MAX_POSITION_PENALTY * Math.pow((100 - fit) / 100, 1.5);
  return Math.max(0, Math.round(p.overall - penalty));
}

/* How badly a player is played out of position, as an arrow count:
   0 = natural, 1 = a near-enough role, 2 = a real cost, 3 = plain wrong. */
export function oopSeverity(p: Player, kind: SlotKind): 0 | 1 | 2 | 3 {
  const drop = p.overall - effectiveOverall(p, kind);
  if (drop <= 0) return 0;
  if (drop <= 2) return 1;
  if (drop <= 4) return 2;
  return 3;
}

// Squad strength = average effective rating of the deployed XI.
export function squadStrength(assignments: Record<string, Player | undefined>, slots: Slot[]): { rating: number; fit: number } {
  const xi = slots.map((s) => ({ s, p: assignments[s.id] })).filter((x) => x.p) as { s: Slot; p: Player }[];
  if (!xi.length) return { rating: 0, fit: 0 };
  const rating = xi.reduce((sum, { s, p }) => sum + effectiveOverall(p, s.kind), 0) / xi.length;
  return { rating: Math.round(rating), fit: familiarity(assignments, slots) };
}
