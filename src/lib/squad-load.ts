import { ALL_PLAYERS, type Player, type SlotKind, type Slot } from "@/lib/draft-utils";
import type { TacticsSettings, FormationId } from "@/lib/tactics-utils";
import { DEFAULT_TACTICS, FORMATIONS, remapXi, effectiveOverall } from "@/lib/tactics-utils";
import type { TeamEntry } from "@/lib/tournament-utils";
import type { SideInit } from "@/lib/match-engine";
import { loadSquadStatus, formBonus, isUnavailable } from "@/lib/squad-status";
// @ts-expect-error - JS file without types
import { INITIAL_PLAYERS } from "@/data/players";

export const DRAFT_KEY = "gaffer.draft.v1";
export const TACTICS_KEY = "gaffer.tactics.v1";

export type LoadedSquad = {
  xi: Player[];
  bench: Player[];
  formation: FormationId;
  assignments: Record<string, Player | undefined>;
};

export function loadSquad(): LoadedSquad {
  const empty: LoadedSquad = { xi: [], bench: [], formation: "4-3-3", assignments: {} };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as { formation?: FormationId; assignments?: Record<string, Player | undefined> };
    const formation = parsed.formation && FORMATIONS[parsed.formation] ? parsed.formation : "4-3-3";
    const a = parsed.assignments ?? {};
    const xi = FORMATIONS[formation].map((s) => a[s.id]).filter(Boolean) as Player[];
    const bench = Array.from({ length: 7 }, (_, i) => a[`bench-${i}`]).filter(Boolean) as Player[];
    return { xi, bench, formation, assignments: a };
  } catch { return empty; }
}

export function loadTactics(): TacticsSettings {
  if (typeof window === "undefined") return DEFAULT_TACTICS;
  try {
    const raw = window.localStorage.getItem(TACTICS_KEY);
    if (!raw) return DEFAULT_TACTICS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_TACTICS, ...(parsed.tactics ?? parsed) };
  } catch { return DEFAULT_TACTICS; }
}

/* Build the two live-match sides. XI arrays stay aligned with slots.
   The user's arrangement is taken exactly as drafted — no remapping. */
export function buildUserSide(entry: TeamEntry, squad: LoadedSquad, bench: Player[], tactics: TacticsSettings): SideInit {
  const slots = FORMATIONS[squad.formation];
  const status = loadSquadStatus();
  const withForm = (p: Player): Player => {
    const bonus = formBonus(status, p.id);
    return bonus ? { ...p, overall: Math.max(1, Math.min(99, p.overall + bonus)) } : p;
  };
  const out = (p: Player | undefined) => !!p && isUnavailable(status, p.id);
  // Unavailable players (banned/injured) drop out of both XI and bench.
  const used = new Set(squad.xi.map((p) => p.id));
  const benchAvail = bench.filter((p) => !out(p));
  const taken = new Set<string>();

  // Position-aware replacement for an empty/unavailable slot: keepers can only
  // be replaced by keepers, outfielders by outfielders. Prefer your own bench
  // (your best fit); if you have no valid cover, an emergency stand-in is drawn
  // from the pool — the weakest available, so losing a starter genuinely hurts.
  const fillSlot = (kind: SlotKind): Player => {
    const isGk = kind === "GK";
    const eligible = (p: Player) => (isGk ? p.position === "GK" : p.position !== "GK");
    const benchOpts = benchAvail
      .filter((p) => !used.has(p.id) && !taken.has(p.id) && eligible(p))
      .sort((a, b) => effectiveOverall(b, kind) - effectiveOverall(a, kind));
    const pick = benchOpts[0] ?? ALL_PLAYERS
      .filter((p) => !used.has(p.id) && !taken.has(p.id) && eligible(p) && !benchAvail.some((b) => b.id === p.id))
      .sort((a, b) => a.overall - b.overall)[0]; // emergency: weakest first
    taken.add(pick.id);
    return pick;
  };

  const aligned = slots.map((s) => {
    const drafted = squad.assignments[s.id];
    return (!drafted || out(drafted)) ? fillSlot(s.kind) : drafted;
  }).map(withForm) as Player[];
  const alignedIds = new Set(aligned.map((p) => p.id));
  const finalBench = benchAvail.filter((p) => !alignedIds.has(p.id)).map(withForm);
  return { entry, xi: aligned, slots, bench: finalBench, tactics };
}

