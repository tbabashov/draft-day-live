// @ts-expect-error - JS file without types
import { INITIAL_PLAYERS, REAL_CLUBS } from "@/data/players";
import type { Player } from "@/lib/draft-utils";
import type { TacticsSettings } from "@/lib/tactics-utils";

export type Club = {
  id: string;
  name: string;
  abbreviation: string;
  primaryColour: string;
  secondaryColour: string;
  stadium: string;
  reputation: number;
};

export const CLUBS: Club[] = (REAL_CLUBS as Club[]).slice();

export function clubRating(clubId: string): number {
  const players = (INITIAL_PLAYERS as Player[]).filter((p: any) => p.clubId === clubId);
  if (players.length >= 11) {
    const top = players.map((p) => p.overall).sort((a, b) => b - a).slice(0, 11);
    return Math.round(top.reduce((s, v) => s + v, 0) / 11);
  }
  const club = CLUBS.find((c) => c.id === clubId);
  const rep = club?.reputation ?? 75;
  // Fallback: map reputation (70..90) to rating (70..86)
  return Math.round(70 + (rep - 70) * 0.8);
}

export type TeamEntry = {
  id: string;             // clubId or "user"
  name: string;
  abbr: string;
  primary: string;
  secondary: string;
  reputation: number;
  rating: number;
  isUser: boolean;
};

export function buildUserEntry(xi: Player[], userClub?: Club | null, ratingOverride?: number): TeamEntry {
  const rating = ratingOverride ?? (xi.length
    ? Math.round(xi.reduce((s, p) => s + p.overall, 0) / xi.length)
    : 75);
  return {
    id: "user",
    name: userClub?.name ?? "Your XI",
    abbr: userClub?.abbreviation ?? "YOU",
    primary: userClub?.primaryColour ?? "#E30613",
    secondary: userClub?.secondaryColour ?? "#000000",
    reputation: Math.max(85, rating + 3),
    rating,
    isUser: true,
  };
}

// Random selection of PL clubs to fill the draw.
export function buildAiEntries(count: number, exclude?: string): TeamEntry[] {
  const pool = CLUBS.filter((c) => c.id !== exclude).slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((c) => ({
    id: c.id,
    name: c.name,
    abbr: c.abbreviation,
    primary: c.primaryColour,
    secondary: c.secondaryColour,
    reputation: c.reputation,
    rating: clubRating(c.id),
    isUser: false,
  }));
}

export type BracketMatch = {
  id: string;
  round: number;         // 0=R16, 1=QF, 2=SF, 3=Final
  index: number;         // position within round
  home?: TeamEntry;
  away?: TeamEntry;
  homeScore?: number;
  awayScore?: number;
  winner?: TeamEntry;
  played: boolean;
  events?: MatchEvent[];
  pens?: { home: number; away: number };
};

export type MatchEvent = {
  minute: number;
  type: "goal" | "chance" | "yellow" | "red" | "save";
  side: "home" | "away";
  playerName?: string;
  assistName?: string;
  /* Own goal: counts on the scoreline for `side`, but never on the scorer's
     tally — it's credited to a player of the *other* team. */
  ownGoal?: boolean;
};

export type Bracket = {
  rounds: BracketMatch[][]; // rounds[0]=R16 (8 matches), [1]=QF (4), [2]=SF (2), [3]=F (1)
  seeds: TeamEntry[];       // sorted 1..16
};

// UCL-style random draw: no seeding, straight out of the pot.
export function seedBracket(teams: TeamEntry[]): Bracket {
  const drawn = teams.slice();
  for (let i = drawn.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [drawn[i], drawn[j]] = [drawn[j], drawn[i]];
  }
  const r16: BracketMatch[] = [];
  for (let i = 0; i < 16; i += 2) {
    r16.push({
      id: `r0-m${i / 2}`,
      round: 0,
      index: i / 2,
      home: drawn[i],
      away: drawn[i + 1],
      played: false,
    });
  }
  const empty = (round: number, count: number): BracketMatch[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `r${round}-m${i}`,
      round,
      index: i,
      played: false,
    }));
  return {
    rounds: [r16, empty(1, 4), empty(2, 2), empty(3, 1)],
    seeds: drawn,
  };
}

