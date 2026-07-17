/* Which competition the current run is committed to, if any. Once you enter
   a cup or a league you're locked into it until a New Game wipes the keys. */
export function activeCompetition(): "cup" | "league" | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.localStorage.getItem("gaffer.bracket.v1")) return "cup";
    if (window.localStorage.getItem("gaffer.league.v1")) return "league";
  } catch {}
  return null;
}
