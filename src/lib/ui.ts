/* Shared pill-button shapes so every screen's header/action controls match.
   One geometry (rounded-full · px-4 · py-2 · text-xs) across the whole app;
   only the fill/border changes with the button's role. */
export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-7 py-2.5 sm:py-3 text-xs font-semibold transition whitespace-nowrap";

/** Primary call-to-action (filled). */
export const btnPrimary = `${btnBase} bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110`;

/** Neutral secondary action (outlined). */
export const btnGhost = `${btnBase} border border-border bg-surface-2 hover:bg-surface hover:border-primary/40`;

/** Destructive action (red outline). */
export const btnDanger = `${btnBase} border border-primary/50 text-primary hover:bg-primary/10`;