// Tactics contribution to attack/defense strength for the user team.
export function tacticsModifiers(t?: TacticsSettings): { atk: number; def: number } {
  if (!t) return { atk: 0, def: 0 };
  // Centered at 50 → 0. Range ±3 rating points.
  const men = (t.mentality - 50) / 50; // -1..1
  const line = (t.defLine - 50) / 50;
  const press = (t.pressing - 50) / 50;
  const tempo = (t.tempo - 50) / 50;
  const atk = men * 2.5 + tempo * 1.2 + press * 0.8;
  const def = -men * 1.2 + (1 - Math.abs(line)) * 0.6 + press * 0.6;
  return { atk, def };
}

/* Scorers must actually play for the club. Attackers are likelier names. */
const SCORER_WEIGHT: Record<string, number> = { ST: 5, CF: 5, LW: 3.5, RW: 3.5, CAM: 3, LM: 2, RM: 2, CM: 1.5, CDM: 0.7, LB: 0.4, RB: 0.4, LWB: 0.5, RWB: 0.5, CB: 0.3 };
function pickName(entry: TeamEntry, isUser: boolean, xi?: Player[]): string {
  const pool = isUser && xi && xi.length
    ? xi.filter((p) => p.position !== "GK")
    : (INITIAL_PLAYERS as Player[]).filter((p) => p.clubId === entry.id && p.position !== "GK");
  if (!pool.length) return "The striker";
  const total = pool.reduce((s, p) => s + (SCORER_WEIGHT[p.position] ?? 1), 0);
  let roll = Math.random() * total;
  for (const p of pool) {
    roll -= SCORER_WEIGHT[p.position] ?? 1;
    if (roll <= 0) return p.name.last || p.name.display;
  }
  const p = pool[pool.length - 1];
  return p.name.last || p.name.display;
}