export type LiveSides = { home: SideInit; away: SideInit; userSide: "home" | "away" };

/* Hand-picked first-choice XIs for select clubs, so they line up the way they
   actually would rather than by raw overall. Names are slot-ordered for the
   given formation. */
const AI_LINEUPS: Record<string, { formation: FormationId; names: string[] }> = {
  chelsea: {
    formation: "4-3-3", // gk, lb, lcb, rcb, rb, lcm, cm, rcm, lw, st, rw
    names: [
      "Robert Sánchez", "Jorrel Hato", "Levi Colwill", "Trevoh Chalobah", "Reece James",
      "Enzo Fernández", "Moisés Caicedo", "Cole Palmer", "Jamie Gittens", "João Pedro", "Pedro Neto",
    ],
  },
  mancity: {
    formation: "4-3-3 Attack", // gk, lb, lcb, rcb, rb, lcm, rcm, cam, lw, st, rw
    names: [
      "Gianluigi Donnarumma", "Nico O'Reilly", "Joško Gvardiol", "Marc Guehi", "Mateus Nunes",
      "Rodri", "Tijjani Reijnders", "Rayan Cherki", "Jérémy Doku", "Erling Haaland", "Antoine Semenyo",
    ],
  },
  manutd: {
    formation: "4-3-3 Attack", // gk, lb, lcb, rcb, rb, lcm, rcm, cam, lw, st, rw
    names: [
      "Senne Lammens", "Patrick Dorgu", "Matthijs de Ligt", "Harry Maguire", "Diogo Dalot",
      "Kobbie Mainoo", "Casemiro", "Bruno Fernandes", "Amad Diallo", "Matheus Cunha", "Bryan Mbeumo",
    ],
  },
  liverpool: {
    formation: "4-3-3 Attack", // gk, lb, lcb, rcb, rb, lcm, rcm, cam, lw, st, rw
    names: [
      "Alisson Becker", "Milos Kerkez", "Virgil van Dijk", "Ibrahima Konaté", "Jeremie Frimpong",
      "Alexis Mac Allister", "Ryan Gravenberch", "Dominic Szoboszlai", "Cody Gakpo", "Hugo Ekitike", "Mohamed Salah",
    ],
  },
  arsenal: {
    formation: "4-3-3 Attack", // gk, lb, lcb, rcb, rb, lcm, rcm, cam, lw, st, rw
    names: [
      "David Raya", "Piero Hincapié", "Gabriel", "William Saliba", "Ben White",
      "Declan Rice", "Martín Zubimendi", "Eberechi Eze", "Gabriel Martinelli", "Viktor Gyökeres", "Bukayo Saka",
    ],
  },
  astonvilla: {
    formation: "4-3-3 Attack", // gk, lb, lcb, rcb, rb, lcm, rcm, cam, lw, st, rw
    names: [
      "Emiliano Martínez", "Lucas Digne", "Ezri Konsa", "Pau Torres", "Matty Cash",
      "Youri Tielemans", "John McGinn", "Morgan Rogers", "Leon Bailey", "Ollie Watkins", "Emiliano Buendía",
    ],
  },
};

/* Formations the AI is allowed to line up in when it has no fixed XI. The one
   that yields the strongest side (by effective overall) is chosen. */
const AI_FORMATIONS: FormationId[] = [
  "4-3-3", "4-3-3 Attack", "4-3-3 Holding", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2", "4-1-4-1",
];

