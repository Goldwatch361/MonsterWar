/* ===== monster.js — Monster-Erzeugung, Stats, Fusion (ohne Level/Attacken) ===== */
const Monster = {
  /* Stats = Basiswerte × Seltenheit (× 3.5 wenn fusioniert). Kein Level mehr. */
  recalc(m, keepRatio = true) {
    const rarityMult = DATA.rarities[m.rarity].mult;
    const fusedMult = m.fused ? 3.5 : 1;
    const ratio = (keepRatio && m.maxHp) ? Math.min(1, m.hp / m.maxHp) : 1;

    m.maxHp   = Math.round(m.baseHp      * rarityMult * fusedMult);
    m.attack  = Math.round(m.baseAttack  * rarityMult * fusedMult);
    m.defense = Math.round(m.baseDefense * rarityMult * fusedMult);

    m.hp = keepRatio ? Math.max(1, Math.round(m.maxHp * ratio)) : m.maxHp;
    return m;
  },

  /* Neue Monster-Instanz aus Vorlage */
  create(templateId, rarityOverride = null) {
    const t = DATA.templates[templateId];
    const m = {
      id: DATA.uid(),
      templateId,
      name: t.name,
      emoji: t.emoji,
      element: t.element,
      rarity: rarityOverride || t.rarity,
      fused: false,
      baseHp: t.hp,
      baseAttack: t.attack,
      baseDefense: t.defense,
    };
    Monster.recalc(m, false);
    return m;
  },

  /* Zufälliges Monster einer Seltenheit (Summon / Drop).
     Existiert keine Vorlage dieser Seltenheit (z.B. Mythisch), wird eine Vorlage der
     nächsthöchsten verfügbaren Seltenheit genommen und der Rang überschrieben. */
  randomOfRarity(rarity) {
    let pool = DATA.templatesByRarity[rarity];
    let override = null;
    if (!pool || pool.length === 0) {
      const order = ["mythisch", "legendaer", "episch", "selten", "normal"];
      for (const r of order) {
        if (DATA.templatesByRarity[r] && DATA.templatesByRarity[r].length) { pool = DATA.templatesByRarity[r]; break; }
      }
      override = rarity;
    }
    const id = pool[Math.floor(Math.random() * pool.length)];
    return Monster.create(id, override);
  },

  /* Voll heilen */
  heal(m) { m.hp = m.maxHp; },

  /* Fusion: gleiche Vorlage UND gleiche Seltenheit (Selten & Selten, …) */
  canFuse(a, b) {
    return a && b && a.id !== b.id && a.templateId === b.templateId && a.rarity === b.rarity;
  },

  fuse(a, b) {
    const m = Monster.create(a.templateId);
    m.fused = true;
    m.rarity = DATA.nextRarity(a.rarity); // Rang-Aufstieg (Pfad bis Transzendent)
    // Cooler, rang-abhängiger Name (basiert immer auf dem Vorlagennamen)
    const baseName = DATA.templates[m.templateId].name;
    const title = DATA.rarityTitles[m.rarity] || "";
    m.name = title ? `${title} ${baseName}` : baseName;
    Monster.recalc(m, false);
    return m;
  },
};
