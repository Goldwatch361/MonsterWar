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
   HP-Kurvenform: wert = base · lv^poly · levelGrowth^lv (Poly formt das Early-Game).
   ATK/Gold-Kurvenform: reine Stage-Basis (kein Level-Bezug), steigt in Blöcken von X Stages:
     Basis(stage) = base · stageGrowth^floor((stage-1) / stageBlock)
     Normale Welle = Basis(stage) · normalMult
     Boss-Welle    = Basis(stage) · bossMult
   levelGrowth = 1.85^(1/1000) → Gegner-HP wächst pro 200 Stages (= 1000 Level) um ×1,85,
   exakt im Takt der Monster-Stat-Kurve (statGrowth pro Rang). → ~200 Stages pro Rang. */
DATA.battleTuning = {
  varianceMin: 0.85, varianceRange: 0.30,   // Schadens-Varianz: 0.85–1.15×
  defenseConstant: 0.6,                     // defReduction = def / (def + atk * K)
  defenseCap: 0.55,                         // max. Schadensreduktion durch Verteidigung
  enemyDmgFloor: 0.06,                      // Mindest-Schaden pro Gegner-Treffer: 6% der Ziel-MaxHP — hält Farmen deutlich spürbar, ohne die Wände zu verschieben
  enemyDmgFloorMinLevel: 50,                // Boden erst ab diesem Gegner-Level (schont das Early-Game / den Starter)
  levelGrowth: Math.pow(1.85, 1 / 1000),    // ≈ 1.000616 pro Level (nur noch HP)
  enemyHpBase: 100, enemyHpPoly: 0.3,
  bossHpMult: 2.5,
  enemyAtkBase: 10,                         // Basis(Stage 1–10) = 10
  enemyAtkStageGrowth: 6,                   // Basis wird alle enemyAtkStageBlock Stages mit 6 multipliziert
  enemyAtkStageBlock: 10,                   // Basis bleibt 10 Stages lang konstant, danach nächster Sprung
  enemyAtkNormalMult: 1.85,                 // normale Welle = Basis * 1.85
  enemyAtkBossMult: 5,                      // Boss-Welle = Basis * 5
  goldNormalBase: 5,                        // Gold(Stage) = goldNormalBase * goldGrowth^(stage-1) (normale Welle)
  goldBossBase: 20,                         // Gold(Stage) = goldBossBase   * goldGrowth^(stage-1) (Boss-Welle)
  goldGrowth: 1.2,                          // reines Pro-Stage-Wachstum, kein Block mehr
};

/* Spieler-/Expeditions-XP-Kurven (Level^Exponent * Basis) */
DATA.progression = {
  playerXpBase: 100, playerXpExp: 1.5,
  expeditionXpBase: 150, expeditionXpExp: 1.6,
};

/* ---- Reise: täglicher Bonus + Achievements ---- */
/* Tägliche Belohnung: skaliert mit Spielerlevel, Reset um resetHour (lokale Zeit),
   Fenster [resetHour:00, nächster Tag resetHour:00) = 1 "Tag". Kein Ansammeln —
   wird das Fenster verpasst, verfällt die Belohnung ersatzlos (siehe Game.journeyClaim). */
DATA.dailyReward = {
  resetHour: 12,
  gold: (lvl) => lvl * 1000,
  eggId: "standard",
  eggCount: (lvl) => lvl * 10,
  crystals: 50,
};

/* Achievement-Kategorien. Jede Kategorie ist eine Liste von Tier-Definitionen
   mit {id, label, reward:{gold,crystals,eggId?,eggCount?}}; die jeweilige
   Erfüllungs-Bedingung wird generisch in Game.achievementDefs() ausgewertet
   (dort gemappt auf den passenden State-Pfad: dexSeen/mines/playSeconds/
   playerLevel/kills/stage.unlocked). Belohnungen werden automatisch bei
   Erfüllung vergeben (kein manueller Claim wie bei der Tagesbelohnung). */