/* Deterministic 35–64 value seeded off a string, so an AI team's tactical
   sliders (and therefore its whole build) stay identical across refreshes. */
function seededJitter(seed: string, salt: number): number {
  let h = 2166136261;
  const s = `${seed}#${salt}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 35 + (Math.abs(h) % 30);
}

/* Best XI for a formation: assign each slot to a distinct squad player so the
   total effective overall (out-of-position penalties included) is maximised.
   Hungarian algorithm — rows = slots, columns = players, minimising cost. */
function bestXIFor(squad: Player[], slots: Slot[]): { aligned: Player[]; total: number } {
  const n = slots.length;            // 11 slots (rows)
  const m = squad.length;            // players (columns), m >= n for any PL squad
  if (m < n) { // pathological fallback: greedy fit
    const a = remapXi(squad, slots);
    const used = new Set<string>();
    const aligned = slots.map((s) => { const p = a[s.id]!; used.add(p.id); return p; });
    return { aligned, total: aligned.reduce((t, p, i) => t + effectiveOverall(p, slots[i].kind), 0) };
  }
  const INF = 1e9;
  // cost[i][j] = higher is worse; minimise negative effective overall.
  const cost = (i: number, j: number) => 200 - effectiveOverall(squad[j], slots[i].kind);
  const u = new Array(n + 1).fill(0);
  const v = new Array(m + 1).fill(0);
  const p = new Array(m + 1).fill(0); // p[j] = row matched to column j (1-indexed)
  const way = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(INF);
    const used = new Array(m + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF, j1 = -1;
      for (let j = 1; j <= m; j++) if (!used[j]) {
        const cur = cost(i0 - 1, j - 1) - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  // rowCol[i] = column (player index) assigned to slot i
  const rowCol = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j] > 0) rowCol[p[j] - 1] = j - 1;
  const aligned = slots.map((_, i) => squad[rowCol[i]]);
  const total = aligned.reduce((t, pl, i) => t + effectiveOverall(pl, slots[i].kind), 0);
  return { aligned, total };
}

export function buildAiSide(entry: TeamEntry): SideInit {
  const squad = (INITIAL_PLAYERS as Player[])
    .filter((p) => (p as Player & { clubId?: string }).clubId === entry.id)
    .sort((a, b) => b.overall - a.overall);
  const tactics = (formation: FormationId): TacticsSettings => ({
    ...DEFAULT_TACTICS, formation,
    mentality: seededJitter(entry.id, 1), pressing: seededJitter(entry.id, 2), tempo: seededJitter(entry.id, 3),
  });

  // A fixed XI for this club takes priority (if every named player exists).
  const preset = AI_LINEUPS[entry.id];
  if (preset) {
    const byName = new Map(squad.map((p) => [p.name.display, p]));
    const xi = preset.names.map((n) => byName.get(n));
    if (xi.every(Boolean)) {
      const xiPlayers = xi as Player[];
      const inXi = new Set(xiPlayers.map((p) => p.id));
      const bench = squad.filter((p) => !inXi.has(p.id)).slice(0, 7);
      return { entry, xi: xiPlayers, slots: FORMATIONS[preset.formation], bench, tactics: tactics(preset.formation) };
    }
  }

  // No fixed XI: pick the formation that produces the strongest side, and build
  // the best possible line-up within it. Fully deterministic → stable on reload.
  let best: { formation: FormationId; aligned: Player[]; total: number } | null = null;
  for (const formation of AI_FORMATIONS) {
    const { aligned, total } = bestXIFor(squad, FORMATIONS[formation]);
    if (!best || total > best.total) best = { formation, aligned, total };
  }
  const { formation, aligned } = best!;
  const slots = FORMATIONS[formation];
  const alignedIds = new Set(aligned.map((p) => p.id));
  const bench = squad.filter((p) => !alignedIds.has(p.id)).slice(0, 7);
  return { entry, xi: aligned, slots, bench, tactics: tactics(formation) };
}
