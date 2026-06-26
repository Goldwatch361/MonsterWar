/* ===== game.js — Spielzustand & Aktionen ===== */
const Game = {
  state: null,
  MAX_TEAM: 5,

  /* Frischer Startzustand (Erststart) */
  newGame() {
    const starter = Monster.create("flammenwolf");
    Game.state = {
      version: Save.VERSION,
      gold: 50,
      playerLevel: 1,
      playerExp: 0,
      team: [starter],
      collection: [starter],
      inventory: { eggs: 0, crystals: 0, upgradeStones: 0 },
      enemy: null,
      stage: { current: 1, unlocked: 1, wave: 1, best: {} },
      worldBoss: { level: 1, best: 0 },
      kills: 0,
      goldEarned: 0,
      xpEarned: 0,
      playSeconds: 0,
      settings: { sound: true, autosave: true },
      lastSaveTime: Date.now(),
    };
    Battle.startStage(1); // Stage 1 starten + ersten Gegner spawnen
    return true;
  },

  /* Laden oder neues Spiel; gibt true zurück, wenn Erststart */
  init() {
    const loaded = Save.loadGame();
    if (loaded) {
      Game.state = loaded;
      if (!Game.state.stage) Game.state.stage = { current: 1, unlocked: 1, wave: 1, best: {} };
      if (!Game.state.worldBoss) Game.state.worldBoss = { level: 1, best: 0 };
      if (Game.state.playerExp == null) Game.state.playerExp = 0;
      // Referenz-Integrität: Team-Einträge sollen auf Collection-Objekte zeigen
      Game.state.team = Game.state.team
        .map(tm => Game.state.collection.find(c => c.id === tm.id))
        .filter(Boolean);
      // Stage wird beim Laden neu gestartet (Welle 1, Team geheilt)
      Battle.startStage(Game.state.stage.current);
      return false; // kein Erststart
    }
    Game.newGame();
    return true; // Erststart
  },

  /* ---- Gesamt-Stärke der gesamten Sammlung (für Topbar-Anzeige) ---- */
  totalAttack() {
    return Game.state.collection.reduce((sum, m) => sum + m.attack, 0);
  },
  totalDefense() {
    return Game.state.collection.reduce((sum, m) => sum + m.defense, 0);
  },
  totalHP() {
    return Game.state.collection.reduce((sum, m) => sum + m.maxHp, 0);
  },

  /* Wie viele identische Monster (gleiche Gruppe) man besitzt */
  groupCount(m) {
    const k = Game.groupKey(m);
    return Game.state.collection.filter(x => Game.groupKey(x) === k).length;
  },

  /* ---- Spieler-Erfahrung ---- */
  playerExpToNext(level = Game.state.playerLevel) {
    return Math.round(100 * Math.pow(level, 1.5));
  },
  addPlayerExp(amount) {
    const s = Game.state;
    s.playerExp = (s.playerExp || 0) + amount;
    let ups = 0;
    while (s.playerExp >= Game.playerExpToNext()) {
      s.playerExp -= Game.playerExpToNext();
      s.playerLevel++;
      ups++;
    }
    if (ups > 0) UI.toast("⭐ Spieler-Level " + s.playerLevel + "!", "good");
  },

  /* ---- Kampf-Navigation: Modus → (Team-Auswahl) → (Stage-Auswahl) → Kampf ---- */
  // 1) Modus gewählt
  chooseMode(mode) {
    UI.pendingMode = mode;
    if (mode === "worldboss") {
      // WorldBoss braucht KEINE Team-Auswahl — er nutzt die gesamte Sammlung (= Anzeige oben)
      Battle.startWorldBoss(Game.state.worldBoss.level);
      UI.kampfView = "fight";
    } else {
      Battle.mode = null;           // noch nicht kämpfen
      UI.kampfView = "team";        // Stage: zuerst Team wählen
    }
    UI.render();
  },
  // 2) Team bestätigt (nur Stage)
  confirmTeam() {
    if (Game.state.team.length < 1) { UI.toast("Wähle mindestens 1 Monster!", "bad"); return; }
    UI.kampfView = "stageSelect";
    UI.render();
  },
  // 3) Stage aus der Auswahl starten
  startStageRun(n) {
    const s = Game.state;
    if (n < 1 || n > s.stage.unlocked) return;
    Battle.mode = "stage";
    // Grenz-Lauf (Frontier): die aktuell höchste freigeschaltete Stage → danach automatisch weiter
    Battle.frontier = (n === s.stage.unlocked);
    Battle.startStage(n);
    UI.kampfView = "fight";
    UI.render();
  },
  restartStageRun() {
    Game.startStageRun(Game.state.stage.current);
  },
  restartWorldBoss() {
    Battle.startWorldBoss(Game.state.worldBoss.level);
    UI.render();
  },

  // Navigation zurück
  backToModes() { Battle.mode = null; Battle.wbClearTimers(); UI.kampfView = "modes"; UI.render(); },
  backToTeam() { Battle.mode = null; UI.kampfView = "team"; UI.render(); },
  backToStageSelect() { Battle.mode = null; UI.kampfView = "stageSelect"; UI.render(); },

  findMonster(id) {
    return Game.state.collection.find(m => m.id === id);
  },

  /* Sortierte Kopie der Sammlung: Seltenheit ↓, Angriff ↓, Name ↑ */
  sortedCollection() {
    return Game.state.collection.slice().sort((a, b) => {
      const r = DATA.rarities[b.rarity].order - DATA.rarities[a.rarity].order;
      if (r !== 0) return r;
      if (b.attack !== a.attack) return b.attack - a.attack;
      return a.name.localeCompare(b.name);
    });
  },

  /* Die n stärksten Monster (für WorldBoss-Anzeige) */
  strongestMonsters(n) {
    return Game.state.collection.slice().sort((a, b) =>
      (b.attack + b.defense + b.maxHp * 0.1) - (a.attack + a.defense + a.maxHp * 0.1)
    ).slice(0, n);
  },

  addMonster(m) {
    // Neue Monster landen NUR in der Sammlung — Team wird manuell zusammengestellt
    Game.state.collection.push(m);
  },

  /* ---- Summon (mehrere Banner, Mehrfach-Beschwörung) ---- */
  SUMMON_MAX: 100, // Obergrenze für „Max"

  summonAffordable(banner) {
    const s = Game.state;
    const have = banner.currency === "crystals" ? s.inventory.crystals : s.gold;
    return Math.min(Game.SUMMON_MAX, Math.floor(have / banner.cost));
  },

  // count: Anzahl; "max" = so viele wie bezahlbar
  summon(bannerId, count = 1) {
    const s = Game.state;
    const banner = DATA.summonBanners.find(b => b.id === bannerId) || DATA.summonBanners[0];

    if (s.playerLevel < banner.minLevel) { UI.toast(`Erst ab Spieler-Level ${banner.minLevel}!`, "bad"); return; }

    let n = count === "max" ? Game.summonAffordable(banner) : count;
    n = Math.min(n, Game.summonAffordable(banner));
    if (n < 1) { UI.toast(banner.currency === "crystals" ? "Nicht genug Kristalle!" : "Nicht genug Gold!", "bad"); return; }

    const totalCost = banner.cost * n;
    if (banner.currency === "crystals") s.inventory.crystals -= totalCost;
    else s.gold -= totalCost;

    const counts = {};
    let best = null;
    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      let acc = 0, rarity = banner.table[0].rarity;
      for (const row of banner.table) { acc += row.chance; if (roll <= acc) { rarity = row.rarity; break; } }
      const mon = Monster.randomOfRarity(rarity);
      Game.addMonster(mon);
      counts[rarity] = (counts[rarity] || 0) + 1;
      if (!best || DATA.rarities[rarity].order > DATA.rarities[best].order) best = rarity;
    }

    if (n === 1) {
      UI.toast(`${banner.emoji} ${DATA.rarities[best].name}!`, DATA.rarities[best].order >= 1 ? "good" : "");
    } else {
      const summary = DATA.rarityOrder.filter(r => counts[r]).map(r => `${counts[r]}× ${DATA.rarities[r].name}`).join(", ");
      UI.toast(`${banner.emoji} ${n} Beschwörungen — bestes: ${DATA.rarities[best].name}`, "good");
      UI.modal(`<div class="emoji-xl">${banner.emoji}</div><h2>${n}× ${banner.name}</h2><p>${summary}</p>
        <button class="btn" style="margin-top:12px" onclick="UI.closeModal()">Super!</button>`);
    }
    UI.render();
  },

  hatchEgg() {
    const s = Game.state;
    if (s.inventory.eggs < 1) return;
    s.inventory.eggs--;
    // Ei: bessere Chancen als normaler Summon
    const roll = Math.random();
    const rarity = roll < 0.45 ? "normal" : roll < 0.8 ? "selten" : roll < 0.97 ? "episch" : "legendaer";
    const mon = Monster.randomOfRarity(rarity);
    Game.addMonster(mon);
    UI.toast(`🥚 Geschlüpft: ${mon.name} (${DATA.rarities[rarity].name})!`, "good");
    UI.render();
  },

  /* ---- Team ---- */
  toggleTeam(id) {
    const s = Game.state;
    const idx = s.team.findIndex(m => m.id === id);
    if (idx >= 0) {
      if (s.team.length === 1) { UI.toast("Mindestens 1 Monster im Team!", "bad"); return; }
      s.team.splice(idx, 1);
    } else {
      if (s.team.length >= Game.MAX_TEAM) { UI.toast(`Team voll (max ${Game.MAX_TEAM})!`, "bad"); return; }
      const m = Game.findMonster(id);
      if (m) { Monster.heal(m); s.team.push(m); }
    }
    UI.render();
  },

  /* Aus einer Gruppe das stärkste, noch nicht eingesetzte Monster ins Team holen */
  teamAddFromGroup(key) {
    const s = Game.state;
    if (s.team.length >= Game.MAX_TEAM) { UI.toast(`Team voll (max ${Game.MAX_TEAM})!`, "bad"); return; }
    const group = Game.collectionGroups().find(g => g.key === key);
    if (!group) return;
    const cand = group.members.find(m => !s.team.some(t => t.id === m.id));
    if (!cand) return;
    Monster.heal(cand);
    s.team.push(cand);
    UI.render();
  },

  /* Aus einer Gruppe ein eingesetztes Monster aus dem Team nehmen */
  teamRemoveFromGroup(key) {
    const s = Game.state;
    const group = Game.collectionGroups().find(g => g.key === key);
    if (!group) return;
    const inTeam = group.members.find(m => s.team.some(t => t.id === m.id));
    if (!inTeam) return;
    if (s.team.length === 1) { UI.toast("Mindestens 1 Monster im Team!", "bad"); return; }
    s.team = s.team.filter(m => m.id !== inTeam.id);
    UI.render();
  },

  /* Team-Auswahl-Box: einzelnes Monster entfernen / Team leeren */
  teamRemoveById(id) {
    const s = Game.state;
    s.team = s.team.filter(m => m.id !== id);
    UI.render();
  },
  clearTeam() {
    Game.state.team = [];
    UI.render();
  },

  /* ---- Sammlung: identische Monster stapeln ---- */
  /* Gruppen-Schlüssel: gleiche Vorlage + gleiche Seltenheit + gleicher Name (= fusionierbar) */
  groupKey(m) { return m.templateId + "|" + m.rarity + "|" + m.name; },

  collectionGroups() {
    const map = new Map();
    for (const m of Game.state.collection) {
      const k = Game.groupKey(m);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    }
    const groups = [...map.entries()].map(([key, members]) => {
      const sample = members[0];
      return { key, members, count: members.length, sample };
    });
    // Sortierung: Seltenheit ↓, Angriff ↓, Name ↑
    groups.sort((A, B) => {
      const a = A.sample, b = B.sample;
      const r = DATA.rarities[b.rarity].order - DATA.rarities[a.rarity].order;
      if (r !== 0) return r;
      if (b.attack !== a.attack) return b.attack - a.attack;
      return a.name.localeCompare(b.name);
    });
    return groups;
  },

  /* Alle fusionierbaren Gruppen eines Rangs auf einmal max-fusionieren */
  fuseAllInRank(rarity) {
    const s = Game.state;
    let totalMade = 0, lastFused = null;
    // Snapshot der fusionsbaren Gruppen (Sammlung ändert sich beim Fusionieren)
    const keys = Game.collectionGroups()
      .filter(g => g.sample.rarity === rarity && g.count >= 2)
      .map(g => g.key);
    if (!keys.length) { UI.toast("Keine fusionierbaren Paare in diesem Rang.", "bad"); return; }
    for (const key of keys) {
      const g = Game.collectionGroups().find(gr => gr.key === key);
      if (!g || g.count < 2) continue;
      const members = g.members.slice();
      const pairs = Math.floor(members.length / 2);
      for (let i = 0; i < pairs; i++) {
        const a = members[2 * i], b = members[2 * i + 1];
        if (!Monster.canFuse(a, b)) break;
        const fused = Monster.fuse(a, b);
        s.collection = s.collection.filter(m => m.id !== a.id && m.id !== b.id);
        s.team = s.team.filter(m => m.id !== a.id && m.id !== b.id);
        Game.addMonster(fused);
        totalMade++; lastFused = fused;
      }
    }
    if (!totalMade) { UI.toast("Keine fusionierbaren Paare in diesem Rang.", "bad"); return; }
    UI.toast(`⚛ ${totalMade}× ${DATA.rarities[rarity].name} fusioniert → ${DATA.rarities[lastFused.rarity].name}!`, "good");
    UI.render();
  },

  /* ---- Fusion (Rang-bedingt: gleiche Vorlage + gleiche Seltenheit) ----
     pairs: Anzahl der Fusionen (je 2 Monster) oder "max". */
  fuseGroup(key, pairs = 1) {
    const s = Game.state;
    const group = Game.collectionGroups().find(g => g.key === key);
    if (!group || group.count < 2) { UI.toast("Mindestens 2 gleiche Monster nötig.", "bad"); return; }

    const maxPairs = Math.floor(group.count / 2);
    let p = pairs === "max" ? maxPairs : Math.min(parseInt(pairs, 10) || 1, maxPairs);
    if (p < 1) return;

    // paarweise fusionieren
    const members = group.members.slice();
    let made = 0, lastFused = null;
    for (let i = 0; i < p; i++) {
      const a = members[2 * i], b = members[2 * i + 1];
      if (!a || !b || !Monster.canFuse(a, b)) break;
      const fused = Monster.fuse(a, b);
      s.collection = s.collection.filter(m => m.id !== a.id && m.id !== b.id);
      s.team = s.team.filter(m => m.id !== a.id && m.id !== b.id);
      Game.addMonster(fused);
      made++; lastFused = fused;
    }
    if (made > 0) UI.toast(`⚛ ${made}× Fusion → ${lastFused.name} (${DATA.rarities[lastFused.rarity].name})!`, "good");
    UI.render();
  },

  /* ---- Settings ---- */
  toggleSetting(key) {
    Game.state.settings[key] = !Game.state.settings[key];
    UI.render();
  },

  manualSave() {
    if (Save.saveGame()) UI.toast("💾 Gespeichert!", "good");
    else UI.toast("Speichern fehlgeschlagen", "bad");
  },

  askReset() {
    UI.modal(`
      <div class="emoji-xl">🗑️</div>
      <h2>Spielstand löschen?</h2>
      <p>Alle Monster, Gold und Fortschritte gehen <b>unwiderruflich</b> verloren.</p>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn bad" onclick="Game.doReset()">Ja, löschen</button>
        <button class="btn ghost" onclick="UI.closeModal()">Abbrechen</button>
      </div>`);
  },

  doReset() {
    Save.resetGame();
    UI.closeModal();
    Game.newGame();
    UI.kampfView = "modes";
    UI.pendingMode = null;
    Battle.mode = null;
    UI.switchTab("home");
    UI.showTutorial();
    UI.toast("Neues Spiel gestartet", "good");
  },
};
