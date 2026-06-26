/* ===== data.js — statische Spieldaten ===== */
const DATA = {};

/* Elemente mit Anzeige + Vorteils-Beziehungen.
   strong = Element, gegen das dieses Element +20% Schaden macht. */
DATA.elements = {
  feuer:    { name: "Feuer",    icon: "🔥", color: "var(--el-feuer)",    strong: "natur" },
  natur:    { name: "Natur",    icon: "🌿", color: "var(--el-natur)",    strong: "wasser" },
  wasser:   { name: "Wasser",   icon: "💧", color: "var(--el-wasser)",   strong: "feuer" },
  licht:    { name: "Licht",    icon: "✨", color: "var(--el-licht)",    strong: "schatten" },
  schatten: { name: "Schatten", icon: "🌑", color: "var(--el-schatten)", strong: "licht" },
};

/* Seltenheiten: Stat-Multiplikator + Farbe (20 Ränge; jeder ≥ 3× der vorherige → jede Fusion mindestens doppelt so stark)
   Formel: Normal=1, dann abwechselnd ×3 und ×3.33 → 1, 3, 10, 30, 100, 300 … 3 000 000 000
   Höchster Rang (Unaussprechlich) fused = Basis × 3 000 000 000 × 3.5 → dreistellige Milliarden ✓ */
DATA.rarities = {
  normal:          { name: "Normal",          mult:                1, color: "var(--r-normal)",          order:  0 },
  selten:          { name: "Selten",          mult:                3, color: "var(--r-selten)",          order:  1 },
  episch:          { name: "Episch",          mult:               10, color: "var(--r-episch)",          order:  2 },
  legendaer:       { name: "Legendär",        mult:               30, color: "var(--r-legendaer)",       order:  3 },
  mythisch:        { name: "Mythisch",        mult:              100, color: "var(--r-mythisch)",        order:  4 },
  goettlich:       { name: "Göttlich",        mult:              300, color: "var(--r-goettlich)",       order:  5 },
  uralt:           { name: "Uralt",           mult:            1_000, color: "var(--r-uralt)",           order:  6 },
  kosmisch:        { name: "Kosmisch",        mult:            3_000, color: "var(--r-kosmisch)",        order:  7 },
  titanisch:       { name: "Titanisch",       mult:           10_000, color: "var(--r-titanisch)",       order:  8 },
  transzendent:    { name: "Transzendent",    mult:           30_000, color: "var(--r-transzendent)",    order:  9 },
  erhaben:         { name: "Erhaben",         mult:          100_000, color: "var(--r-erhaben)",         order: 10 },
  archaisch:       { name: "Archaisch",       mult:          300_000, color: "var(--r-archaisch)",       order: 11 },
  abyssal:         { name: "Abyssal",         mult:        1_000_000, color: "var(--r-abyssal)",         order: 12 },
  primordial:      { name: "Primordial",      mult:        3_000_000, color: "var(--r-primordial)",      order: 13 },
  weltgeist:       { name: "Weltgeist",       mult:       10_000_000, color: "var(--r-weltgeist)",       order: 14 },
  schoepfer:       { name: "Schöpfer",        mult:       30_000_000, color: "var(--r-schoepfer)",       order: 15 },
  goettervater:    { name: "Göttervater",     mult:      100_000_000, color: "var(--r-goettervater)",    order: 16 },
  absolut:         { name: "Absolut",         mult:      300_000_000, color: "var(--r-absolut)",         order: 17 },
  jenseitig:       { name: "Jenseitig",       mult:    1_000_000_000, color: "var(--r-jenseitig)",       order: 18 },
  unaussprechlich: { name: "Unaussprechlich", mult:    3_000_000_000, color: "var(--r-unaussprechlich)", order: 19 },
};
/* Reihenfolge der Ränge (für Fusion-Aufstieg) */
DATA.rarityOrder = [
  "normal", "selten", "episch", "legendaer", "mythisch",
  "goettlich", "uralt", "kosmisch", "titanisch", "transzendent",
  "erhaben", "archaisch", "abyssal", "primordial", "weltgeist",
  "schoepfer", "goettervater", "absolut", "jenseitig", "unaussprechlich",
];

/* Monster-Vorlagen. Basiswerte ~ Normal-Niveau; Seltenheit multipliziert.
   ANGREIFER (ATK >> DEF): Flammenwolf, Schattenkatze, Glutbär, Frostfuchs, Inferno-Phönix, Schattendrache
   TANKER    (DEF >> ATK): Aquageist, Blattgolem, Lichtfee, Ranken-Tiger, Tidal-Kraken, Wald-Älteste, Licht-Greif */
