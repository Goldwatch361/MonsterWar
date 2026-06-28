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
      inventory: { eggs: { standard: 0, premium: 0, elite: 0, mythic: 0, divine: 0, cosmic: 0, transcend: 0 }, crystals: 0 },
      avatarMonsterId: starter.id,
      mines: { standard: { owned: false, lastCollect: 0 }, elite: { owned: false, lastCollect: 0 }, goettlich: { owned: false, lastCollect: 0 }, crystal: { owned: false, lastCollect: 0 } },
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
      // Eier-Migration: altes Format war eine Zahl → Objekt mit Standard-Eiern
      if (typeof Game.state.inventory.eggs === 'number') {
        const old = Game.state.inventory.eggs;
        Game.state.inventory.eggs = { standard: old, premium: 0, elite: 0, mythic: 0, divine: 0, cosmic: 0, transcend: 0 };
      }
      for (const t of ['standard','premium','elite','mythic','divine','cosmic','transcend']) {
        if (Game.state.inventory.eggs[t] == null) Game.state.inventory.eggs[t] = 0;
      }
      // Avatar-Migration
      if (!Game.state.avatarMonsterId && Game.state.collection.length)
        Game.state.avatarMonsterId = Game.state.collection[0].id;
      // Mines-Migration: altes mine-Objekt → mines-Objekt
      if (!Game.state.mines) {
        Game.state.mines = {
          standard: Game.state.mine || { owned: false, lastCollect: 0 },
          elite:    { owned: false, lastCollect: 0 },
          goettlich:{ owned: false, lastCollect: 0 },
          crystal:  { owned: false, lastCollect: 0 },
        };
        delete Game.state.mine;
      }
      for (const m of Game.MINES) {
        if (!Game.state.mines[m.id]) Game.state.mines[m.id] = { owned: false, lastCollect: 0 };
      }
      if (Game.state.inventory.eggs.goettlich == null) Game.state.inventory.eggs.goettlich = 0;
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
  backToStageSelect() { Battle.mode = null; UI.kampfView = "team"; UI.render(); },

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

  /* ---- Ei-Beschwörung ---- */
  SUMMON_MAX: 100,

  /* Würfelt n Monster aus der Ei-Tafel und gibt sie zurück */
  _rollEgg(egg, n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      let acc = 0, rarity = egg.table[0].rarity;
      for (const row of egg.table) { acc += row.chance; if (roll <= acc) { rarity = row.rarity; break; } }
      const mon = Monster.randomOfRarity(rarity);
      Game.addMonster(mon);
      results.push(mon);
    }
    return results;
  },

  /* Ei kaufen & sofort öffnen (Summon-Tab "Kaufen") */
  buyAndCrack(eggId, count = 1) {
    const s = Game.state;
    const egg = DATA.eggTypes.find(e => e.id === eggId);
    if (!egg) return;
    if (s.playerLevel < egg.minLevel) { UI.toast(`🥚 Erst ab Spieler-Level ${egg.minLevel}!`, "bad"); return; }
    const have = egg.currency === "crystals" ? s.inventory.crystals : s.gold;
    const max = Math.min(Game.SUMMON_MAX, Math.floor(have / egg.cost));
    const n = count === "max" ? max : Math.min(count, max);
    if (n < 1) { UI.toast(egg.currency === "crystals" ? "Nicht genug Kristalle! 💎" : "Nicht genug Gold! 💰", "bad"); return; }
    const totalCost = egg.cost * n;
    if (egg.currency === "crystals") s.inventory.crystals -= totalCost;
    else s.gold -= totalCost;
    const results = Game._rollEgg(egg, n);
    UI.showSummonResult(results, egg);
    UI.render();
  },

  /* Gedropptes Ei aus Inventar öffnen */
  crackDroppedEgg(eggId, count = 1) {
    const s = Game.state;
    const egg = DATA.eggTypes.find(e => e.id === eggId);
    if (!egg) return;
    const have = s.inventory.eggs[eggId] || 0;
    const n = count === "max" ? have : Math.min(count, have);
    if (n < 1) { UI.toast("Keine Eier dieser Art!", "bad"); return; }
    s.inventory.eggs[eggId] -= n;
    const results = Game._rollEgg(egg, n);
    UI.showSummonResult(results, egg);
    UI.render();
  },

  /* Rückwärtskompatibilität für alten hatchEgg()-Aufruf */
  hatchEgg() { Game.crackDroppedEgg("standard", 1); },

  /* Wie viele Eier eines Typs man sich leisten kann (für Max-Button) */
  summonAffordable(egg) {
    const s = Game.state;
    const have = egg.currency === "crystals" ? s.inventory.crystals : s.gold;
    return Math.min(Game.SUMMON_MAX, Math.floor(have / egg.cost));
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
  autoFillTeam(stat) {
    const s = Game.state;
    const sorted = [...s.collection]
      .sort((a, b) => stat === "atk" ? b.attack - a.attack : b.defense - a.defense);
    s.team = sorted.slice(0, Game.MAX_TEAM);
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

  /* Gold-Kosten für eine Fusion (Ergebnis-Rang entscheidet) */
  fuseCost(resultRarity) {
    const order = DATA.rarities[resultRarity].order;
    return Math.round(50 * Math.pow(1.9, order));
  },

  /* Alle fusionierbaren Gruppen eines Rangs auf einmal max-fusionieren */
  fuseAllInRank(rarity) {
    const s = Game.state;
    const groups = Game.collectionGroups().filter(g => g.sample.rarity === rarity && g.count >= 2);
    if (!groups.length) { UI.toast("Keine fusionierbaren Paare in diesem Rang.", "bad"); return; }

    const resultRarity = DATA.nextRarity(rarity);
    const costPer = Game.fuseCost(resultRarity);
    const totalPairs = groups.reduce((sum, g) => sum + Math.floor(g.count / 2), 0);
    const totalCost = costPer * totalPairs;
    if (s.gold < totalCost) {
      UI.toast(`Nicht genug Gold! ${totalCost.toLocaleString("de-DE")} 💰 für alle Fusionen benötigt.`, "bad");
      return;
    }
    s.gold -= totalCost;

    let totalMade = 0, lastFused = null;
    for (const initGroup of groups) {
      const g = Game.collectionGroups().find(gr => gr.key === initGroup.key);
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
    UI.toast(`⚛ ${totalMade}× fusioniert → ${DATA.rarities[lastFused.rarity].name}! (−${totalCost.toLocaleString("de-DE")} 💰)`, "good");
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

    // Gold-Kosten prüfen
    const resultRarity = DATA.nextRarity(group.members[0].rarity);
    const costPer = Game.fuseCost(resultRarity);
    const totalCost = costPer * p;
    if (s.gold < totalCost) {
      UI.toast(`Nicht genug Gold! ${totalCost.toLocaleString("de-DE")} 💰 benötigt.`, "bad");
      return;
    }
    s.gold -= totalCost;

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
    if (made > 0) UI.toast(`⚛ ${made}× Fusion → ${lastFused.name} (${DATA.rarities[lastFused.rarity].name})! (−${totalCost.toLocaleString("de-DE")} 💰)`, "good");
    UI.render();
  },

  /* ---- Minen ---- */
  MINES: [
    { id: "standard",  name: "Standard-Mine", emoji: "⛏️",  cost: 10_000,      cooldown: 10 * 60 * 1000, reward: { type: "egg",     id: "standard",  label: "Standard-Ei",  emoji: "🥚" }, color: "#9aa4bf" },
    { id: "elite",     name: "Elite-Mine",     emoji: "🔮",  cost: 100_000,     cooldown: 15 * 60 * 1000, reward: { type: "egg",     id: "elite",     label: "Elite-Ei",     emoji: "🥚" }, color: "#4aa8ff" },
    { id: "goettlich", name: "Götter-Mine",    emoji: "🌟",  cost: 500_000,     cooldown: 60 * 60 * 1000, reward: { type: "egg",     id: "goettlich", label: "Göttlich-Ei",  emoji: "🥚" }, color: "#ffe7a0" },
    { id: "crystal",   name: "Kristall-Mine",  emoji: "💎",  cost: 1_000_000,   cooldown: 60 * 60 * 1000, reward: { type: "crystal",                  label: "Kristall",     emoji: "💎" }, color: "#00d3a7" },
  ],

  buyMine(id) {
    const cfg = Game.MINES.find(m => m.id === id);
    if (!cfg) return;
    const s = Game.state;
    if (s.mines[id]?.owned) return;
    if (s.gold < cfg.cost) { UI.toast("Nicht genug Gold! 💰", "bad"); return; }
    s.gold -= cfg.cost;
    s.mines[id] = { owned: true, lastCollect: Date.now() };
    UI.toast(`${cfg.emoji} ${cfg.name} gekauft!`, "good");
    UI.updateTopbar();
    UI.render();
  },

  mineItemsReady(id) {
    const cfg = Game.MINES.find(m => m.id === id);
    const s = Game.state;
    if (!cfg || !s.mines?.[id]?.owned) return 0;
    return Math.floor((Date.now() - (s.mines[id].lastCollect || 0)) / cfg.cooldown);
  },

  mineCollect(id) {
    const cfg = Game.MINES.find(m => m.id === id);
    const s = Game.state;
    const count = Game.mineItemsReady(id);
    if (count < 1) { UI.toast("Mine noch nicht fertig!", "bad"); return; }
    const elapsed = Date.now() - (s.mines[id].lastCollect || 0);
    s.mines[id].lastCollect = Date.now() - (elapsed % cfg.cooldown);
    const r = cfg.reward;
    if (r.type === "crystal") {
      s.inventory.crystals = (s.inventory.crystals || 0) + count;
    } else {
      s.inventory.eggs[r.id] = (s.inventory.eggs[r.id] || 0) + count;
    }
    UI.toast(`${cfg.emoji} ${count}× ${r.label} ${r.emoji} abgeholt!`, "good");
    UI.updateTopbar();
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