function poisson(lambda: number): number {
  // Knuth's algorithm
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export function simulateMatch(
  home: TeamEntry,
  away: TeamEntry,
  opts?: { userXi?: Player[]; userTactics?: TacticsSettings; allowDraw?: boolean }
): { homeScore: number; awayScore: number; events: MatchEvent[]; winner: TeamEntry | null } {
  const mods = tacticsModifiers(opts?.userTactics);
  const homeAtk = home.rating + (home.isUser ? mods.atk : 0) + home.reputation * 0.05 + 2; // home advantage
  const homeDef = home.rating + (home.isUser ? mods.def : 0) + 2;
  const awayAtk = away.rating + (away.isUser ? mods.atk : 0) + away.reputation * 0.05;
  const awayDef = away.rating + (away.isUser ? mods.def : 0);

  // xG = 1.3 baseline + swing based on atk-vs-opp-def
  const homeXg = Math.max(0.2, 1.3 + (homeAtk - awayDef) * 0.08);
  const awayXg = Math.max(0.2, 1.2 + (awayAtk - homeDef) * 0.08);

  let homeScore = poisson(homeXg);
  let awayScore = poisson(awayXg);
  // Upset dampener: rarely allow crazy blowouts
  homeScore = Math.min(homeScore, 6);
  awayScore = Math.min(awayScore, 6);

  const events: MatchEvent[] = [];
  const addGoals = (n: number, side: "home" | "away") => {
    for (let i = 0; i < n; i++) {
      const minute = Math.floor(Math.random() * 90) + 1;
      const team = side === "home" ? home : away;
      const playerName = pickName(team, team.isUser, opts?.userXi);
      // Most goals have a creator (never the scorer himself).
      let assistName: string | undefined;
      if (Math.random() < 0.75) {
        for (let tries = 0; tries < 4; tries++) {
          const a = pickName(team, team.isUser, opts?.userXi);
          if (a !== playerName) { assistName = a; break; }
        }
      }
      events.push({ minute, type: "goal", side, playerName, assistName });
    }
  };
  addGoals(homeScore, "home");
  addGoals(awayScore, "away");
  // Add flavor: yellow/red/chances
  const flavor = 4 + Math.floor(Math.random() * 6);
  for (let i = 0; i < flavor; i++) {
    const side: "home" | "away" = Math.random() < 0.5 ? "home" : "away";
    const roll = Math.random();
    const type: MatchEvent["type"] =
      roll < 0.55 ? "chance" : roll < 0.85 ? "save" : roll < 0.97 ? "yellow" : "red";
    events.push({
      minute: Math.floor(Math.random() * 90) + 1,
      type,
      side,
    });
  }
  events.sort((a, b) => a.minute - b.minute);

  // League mode: a tie stands as a draw.
  if (opts?.allowDraw && homeScore === awayScore) {
    return { homeScore, awayScore, events, winner: null };
  }

  // Extra-time / pens tiebreaker for knockout
  let winner: TeamEntry;
  if (homeScore === awayScore) {
    // Slight edge to higher rating with randomness
    const bias = (home.rating + (home.isUser ? mods.atk : 0)) - (away.rating + (away.isUser ? mods.atk : 0));
    const p = 0.5 + bias * 0.02;
    winner = Math.random() < Math.max(0.15, Math.min(0.85, p)) ? home : away;
    // Reflect as +1 in ET
    if (winner.id === home.id) homeScore += 1;
    else awayScore += 1;
    events.push({
      minute: 105 + Math.floor(Math.random() * 15),
      type: "goal",
      side: winner.id === home.id ? "home" : "away",
      playerName: pickName(winner, winner.isUser, opts?.userXi),
    });
  } else {
    winner = homeScore > awayScore ? home : away;
  }
  return { homeScore, awayScore, events, winner };
}

export const ROUND_NAMES = ["Round of 16", "Quarter-Finals", "Semi-Finals", "Final"];

/* Rank a team's paper strength within a competition (1 = strongest). */
export function strengthRank(teams: TeamEntry[], id: string): number {
  const sorted = [...teams].sort(
    (a, b) => b.rating + b.reputation * 0.05 - (a.rating + a.reputation * 0.05) || a.name.localeCompare(b.name)
  );
  return sorted.findIndex((t) => t.id === id) + 1;
}

export type Verdict = { label: "OVERPERFORMED" | "MET EXPECTATIONS" | "UNDERPERFORMED"; detail: string };

/* Competition-wide scorer/assister aggregation. Each match provides the two
   team ids and its goal events (side + playerName + assistName). */
export type ScoreEntry = { name: string; teamId: string; goals: number; assists: number };
export function aggregateScorers(
  matches: { home: string; away: string; events?: MatchEvent[] }[]
): { scorers: ScoreEntry[]; assisters: ScoreEntry[] } {
  const map = new Map<string, ScoreEntry>();
  const get = (name: string, teamId: string) => {
    const key = `${teamId}::${name}`;
    let e = map.get(key);
    if (!e) { e = { name, teamId, goals: 0, assists: 0 }; map.set(key, e); }
    return e;
  };
  for (const m of matches) {
    for (const ev of m.events ?? []) {
      if (ev.type !== "goal" || !ev.playerName) continue;
      if (ev.ownGoal) continue; // nobody wins a Golden Boot off their own net
      const teamId = ev.side === "home" ? m.home : m.away;
      get(ev.playerName, teamId).goals++;
      if (ev.assistName) get(ev.assistName, teamId).assists++;
    }
  }
  const all = [...map.values()];
  return {
    scorers: all.filter((e) => e.goals > 0).sort((a, b) => b.goals - a.goals || b.assists - a.assists),
    assisters: all.filter((e) => e.assists > 0).sort((a, b) => b.assists - a.assists || b.goals - a.goals),
  };
}
