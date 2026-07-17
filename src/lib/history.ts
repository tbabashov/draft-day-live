import type { Verdict } from "@/lib/tournament-utils";

/* Permanent record of finished runs. Deliberately NOT in the restart key set —
   the trophy cabinet survives new drafts. */
export const HISTORY_KEY = "gaffer.history.v1";

export type RunRecord = {
  date: number;
  mode: "cup" | "league";
  outcome: string;       // e.g. "Champions", "Quarter-Finals", "3rd of 21"
  champion: boolean;
  verdict?: Verdict;
  squadRating: number;
  formation: string;
  record: { w: number; d: number; l: number; gf: number; ga: number };
  topScorer?: { name: string; goals: number };
  biggestWin?: string;   // e.g. "5-0 vs Chelsea"
};

export function loadHistory(): RunRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as RunRecord[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(rec: RunRecord) {
  try {
    const all = loadHistory();
    all.push(rec);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  } catch {}
}

export type RecordBook = {
  cupWins: number;
  leagueTitles: number;
  totalRuns: number;
  biggestWin?: string;
  mostGoalsInRun: number;
  bestSquadRating: number;
  silverwareStreak: number; // trailing runs that ended in a trophy
};

export function computeRecords(history: RunRecord[]): RecordBook {
  let biggestWinMargin = -1;
  let biggestWin: string | undefined;
  let mostGoals = 0;
  let bestRating = 0;
  for (const r of history) {
    mostGoals = Math.max(mostGoals, r.record.gf);
    bestRating = Math.max(bestRating, r.squadRating);
    if (r.biggestWin) {
      const m = r.biggestWin.match(/^(\d+)-(\d+)/);
      if (m) {
        const margin = parseInt(m[1]) - parseInt(m[2]);
        if (margin > biggestWinMargin) { biggestWinMargin = margin; biggestWin = r.biggestWin; }
      }
    }
  }
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].champion) streak++;
    else break;
  }
  return {
    cupWins: history.filter((r) => r.mode === "cup" && r.champion).length,
    leagueTitles: history.filter((r) => r.mode === "league" && r.champion).length,
    totalRuns: history.length,
    biggestWin,
    mostGoalsInRun: mostGoals,
    bestSquadRating: bestRating,
    silverwareStreak: streak,
  };
}
