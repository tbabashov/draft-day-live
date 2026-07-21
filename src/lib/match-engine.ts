import type { Player, Slot, SlotKind } from "@/lib/draft-utils";
import type { TacticsSettings } from "@/lib/tactics-utils";
import { effectiveOverall } from "@/lib/tactics-utils";
import { tacticsModifiers, type TeamEntry } from "@/lib/tournament-utils";

/* ------------------------------------------------------------------ */
/* Commentary bank — several variants per scenario so lines don't repeat */
/* Placeholders: {player} {team} {opp} {score} {keeper}                 */
/* ------------------------------------------------------------------ */

const LINES: Record<string, string[]> = {
  kickoff: [
    "And it's live! {team} get us underway — a place in the next round on the line.",
    "The referee's whistle goes, and this one is UP AND RUNNING!",
    "Here we go then. Knockout football — no second chances, no tomorrow.",
  ],
  halftime: [
    "The referee brings the first half to a close. Time to catch our breath.",
    "That's half-time. Plenty for both managers to chew over.",
  ],
  secondHalf: [
    "We're back underway for the second half!",
    "The players are back out, and battle resumes!",
  ],
  stoppage: [
    "The board goes up — {n} added minutes. Still time for a twist in this tale!",
    "{n} minutes of stoppage time to play. Hearts in mouths all around the ground.",
  ],
  goal: [
    "{player}!!! OH THAT IS MAGNIFICENT! {team} have their goal and the place erupts! {score}!",
    "IT'S IN!!! {player} with the finish — and you simply have to admire it! {score}!",
    "{player}... SCORES! The net bulges and {team} are dreaming! {score}!",
    "OHHH YES! {player} arrives at exactly the right moment — {team} strike! {score}!",
    "GOAL! It's {player}! Cool as you like, and {team} have what they came for! {score}!",
    "AND THAT... IS WHY YOU WATCH FOOTBALL! {player} produces a moment of magic! {score}!",
    "{player} shoots... AND SCORES! What drama here! {score}!",
    "OH MY WORD! {player}! Where did he pull that from?! {score} and the ground is shaking!",
    "It's a goal made in heaven and finished by {player}! {team} lead the dance! {score}!",
  ],
  save: [
    "{player} lets fly... brilliant save by {keeper}! Fingertips!",
    "Oh, {player} has to score there! But {keeper} says no — what a stop!",
    "{player} tries his luck from range — {keeper} is equal to it. Good hands.",
    "It's {player} through the middle... denied! {keeper} spreads himself superbly!",
    "A snapshot from {player} — {keeper} beats it away! The danger lives on...",
    "{player} with the header... CLAWED OUT by {keeper}! Remarkable reflexes!",
  ],
  miss: [
    "{player} shoots... just wide! Inches away from bedlam!",
    "Oh {player}... he'll want that one back. Over the bar from a great position.",
    "The chance falls to {player}... but he drags it wide! You could hear the gasp!",
    "{player} winds up... high and not so handsome. Chance gone.",
    "How has that stayed out?! {player} slices it past the far post!",
    "{player} snatches at it! The ball balloons into the stands and the chance is gone.",
  ],
  goalComeback: [
    "THE COMEBACK IS COMPLETE! {player} turns this match on its head — {team} lead! {score}!",
    "From the dead, {team} RISE! {player} caps an astonishing turnaround! {score}!",
    "You simply cannot write this script! {player} — and {team} have come all the way back! {score}!",
  ],
  goalLastMinute: [
    "{player}!!! IN THE DYING SECONDS! A LAST-MINUTE WINNER FOR {team}! ABSOLUTE SCENES! {score}!",
    "AT THE DEATH! {player} breaks {opp} hearts with virtually the last kick of the game! {score}!",
    "THEY'VE DONE IT IN STOPPAGE TIME! {player}! {team} snatch it at the very end! {score}!",
  ],
  goalHugeLead: [
    "{player} makes it {score}. This has gone from a football match to a demolition.",
    "Another one! {score}! {team} are utterly ruthless tonight — you almost feel for {opp}.",
    "It's raining goals! {player} adds the gloss — {score}, and total humiliation looms for {opp}.",
  ],
  goalReduceDeficit: [
    "{player} pulls one back! {score} — is there a twist left in this one?",
    "A lifeline for {team}! {player} narrows it to {score}!",
    "{player} gives {team} a glimmer of hope. {score}, and suddenly {opp} look nervous.",
  ],
  goalConsolation: [
    "{player} gets one back... {score}. A consolation, surely, nothing more.",
    "Pride restored, if little else — {player} makes it {score}.",
    "The {team} fans finally have something to cheer. {player} scores, but it's {score}.",
  ],
  goalBrace: [
    "{player} again! That's his second of the game! {score}!",
    "A brace for {player}! He's having himself a night! {score}!",
    "Two for {player}! {opp} simply cannot handle him! {score}!",
  ],
  goalHattrick: [
    "HAT-TRICK!!! {player}! Take the match ball home, son! {score}!",
    "THAT'S THREE! A hat-trick for {player} — this is HIS stage tonight! {score}!",
    "{player} completes the treble! An evening he'll tell his grandkids about! {score}!",
  ],
  goalFour: [
    "HOOOOO-HO-HO-HO! FOUR! {player} simply will not stop scoring today! {score}!",
    "FOUR GOALS for {player}! We are witnessing something absolutely absurd! {score}!",
    "He's got FOUR! {player} is toying with {opp} now — someone check if this is legal! {score}!",
  ],
  goalSalah: [
    "THE EGYPTIAN KING DOES IT AGAIN! Salah! {score}!",
    "Salah!!! Bow down to the Egyptian King! {score}!",
    "Who else? Mohamed Salah — pure royalty in front of goal! {score}!",
  ],
  tacticParkBus: [
    "{team} have well and truly parked the bus. Two banks of four, and not a blade of grass behind them.",
    "It's not pretty out there. {team} are defending for their lives — the purists may want to look away.",
    "You'd need a can opener to break {team} down right now. This one's turning into a slog.",
  ],
  tacticGegenpress: [
    "{team} are pressing like their lives depend on it — {opp} can't get a moment's peace on the ball.",
    "The press from {team} is absolutely suffocating. Every single touch is contested.",
  ],
  tacticRouteOne: [
    "{team} going route one — straight over the midfield, no ceremony whatsoever.",
    "Direct, breathless stuff from {team}. Blink and you'll miss it.",
  ],
  aiPushForward: [
    "{team} are throwing caution to the wind now — men streaming forward with every attack!",
    "The {team} bench has seen enough. They've gone for broke — it's all-out attack!",
    "Desperation stakes for {team}: everyone forward, gaps everywhere. This could get chaotic.",
  ],
  aiShutShop: [
    "{team} are shutting up shop. Time-wasting, deep lines — they want this finished.",
    "You can see the message from the {team} dugout: what we have, we hold.",
    "{team} drop deep to protect what they've got. {opp} will have to pick the lock.",
  ],
  tacticTiki: [
    "Pass, pass, pass — {team} perfectly content to let the ball do the running.",
    "It's keep-ball from {team}. Death by a thousand passes, if {opp} let them.",
  ],
  corner: [
    "Corner to {team}. Bodies forward — this is a chance to load the box.",
    "Turned behind! {team} will swing one in from the flag...",
    "It's another corner for {team}. The pressure is building here.",
  ],
  keeperUp: [
    "And the goalkeeper is coming up for this one! {player} lumbers into the box — everyone forward!",
    "Last chance saloon — even the keeper {player} has gone up for {team}!",
  ],
  keeperGoal: [
    "OH MY WORD, CAN YOU BELIEVE IT?! THEY'VE DONE IT — {player} CLUTCHES IT FOR {team}!!! THE GOALKEEPER HAS SCORED! {score}!",
    "NO. NO WAY. {player}, THE GOALKEEPER, HAS RISEN HIGHEST AND BURIED IT FOR {team}!!! ABSOLUTE SCENES! {score}!",
    "I HAVE NEVER SEEN ANYTHING LIKE IT — {player} COMES UP AND HEADS IT HOME FOR {team}!!! THE KEEPER IS THE HERO! {score}!",
  ],
  offside: [
    "{player} is away... but the flag is UP. Offside, and the move dies.",
    "The net ripples in anticipation... no, wait — {player} strayed offside. It won't count for anything.",
    "Great ball through, but {player} timed it all wrong. Offside. {team} breathe again.",
    "{player} thought he was in! The assistant's flag says otherwise. Tight, very tight.",
  ],
  varCheck: [
    "Hold on... hold on. VAR is having a look at this one. The stadium holds its breath.",
    "Wait — the referee has his finger to his ear. Stockley Park wants a second look...",
    "The celebrations pause... this is being checked upstairs. Nobody move.",
  ],
  varOverturned: [
    "NO GOAL! The VAR has chalked it off! Can you believe it?! It stays {score}!",
    "IT'S BEEN RULED OUT! The technology giveth and the technology taketh away. {score}!",
    "The referee points... NO GOAL! {team} are furious, but it will not stand! {score}!",
  ],
  varStands: [
    "...and the goal STANDS! Checked, confirmed, and the party starts again!",
    "The verdict is in — GOAL GIVEN! The celebrations can resume in earnest!",
  ],
  woodwork: [
    "{player} hits the POST! The frame of the goal rescues {opp}!",
    "OFF THE BAR! {player} is denied by the woodwork — centimetres from glory!",
  ],
  turnover: [
    "Sloppy from {opp} — and {team} pounce on it.",
    "{team} win it back in midfield. The press is biting.",
    "Possession surrendered cheaply, and {team} look to counter!",
    "It breaks down for {opp}, and now {team} come forward with purpose.",
    "Robbed! {team} pick {opp}'s pocket in a dangerous area!",
  ],
  possession: [
    "{team} knocking it around nicely — patient stuff, probing for an opening.",
    "Tidy from {team}. They're growing into this contest.",
    "{team} stroking it about at the back, inviting the press.",
    "{player} demanding the ball at every turn — he's running this midfield.",
    "The tempo drops for a moment as {team} keep the ball.",
    "{player} switches the play beautifully. {team} are dictating terms now.",
    "Lovely feet from {player} in a tight spot. He's enjoying himself out there.",
  ],
  ambience: [
    "Listen to that noise. This place is absolutely bouncing tonight.",
    "The away end is in full voice — they've come here believing.",
    "You can feel the tension around the ground. Knockout football does this to people.",
    "A sea of scarves and songs. Nights like these are why we love this game.",
  ],
  foul: [
    "Crunching challenge in midfield — the referee waves play on... no, he pulls it back.",
    "Free kick. {team} were getting some joy down that side and {opp} put a stop to it.",
    "A cynical little tug, and the referee has a word.",
    "That's a nasty one. The physio is on, but he should be fine to continue.",
  ],
  yellow: [
    "And it's a YELLOW CARD for {player}. No complaints there.",
    "{player} goes into the book — he was a yard short and a second late.",
    "The referee reaches for his pocket... yellow for {player}. He'll need to be careful now.",
    "A booking for {player}. Mistimed, and the referee saw it clearly.",
    "{player} takes one for the team, and takes a yellow with it.",
    "Cynical from {player} — he knew exactly what he was doing. Into the book he goes.",
  ],
  secondYellow: [
    "{player} again... that's a SECOND YELLOW! He's OFF! Utter madness — {team} down to ten!",
    "You cannot do that on a booking! {player} sees yellow, then RED — an early bath!",
    "Second bookable offence for {player}, and the referee has no choice. Off he goes!",
  ],
  red: [
    "OH NO. {player} is OFF! A straight red, and {team} are down to ten men!",
    "The referee doesn't hesitate — RED CARD! {player} walks, and this match has turned on its head!",
    "It's RED! {player} has left his team in the lurch — what a moment in this tie!",
  ],
  sub: [
    "Change for {team}: {player} comes on — fresh legs, fresh ideas.",
    "Here's a substitution. {player} enters the fray for {team}.",
    "{team} roll the dice — on comes {player}.",
  ],
  subTired: [
    "{off} has run himself into the ground — {on} replaces him for {team}.",
    "{off} is out on his feet. {on} comes on to freshen {team} up.",
    "The legs have gone. {off} makes way, and {on} gets his chance for {team}.",
  ],
  subDouble: [
    "A double change for {team} — fresh legs all round.",
    "{team} make two at once. The bench gets busy.",
  ],
  subTriple: [
    "THREE at once for {team}! The manager rolls every dice he has!",
    "A triple substitution for {team} — a full-scale rescue operation.",
  ],
  injuryMinor: [
    "{player} is down clutching his ankle... he grimaces, but he'll shake it off and carry on.",
    "A knock for {player}. The physio has a look — he's limping, but he stays on.",
    "{player} takes a whack and needs a moment. Brave lad, he plays on.",
  ],
  injurySub: [
    "Oh no, {player} can't continue. That's a forced change for {team} — {on} comes on.",
    "{player} shakes his head — his night is over. {on} replaces the stricken man for {team}.",
    "The stretcher's out for {player}. An enforced substitution, and on comes {on}.",
  ],
  injuryNoSub: [
    "{player} can't go on — and {team} have no changes left! They're down to bare bones!",
    "Disaster for {team}: {player} hobbles off, and with no subs remaining they'll finish short-handed.",
  ],
  ftWin: [
    "THERE'S THE WHISTLE! {team} have done it — they march on! Final score {score}.",
    "It's all over! {team} into the next round, and thoroughly deserved! {score}!",
    "Full time! The fairytale continues for {team}! {score}.",
  ],
  ftLose: [
    "The final whistle blows... and it's heartbreak. {team} are out. {score}.",
    "It's over. {team} gave everything, but it ends here. {score}.",
    "Full time — and the dream dies tonight. {score}. Cruel, cruel game.",
  ],
  ftDraw: [
    "The whistle goes, and they share the spoils. {score} — a point apiece.",
    "All square at the end. {score}, and honours even.",
    "Full time, {score}. Neither side could land the knockout blow.",
  ],
  penIntro: [
    "Nothing can separate these sides. PENALTIES will decide it. Deep breaths, everyone.",
    "We're going to a shootout! Twelve yards, one keeper, and nerve of pure steel required.",
  ],
  penScored: [
    "{player} steps up... SCORES! Emphatic!",
    "{player}... buries it! The keeper went the wrong way!",
    "Cool as you like from {player}. Top corner!",
  ],
  penMissed: [
    "{player} steps up... SAVED! The keeper is the hero!",
    "{player}... OVER THE BAR! He can't believe it!",
    "It's saved!!! {player}'s effort was too close to the keeper!",
  ],
  penAwarded: [
    "PENALTY! The referee points straight to the spot — {team} have a golden chance! {player} will take it.",
    "He's given it! A spot kick for {team}! {player} takes the ball with the whole ground watching.",
    "The whistle SHRIEKS and the arm points to the spot — penalty to {team}! Up steps {player}.",
  ],
  penVarCheck: [
    "The referee's been sent to the monitor — VAR is checking for a penalty here...",
    "Hold on — a foul in the box? This is being reviewed upstairs. Nobody breathes...",
    "The ref pauses, finger to his ear — VAR is taking a long look at a possible penalty...",
  ],
  penVarGiven: [
    "PENALTY GIVEN! VAR confirms it — {team} have their spot kick!",
    "After the review... the referee marches to the spot! It's a penalty for {team}!",
    "The screen says yes — PENALTY! {team} get the decision.",
  ],
  penVarNone: [
    "No penalty! VAR says play on — {team} are furious but the referee waves it away.",
    "The review's done — NOTHING doing. No penalty given, and {team} can't believe it.",
    "Waved away! VAR overturns it — the referee says get up, no foul.",
  ],
  penScoredPlay: [
    "{player} steps up... and SLOTS IT HOME! {score}!",
    "From twelve yards, {player} makes no mistake — {score}!",
    "{player} sends the keeper the wrong way — GOAL! {score}!",
  ],
  penMissedPlay: [
    "{player} steps up... and it's SAVED! The keeper guesses right!",
    "OH, he's blazed it! {player} skies the penalty over the bar!",
    "{player}'s spot kick is KEPT OUT — what a save! It stays {score}!",
  ],
};

