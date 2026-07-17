// Club crests. Files in src/assets/logos/ are named `<clubId>.<ext>`
// and picked up automatically.
const LOGO_MODULES = import.meta.glob<string>("../assets/logos/*.{png,webp,svg,avif,jpg,jpeg}", {
  eager: true,
  import: "default",
});

const LOGOS: Record<string, string> = {};
for (const [path, url] of Object.entries(LOGO_MODULES)) {
  const id = path.split("/").pop()!.replace(/\.[a-z]+$/, "");
  LOGOS[id] = url;
}

export function clubLogo(clubId: string | undefined): string | undefined {
  return clubId ? LOGOS[clubId] : undefined;
}
