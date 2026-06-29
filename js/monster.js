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

  /* Neue Monster-Instanz aus Vorlage.
     Alles über dem Basis-Rang bekommt Titel + fused=true (×3.5 Stats) — egal ob Ei oder Fusion. */
  create(templateId, rarityOverride = null) {
    const t = DATA.templates[templateId];
    const rarity = rarityOverride || t.rarity;
    const aboveNormal = DATA.rarities[rarity].order > 0;
    const title = aboveNormal ? (DATA.rarityTitles[rarity] || "") : "";
    const m = {
      id: DATA.uid(),
      templateId,
      name: title ? `${title} ${t.name}` : t.name,
      emoji: t.emoji,
      element: t.element,
      rarity,
      fused: aboveNormal,
      baseHp: t.hp,
      baseAttack: t.attack,
      baseDefense: t.defense,
    };
    Monster.recalc(m, false);
    return m;
  },

  /* Zufälliges Monster einer Seltenheit — aus ALLEN Templates, Seltenheit immer überschreiben.
     Jedes Monster ist bei jedem Rang erhältlich. */
  randomOfRarity(rarity) {
    const all = Object.keys(DATA.templates);
    const id = all[Math.floor(Math.random() * all.length)];
    return Monster.create(id, rarity);
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