const lastLine: Record<string, number> = {};
function say(cat: string, vars: Record<string, string | number> = {}): string {
  const pool = LINES[cat] ?? ["..."];
  let i = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && i === lastLine[cat]) i = (i + 1) % pool.length;
  lastLine[cat] = i;
  let out = pool[i];
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

/* ------------------------------------------------------------------ */
/* Engine                                                               */
/* ------------------------------------------------------------------ */

export type LiveEvent = {
  id: number;
  minute: number;        // display minute (90+ shown as 90+n by UI)
  type: "info" | "goal" | "save" | "miss" | "yellow" | "red" | "sub" | "whistle" | "pen" | "offside" | "var" | "injury";
  side?: "home" | "away";
  text: string;
  penScored?: boolean;   // set on shootout kicks
  swaps?: { on: string; off: string }[]; // substitutions: who came on / went off
  varOutcome?: "check" | "given" | "overturned"; // VAR verdict, for the icon
  injurySerious?: boolean; // true when the knock forces them off, for the icon
};

export type SideInit = {
  entry: TeamEntry;
  xi: Player[];          // aligned with slots (11)
  slots: Slot[];
  bench: Player[];
  tactics: TacticsSettings;
};

type RuntimePlayer = {
  p: Player;
  slot: Slot;
  x: number; y: number;      // current render position (0-100 landscape)
  wanderSeed: number;
  off: boolean;              // sent off / subbed off
  booked: boolean;           // on a yellow — next one is a red
  stamina: number;           // 100 → fresh, 0 → out on his feet
  subbedOn: boolean;         // came off the bench
  subbedOnAt?: number;       // game minute they arrived (drives the pitch marker)
};

type EngineSide = {
  entry: TeamEntry;
  players: RuntimePlayer[];
  bench: Player[];
  tactics: TacticsSettings;
  subsMade: number;
  isHome: boolean;
};

export type Phase = "first" | "ht" | "second" | "pens" | "done";

