/* Broadcast short names.

   The database stores the formal name ("Tottenham Hotspur FC"), which is what
   belongs on a team sheet. A scoreboard column is one line wide, so on a phone
   that formal name truncates to "TOTTENHAM …" — these are the names a
   commentator says instead.

   Keyed by name rather than club id on purpose: the user's own side is built
   with `id: "user"` but carries their chosen club's name, so an id lookup
   would miss it. */

const norm = (name: string) =>
  name.toLowerCase().replace(/[^a-z]/g, "").replace(/^afc/, "").replace(/fc$/, "");

const SHORT: Record<string, string> = {
  bournemouth: "Bournemouth",
  arsenal: "Arsenal",
  astonvilla: "Aston Villa",
  brentford: "Brentford",
  brightonhovealbion: "Brighton",
  chelsea: "Chelsea",
  coventrycity: "Coventry",
  crystalpalace: "Palace",
  everton: "Everton",
  fulham: "Fulham",
  hullcity: "Hull City",
  ipswichtown: "Ipswich",
  leedsunited: "Leeds",
  liverpool: "Liverpool",
  manchestercity: "Man City",
  manchesterunited: "Man United",
  newcastleunited: "Newcastle",
  nottinghamforest: "Forest",
  sunderland: "Sunderland",
  tottenhamhotspur: "Spurs",
};

/* Falls back to the name with any FC/AFC trimmed, so an unlisted club (or
   "Your XI") still comes back shorter rather than blank. */
export function shortClubName(name: string): string {
  return SHORT[norm(name)] ?? name.replace(/\s+(FC|AFC)$/i, "").replace(/^AFC\s+/i, "");
}
