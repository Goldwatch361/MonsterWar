/* ===== game.js — Spielzustand & Aktionen ===== */
const Game = {
  state: null,
  MAX_TEAM: 5,
  VERSION: "0.83",

  /* Frischer Startzustand (Erststart) */
  newGame() {
    const starter = Monster.create("flammenwolf");
    const starterEntry = Game.toCollectionEntry(starter, 1);
    Game.state = {
      version: Save.VERSION,
      gold: 50,
      playerLevel: 1,
      playerExp: 0,
      team: [starter],
      collection: [starterEntry],
      inventory: { eggs: { standard: 0, premium: 0, elite: 0, mythic: 0, divine: 0, cosmic: 0, transcend: 0 }, crystals: 0 },
      avatarKey: Game.groupKey(starterEntry),
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
      // Collection-Migration: altes Format (individuelle Objekte mit id) → aggregiert (count)
      if (Game.state.collection.length && Game.state.collection[0]?.id !== undefined) {
        const map = new Map();
        for (const m of Game.state.collection) {
          const k = Game.groupKey(m);
          if (!map.has(k)) map.set(k, Game.toCollectionEntry(m, 0));
          map.get(k).count++;
        }
        Game.state.collection = [...map.values()];
      }
      // Avatar-Migration: id → groupKey
      if (Game.state.avatarMonsterId) {
        const entry = Game.state.collection[0];
        Game.state.avatarKey = entry ? Game.groupKey(entry) : "";
        delete Game.state.avatarMonsterId;
      }
      if (!Game.state.avatarKey && Game.state.collection.length)
        Game.state.avatarKey = Game.groupKey(Game.state.collection[0]);
      // Team-Migration: alte Team-Objekte behalten (haben schon id/hp), recalc sicherstellen
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
      // Namen-Migration: alles über Normal → Titel + fused=true + korrekte Stats
      const _fixName = m => {
        if (!m || !m.templateId || !DATA.templates[m.templateId]) return;
        const aboveNormal = DATA.rarities[m.rarity].order > 0;
        const title = aboveNormal ? (DATA.rarityTitles[m.rarity] || "") : "";
        m.name = title ? `${title} ${DATA.templates[m.templateId].name}` : DATA.templates[m.templateId].name;
        if (aboveNormal !== m.fused) { m.fused = aboveNormal; Monster.recalc(m, false); }
      };
      Game.state.collection.forEach(_fixName);
      Game.state.team.forEach(_fixName);
      // Duplikate nach Umbenennen mergen (gleicher groupKey → count addieren)
      const _mergeMap = new Map();
      for (const e of Game.state.collection) {
        const k = Game.groupKey(e);
        if (_mergeMap.has(k)) _mergeMap.get(k).count += e.count;
        else _mergeMap.set(k, Object.assign({}, e));
      }
      Game.state.collection = [..._mergeMap.values()];
      // avatarKey aktualisieren falls Name sich geändert hat
      if (Game.state.avatarKey) {
        const [tid, rar] = Game.state.avatarKey.split("|");
        const entry = Game.state.collection.find(e => e.templateId === tid && e.rarity === rar);
        if (entry) Game.state.avatarKey = Game.groupKey(entry);
      }
      // Team-Integrität: ungültige Einträge entfernen; Team hat eigene id/hp Objekte
      Game.state.team = Game.state.team.filter(tm => tm && tm.id);
      // Stage wird beim Laden neu gestartet (Welle 1, Team geheilt)
      Battle.startStage(Game.state.stage.current);
      return false; // kein Erststart
    }
    Game.newGame();
    return true; // Erststart
  },

  /* ---- Gesamt-Stärke der gesamten Sammlung (für Topbar-Anzeige) ---- */
  totalAttack()  { return Game.state.collection.reduce((s, e) => s + e.attack  * e.count, 0); },
  totalDefense() { return Game.state.collection.reduce((s, e) => s + e.defense * e.count, 0); },
  totalHP()      { return Game.state.collection.reduce((s, e) => s + e.maxHp   * e.count, 0); },

  /* Wie viele identische Monster (gleiche Gruppe) man besitzt */
  groupCount(m) {
    const entry = Game.state.collection.find(e => Game.groupKey(e) === Game.groupKey(m));
    return entry ? entry.count : 0;
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
    return Game.state.team.find(m => m.id === id);
  },

  /* Sortierte Kopie der Sammlung-Einträge */
  sortedCollection() {
    return [...Game.state.collection].sort((a, b) => {
      const r = DATA.rarities[b.rarity].order - DATA.rarities[a.rarity].order;
      if (r !== 0) return r;
      if (b.attack !== a.attack) return b.attack - a.attack;
      return a.name.localeCompare(b.name);
    });
  },

  /* Die n stärksten Monster (für WorldBoss — als Team-ähnliche Objekte) */
  strongestMonsters(n) {
    return [...Game.state.collection]
      .sort((a, b) => (b.attack + b.defense + b.maxHp * 0.1) - (a.attack + a.defense + a.maxHp * 0.1))
      .slice(0, n)
      .map(e => ({ ...e, id: DATA.uid(), hp: e.maxHp, skills: [] }));
  },

  /* Hilfsfunktion: Monster-Objekt → Collection-Eintrag (ohne id/hp) */
  toCollectionEntry(m, count = 1) {
    return {
      templateId: m.templateId,
      name: m.name,
      emoji: m.emoji,
      element: m.element,
      rarity: m.rarity,
      baseHp: m.baseHp,
      baseAttack: m.baseAttack,
      baseDefense: m.baseDefense,
      maxHp: m.maxHp,
      attack: m.attack,
      defense: m.defense,
      fused: m.fused || false,
      fusedSkill: m.fusedSkill || null,
      count,
    };
  },

  addMonster(m) {
    const key = Game.groupKey(m);
    const existing = Game.state.collection.find(e => Game.groupKey(e) === key);
    if (existing) { existing.count++; }
    else { Game.state.collection.push(Game.toCollectionEntry(m, 1)); }
  },

  /* ---- Ei-Beschwörung ---- */
  SUMMON_MAX: 100,

  /* ≤100 Eier: individuelle Objekte für Modal; >100: statistisch, nur unique Typen erstellen */
  _rollEgg(egg, n) {
    if (n <= 100) {
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
    }
    // Großer Batch: alle Templates, Seltenheit immer überschreiben — wie randomOfRarity
    const allTemplateIds = Object.keys(DATA.templates);
    const keyCounts = new Map();
    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      let acc = 0, rarity = egg.table[0].rarity;
      for (const row of egg.table) { acc += row.chance; if (roll <= acc) { rarity = row.rarity; break; } }
      const templateId = allTemplateIds[Math.floor(Math.random() * allTemplateIds.length)];
      const key = templateId + "|" + rarity;
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
    }
    for (const [key, cnt] of keyCounts) {
      const [templateId, rarity] = key.split("|");
      const mon = Monster.create(templateId, rarity);
      const cKey = Game.groupKey(mon);
      const existing = Game.state.collection.find(e => Game.groupKey(e) === cKey);
      if (existing) existing.count += cnt;
      else Game.state.collection.push(Game.toCollectionEntry(mon, cnt));
    }
    return null; // kein Modal für große Batches
  },

  /* Ei kaufen & sofort öffnen */
  buyAndCrack(eggId, count = 1) {
    const s = Game.state;
    const egg = DATA.eggTypes.find(e => e.id === eggId);
    if (!egg) return;
    if (s.playerLevel < egg.minLevel) { UI.toast(`🥚 Erst ab Spieler-Level ${egg.minLevel}!`, "bad"); return; }
    const have = egg.currency === "crystals" ? s.inventory.crystals : s.gold;
    const n = count === "max" ? Math.floor(have / egg.cost) : Math.min(count, Math.floor(have / egg.cost));
    if (n < 1) { UI.toast(egg.currency === "crystals" ? "Nicht genug Kristalle! 💎" : "Nicht genug Gold! 💰", "bad"); return; }
    if (egg.currency === "crystals") s.inventory.crystals -= egg.cost * n;
    else s.gold -= egg.cost * n;
    const results = Game._rollEgg(egg, n);
    if (results) { UI.showSummonResult(results, egg); }
    else UI.toast(`🥚 ${n.toLocaleString("de-DE")} ${egg.name} geöffnet`, "good");
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
    if (results) { UI.showSummonResult(results, egg); }
    else UI.toast(`🥚 ${n.toLocaleString("de-DE")} ${egg.name} geöffnet`, "good");
    UI.render();
  },

  /* Rückwärtskompatibilität für alten hatchEgg()-Aufruf */
  hatchEgg() { Game.crackDroppedEgg("standard", 1); },

  /* Wie viele Eier eines Typs man sich leisten kann (für Max-Button) */
  summonAffordable(egg) {
    const s = Game.state;
    const have = egg.currency === "crystals" ? s.inventory.crystals : s.gold;
    return Math.floor(have / egg.cost);
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

  /* Aus einer Gruppe ein Monster ins Team holen (neues Team-Objekt mit id+hp) */
  teamAddFromGroup(key) {
    const s = Game.state;
    if (s.team.length >= Game.MAX_TEAM) { UI.toast(`Team voll (max ${Game.MAX_TEAM})!`, "bad"); return; }
    const entry = s.collection.find(e => Game.groupKey(e) === key);
    if (!entry) return;
    const inTeamCount = s.team.filter(t => Game.groupKey(t) === key).length;
    if (inTeamCount >= entry.count) { UI.toast("Alle Monster dieser Art bereits im Team!", "bad"); return; }
    s.team.push({ ...entry, id: DATA.uid(), hp: entry.maxHp, exp: 0, expToNext: 100, skills: [] });
    UI.render();
  },

  /* Ein eingesetztes Monster aus dem Team nehmen */
  teamRemoveFromGroup(key) {
    const s = Game.state;
    const idx = s.team.findIndex(t => Game.groupKey(t) === key);
    if (idx < 0) return;
    if (s.team.length === 1) { UI.toast("Mindestens 1 Monster im Team!", "bad"); return; }
    s.team.splice(idx, 1);
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
    const sorted = [...s.collection].sort((a, b) => stat === "atk" ? b.attack - a.attack : b.defense - a.defense);
    s.team = sorted.slice(0, Game.MAX_TEAM).map(e => ({ ...e, id: DATA.uid(), hp: e.maxHp, exp: 0, expToNext: 100, skills: [] }));
    UI.render();
  },

  /* ---- Sammlung: identische Monster stapeln ---- */
  /* Gruppen-Schlüssel: gleiche Vorlage + gleiche Seltenheit + gleicher Name (= fusionierbar) */
  groupKey(m) { return m.templateId + "|" + m.rarity + "|" + m.name; },

  collectionGroups() {
    const groups = Game.state.collection.map(entry => ({
      key: Game.groupKey(entry),
      members: [entry],
      count: entry.count,
      sample: entry,
    }));
    groups.sort((A, B) => {
      const a = A.sample, b = B.sample;
      const r = DATA.rarities[b.rarity].order - DATA.rarities[a.rarity].order;
      if (r !== 0) return r;
      if (b.attack !== a.attack) return b.attack - a.attack;
      return a.name.localeCompare(b.name);
    });
    return groups;
  },

  /* Anzahl möglicher Fusionen über alle Gruppen */
  possibleFusions() {
    return Game.collectionGroups().reduce((s, g) => s + Math.floor(g.count / 2), 0);
  },

  /* Gold-Kosten für eine Fusion (Ergebnis-Rang entscheidet) */
  fuseCost(resultRarity) {
    const order = DATA.rarities[resultRarity].order;
    return Math.round(500 * Math.pow(2.5, order));
  },

  /* Hilfsfunktion: fusionierten Eintrag in Collection eintragen (count-basiert) */
  _applyFusion(entry, pairs) {
    const fused = Monster.fuse(entry, entry);
    const fusedKey = Game.groupKey(fused);
    const src = Game.state.collection.find(e => Game.groupKey(e) === Game.groupKey(entry));
    if (src) { src.count -= 2 * pairs; }
    const dst = Game.state.collection.find(e => Game.groupKey(e) === fusedKey);
    if (dst) { dst.count += pairs; }
    else { Game.state.collection.push(Game.toCollectionEntry(fused, pairs)); }
    Game.state.collection = Game.state.collection.filter(e => e.count > 0);
    return fused;
  },

  /* Alle fusionierbaren Gruppen eines Rangs auf einmal max-fusionieren */
  fuseAllInRank(rarity) {
    const s = Game.state;
    const entries = s.collection.filter(e => e.rarity === rarity && e.count >= 2);
    if (!entries.length) { UI.toast("Keine fusionierbaren Paare in diesem Rang.", "bad"); return; }

    const resultRarity = DATA.nextRarity(rarity);
    const costPer = Game.fuseCost(resultRarity);
    const totalPairs = entries.reduce((sum, e) => sum + Math.floor(e.count / 2), 0);
    const totalCost = costPer * totalPairs;
    if (s.gold < totalCost) {
      UI.toast(`Nicht genug Gold! ${totalCost.toLocaleString("de-DE")} 💰 für alle Fusionen benötigt.`, "bad");
      return;
    }
    s.gold -= totalCost;

    let totalMade = 0, lastFused = null;
    for (const entry of [...entries]) {
      const pairs = Math.floor(entry.count / 2);
      if (pairs < 1) continue;
      lastFused = Game._applyFusion(entry, pairs);
      totalMade += pairs;
    }
    if (!totalMade) { UI.toast("Keine fusionierbaren Paare.", "bad"); return; }
    UI.toast(`⚛ ${totalMade}× fusioniert → ${DATA.rarities[lastFused.rarity].name}! (−${totalCost.toLocaleString("de-DE")} 💰)`, "good");
    UI.render();
  },

  /* Fusion einer Gruppe (Anzahl oder "max") */
  fuseGroup(key, pairs = 1) {
    const s = Game.state;
    const entry = s.collection.find(e => Game.groupKey(e) === key);
    if (!entry || entry.count < 2) { UI.toast("Mindestens 2 gleiche Monster nötig.", "bad"); return; }

    const maxPairs = Math.floor(entry.count / 2);
    const p = pairs === "max" ? maxPairs : Math.min(parseInt(pairs, 10) || 1, maxPairs);
    if (p < 1) return;

    const resultRarity = DATA.nextRarity(entry.rarity);
    const costPer = Game.fuseCost(resultRarity);
    const totalCost = costPer * p;
    if (s.gold < totalCost) {
      UI.toast(`Nicht genug Gold! ${totalCost.toLocaleString("de-DE")} 💰 benötigt.`, "bad");
      return;
    }
    s.gold -= totalCost;
    const fused = Game._applyFusion(entry, p);
    UI.toast(`⚛ ${p}× Fusion → ${fused.name} (${DATA.rarities[fused.rarity].name})! (−${totalCost.toLocaleString("de-DE")} 💰)`, "good");
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