const SHOT_WEIGHT: Partial<Record<SlotKind, number>> = {
  ST: 5, CF: 5, LW: 3.5, RW: 3.5, CAM: 3, LM: 2, RM: 2, CM: 1.5, CDM: 0.7, LB: 0.4, RB: 0.4, LWB: 0.6, RWB: 0.6, CB: 0.3, GK: 0,
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/* Players with their own goal commentary. Keyed by last name, lowercase. */
const SIGNATURE_GOALS: Record<string, string> = {
  salah: "goalSalah",
};

function lastName(p: Player): string {
  return p.name.last || p.name.display;
}

export class MatchEngine {
  home: EngineSide;
  away: EngineSide;
  minute = 0;
  phase: Phase = "first";
  stoppage = 0;
  stoppageAnnounced = false;
  homeScore = 0;
  awayScore = 0;
  events: LiveEvent[] = [];
  ball = { x: 50, y: 50 };
  ballTarget = { x: 50, y: 50 };
  possession: "home" | "away" = "home";
  carrier = 0; // index into possessing side's players
  stats = {
    possHome: 1, possAway: 1,
    shotsHome: 0, shotsAway: 0,
    onTargetHome: 0, onTargetAway: 0,
    xgHome: 0, xgAway: 0,
    savesHome: 0, savesAway: 0,
    cornersHome: 0, cornersAway: 0,
    foulsHome: 0, foulsAway: 0,
    yellowsHome: 0, yellowsAway: 0,
    redsHome: 0, redsAway: 0,
    offsidesHome: 0, offsidesAway: 0,
  };
  private bump(side: "home" | "away", key: "shots" | "onTarget" | "saves" | "corners" | "fouls" | "yellows" | "reds" | "offsides", n = 1) {
    const k = `${key}${side === "home" ? "Home" : "Away"}` as keyof MatchEngine["stats"];
    (this.stats[k] as number) += n;
  }
  private rate(rp: RuntimePlayer, side: "home" | "away", delta: number) {
    if (!(rp.p.id in this.ratings)) {
      this.ratings[rp.p.id] = 6.5 + rand(-0.3, 0.3);
      this.appeared[rp.p.id] = { side, name: lastName(rp.p), kind: rp.slot.kind };
    }
    this.ratings[rp.p.id] = clamp(this.ratings[rp.p.id] + delta, 4, 10);
  }

  /* Everyone who has featured, best first. */
  matchRatings(): { id: string; side: "home" | "away"; name: string; rating: number }[] {
    // Make sure every current player is registered even without an event.
    for (const which of ["home", "away"] as const) {
      for (const rp of this.side(which).players) if (!rp.off || rp.p.id in this.ratings) this.rate(rp, which, 0);
    }
    return Object.entries(this.ratings)
      .map(([id, rating]) => ({ id, rating, side: this.appeared[id].side, name: this.appeared[id].name }))
      .sort((a, b) => b.rating - a.rating);
  }

  /* One side's full match-day squad for the report: everyone who featured
     (rated, best first) followed by anyone who never played (N/A). Driven off
     the up-front roster snapshot so it stays complete regardless of subs. */
  sideRatings(which: "home" | "away"): { id: string; name: string; rating: number | null }[] {
    this.matchRatings(); // ensure current players are seeded
    const rows = this.roster[which].map((m) => ({
      id: m.id,
      name: m.name,
      rating: (m.id in this.ratings ? this.ratings[m.id] : null) as number | null,
    }));
    const played = rows.filter((r) => r.rating !== null).sort((a, b) => (b.rating as number) - (a.rating as number));
    const unused = rows.filter((r) => r.rating === null);
    return [...played, ...unused];
  }

  pens: { home: (boolean | null)[]; away: (boolean | null)[]; turn: "home" | "away"; kicks: number } | null = null;
  winner: "home" | "away" | null = null;
  goalsLog: { minute: number; side: "home" | "away"; playerName: string; assistName?: string }[] = [];
  /* Cards & injuries as they happen — consumed by the run's squad-status
     store to carry suspensions and knocks into the next match. */
  disciplineLog: { side: "home" | "away"; playerId: string; name: string; kind: "yellow" | "red" | "injury"; severity?: number }[] = [];
  /* Narrative state: biggest deficit each side has faced, whether their
     comeback line has been used, and tactic-line cooldowns. */
  private maxDeficit = { home: 0, away: 0 };
  private comebackDone = { home: false, away: false };
  private tacticSaid: Record<string, { n: number; last: number }> = {};
  private scorerGoals: Record<string, number> = {};
  /* Match ratings, keyed by player id so they survive substitutions. */
  private ratings: Record<string, number> = {};
  private appeared: Record<string, { side: "home" | "away"; name: string; kind: SlotKind }> = {};
  /* The complete match-day squad for each side (XI + full bench), captured
     up front so the report can list everyone — even players never used. */
  private roster: { home: { id: string; name: string }[]; away: { id: string; name: string }[] } = { home: [], away: [] };
  private nextSubCheck = 46; // auto-subs only from the second half
  private nextAiThink = 55;  // AI managers start reacting around the hour
  /* Structured key moments for the post-match report. */
  highlightsLog: { minute: number; side: "home" | "away"; kind: "goal" | "red" | "var" | "pens" | "motm"; label: string }[] = [];
  private pendingVar: { side: "home" | "away"; resolveAt: number; logIndex: number } | null = null;
  /* An in-play penalty (open play, not a shootout). While set, the clock is
     paused: the user's kick is taken via the 3D scene, an opponent's is
     auto-resolved. `pendingPenVar` gates an optional VAR review beforehand. */
  pendingPen: { id: number; side: "home" | "away"; taker: string; isUser: boolean } | null = null;
  private pendingPenVar: { side: "home" | "away"; resolveAt: number; award: boolean } | null = null;
  private inPlayPenTaker: RuntimePlayer | null = null;
  private penSeq = 0;
  /* Ball action state machine: the ball physically travels, and outcomes
     only resolve when it arrives — no more goals from the halfway line. */
  private action:
    | { kind: "dwell"; until: number }
    | { kind: "pass"; to: number; intercepted: boolean; offside: boolean }
    | { kind: "dribble"; tackled: boolean }
    | { kind: "shot"; outcome: "goal" | "save" | "miss" | "woodwork"; shooterIdx: number }
    | { kind: "kickoff" } = { kind: "dwell", until: rand(0.5, 1.0) };
  private ballSpeed = 45; // pitch units per game-minute
  private evId = 0;
  private time = 0; // real-ish accumulator for wander

  private allowDraw: boolean;

  constructor(home: SideInit, away: SideInit, opts?: { allowDraw?: boolean }) {
    this.allowDraw = opts?.allowDraw ?? false;
    this.home = this.buildSide(home, true);
    this.away = this.buildSide(away, false);
    // Snapshot the full match-day squad (XI + bench) before anything mutates.
    this.roster = {
      home: [...home.xi, ...home.bench].map((p) => ({ id: p.id, name: lastName(p) })),
      away: [...away.xi, ...away.bench].map((p) => ({ id: p.id, name: lastName(p) })),
    };
    // Everyone in the starting XI is on record from the first whistle, so a
    // starter subbed off before ever touching the ball still keeps a rating.
    for (const which of ["home", "away"] as const)
      for (const rp of this.side(which).players) this.rate(rp, which, 0);
    // Kick-off: a central midfielder gets us started.
    this.carrier = this.centralPlayer("home");
    this.push("whistle", say("kickoff", { team: home.entry.name }), undefined, 1);
  }

  private centralPlayer(which: "home" | "away"): number {
    const ps = this.side(which).players;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < ps.length; i++) {
      if (ps[i].off || ps[i].slot.kind === "GK") continue;
      const d = Math.hypot(ps[i].x - 50, ps[i].y - 50);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  private nearestTo(which: "home" | "away", x: number, y: number, excludeIdx = -1): number {
    const ps = this.side(which).players;
    let best = -1, bestD = Infinity;
    for (let i = 0; i < ps.length; i++) {
      if (ps[i].off || i === excludeIdx) continue;
      const d = Math.hypot(ps[i].x - x, ps[i].y - y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return Math.max(0, best);
  }

  private buildSide(init: SideInit, isHome: boolean): EngineSide {
    const players = init.slots.map((slot, i) => {
      const p = init.xi[i];
      const anchor = this.anchor(slot, isHome, 0);
      return { p, slot, x: anchor.x, y: anchor.y, wanderSeed: Math.random() * 1000, off: false, booked: false, stamina: 100, subbedOn: false };
    });
    return { entry: init.entry, players, bench: init.bench.slice(), tactics: { ...init.tactics }, subsMade: 0, isHome };
  }

  /* Formation slot (portrait, attack = y→0) → landscape pitch coords.  */
  private anchor(slot: Slot, isHome: boolean, push: number) {
    const depth = (100 - slot.y) * 0.5 + 2 + push;   // 0(own goal) → ~50(half-way)
    const lateral = 8 + slot.x * 0.84;
    return isHome
      ? { x: clamp(depth, 3, 95), y: lateral }
      : { x: clamp(100 - depth, 5, 97), y: 100 - lateral };
  }

  side(which: "home" | "away"): EngineSide { return which === "home" ? this.home : this.away; }
  private opp(which: "home" | "away"): "home" | "away" { return which === "home" ? "away" : "home"; }

  score(): string { return `${this.homeScore}-${this.awayScore}`; }

  displayMinute(): string {
    if (this.phase === "pens" || this.phase === "done") return this.phase === "pens" ? "PENS" : "FT";
    const m = Math.min(Math.ceil(this.minute), 90 + this.stoppage);
    if (this.minute > 90) return `90+${Math.max(1, Math.ceil(this.minute - 90))}'`;
    if (this.phase === "ht") return "HT";
    return `${Math.max(1, m)}'`;
  }

  private push(type: LiveEvent["type"], text: string, side?: "home" | "away", minuteOverride?: number) {
    this.events.push({ id: this.evId++, minute: minuteOverride ?? Math.max(1, Math.ceil(this.minute)), type, side, text });
  }

  private strength(which: "home" | "away") {
    const s = this.side(which);
    const onPitch = s.players.filter((rp) => !rp.off);
    const base = onPitch.length
      ? onPitch.reduce((sum, rp) => sum + effectiveOverall(rp.p, rp.slot.kind) * (0.72 + 0.28 * (rp.stamina / 100)), 0) / onPitch.length
      : 60;
    const shortHanded = (11 - onPitch.length) * 3.5;
    const mods = tacticsModifiers(s.tactics);
    const atk = base + mods.atk + s.entry.reputation * 0.04 + (s.isHome ? 1.5 : 0) - shortHanded;
    const def = base + mods.def - shortHanded;
    return { atk, def, press: s.tactics.pressing };
  }

  private weightedPick(pool: RuntimePlayer[]): RuntimePlayer {
    const total = pool.reduce((s, rp) => s + (SHOT_WEIGHT[rp.slot.kind] ?? 1), 0);
    let roll = Math.random() * total;
    for (const rp of pool) {
      roll -= SHOT_WEIGHT[rp.slot.kind] ?? 1;
      if (roll <= 0) return rp;
    }
    return pool[pool.length - 1];
  }

  private weightedShooter(which: "home" | "away"): RuntimePlayer {
    const outfield = this.side(which).players.filter((rp) => !rp.off && rp.slot.kind !== "GK");
    return this.weightedPick(outfield.length ? outfield : this.side(which).players.filter((rp) => !rp.off));
  }

  private highlight(kind: "goal" | "red" | "var" | "pens" | "motm", side: "home" | "away", label: string) {
    this.highlightsLog.push({ minute: Math.max(1, Math.ceil(this.minute)), side, kind, label });
  }

  private keeper(which: "home" | "away"): RuntimePlayer | undefined {
    return this.side(which).players.find((rp) => rp.slot.kind === "GK" && !rp.off);
  }

  private randomOutfielder(which: "home" | "away"): RuntimePlayer {
    const pool = this.side(which).players.filter((rp) => !rp.off && rp.slot.kind !== "GK");
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ---------------- main tick ---------------- */
  step(dtMin: number) {
    if (this.phase === "ht" || this.phase === "pens" || this.phase === "done") {
      this.drift(dtMin);
      return;
    }
    this.time += dtMin;
    this.minute += dtMin;
    if (this.possession === "home") this.stats.possHome++; else this.stats.possAway++;

    // A pending VAR review resolves after its dramatic pause.
    if (this.pendingVar && this.minute >= this.pendingVar.resolveAt) this.resolveVar();
    // An in-play penalty VAR review resolves the same way.
    if (this.pendingPenVar && this.minute >= this.pendingPenVar.resolveAt) this.resolvePenVar();
    // While a spot-kick is waiting to be taken, open play is frozen.
    if (this.pendingPen) { this.drift(dtMin); return; }

    // Half / full time boundaries
    if (this.phase === "first" && this.minute >= 45) {
      this.resolveVar();
      this.minute = 45;
      this.phase = "ht";
      this.push("whistle", say("halftime"), undefined, 45);
      return;
    }
    if (this.phase === "second") {
      if (!this.stoppageAnnounced && this.minute >= 90) {
        this.stoppage = 1 + Math.floor(Math.random() * 5);
        this.stoppageAnnounced = true;
        this.push("info", say("stoppage", { n: this.stoppage }), undefined, 90);
      }
      if (this.stoppageAnnounced && this.minute >= 90 + this.stoppage) {
        this.resolveVar();
        this.fullTime();
        return;
      }
    }

    this.drainStamina(dtMin);
    if (this.minute >= this.nextSubCheck) {
      this.nextSubCheck = this.minute + rand(2, 4);
      this.runAutoSubs("home");
      this.runAutoSubs("away");
    }
    if (this.minute >= this.nextAiThink) {
      this.nextAiThink = this.minute + rand(6, 10);
      this.aiCoach("home");
      this.aiCoach("away");
    }
    this.advanceBall(dtMin);
    if (this.action.kind === "dwell" && this.minute >= this.action.until) this.decideAction();
    this.drift(dtMin);
  }

  /* AI managers read the scoreboard like humans do: chase when behind,
     shut up shop when ahead. Users coach themselves from the Touchline. */
  private aiCoach(which: "home" | "away") {
    const s = this.side(which);
    if (s.entry.isUser) return;
    const diff = (which === "home" ? this.homeScore - this.awayScore : this.awayScore - this.homeScore);
    const t = s.tactics;
    const before = { m: t.mentality, d: t.defLine };
    if (diff < 0 && this.minute >= 70 && diff <= -2) {
      // desperate: all-out attack
      t.mentality = 90; t.pressing = 85; t.tempo = 85; t.defLine = 80;
    } else if (diff < 0 && this.minute >= 60) {
      t.mentality = clamp(t.mentality + 20, 0, 100);
      t.pressing = clamp(t.pressing + 15, 0, 100);
      t.tempo = clamp(t.tempo + 15, 0, 100);
    } else if (diff === 1 && this.minute >= 80) {
      // protect a one-goal lead: park it
      t.mentality = 15; t.pressing = 30; t.tempo = 30; t.defLine = 20;
    } else if (diff > 0 && this.minute >= 70) {
      t.mentality = clamp(t.mentality - 25, 0, 100);
      t.tempo = clamp(t.tempo - 15, 0, 100);
      t.defLine = clamp(t.defLine - 20, 0, 100);
    } else {
      return;
    }
    // Announce big shifts, once per direction per match.
    const pushed = t.mentality - before.m >= 20;
    const shut = before.m - t.mentality >= 20 || (diff > 0 && t.defLine < before.d - 15);
    const cat = pushed ? "aiPushForward" : shut ? "aiShutShop" : null;
    if (cat) {
      const seen = this.tacticSaid[`${cat}-${which}`] ?? { n: 0, last: -99 };
      if (seen.n < 1) {
        this.tacticSaid[`${cat}-${which}`] = { n: 1, last: this.minute };
        this.push("info", say(cat, { team: s.entry.name, opp: this.side(this.opp(which)).entry.name }), which);
      }
    }
  }

  /* High tempo + heavy pressing burn the legs: flat out, a player is done
     by the hour mark; balanced sides fade late instead. Keepers coast. */
  private drainStamina(dtMin: number) {
    for (const which of ["home", "away"] as const) {
      const t = this.side(which).tactics;
      const rate = 0.12 + 0.74 * ((t.tempo + t.pressing) / 100);
      for (const rp of this.side(which).players) {
        if (rp.off) continue;
        rp.stamina = Math.max(0, rp.stamina - rate * dtMin * (rp.slot.kind === "GK" ? 0.3 : 1));
      }
    }
  }

  /* From the second half, tired legs get hauled off automatically — both
     teams, up to the 5-sub limit, occasionally two or three at once. */
  private runAutoSubs(which: "home" | "away") {
    if (this.phase !== "second") return;
    const s = this.side(which);
    if (s.subsMade >= 5 || !s.bench.length) return;
    const pSub = this.minute < 60 ? 0.3 : 0.6;
    const eligible = s.players
      .filter((rp) => !rp.off && rp.slot.kind !== "GK" && rp.stamina < 28 && Math.random() < pSub)
      .sort((a, b) => a.stamina - b.stamina);
    // Mostly one at a time; a double now and then, a triple on rare nights.
    let groupSize = 1;
    if (eligible.length > 1 && Math.random() < 0.25) groupSize = 2;
    if (groupSize === 2 && eligible.length > 2 && Math.random() < 0.2) groupSize = 3;
    const tired = eligible.slice(0, Math.min(groupSize, 5 - s.subsMade, s.bench.length));
    if (!tired.length) return;
    const swaps: { off: string; on: string }[] = [];
    for (const rp of tired) {
      const inP = this.bestBenchFor(s, rp.slot.kind);
      if (!inP) break;
      swaps.push({ off: lastName(rp.p), on: lastName(inP) });
      this.applySub(s, rp, inP);
    }
    if (!swaps.length) return;
    if (swaps.length === 1) {
      this.push("sub", say("subTired", { off: swaps[0].off, on: swaps[0].on, team: s.entry.name }), which);
    } else {
      this.push("sub", say(swaps.length === 2 ? "subDouble" : "subTriple", { team: s.entry.name }), which);
    }
    this.events[this.events.length - 1].swaps = swaps;
  }

  private bestBenchFor(s: EngineSide, kind: SlotKind): Player | null {
    if (!s.bench.length) return null;
    const sorted = [...s.bench].sort((a, b) => effectiveOverall(b, kind) - effectiveOverall(a, kind));
    return sorted[0];
  }

  private applySub(s: EngineSide, rp: RuntimePlayer, inP: Player) {
    s.bench = s.bench.filter((b) => b.id !== inP.id);
    rp.p = inP;
    rp.booked = false;
    rp.stamina = 100;
    rp.subbedOn = true;
    rp.subbedOnAt = this.minute;
    s.subsMade++;
    // The player coming on gets a rating from the moment they step on.
    this.rate(rp, s.isHome ? "home" : "away", 0);
  }

  startSecondHalf() {
    if (this.phase !== "ht") return;
    this.phase = "second";
    this.minute = 45;
    this.possession = this.possession === "home" ? "away" : "home";
    this.ball = { x: 50, y: 50 };
    this.ballTarget = { x: 50, y: 50 };
    this.carrier = this.centralPlayer(this.possession);
    this.action = { kind: "dwell", until: 45 + rand(0.4, 0.8) };
    this.push("whistle", say("secondHalf"), undefined, 46);
  }

  private resolveVar() {
    if (!this.pendingVar) return;
    const { side, logIndex } = this.pendingVar;
    this.pendingVar = null;
    if (Math.random() < 0.6) {
      // Chalked off.
      if (side === "home") this.homeScore = Math.max(0, this.homeScore - 1);
      else this.awayScore = Math.max(0, this.awayScore - 1);
      if (this.goalsLog[logIndex]?.side === side) this.goalsLog.splice(logIndex, 1);
      this.highlight("var", side, `Goal overturned by VAR · ${this.score()}`);
      this.push("var", say("varOverturned", { team: this.side(side).entry.name, score: this.score() }), side);
      this.events[this.events.length - 1].varOutcome = "overturned";
    } else {
      this.push("var", say("varStands"), side);
      this.events[this.events.length - 1].varOutcome = "given";
    }
  }

  private fullTime() {
    this.minute = 90 + this.stoppage;
    if (this.homeScore === this.awayScore) {
      if (this.allowDraw) {
        // League football: a draw is a result.
        this.phase = "done";
        this.push("whistle", say("ftDraw", { score: this.score() }));
        return;
      }
      this.phase = "pens";
      this.pens = { home: [], away: [], turn: Math.random() < 0.5 ? "home" : "away", kicks: 0 };
      this.push("whistle", say("penIntro"));
    } else {
      this.finish(this.homeScore > this.awayScore ? "home" : "away");
    }
  }

  private finish(winner: "home" | "away") {
    this.phase = "done";
    this.winner = winner;
    for (const rp of this.side(winner).players) if (!rp.off || rp.p.id in this.ratings) this.rate(rp, winner, 0.3);
    const motm = this.matchRatings()[0];
    if (motm) this.highlight("motm", motm.side, `Man of the Match: ${motm.name} (${motm.rating.toFixed(1)})`);
    const team = this.side(winner).entry;
    const userWon = this.side(winner).entry.isUser;
    this.push("whistle", say(userWon ? "ftWin" : this.home.entry.isUser || this.away.entry.isUser ? "ftLose" : "ftWin", {
      team: team.name, score: this.score(),
    }));
  }

  /* One "moment" of match action. */
  /* Is this position close enough to the opponent's goal to shoot from? */
  private inShootingRange(which: "home" | "away", x: number): boolean {
    return which === "home" ? x > 62 : x < 38;
  }
  private inLongRange(which: "home" | "away", x: number): boolean {
    return which === "home" ? x > 52 : x < 48;
  }

  private currentCarrier(): RuntimePlayer | null {
    const ps = this.side(this.possession).players;
    const rp = ps[this.carrier];
    if (!rp || rp.off) {
      this.carrier = this.nearestTo(this.possession, this.ball.x, this.ball.y);
      return ps[this.carrier] ?? null;
    }
    return rp;
  }

  private giveTo(which: "home" | "away", idx: number, dwellMin = rand(0.3, 0.75)) {
    this.possession = which;
    this.carrier = idx;
    this.action = { kind: "dwell", until: this.minute + dwellMin };
  }

  /* The player on the ball makes a decision: pass, carry, shoot — or the
     referee interrupts. */
  private decideAction() {
    const att = this.possession;
    const dfn = this.opp(att);
    const A = this.strength(att);
    const D = this.strength(dfn);
    const attTeam = this.side(att).entry.name;
    const dfnTeam = this.side(dfn).entry.name;
    const carrier = this.currentCarrier();
    if (!carrier) return;

    // Penalties: a defender's foul as the attacker bears down on goal. The
    // deeper into the box the attack is, the more likely the whistle blows.
    {
      const goalX = att === "home" ? 97 : 3;
      const dist = Math.abs(carrier.x - goalX);
      const pPen = dist <= 12 ? 0.13 : dist <= 22 ? 0.065 : dist <= 35 ? 0.03 : 0;
      if (pPen > 0 && Math.random() < pPen) {
        this.bump(dfn, "fouls");
        this.triggerPenalty(att);
        return;
      }
    }

    // Injuries: rare, random, occasionally match-changing.
    if (Math.random() < 0.006) {
      const side = Math.random() < 0.5 ? att : dfn;
      const s = this.side(side);
      const pool = s.players.filter((rp) => !rp.off);
      const victim = pool[Math.floor(Math.random() * pool.length)];
      if (victim) {
        if (Math.random() < 0.5) {
          victim.stamina = Math.max(0, victim.stamina - 25);
          this.disciplineLog.push({ side, playerId: victim.p.id, name: lastName(victim.p), kind: "injury", severity: 0 });
          this.push("injury", say("injuryMinor", { player: lastName(victim.p) }), side);
          this.events[this.events.length - 1].injurySerious = false;
        } else {
          this.disciplineLog.push({ side, playerId: victim.p.id, name: lastName(victim.p), kind: "injury", severity: 1 });
          const inP = s.subsMade < 5 ? this.bestBenchFor(s, victim.slot.kind) : null;
          if (inP) {
            const offName = lastName(victim.p);
            this.applySub(s, victim, inP);
            this.push("injury", say("injurySub", { player: offName, team: s.entry.name, on: lastName(inP) }), side);
            this.events[this.events.length - 1].swaps = [{ on: lastName(inP), off: offName }];
            this.events[this.events.length - 1].injurySerious = true;
          } else {
            victim.off = true;
            this.push("injury", say("injuryNoSub", { player: lastName(victim.p), team: s.entry.name }), side);
            this.events[this.events.length - 1].injurySerious = true;
            if (this.carrier >= 0 && this.side(this.possession).players[this.carrier]?.off) {
              this.carrier = this.nearestTo(this.possession, this.ball.x, this.ball.y);
            }
          }
        }
        return;
      }
    }

    // Referee moments (fouls & cards) interrupt open play.
    if (Math.random() < 0.045) {
      const side = Math.random() < 0.5 ? att : dfn;
      // Already-booked players live on the edge — they're more likely to be the
      // one caught fouling again, which turns into a second yellow.
      const bookedMen = this.side(side).players.filter((rp) => !rp.off && rp.booked && rp.slot.kind !== "GK");
      const culprit = (bookedMen.length && Math.random() < 0.45)
        ? bookedMen[Math.floor(Math.random() * bookedMen.length)]
        : this.randomOutfielder(side);
      const roll = Math.random();
      this.bump(side, "fouls");
      if (roll < 0.06 && this.side(side).players.filter((rp) => !rp.off).length > 8) {
        culprit.off = true;
        this.bump(side, "reds");
        this.rate(culprit, side, -1.5);
        this.disciplineLog.push({ side, playerId: culprit.p.id, name: lastName(culprit.p), kind: "red", severity: 2 });
        this.highlight("red", side, `${lastName(culprit.p)} sent off`);
        this.push("red", say("red", { player: lastName(culprit.p), team: this.side(side).entry.name }), side);
      } else if (roll < 0.6) {
        if (culprit.booked && this.side(side).players.filter((rp) => !rp.off).length > 8) {
          culprit.off = true;
          this.bump(side, "yellows");
          this.bump(side, "reds");
          this.rate(culprit, side, -1.5);
          this.disciplineLog.push({ side, playerId: culprit.p.id, name: lastName(culprit.p), kind: "red", severity: 1 });
          this.highlight("red", side, `${lastName(culprit.p)} sent off (2nd yellow)`);
          this.push("red", say("secondYellow", { player: lastName(culprit.p), team: this.side(side).entry.name }), side);
        } else {
          culprit.booked = true;
          this.bump(side, "yellows");
          this.rate(culprit, side, -0.3);
          this.disciplineLog.push({ side, playerId: culprit.p.id, name: lastName(culprit.p), kind: "yellow" });
          this.push("yellow", say("yellow", { player: lastName(culprit.p) }), side);
        }
      } else {
        this.push("info", say("foul", { team: attTeam, opp: dfnTeam }), side);
      }
      // Free kick: whoever was fouled against keeps/gets the ball where it is.
      const toSide = side === att ? dfn : att;
      this.giveTo(toSide, this.nearestTo(toSide, this.ball.x, this.ball.y), rand(0.5, 0.9));
      return;
    }

    // In range → have a go, most of the time. From distance, sometimes.
    // Keepers never shoot from open play (they only threaten from a last-gasp
    // set piece, handled separately).
    if (carrier.slot.kind !== "GK") {
      if (this.inShootingRange(att, carrier.x)) {
        const pShoot = clamp(0.68 + (A.atk - D.def) * 0.012, 0.45, 0.85);
        if (Math.random() < pShoot) {
          this.launchShot(carrier, A, D);
          return;
        }
        // No shot on — a cross or driven ball is often turned behind for a
        // corner. This is the everyday source of corners, not just off a save.
        if (Math.random() < 0.72) {
          this.awardCorner(att, attTeam);
          return;
        }
      } else if (this.inLongRange(att, carrier.x) && Math.random() < 0.08) {
        this.launchShot(carrier, A, D);
        return;
      }
    }

    // Otherwise: pass (mostly) or carry it forward.
    if (Math.random() < 0.66) {
      const goalX = att === "home" ? 97 : 3;
      const mates = this.side(att).players
        .map((rp, i) => ({ rp, i }))
        .filter(({ rp, i }) => !rp.off && i !== this.carrier && rp.slot.kind !== "GK");
      if (!mates.length) return;
      // Prefer teammates ahead of the ball, at a sensible passing distance.
      const scored = mates.map(({ rp, i }) => {
        const gain = Math.abs(carrier.x - goalX) - Math.abs(rp.x - goalX); // progress toward goal
        const dist = Math.hypot(rp.x - carrier.x, rp.y - carrier.y);
        const w = Math.max(0.15, 1 + gain * 0.13 - Math.max(0, dist - 40) * 0.05);
        return { i, rp, w };
      });
      const total = scored.reduce((s, m) => s + m.w, 0);
      let roll = Math.random() * total;
      let pick = scored[scored.length - 1];
      for (const m of scored) { roll -= m.w; if (roll <= 0) { pick = m; break; } }

      // Forward passes into the final third can catch the runner offside.
      const progressive = Math.abs(pick.rp.x - goalX) < Math.abs(carrier.x - goalX) - 3;
      const inFinalThird = att === "home" ? pick.rp.x > 56 : pick.rp.x < 44;
      const offside = progressive && inFinalThird && Math.random() < 0.42;
      const pInt = clamp(0.09 + (D.press - 50) * 0.002 + (D.def - A.atk) * 0.005, 0.04, 0.2);
      const intercepted = !offside && Math.random() < pInt;
      this.action = { kind: "pass", to: pick.i, intercepted, offside };
      if (intercepted) {
        // Cut out mid-flight: ball dies between the two.
        this.ballTarget = {
          x: (carrier.x + pick.rp.x) / 2 + rand(-4, 4),
          y: clamp((carrier.y + pick.rp.y) / 2 + rand(-4, 4), 3, 97),
        };
      } else {
        this.ballTarget = { x: pick.rp.x, y: pick.rp.y };
      }
      this.ballSpeed = 42;
      return;
    }

    // Dribble: carry it toward goal.
    const dir = att === "home" ? 1 : -1;
    const pTackle = clamp(0.11 + (D.press - 50) * 0.002 + (D.def - A.atk) * 0.005, 0.05, 0.22);
    this.action = { kind: "dribble", tackled: Math.random() < pTackle };
    this.ballTarget = {
      x: clamp(carrier.x + dir * rand(8, 15), 4, 96),
      y: clamp(carrier.y + rand(-9, 9), 4, 96),
    };
    this.ballSpeed = 20;
  }

  private launchShot(shooter: RuntimePlayer, A: { atk: number }, D: { def: number }) {
    const att = this.possession;
    this.bump(att, "shots");
    const pGoal = clamp(0.33 + (A.atk - D.def) * 0.010, 0.14, 0.55);
    const out = Math.random();
    const outcome: "goal" | "save" | "miss" | "woodwork" =
      out < pGoal ? "goal"
      : out < pGoal + 0.55 * (1 - pGoal) ? "save"
      : Math.random() < 0.15 ? "woodwork" : "miss";
    const shotXg = outcome === "goal" ? 0.18 + Math.random() * 0.5 : 0.05 + Math.random() * 0.3;
    if (att === "home") this.stats.xgHome += shotXg; else this.stats.xgAway += shotXg;
    this.action = { kind: "shot", outcome, shooterIdx: this.carrier };
    // Misses drift wide/over; everything else is at the goal mouth.
    const wideY = outcome === "miss" ? (Math.random() < 0.5 ? rand(28, 38) : rand(62, 72)) : rand(44, 56);
    this.ballTarget = { x: att === "home" ? 97 : 3, y: wideY };
    this.ballSpeed = 75;
  }

  /* A trailing side in the dying minutes sends its keeper up for a set piece.
     He rises for the header and, once in a blue moon (5%), actually scores.
     Returns true if the keeper scored (and the restart is handled here). */
  private tryKeeperSetPiece(att: "home" | "away"): boolean {
    const diff = att === "home" ? this.homeScore - this.awayScore : this.awayScore - this.homeScore;
    const lastGasp = this.phase === "second" && this.minute >= 88;
    if (diff >= 0 || !lastGasp) return false;
    const gk = this.side(att).players.find((rp) => rp.slot.kind === "GK" && !rp.off);
    if (!gk) return false;
    // Even in the last gasp, the keeper only gambles forward now and then.
    if (Math.random() >= 0.4) return false;
    const dfn = this.opp(att);
    this.push("info", say("keeperUp", { player: lastName(gk.p), team: this.side(att).entry.name }), att);
    if (Math.random() < 0.05) {
      if (att === "home") this.homeScore++; else this.awayScore++;
      this.bump(att, "onTarget");
      this.rate(gk, att, 1.5);
      this.goalsLog.push({ minute: Math.max(1, Math.ceil(this.minute)), side: att, playerName: lastName(gk.p) });
      this.highlight("goal", att, `${lastName(gk.p)} (GK!) · ${this.score()}`);
      this.push("goal", say("keeperGoal", { player: lastName(gk.p), team: this.side(att).entry.name, score: this.score() }), att);
      this.maxDeficit.home = Math.max(this.maxDeficit.home, this.awayScore - this.homeScore);
      this.maxDeficit.away = Math.max(this.maxDeficit.away, this.homeScore - this.awayScore);
      this.possession = dfn;
      this.action = { kind: "kickoff" };
      this.ballTarget = { x: 50, y: 50 };
      this.ballSpeed = 40;
      return true;
    }
    // Keeper's up but it comes to nothing — hoof clear, play on.
    this.giveTo(att, this.nearestTo(att, this.ball.x, this.ball.y), rand(0.5, 0.9));
    return true;
  }

  /* Colour commentary about how the teams are set up. Each style line fires
     at most twice a match, with a decent gap between repeats. */
  private tryTacticLine(att: "home" | "away", dfn: "home" | "away"): boolean {
    const candidates: { cat: string; side: "home" | "away" }[] = [];
    const dT = this.side(dfn).tactics;
    const aT = this.side(att).tactics;
    if (dT.mentality <= 30 && dT.defLine <= 40) candidates.push({ cat: "tacticParkBus", side: dfn });
    if (dT.pressing >= 78) candidates.push({ cat: "tacticGegenpress", side: dfn });
    if (aT.tempo >= 78) candidates.push({ cat: "tacticRouteOne", side: att });
    if (aT.tempo <= 32) candidates.push({ cat: "tacticTiki", side: att });
    for (const c of candidates.sort(() => Math.random() - 0.5)) {
      const seen = this.tacticSaid[c.cat] ?? { n: 0, last: -99 };
      if (seen.n >= 2 || this.minute - seen.last < 20) continue;
      this.tacticSaid[c.cat] = { n: seen.n + 1, last: this.minute };
      this.push("info", say(c.cat, {
        team: this.side(c.side).entry.name,
        opp: this.side(this.opp(c.side)).entry.name,
      }), c.side);
      return true;
    }
    return false;
  }

  /* Ball physics: constant-speed travel; outcomes fire on arrival. */
  private advanceBall(dtMin: number) {
    if (this.action.kind === "dwell") {
      // Ball sticks with the carrier.
      const rp = this.currentCarrier();
      if (rp) this.ballTarget = { x: rp.x, y: rp.y };
      this.ballSpeed = 50;
    }
    const dx = this.ballTarget.x - this.ball.x;
    const dy = this.ballTarget.y - this.ball.y;
    const dist = Math.hypot(dx, dy);
    const step = this.ballSpeed * dtMin;
    if (dist <= Math.max(1.4, step)) {
      this.ball.x = this.ballTarget.x;
      this.ball.y = this.ballTarget.y;
      if (this.action.kind !== "dwell") this.handleArrival();
      return;
    }
    this.ball.x += (dx / dist) * step;
    this.ball.y += (dy / dist) * step;
  }

  private handleArrival() {
    const att = this.possession;
    const dfn = this.opp(att);
    const attTeam = this.side(att).entry.name;
    const dfnTeam = this.side(dfn).entry.name;
    const action = this.action;

    if (action.kind === "pass") {
      if (action.offside) {
        const runner = this.side(att).players[action.to];
        this.bump(att, "offsides");
        this.push("offside", say("offside", { player: runner ? lastName(runner.p) : "the runner", team: dfnTeam }), att);
        const gk = this.side(dfn).players.findIndex((rp) => rp.slot.kind === "GK" && !rp.off);
        this.giveTo(dfn, gk >= 0 ? gk : this.nearestTo(dfn, this.ball.x, this.ball.y), rand(0.5, 0.9));
        return;
      }
      if (action.intercepted) {
        this.giveTo(dfn, this.nearestTo(dfn, this.ball.x, this.ball.y));
        if (Math.random() < 0.22) this.push("info", say("turnover", { team: dfnTeam, opp: attTeam }), dfn);
        return;
      }
      this.giveTo(att, action.to);
      const flavour = Math.random();
      const receiver = this.side(att).players[action.to];
      if (flavour < 0.12 && receiver) {
        this.push("info", say("possession", { team: attTeam, player: lastName(receiver.p) }), att);
      } else if (flavour < 0.22 && this.tryTacticLine(att, dfn)) {
        // tactic-flavoured colour commentary fired
      } else if (flavour < 0.16) {
        this.push("info", say("ambience"), undefined);
      }
      return;
    }

    if (action.kind === "dribble") {
      if (action.tackled) {
        this.giveTo(dfn, this.nearestTo(dfn, this.ball.x, this.ball.y));
        if (Math.random() < 0.22) this.push("info", say("turnover", { team: dfnTeam, opp: attTeam }), dfn);
      } else {
        this.giveTo(att, this.carrier, rand(0.3, 0.7));
      }
      return;
    }

    if (action.kind === "kickoff") {
      this.giveTo(this.possession, this.centralPlayer(this.possession), rand(0.4, 0.8));
      return;
    }

    if (action.kind === "shot") {
      const shooter = this.side(att).players[action.shooterIdx] ?? this.currentCarrier()!;
      const gk = this.keeper(dfn);
      if (action.outcome === "goal") {
        if (att === "home") { this.homeScore++; this.stats.onTargetHome++; } else { this.awayScore++; this.stats.onTargetAway++; }
        const mates = this.side(att).players.filter((rp) => !rp.off && rp !== shooter && rp.slot.kind !== "GK");
        const assistRp = Math.random() < 0.78 && mates.length ? this.weightedPick(mates) : null;
        const assistName = assistRp ? lastName(assistRp.p) : undefined;
        this.rate(shooter, att, 1.0);
        if (assistRp) this.rate(assistRp, att, 0.5);
        for (const rp of this.side(dfn).players) {
          if (!rp.off && ["GK", "CB", "LB", "RB", "LWB", "RWB"].includes(rp.slot.kind)) this.rate(rp, dfn, -0.15);
        }
        this.goalsLog.push({ minute: Math.max(1, Math.ceil(this.minute)), side: att, playerName: lastName(shooter.p), assistName });
        this.highlight("goal", att, `${lastName(shooter.p)}${assistName ? ` (${assistName})` : ""} · ${this.score()}`);

        // Pick the commentary that fits the moment, not just "a goal".
        const attScore = att === "home" ? this.homeScore : this.awayScore;
        const dfnScore = att === "home" ? this.awayScore : this.homeScore;
        const diff = attScore - dfnScore;
        const signature = SIGNATURE_GOALS[lastName(shooter.p).toLowerCase()];
        // Key by side too: a drafted player can share an id with the same
        // real player in the opponent's XI, so tally each team's copy apart.
        const scorerKey = `${att}:${shooter.p.id}`;
        const scorerTally = (this.scorerGoals[scorerKey] = (this.scorerGoals[scorerKey] ?? 0) + 1);
        let cat = "goal";
        if (this.phase === "second" && this.minute >= 88 && diff === 1) {
          cat = "goalLastMinute";
        } else if (diff >= 1 && this.maxDeficit[att] >= 2 && !this.comebackDone[att]) {
          cat = "goalComeback";
          this.comebackDone[att] = true;
        } else if (scorerTally >= 4) {
          cat = "goalFour";
        } else if (scorerTally === 3) {
          cat = "goalHattrick";
        } else if (signature) {
          cat = signature;
        } else if (scorerTally === 2) {
          cat = "goalBrace";
        } else if (diff >= 4) {
          cat = "goalHugeLead";
        } else if (diff <= -3) {
          cat = "goalConsolation";
        } else if (diff < 0) {
          cat = "goalReduceDeficit";
        }
        // Remember how deep the hole got, for comeback detection later.
        this.maxDeficit.home = Math.max(this.maxDeficit.home, this.awayScore - this.homeScore);
        this.maxDeficit.away = Math.max(this.maxDeficit.away, this.homeScore - this.awayScore);
        this.push("goal", say(cat, { player: lastName(shooter.p), team: attTeam, opp: dfnTeam, score: this.score() }), att);
        if (!this.pendingVar && Math.random() < 0.1) {
          this.pendingVar = { side: att, resolveAt: this.minute + rand(0.8, 1.6), logIndex: this.goalsLog.length - 1 };
          this.push("var", say("varCheck"), att);
          this.events[this.events.length - 1].varOutcome = "check";
        }
        // Restart from the centre spot.
        this.possession = dfn;
        this.action = { kind: "kickoff" };
        this.ballTarget = { x: 50, y: 50 };
        this.ballSpeed = 40;
        return;
      }
      if (action.outcome === "save") {
        if (att === "home") this.stats.onTargetHome++; else this.stats.onTargetAway++;
        this.bump(dfn, "saves");
        if (gk) this.rate(gk, dfn, 0.15);
        this.push("save", say("save", { player: lastName(shooter.p), keeper: gk ? lastName(gk.p) : "the keeper" }), att);
        // Keepers often can only parry behind for a corner.
        if (Math.random() < 0.45) { this.awardCorner(att, attTeam); return; }
        this.goalKick(dfn);
        return;
      }
      // A blocked/deflected effort is turned behind for a corner; otherwise
      // it's off target for a goal kick.
      this.push("miss", say(action.outcome === "woodwork" ? "woodwork" : "miss", { player: lastName(shooter.p), opp: dfnTeam }), att);
      const cornerChance = action.outcome === "woodwork" ? 0.4 : 0.28;
      if (Math.random() < cornerChance) { this.awardCorner(att, attTeam); return; }
      this.goalKick(dfn);
    }
  }

  /* A corner: log it, sound the line, and (very rarely, late on) let a trailing
     side's keeper come up for it. Most deliveries are headed clear; some load
     the box for a genuine chance. */
  private awardCorner(att: "home" | "away", attTeam: string) {
    this.bump(att, "corners");
    this.push("info", say("corner", { team: attTeam }), att);
    if (this.tryKeeperSetPiece(att)) return;
    if (Math.random() < 0.4) {
      this.giveTo(att, this.nearestTo(att, this.ball.x, this.ball.y), rand(0.5, 0.9));
    } else {
      const dfn = this.opp(att);
      this.giveTo(dfn, this.nearestTo(dfn, this.ball.x, this.ball.y), rand(0.5, 0.9));
    }
  }

  private goalKick(dfn: "home" | "away") {
    const gkIdx = this.side(dfn).players.findIndex((rp) => rp.slot.kind === "GK" && !rp.off);
    this.giveTo(dfn, gkIdx >= 0 ? gkIdx : this.nearestTo(dfn, this.ball.x, this.ball.y), rand(0.5, 1.0));
  }

  /* ---------------- in-play penalties ---------------- */
  /* A penalty has been won by `side`. Roughly a third of the time the referee
     consults VAR before deciding; otherwise it's awarded straight away. */
  private triggerPenalty(side: "home" | "away") {
    if (Math.random() < 0.35) {
      this.pendingPenVar = { side, resolveAt: this.minute + rand(0.8, 1.6), award: Math.random() < 0.8 };
      this.push("var", say("penVarCheck", { team: this.side(side).entry.name }), side);
      this.events[this.events.length - 1].varOutcome = "check";
    } else {
      this.awardPenalty(side);
    }
  }

  private resolvePenVar() {
    if (!this.pendingPenVar) return;
    const { side, award } = this.pendingPenVar;
    this.pendingPenVar = null;
    if (award) {
      this.push("var", say("penVarGiven", { team: this.side(side).entry.name }), side);
      this.events[this.events.length - 1].varOutcome = "given";
      this.awardPenalty(side);
    } else {
      this.push("var", say("penVarNone", { team: this.side(side).entry.name }), side);
      this.events[this.events.length - 1].varOutcome = "overturned";
      const dfn = this.opp(side);
      this.possession = dfn;
      this.giveTo(dfn, this.nearestTo(dfn, this.ball.x, this.ball.y), rand(0.5, 0.9));
    }
  }

  private awardPenalty(side: "home" | "away") {
    this.inPlayPenTaker = this.weightedShooter(side);
    this.bump(side, "shots");
    this.pendingPen = { id: ++this.penSeq, side, taker: lastName(this.inPlayPenTaker.p), isUser: this.side(side).entry.isUser };
    this.push("pen", say("penAwarded", { team: this.side(side).entry.name, player: lastName(this.inPlayPenTaker.p) }), side);
  }

  /* An opponent / AI spot-kick converts at ~77% (matching the shootout). */
  resolveInPlayPenAI(): { scored: boolean; dir: "left" | "center" | "right"; keeperDir: "left" | "center" | "right" } {
    const dir = (["left", "center", "right"] as const)[Math.floor(Math.random() * 3)];
    const keeperDir = (["left", "center", "right"] as const)[Math.floor(Math.random() * 3)];
    const scored = Math.random() < 0.77;
    this.finishInPlayPen(scored);
    return { scored, dir, keeperDir };
  }

  /* The user takes their spot-kick from the 3D scene: pick a corner, the keeper
     dives at random — beat him and it's a goal, pick his corner and he saves. */
  takeInPlayPenUser(dir: "left" | "center" | "right"): { scored: boolean; keeperDir: "left" | "center" | "right" } {
    const keeperDir = (["left", "center", "right"] as const)[Math.floor(Math.random() * 3)];
    const scored = keeperDir !== dir;
    this.finishInPlayPen(scored);
    return { scored, keeperDir };
  }

  /* The user's keeper faces a conceded spot-kick: pick a dive, the opponent
     shoots at random — guess the corner and you save it, miss and it's in. */
  takeInPlayDiveUser(dir: "left" | "center" | "right"): { scored: boolean; shotDir: "left" | "center" | "right" } {
    const shotDir = (["left", "center", "right"] as const)[Math.floor(Math.random() * 3)];
    const scored = shotDir !== dir;
    this.finishInPlayPen(scored);
    return { scored, shotDir };
  }

  private finishInPlayPen(scored: boolean) {
    const pen = this.pendingPen;
    if (!pen || !this.inPlayPenTaker) { this.pendingPen = null; this.inPlayPenTaker = null; return; }
    const att = pen.side;
    const dfn = this.opp(att);
    const taker = this.inPlayPenTaker;
    this.pendingPen = null;
    this.inPlayPenTaker = null;
    const minute = Math.max(1, Math.ceil(this.minute));
    if (scored) {
      if (att === "home") this.homeScore++; else this.awayScore++;
      this.bump(att, "onTarget");
      this.rate(taker, att, 0.6);
      for (const rp of this.side(dfn).players) {
        if (!rp.off && rp.slot.kind === "GK") this.rate(rp, dfn, -0.15);
      }
      this.goalsLog.push({ minute, side: att, playerName: lastName(taker.p) });
      this.highlight("goal", att, `${lastName(taker.p)} (pen) · ${this.score()}`);
      this.push("goal", say("penScoredPlay", { player: lastName(taker.p), team: this.side(att).entry.name, score: this.score() }), att);
      this.maxDeficit.home = Math.max(this.maxDeficit.home, this.awayScore - this.homeScore);
      this.maxDeficit.away = Math.max(this.maxDeficit.away, this.homeScore - this.awayScore);
      // restart from the centre spot
      this.possession = dfn;
      this.action = { kind: "kickoff" };
      this.ballTarget = { x: 50, y: 50 };
    } else {
      this.bump(att, "onTarget");
      this.bump(dfn, "saves");
      this.rate(taker, att, -0.5);
      const gk = this.keeper(dfn);
      if (gk) this.rate(gk, dfn, 0.3);
      this.push("save", say("penMissedPlay", { player: lastName(taker.p), score: this.score() }), att);
      // keeper claims it, play resumes
      this.possession = dfn;
      this.giveTo(dfn, this.nearestTo(dfn, this.ball.x, this.ball.y), rand(0.5, 0.9));
    }
  }

  /* ---------------- penalty shootout ---------------- */
  /* One taker per kick, cached so the UI can announce him before the ball
     is struck. */
  private penTaker: RuntimePlayer | null = null;
  currentPenTaker(): string | null {
    if (this.phase !== "pens" || !this.pens) return null;
    if (!this.penTaker) this.penTaker = this.weightedShooter(this.pens.turn);
    return lastName(this.penTaker.p);
  }

  /* Is the user's side up next to take a shootout kick? */
  pensUserTurn(): boolean {
    return this.phase === "pens" && !!this.pens && this.side(this.pens.turn).entry.isUser;
  }

  /* Is the opponent up next, i.e. the user's keeper is diving this kick? */
  pensUserDefend(): boolean {
    if (this.phase !== "pens" || !this.pens) return false;
    const kicking = this.side(this.pens.turn).entry.isUser;
    const userInMatch = this.side("home").entry.isUser || this.side("away").entry.isUser;
    return userInMatch && !kicking;
  }

  /* AI kicks (and the opponent's) resolve on a straight 75% roll. */
  stepPens() {
    if (this.phase !== "pens" || !this.pens) return;
    this.currentPenTaker();
    this.resolveKick(Math.random() < 0.75);
  }

  /* The user picks a corner: keeper dives at random — beat him and it's a goal,
     pick the corner he dives to and he saves it (≈67% conversion overall).
     Returns the outcome plus the keeper's dive so the UI can animate it. */
  takeUserPen(dir: "left" | "center" | "right"): { scored: boolean; keeperDir: "left" | "center" | "right" } {
    if (!this.pensUserTurn()) return { scored: false, keeperDir: "center" };
    this.currentPenTaker();
    const keeperDir = (["left", "center", "right"] as const)[Math.floor(Math.random() * 3)];
    const scored = keeperDir !== dir;
    this.resolveKick(scored);
    return { scored, keeperDir };
  }

  /* The user's keeper dives against the opponent's shootout kick: pick a corner,
     the taker shoots at random — guess right to save, wrong way it's scored. */
  takeUserDive(dir: "left" | "center" | "right"): { scored: boolean; shotDir: "left" | "center" | "right" } {
    if (!this.pensUserDefend()) return { scored: true, shotDir: "center" };
    this.currentPenTaker();
    const shotDir = (["left", "center", "right"] as const)[Math.floor(Math.random() * 3)];
    const scored = shotDir !== dir;
    this.resolveKick(scored);
    return { scored, shotDir };
  }

  private resolveKick(scored: boolean) {
    if (this.phase !== "pens" || !this.pens || !this.penTaker) return;
    const P = this.pens;
    const side = P.turn;
    const taker = this.penTaker;
    this.penTaker = null;
    this.rate(taker, side, scored ? 0.4 : -0.5);
    (side === "home" ? P.home : P.away).push(scored);
    this.push("pen", say(scored ? "penScored" : "penMissed", { player: lastName(taker.p) }), side);
    this.events[this.events.length - 1].penScored = scored;
    P.turn = this.opp(side);
    P.kicks++;

    const hs = P.home.filter(Boolean).length;
    const as = P.away.filter(Boolean).length;
    const hTaken = P.home.length;
    const aTaken = P.away.length;
    // Decided early or after 5 each (then sudden death pairs)
    const decided =
      (hTaken >= 5 && aTaken >= 5 && hTaken === aTaken && hs !== as) ||
      (hTaken < 5 || aTaken < 5
        ? hs > as + (5 - aTaken) || as > hs + (5 - hTaken)
        : false);
    if (decided) {
      this.highlight("pens", hs > as ? "home" : "away", `Penalties won ${Math.max(hs, as)}–${Math.min(hs, as)}`);
      this.finish(hs > as ? "home" : "away");
    }
  }

  /* ---------------- live coaching ---------------- */
  setTactics(which: "home" | "away", t: TacticsSettings) {
    this.side(which).tactics = { ...t };
  }

  setFormation(which: "home" | "away", slots: Slot[], remap: (xi: Player[], slots: Slot[]) => Record<string, Player | undefined>) {
    const s = this.side(which);
    const active = s.players.filter((rp) => !rp.off);
    const assigned = remap(active.map((rp) => rp.p), slots);
    const offOnes = s.players.filter((rp) => rp.off);
    s.players = slots
      .map((slot) => {
        const p = assigned[slot.id];
        if (!p) return null;
        const prev = s.players.find((rp) => rp.p.id === p.id);
        const a = this.anchor(slot, s.isHome, 0);
        return { p, slot, x: prev?.x ?? a.x, y: prev?.y ?? a.y, wanderSeed: prev?.wanderSeed ?? Math.random() * 1000, off: false, booked: prev?.booked ?? false, stamina: prev?.stamina ?? 100, subbedOn: prev?.subbedOn ?? false };
      })
      .filter(Boolean) as RuntimePlayer[];
    s.players.push(...offOnes);
    this.carrier = Math.min(this.carrier, s.players.length - 1);
  }

  makeSub(which: "home" | "away", outPlayerId: string, inPlayer: Player): boolean {
    const s = this.side(which);
    if (s.subsMade >= 5) return false;
    const rp = s.players.find((x) => x.p.id === outPlayerId && !x.off);
    if (!rp) return false;
    const offName = lastName(rp.p);
    s.bench = s.bench.filter((b) => b.id !== inPlayer.id);
    rp.p = inPlayer;
    rp.booked = false; // fresh legs, clean slate
    rp.stamina = 100;
    rp.subbedOn = true;
    rp.subbedOnAt = this.minute;
    s.subsMade++;
    this.push("sub", say("sub", { player: lastName(inPlayer), team: s.entry.name }), which);
    this.events[this.events.length - 1].swaps = [{ on: lastName(inPlayer), off: offName }];
    return true;
  }

  /* ---------------- movement ---------------- */
  private drift(dtMin: number) {
    // Field tilt: everyone shifts toward the ball's end of the pitch.
    const ballTilt = (this.ball.x - 50) / 50; // -1..1
    for (const which of ["home", "away"] as const) {
      const s = this.side(which);
      const attacking = this.possession === which;
      const men = (s.tactics.mentality - 50) * 0.08;
      const width = (s.tactics.width - 50) * 0.06;
      for (let i = 0; i < s.players.length; i++) {
        const rp = s.players[i];
        if (rp.off) continue;
        const isCarrier = attacking && i === this.carrier;
        // Attackers push up with the ball; defenders drop toward it.
        const tiltPush = (which === "home" ? ballTilt : -ballTilt) * 9;
        const push = (attacking ? 15 : -6) + men + tiltPush;
        const a = this.anchor(rp.slot, s.isHome, push);
        const wx = Math.sin(this.time * 2.1 + rp.wanderSeed) * 2;
        const wy = Math.cos(this.time * 1.7 + rp.wanderSeed * 1.3) * (2 + Math.abs(width));
        let tx: number, ty: number;
        if (isCarrier && (this.action.kind === "dwell" || this.action.kind === "dribble")) {
          // The man on the ball goes where the ball goes.
          tx = this.ballTarget.x;
          ty = this.ballTarget.y;
        } else {
          // Ball gravity: nearby players close down the ball.
          const dx = this.ball.x - rp.x;
          const dy = this.ball.y - rp.y;
          const dist = Math.hypot(dx, dy) || 1;
          const pull = dist < 20 && rp.slot.kind !== "GK" ? (attacking ? 3 : 5) / dist : 0;
          tx = a.x + wx + dx * pull;
          ty = a.y + wy + dy * pull;
        }
        const ease = 1 - Math.pow(isCarrier ? 0.0002 : 0.0018, dtMin); // carrier tracks the ball tightly
        rp.x += (clamp(tx, 2, 98) - rp.x) * ease;
        rp.y += (clamp(ty, 2, 98) - rp.y) * ease;
      }
    }
  }
}
