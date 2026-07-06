// @ts-expect-error - JS file without types
import { INITIAL_PLAYERS } from "@/data/players";

export type Attrs = { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number };

export type Player = {
  id: string;
  name: { first: string; last: string; display: string };
  nationality: string;
  age: number;
  position: string;
  overall: number;
  potential: number;
  attributes: Attrs;
};

export const ALL_PLAYERS: Player[] = INITIAL_PLAYERS as Player[];

export type Tier = "icon" | "gold" | "silver" | "bronze";
export function tierOf(ovr: number): Tier {
  if (ovr >= 88) return "icon";
  if (ovr >= 80) return "gold";
  if (ovr >= 72) return "silver";
  return "bronze";
}

export const TIER_STYLES: Record<Tier, { grad: string; ring: string; text: string; label: string }> = {
  icon: {
    grad: "from-[oklch(0.55_0.25_320)] via-[oklch(0.45_0.22_310)] to-[oklch(0.25_0.15_300)]",
    ring: "shadow-[0_0_40px_-5px_oklch(0.6_0.25_320/0.6)] ring-1 ring-[oklch(0.75_0.2_320)]",
    text: "text-white",
    label: "ICON",
  },
  gold: {
    grad: "from-[oklch(0.85_0.17_85)] via-[oklch(0.72_0.16_80)] to-[oklch(0.5_0.14_70)]",
    ring: "shadow-[0_10px_30px_-10px_oklch(0.72_0.16_80/0.6)]",
    text: "text-[oklch(0.15_0.05_60)]",
    label: "GOLD",
  },
  silver: {
    grad: "from-[oklch(0.86_0.012_260)] via-[oklch(0.72_0.01_260)] to-[oklch(0.5_0.008_260)]",
    ring: "shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]",
    text: "text-[oklch(0.15_0.02_260)]",
    label: "SILVER",
  },
  bronze: {
    grad: "from-[oklch(0.65_0.14_55)] via-[oklch(0.5_0.12_45)] to-[oklch(0.32_0.09_35)]",
    ring: "shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]",
    text: "text-[oklch(0.15_0.05_40)]",
    label: "BRONZE",
  },
};

// Formation slot definition
export type SlotKind =
  | "GK" | "LB" | "CB" | "RB" | "LWB" | "RWB"
  | "CDM" | "CM" | "CAM" | "LM" | "RM"
  | "LW" | "RW" | "ST" | "CF" | "ANY";

// Which player positions are eligible for a given formation slot.
const ELIGIBLE: Record<SlotKind, string[]> = {
  GK: ["GK"],
  LB: ["LB", "LWB", "LM"],
  RB: ["RB", "RWB", "RM"],
  CB: ["CB"],
  LWB: ["LWB", "LB"],
  RWB: ["RWB", "RB"],
  CDM: ["CDM", "CM"],
  CM: ["CM", "CDM", "CAM"],
  CAM: ["CAM", "CM", "AM"],
  LM: ["LM", "LW", "LB"],
  RM: ["RM", "RW", "RB"],
  LW: ["LW", "LM"],
  RW: ["RW", "RM"],
  ST: ["ST", "CF"],
  CF: ["CF", "ST", "CAM"],
  ANY: [], // any position
};

export function eligibleFor(slot: SlotKind, pool: Player[]): Player[] {
  if (slot === "ANY") return pool;
  const allowed = ELIGIBLE[slot];
  return pool.filter((p) => allowed.includes(p.position));
}

// Formation: array of {id, kind, x%, y%}. Pitch coords: 0-100 (attack up).
export type Slot = { id: string; kind: SlotKind; x: number; y: number };

export const FORMATION_433: Slot[] = [
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
];

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawFive(slot: SlotKind, pool: Player[]): Player[] {
  const eligible = eligibleFor(slot, pool);
  return shuffle(eligible).slice(0, 5);
}

export function initials(p: Player): string {
  const parts = p.name.display.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

export function shortName(p: Player): string {
  const last = p.name.last || p.name.display;
  return last.toUpperCase();
}