DATA.achievements = {
  // (a) Rang komplett entdeckt — 1 Eintrag pro Rarity, Belohnung skaliert mit
  // Rang-Order nach demselben base*growth^order-Muster wie andere Ökonomie-
  // Formeln (z.B. fuseCost). Ei-Tier steigt mit, gedeckelt bei "cosmic" —
  // "transcend" bleibt der eigentlichen Progression vorbehalten.
  rankComplete: DATA.rarityOrder.map((rarity) => {
    const order = DATA.rarities[rarity].order;
    return {
      id: `rank_${rarity}`,
      rarity,
      label: `Alle ${DATA.rarities[rarity].name}-Monster entdeckt`,
      reward: {
        gold: Math.round(2000 * Math.pow(1.9, order)),
        crystals: Math.round(20 * Math.pow(1.5, order)),
        eggId: order >= 14 ? "cosmic" : order >= 9 ? "divine" : order >= 5 ? "elite" : order >= 2 ? "premium" : "standard",
        eggCount: 3,
      },
    };
  }),

  // (b) Alle Minen im Besitz (1 Tier)
  minesComplete: {
    id: "mines_all",
    label: "Alle Minen im Besitz",
    reward: { gold: 5_000_000, crystals: 500, eggId: "divine", eggCount: 5 },
  },

  // (c) Kampfzeit-Meilensteine (state.playSeconds — zählt nur aktive Kampf-Ticks).
  // Läuft nebenbei praktisch von selbst mit (kein aktives Zutun nötig) — Belohnung
  // daher deutlich niedriger als bei Stage (echte Progression).
  playtime: [
    { id: "pt_1", seconds: 600,          label: "10 Minuten gekämpft", reward: { gold: 1_000,      crystals: 3,   eggId: "standard", eggCount: 3 } },
    { id: "pt_2", seconds: 3600,         label: "1 Stunde gekämpft",   reward: { gold: 3_000,      crystals: 8,   eggId: "standard", eggCount: 5 } },
    { id: "pt_3", seconds: 6 * 3600,     label: "6 Stunden gekämpft",  reward: { gold: 15_000,     crystals: 20,  eggId: "premium",  eggCount: 5 } },
    { id: "pt_4", seconds: 24 * 3600,    label: "24 Stunden gekämpft", reward: { gold: 80_000,     crystals: 50,  eggId: "premium",  eggCount: 8 } },
    { id: "pt_5", seconds: 3 * 86400,    label: "3 Tage gekämpft",     reward: { gold: 500_000,    crystals: 120, eggId: "elite",    eggCount: 8 } },
    { id: "pt_6", seconds: 7 * 86400,    label: "1 Woche gekämpft",    reward: { gold: 3_000_000,  crystals: 300, eggId: "elite",    eggCount: 10 } },
    { id: "pt_7", seconds: 14 * 86400,   label: "2 Wochen gekämpft",   reward: { gold: 15_000_000, crystals: 800, eggId: "mythic",   eggCount: 10 } },
  ],

  // (d) Spielerlevel-Meilensteine (state.playerLevel) — echter Fortschritts-Meilenstein
  // (Level-Kurve wird steiler, Aufstieg wird zunehmend schwerer), daher nah an Stage
  // dran statt bei Kampfzeit/Kills.
  playerLevel: [
    { id: "lvl_1", level: 5,   label: "Level 5 erreicht",   reward: { gold: 10_000,        crystals: 20,   eggId: "standard", eggCount: 6 } },
    { id: "lvl_2", level: 15,  label: "Level 15 erreicht",  reward: { gold: 100_000,       crystals: 80,   eggId: "premium",  eggCount: 8 } },
    { id: "lvl_3", level: 30,  label: "Level 30 erreicht",  reward: { gold: 1_000_000,     crystals: 300,  eggId: "elite",    eggCount: 12 } },
    { id: "lvl_4", level: 50,  label: "Level 50 erreicht",  reward: { gold: 8_000_000,     crystals: 800,  eggId: "mythic",   eggCount: 15 } },
    { id: "lvl_5", level: 75,  label: "Level 75 erreicht",  reward: { gold: 60_000_000,    crystals: 2000, eggId: "divine",   eggCount: 18 } },
    { id: "lvl_6", level: 100, label: "Level 100 erreicht", reward: { gold: 400_000_000,   crystals: 5000, eggId: "cosmic",   eggCount: 20 } },
    { id: "lvl_7", level: 150, label: "Level 150 erreicht", reward: { gold: 2_500_000_000, crystals: 12000,eggId: "cosmic",   eggCount: 25 } },
  ],

  // (e) Gegner-Kills-Meilensteine (state.kills — Stage- + WorldBoss-Kills zusammen).
  // Läuft beim Dauer-Kämpfen automatisch mit hoch — Belohnung entsprechend gedämpft.
  kills: [
    { id: "kill_1", kills: 50,        label: "50 Gegner besiegt",       reward: { gold: 1_000,      crystals: 3,   eggId: "standard", eggCount: 3 } },
    { id: "kill_2", kills: 500,       label: "500 Gegner besiegt",      reward: { gold: 4_000,      crystals: 10,  eggId: "standard", eggCount: 5 } },
    { id: "kill_3", kills: 2500,      label: "2.500 Gegner besiegt",    reward: { gold: 25_000,     crystals: 25,  eggId: "premium",  eggCount: 5 } },
    { id: "kill_4", kills: 10000,     label: "10.000 Gegner besiegt",   reward: { gold: 150_000,    crystals: 60,  eggId: "elite",    eggCount: 8 } },
    { id: "kill_5", kills: 50000,     label: "50.000 Gegner besiegt",   reward: { gold: 1_000_000,  crystals: 150, eggId: "elite",    eggCount: 10 } },
    { id: "kill_6", kills: 200000,    label: "200.000 Gegner besiegt",  reward: { gold: 6_000_000,  crystals: 400, eggId: "mythic",   eggCount: 10 } },
    { id: "kill_7", kills: 1_000_000, label: "1 Mio. Gegner besiegt",   reward: { gold: 30_000_000, crystals: 1000,eggId: "divine",   eggCount: 12 } },
  ],

  // (f) Stage-Meilensteine (state.stage.unlocked) — erfordert echte Progression
  // (Team-Stärke/Fusion), daher spürbar höhere Belohnung als Kampfzeit/Kills.
  stage: [
    { id: "stg_1", stage: 10,   label: "Stage 10 erreicht",    reward: { gold: 20_000,        crystals: 30,   eggId: "standard", eggCount: 8 } },
    { id: "stg_2", stage: 50,   label: "Stage 50 erreicht",    reward: { gold: 200_000,       crystals: 120,  eggId: "premium",  eggCount: 10 } },
    { id: "stg_3", stage: 200,  label: "Stage 200 erreicht",   reward: { gold: 1_500_000,     crystals: 400,  eggId: "elite",    eggCount: 15 } },
    { id: "stg_4", stage: 500,  label: "Stage 500 erreicht",   reward: { gold: 12_000_000,    crystals: 1000, eggId: "mythic",   eggCount: 15 } },
    { id: "stg_5", stage: 1000, label: "Stage 1.000 erreicht", reward: { gold: 100_000_000,   crystals: 2500, eggId: "divine",   eggCount: 20 } },
    { id: "stg_6", stage: 2500, label: "Stage 2.500 erreicht", reward: { gold: 600_000_000,   crystals: 6000, eggId: "cosmic",   eggCount: 20 } },
    { id: "stg_7", stage: 4000, label: "Stage 4.000 erreicht", reward: { gold: 4_000_000_000, crystals: 15000,eggId: "cosmic",   eggCount: 25 } },
  ],
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
