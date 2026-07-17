/* Run-scoped squad condition: injuries, suspensions, card accumulation and
   form. Lives alongside the draft for the duration of a run and is wiped by
   every restart path. */

export const SQUAD_STATUS_KEY = "gaffer.squadstatus.v1";

export type SquadStatus = {
  injuries: Record<string, { name: string; matches: number }>;
  bans: Record<string, { name: string; matches: number }>;
  yellows: Record<string, number>;
  form: Record<string, number[]>; // last match ratings, most recent last (max 2)
};

const EMPTY: SquadStatus = { injuries: {}, bans: {}, yellows: {}, form: {} };

export function loadSquadStatus(): SquadStatus {
  if (typeof window === "undefined") return structuredClone(EMPTY);
  try {
    const raw = window.localStorage.getItem(SQUAD_STATUS_KEY);
    if (!raw) return structuredClone(EMPTY);
    return { ...structuredClone(EMPTY), ...JSON.parse(raw) };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function saveSquadStatus(s: SquadStatus) {
  try {
    window.localStorage.setItem(SQUAD_STATUS_KEY, JSON.stringify(s));
  } catch {}
}

/* Record post-match ratings for the user's players (keeps the last two). */
export function recordForm(ratings: { id: string; rating: number }[]) {
  const s = loadSquadStatus();
  for (const r of ratings) {
    const list = s.form[r.id] ?? [];
    list.push(r.rating);
    s.form[r.id] = list.slice(-2);
  }
  saveSquadStatus(s);
}

/* Hot streak: back-to-back ≥7.8 → +1 overall. Cold: back-to-back ≤6.2 → −1. */
export function formBonus(s: SquadStatus, playerId: string): number {
  const f = s.form[playerId];
  if (!f || f.length < 2) return 0;
  if (f[0] >= 7.8 && f[1] >= 7.8) return 1;
  if (f[0] <= 6.2 && f[1] <= 6.2) return -1;
  return 0;
}

/* True if a player can't play the next match. */
export function isUnavailable(s: SquadStatus, playerId: string): boolean {
  return (s.injuries[playerId]?.matches ?? 0) > 0 || (s.bans[playerId]?.matches ?? 0) > 0;
}

export type MatchDiscipline = { playerId: string; name: string; kind: "yellow" | "red" | "injury"; severity?: number }[];

/* Apply a finished user match to the run's squad status:
   1. serve one match on everything already carried in,
   2. then stack any new bans/injuries from this match. */
export function applyMatchDiscipline(discipline: MatchDiscipline): SquadStatus {
  const s = decrementAfterMatch(loadSquadStatus());
  for (const d of discipline) {
    if (d.kind === "red") {
      // Straight red (severity 2) → 2-match ban; second yellow (1) → 1 match.
      s.bans[d.playerId] = { name: d.name, matches: d.severity ?? 1 };
      s.yellows[d.playerId] = 0;
    } else if (d.kind === "yellow") {
      const n = (s.yellows[d.playerId] ?? 0) + 1;
      if (n >= 2) { s.bans[d.playerId] = { name: d.name, matches: 1 }; s.yellows[d.playerId] = 0; }
      else s.yellows[d.playerId] = n;
    } else if (d.kind === "injury" && d.severity && d.severity > 0) {
      s.injuries[d.playerId] = { name: d.name, matches: 1 + Math.floor(Math.random() * 3) };
    }
  }
  saveSquadStatus(s);
  return s;
}

/* Serve one match of every active injury/ban. */
export function decrementAfterMatch(s: SquadStatus): SquadStatus {
  for (const key of ["injuries", "bans"] as const) {
    for (const [id, e] of Object.entries(s[key])) {
      e.matches -= 1;
      if (e.matches <= 0) delete s[key][id];
    }
  }
  return s;
}
