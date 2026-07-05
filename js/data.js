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

/* Stat-Wachstum pro Rang: stat = basis × statGrowth^order (siehe Monster.recalc).
   1,85 → Unaussprechlich (Order 19) = ×119.196 gegenüber Normal. */
DATA.statGrowth = 1.85;

/* Seltenheiten: Name + Farbe + Rang-Order (20 Ränge). */
DATA.rarities = {
  normal:          { name: "Normal",          color: "var(--r-normal)",          order:  0 },
  selten:          { name: "Selten",          color: "var(--r-selten)",          order:  1 },
  episch:          { name: "Episch",          color: "var(--r-episch)",          order:  2 },
  legendaer:       { name: "Legendär",        color: "var(--r-legendaer)",       order:  3 },
  mythisch:        { name: "Mythisch",        color: "var(--r-mythisch)",        order:  4 },
  goettlich:       { name: "Göttlich",        color: "var(--r-goettlich)",       order:  5 },
  uralt:           { name: "Uralt",           color: "var(--r-uralt)",           order:  6 },
  kosmisch:        { name: "Kosmisch",        color: "var(--r-kosmisch)",        order:  7 },
  titanisch:       { name: "Titanisch",       color: "var(--r-titanisch)",       order:  8 },
  transzendent:    { name: "Transzendent",    color: "var(--r-transzendent)",    order:  9 },
  erhaben:         { name: "Erhaben",         color: "var(--r-erhaben)",         order: 10 },
  archaisch:       { name: "Archaisch",       color: "var(--r-archaisch)",       order: 11 },
  abyssal:         { name: "Abyssal",         color: "var(--r-abyssal)",         order: 12 },
  primordial:      { name: "Primordial",      color: "var(--r-primordial)",      order: 13 },
  weltgeist:       { name: "Weltgeist",       color: "var(--r-weltgeist)",       order: 14 },
  schoepfer:       { name: "Schöpfer",        color: "var(--r-schoepfer)",       order: 15 },
  goettervater:    { name: "Göttervater",     color: "var(--r-goettervater)",    order: 16 },
  absolut:         { name: "Absolut",         color: "var(--r-absolut)",         order: 17 },
  jenseitig:       { name: "Jenseitig",       color: "var(--r-jenseitig)",       order: 18 },
  unaussprechlich: { name: "Unaussprechlich", color: "var(--r-unaussprechlich)", order: 19 },
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
      { rarity: "normal", chance: 0.70 }, { rarity: "selten", chance: 0.30 },
    ],
  },
  {
    id: "premium", name: "Premium-Ei", emoji: "✨", currency: "gold", cost: 1500, minLevel: 5,
    dropMinLevel: 5, dropWeight: 6,
    table: [
      { rarity: "selten", chance: 0.70 }, { rarity: "episch", chance: 0.29 },
      { rarity: "legendaer", chance: 0.01 },
    ],
  },
  {
    id: "elite", name: "Elite-Ei", emoji: "💎", currency: "crystals", cost: 60, minLevel: 12,
    dropMinLevel: 15, dropWeight: 4,
    table: [
      { rarity: "episch", chance: 0.65 }, { rarity: "legendaer", chance: 0.30 },
      { rarity: "mythisch", chance: 0.05 },
    ],
  },
  {
    id: "mythic", name: "Mythisch-Ei", emoji: "🌌", currency: "gold", cost: 10000, minLevel: 20,
    dropMinLevel: 30, dropWeight: 3,
    table: [
      { rarity: "legendaer", chance: 0.60 }, { rarity: "mythisch", chance: 0.35 },
      { rarity: "goettlich", chance: 0.05 },
    ],
  },
  {
    id: "divine", name: "Göttlich-Ei", emoji: "👼", currency: "gold", cost: 25000, minLevel: 35,
    dropMinLevel: 50, dropWeight: 2,
    table: [
      { rarity: "mythisch", chance: 0.55 }, { rarity: "goettlich", chance: 0.35 },
      { rarity: "uralt", chance: 0.10 },
    ],
  },
  {
    id: "cosmic", name: "Kosmisch-Ei", emoji: "🪐", currency: "crystals", cost: 500, minLevel: 50,
    dropMinLevel: 65, dropWeight: 1,
    table: [
      { rarity: "goettlich", chance: 0.50 }, { rarity: "uralt", chance: 0.35 },
      { rarity: "kosmisch", chance: 0.13 }, { rarity: "titanisch", chance: 0.02 },
    ],
  },
  {
    id: "transcend", name: "Transzendenz-Ei", emoji: "🌠", currency: "gold", cost: 300000, minLevel: 70,
    dropMinLevel: 85, dropWeight: 1,
    table: [
      { rarity: "uralt", chance: 0.35 }, { rarity: "kosmisch", chance: 0.30 },
      { rarity: "titanisch", chance: 0.20 }, { rarity: "transzendent", chance: 0.10 },
      { rarity: "erhaben", chance: 0.04 }, { rarity: "archaisch", chance: 0.01 },
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
  baseHp: 150000, hpGrowth: 1.85, // hp = baseHp * hpGrowth^(lv-5) — wächst im Takt der Spielerstärke (statGrowth)
  dmgPct: 0.10,
  goldBase: 3000, goldGrowth: 1.9, // gold = goldBase * goldGrowth^(lv-1) — Ökonomie-Rate wie fuseCost
};

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

/* Kampf-Feintuning: alle Formel-Konstanten aus battle.js an einem Ort.
   Kurvenform: wert = base · lv^poly · levelGrowth^lv
   Der Poly-Anteil formt das Early-Game, der exponentielle Anteil trägt das Langzeit-Wachstum:
   levelGrowth = 1.85^(1/1000) → Gegner werden pro 200 Stages (= 1000 Level) um ×1,85 stärker,
   exakt im Takt der Monster-Stat-Kurve (statGrowth pro Rang). → ~200 Stages pro Rang. */
DATA.battleTuning = {
  varianceMin: 0.85, varianceRange: 0.30,   // Schadens-Varianz: 0.85–1.15×
  defenseConstant: 0.6,                     // defReduction = def / (def + atk * K)
  defenseCap: 0.55,                         // max. Schadensreduktion durch Verteidigung
  enemyDmgFloor: 0.03,                      // Mindest-Schaden pro Gegner-Treffer: 3% der Ziel-MaxHP — hält Farmen spürbar, ohne die Wände zu verschieben
  enemyDmgFloorMinLevel: 50,                // Boden erst ab diesem Gegner-Level (schont das Early-Game / den Starter)
  levelGrowth: Math.pow(1.85, 1 / 1000),    // ≈ 1.000616 pro Level
  enemyHpBase: 100, enemyHpPoly: 0.3,
  enemyAtkBase: 1.2, enemyAtkPoly: 0.5,
  rewardBase: 2,    rewardPoly: 0.35,
  bossHpMult: 2.5, bossAtkMult: 1.2, bossRewardMult: 3.0,
};

/* Spieler-/Expeditions-XP-Kurven (Level^Exponent * Basis) */
DATA.progression = {
  playerXpBase: 100, playerXpExp: 1.5,
  expeditionXpBase: 150, expeditionXpExp: 1.6,
};

/* Offline-Cap in Sekunden (8 Stunden) */
DATA.offlineCapSeconds = 8 * 3600;

/* eindeutige ID */
DATA.uid = () => "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* nächst-höhere Seltenheit (für Fusion-Aufstieg) */
DATA.nextRarity = (r) => {
  const i = DATA.rarityOrder.indexOf(r);
  return DATA.rarityOrder[Math.min(i + 1, DATA.rarityOrder.length - 1)];
};