DATA.templates = {
  // ---- Normal — Angreifer ----
  flammenwolf:   { name: "Flammenwolf",    emoji: "🐺",  element: "feuer",    rarity: "normal",    hp: 100, attack: 20, defense:  4 },
  schattenkatze: { name: "Schattenkatze",  emoji: "🐈‍⬛", element: "schatten", rarity: "normal",    hp:  80, attack: 26, defense:  2 },
  // ---- Normal — Tanker ----
  aquageist:     { name: "Aquageist",      emoji: "🐟",  element: "wasser",   rarity: "normal",    hp: 125, attack:  8, defense: 20 },
  blattgolem:    { name: "Blattgolem",     emoji: "🌱",  element: "natur",    rarity: "normal",    hp: 145, attack:  6, defense: 24 },
  lichtfee:      { name: "Lichtfee",       emoji: "🧚",  element: "licht",    rarity: "normal",    hp: 100, attack: 14, defense: 14 },

  // ---- Selten — Angreifer ----
  glutbaer:      { name: "Glutbär",        emoji: "🐻",  element: "feuer",    rarity: "selten",    hp: 155, attack: 32, defense:  8 },
  frostfuchs:    { name: "Frostfuchs",     emoji: "🦊",  element: "wasser",   rarity: "selten",    hp: 145, attack: 28, defense:  6 },
  // ---- Selten — Tanker ----
  rankentiger:   { name: "Ranken-Tiger",   emoji: "🐯",  element: "natur",    rarity: "selten",    hp: 180, attack: 16, defense: 30 },

  // ---- Episch — Angreifer ----
  infernophoenix:{ name: "Inferno-Phönix", emoji: "🦅",  element: "feuer",    rarity: "episch",    hp: 215, attack: 48, defense: 10 },
  // ---- Episch — Tanker ----
  tidalkraken:   { name: "Tidal-Kraken",   emoji: "🦑",  element: "wasser",   rarity: "episch",    hp: 260, attack: 22, defense: 44 },
  waldaelteste:  { name: "Wald-Älteste",   emoji: "🦌",  element: "natur",    rarity: "episch",    hp: 280, attack: 16, defense: 42 },

  // ---- Legendär — Angreifer ----
  schattendrache:{ name: "Schattendrache", emoji: "🐉",  element: "schatten", rarity: "legendaer", hp: 335, attack: 62, defense: 14 },
  // ---- Legendär — Tanker/Allrounder ----
  lichtgreif:    { name: "Licht-Greif",    emoji: "🦁",  element: "licht",    rarity: "legendaer", hp: 320, attack: 40, defense: 44 },
};

/* Vorlagen nach Seltenheit gruppiert (für Summon; höhere Ränge nur via Fusion) */
DATA.templatesByRarity = (() => {
  const map = { normal: [], selten: [], episch: [], legendaer: [], mythisch: [] };
  for (const id in DATA.templates) {
    const r = DATA.templates[id].rarity;
    if (map[r]) map[r].push(id);
  }
  return map;
})();

/* Ei-Typen: das neue Beschwörungs-System.
   dropMinLevel = ab welchem Spielerlevel dieses Ei aus Stage/WB droppen kann.
   dropWeight   = relative Häufigkeit im Drop-Pool (höher = häufiger). */
DATA.eggTypes = [
  {
    id: "standard", name: "Standard-Ei", emoji: "🥚", currency: "gold", cost: 150, minLevel: 1,
    dropMinLevel: 1, dropWeight: 10,
    table: [
      { rarity: "normal", chance: 0.70 }, { rarity: "selten", chance: 0.20 },
      { rarity: "episch", chance: 0.08 }, { rarity: "legendaer", chance: 0.02 },
    ],
  },
  {
    id: "premium", name: "Premium-Ei", emoji: "✨🥚", currency: "gold", cost: 1500, minLevel: 5,
    dropMinLevel: 5, dropWeight: 6,
    table: [
      { rarity: "normal", chance: 0.30 }, { rarity: "selten", chance: 0.40 },
      { rarity: "episch", chance: 0.22 }, { rarity: "legendaer", chance: 0.075 },
      { rarity: "mythisch", chance: 0.005 },
    ],
  },
  {
    id: "elite", name: "Elite-Ei", emoji: "💎🥚", currency: "crystals", cost: 60, minLevel: 12,
    dropMinLevel: 15, dropWeight: 4,
    table: [
      { rarity: "selten", chance: 0.45 }, { rarity: "episch", chance: 0.35 },
      { rarity: "legendaer", chance: 0.17 }, { rarity: "mythisch", chance: 0.03 },
    ],
  },
  {
    id: "mythic", name: "Mythisch-Ei", emoji: "🌌🥚", currency: "gold", cost: 10000, minLevel: 20,
    dropMinLevel: 30, dropWeight: 3,
    table: [
      { rarity: "episch", chance: 0.50 }, { rarity: "legendaer", chance: 0.40 },
      { rarity: "mythisch", chance: 0.10 },
    ],
  },
  {
    id: "divine", name: "Göttlich-Ei", emoji: "👼🥚", currency: "gold", cost: 80000, minLevel: 30,
    dropMinLevel: 50, dropWeight: 2,
    table: [
      { rarity: "legendaer", chance: 0.50 }, { rarity: "mythisch", chance: 0.38 },
      { rarity: "goettlich", chance: 0.12 },
    ],
  },
  {
    id: "cosmic", name: "Kosmisch-Ei", emoji: "🪐🥚", currency: "crystals", cost: 500, minLevel: 45,
    dropMinLevel: 65, dropWeight: 1,
    table: [
      { rarity: "mythisch", chance: 0.45 }, { rarity: "goettlich", chance: 0.38 },
      { rarity: "uralt", chance: 0.14 }, { rarity: "kosmisch", chance: 0.03 },
    ],
  },
  {
    id: "transcend", name: "Transzendenz-Ei", emoji: "🌠🥚", currency: "gold", cost: 1500000, minLevel: 60,
    // Kein Drop (nur kaufbar)
    table: [
      { rarity: "goettlich", chance: 0.40 }, { rarity: "uralt", chance: 0.30 },
      { rarity: "kosmisch", chance: 0.20 }, { rarity: "titanisch", chance: 0.08 },
      { rarity: "transzendent", chance: 0.02 },
    ],
  },
];
DATA.summonBanners = DATA.eggTypes; // Rückwärtskompatibilität

