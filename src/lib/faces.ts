// Player face images. Drop new files into src/assets/faces/ named
// like `bukayo_saka.png` — they're picked up automatically.
const FACE_MODULES = import.meta.glob<string>("../assets/faces/*.{png,webp,avif,jpg,jpeg}", {
  eager: true,
  import: "default",
});

// Filenames that don't match the spelling used in the player data.
const ALIASES: Record<string, string> = {
  mohammedsalah: "mohamedsalah",
  mileslewisskelly: "myleslewisskelly",
  christianmosquera: "cristhianmosquera",
  boubakarcamara: "boubacarkamara",
  estevaowillian: "estevao",      // card shows Estêvão
  gabrielmagalhaes: "gabriel",    // card shows Gabriel
  papematarsarr: "papesarr",      // card shows Sarr
  totigomes: "toti",              // card shows Toti
  dominikszoboszlai: "dominicszoboszlai",
  // surname-only uploads
  kolomuani: "randalkolomuani",
  vandeven: "mickyvandeven",
};

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o") // ø doesn't decompose
    .replace(/ı/g, "i") // dotless ı
    .replace(/[^a-z]/g, "");
}

const FACES: Record<string, string> = {};
for (const [path, url] of Object.entries(FACE_MODULES)) {
  const file = path.split("/").pop()!.replace(/\.[a-z]+$/, "");
  const key = normalize(file);
  FACES[ALIASES[key] ?? key] = url;
}

export function faceFor(displayName: string): string | undefined {
  return FACES[normalize(displayName)];
}