/* Rang-Titel für fusionierte Monster (alle 19 Fusionsziele = alle Ränge außer Normal) */
DATA.rarityTitles = {
  selten:          "Veredelter",
  episch:          "Grimmiger",
  legendaer:       "Königlicher",
  mythisch:        "Mythischer",
  goettlich:       "Göttlicher",
  uralt:           "Urzeitlicher",
  kosmisch:        "Kosmischer",
  titanisch:       "Titanischer",
  transzendent:    "Transzendenter",
  erhaben:         "Erhabener",
  archaisch:       "Archaischer",
  abyssal:         "Abyssaler",
  primordial:      "Primordialer",
  weltgeist:       "Weltgeistiger",
  schoepfer:       "Schöpferischer",
  goettervater:    "Göttervaterlicher",
  absolut:         "Absoluter",
  jenseitig:       "Jenseitiger",
  unaussprechlich: "Unaussprechlicher",
};
/* Rückwärtskompatibilität (altes Standard-Banner) */
DATA.summonCost = 100;

/* WorldBoss-Konfiguration */
DATA.worldBoss = {
  emojis: ["🌌", "🐲", "👹", "🦏", "🦖", "🐙"],
  names: ["Weltenfresser", "Titanwurm", "Höllenkoloss", "Urdrache", "Leviathan", "Sternenbestie"],
  baseHp: 8000000, hpGrowth: 2.5,
  dmgPct: 0.10,
  goldBase: 1000, goldLevelPow: 1.5,
};

/* Fähigkeiten-Pool für Fusion (zufällige Bonus-Fähigkeit) */
DATA.fusionSkills = ["Raserei", "Eisenschild", "Doppelhieb", "Urgewalt", "Seelenfraß", "Lichtbann"];

/* Gegner-Pool nach Level-Band. Basiswerte werden mit der Formel skaliert. */
DATA.enemyTiers = [
  { max: 9,    pool: [
    { name: "Goblin",   emoji: "👺" }, { name: "Schleim", emoji: "🟢" },
    { name: "Ratte",    emoji: "🐀" }, { name: "Fledermaus", emoji: "🦇" },
  ]},
  { max: 24,   pool: [
    { name: "Ork",      emoji: "👹" }, { name: "Skelett", emoji: "💀" },
    { name: "Riesenspinne", emoji: "🕷️" }, { name: "Wildwolf", emoji: "🐺" },
  ]},
  { max: 49,   pool: [
    { name: "Troll",    emoji: "🧌" }, { name: "Steingolem", emoji: "🗿" },
    { name: "Hexe",     emoji: "🧙" }, { name: "Basilisk", emoji: "🦎" },
  ]},
  { max: 99,   pool: [
    { name: "Dämon",    emoji: "😈" }, { name: "Hydra", emoji: "🐲" },
    { name: "Wyvern",   emoji: "🦖" }, { name: "Lich", emoji: "☠️" },
  ]},
  { max: Infinity, pool: [
    { name: "Drachenlord",  emoji: "🐉" }, { name: "Titan", emoji: "🏔️" },
    { name: "Schattenfürst",emoji: "🌑" }, { name: "Weltenfresser", emoji: "👾" },
  ]},
];

/* Gegner-Basiswerte (Level-1-Goblin = HP50 / Atk5 / Reward20 lt. Spec) */
DATA.enemyBase = { hp: 80, attack: 4, reward: 5 };

/* Offline-Cap in Sekunden (8 Stunden) */
DATA.offlineCapSeconds = 8 * 3600;

/* eindeutige ID */
DATA.uid = () => "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* nächst-höhere Seltenheit (für Fusion-Aufstieg) */
DATA.nextRarity = (r) => {
  const i = DATA.rarityOrder.indexOf(r);
  return DATA.rarityOrder[Math.min(i + 1, DATA.rarityOrder.length - 1)];
};
