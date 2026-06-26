/* ===== battle.js — Stage-basiertes Kampfsystem (BattleManager) ===== */
const Battle = {
  timer: null,
  tickMs: 900,
  mode: null,           // null = pausiert (Menü), "stage" oder "worldboss"
  frontier: false,      // läuft gerade die höchste Stage? → nach Sieg automatisch weiter
  WAVES_PER_STAGE: 5,   // Wellen pro Stage (z.B. Stage 1 = Level 1–5)
  phase: "team",        // "team" oder "enemy" — wer ist als Nächstes dran
  teamPointer: 0,       // welches Team-Monster als Nächstes angreift
  lastAttackerId: null, // welches Monster zuletzt angegriffen hat (Ziel des Gegners)
  fx: null,             // Animations-Info für UI: {type, attackerId/targetId, dmg}
  wbHp: 0, wbMaxHp: 0,  // WorldBoss: gemeinsamer Team-HP-Pool (gesamte Sammlung)
  wbTeam: [],           // WorldBoss: die 5 stärksten Monster (Anzeige + Angriffs-Reihenfolge)
  wbTimeouts: [],       // WorldBoss läuft mit eigener Taktung (300ms-Schritte)

  start() {
    if (Battle.timer) return;
    Battle.timer = setInterval(Battle.tick, Battle.tickMs);
  },
  stop() {
    clearInterval(Battle.timer);
    Battle.timer = null;
    Battle.wbClearTimers();
  },

  /* WorldBoss-Timing-Helfer */
  wbClearTimers() {
    Battle.wbTimeouts.forEach(clearTimeout);
    Battle.wbTimeouts = [];
  },
  wbDelay(ms, fn) {
    const id = setTimeout(() => { if (Battle.mode === "worldboss") fn(); }, ms);
    Battle.wbTimeouts.push(id);
  },

  /* Globales Gegner-Level aus Stage + Welle (Stage 1 → Level 1..5, Stage 2 → 6..10, …) */
  globalLevel(stage, wave) {
    return (stage - 1) * Battle.WAVES_PER_STAGE + wave;
  },

  /* Schadensberechnung mit Element-Vorteil + Varianz */
  calculateDamage(attacker, defender) {
    const variance = 0.85 + Math.random() * 0.30;
    let mod = 1;
    const atkEl = DATA.elements[attacker.element];
    if (atkEl && atkEl.strong === defender.element) mod = 1.20;      // Vorteil
    else if (defender.element && DATA.elements[defender.element] &&
             DATA.elements[defender.element].strong === attacker.element) mod = 0.85; // Nachteil
    const raw = attacker.attack * mod * variance - (defender.defense || 0) * 0.5;
    return { dmg: Math.max(1, Math.round(raw)), advantage: mod > 1 };
  },

  /* Stage (neu) starten: Welle 1, Team voll heilen, ersten Gegner spawnen */
  startStage(stageNum) {
    const s = Game.state;
    s.stage.current = Math.max(1, Math.min(stageNum, s.stage.unlocked));
    s.stage.wave = 1;
    s.team.forEach(Monster.heal);
    Battle.phase = "team";
    Battle.teamPointer = 0;
    Battle.lastAttackerId = null;
    Battle.spawnEnemy();
  },

  /* Gegner der aktuellen Stage/Welle erzeugen (skaliert).
     Letzte Welle = Boss (mehr HP, mehr Belohnung). KEIN Heilen (HP wird über die Wellen mitgenommen). */
  spawnEnemy() {
    const s = Game.state;
    const st = s.stage;
    const lv = Battle.globalLevel(st.current, st.wave);
    const isBoss = st.wave >= Battle.WAVES_PER_STAGE;

    const tier = DATA.enemyTiers.find(t => lv <= t.max) || DATA.enemyTiers[DATA.enemyTiers.length - 1];
    const tpl = tier.pool[Math.floor(Math.random() * tier.pool.length)];
    const els = Object.keys(DATA.elements);
    const element = els[Math.floor(Math.random() * els.length)];

    let hp     = Math.round(DATA.enemyBase.hp     * Math.pow(lv, 1.5));
    let attack = Math.round(DATA.enemyBase.attack * Math.pow(lv, 1.3));
    let reward = Math.round(DATA.enemyBase.reward * Math.pow(lv, 0.6));
    if (isBoss) { hp = Math.round(hp * 1.8); attack = Math.round(attack * 1.15); reward = Math.round(reward * 2.0); }

    s.enemy = {
      name: (isBoss ? "👑 " : "") + tpl.name, emoji: tpl.emoji, element,
      level: lv, hp, maxHp: hp, attack, reward, isBoss, wave: st.wave,
    };

    // Bestwert der Stage merken (höchste erreichte Welle)
    st.best[st.current] = Math.max(st.best[st.current] || 0, st.wave);
  },

  /* Gegner besiegt: nächste Welle, oder Stage geschafft */
  onEnemyDefeated() {
    const s = Game.state;
    const st = s.stage;

    if (st.wave >= Battle.WAVES_PER_STAGE) {
      // Stage geschafft!
      const cleared = st.current;
      st.best[cleared] = Battle.WAVES_PER_STAGE;
      const wasFrontier = cleared >= st.unlocked;
      if (st.unlocked < cleared + 1) st.unlocked = cleared + 1;

      if (Battle.frontier && wasFrontier) {
        // Höchste Stage geschafft → automatisch weiter bis zum Tod
        UI.toast(`🏆 Stage ${cleared} geschafft! Weiter zu Stage ${cleared + 1}`, "good");
        Battle.startStage(cleared + 1); // current = cleared+1 = neue höchste → bleibt Frontier
      } else {
        // Bereits freigeschaltete Stage geschafft → zurück zur Stage-Auswahl
        UI.toast(`🏆 Stage ${cleared} geschafft!`, "good");
        Battle.mode = null;
        UI.kampfView = "stageSelect";
      }
      if (UI.current === "home") UI.render();
    } else {
      st.wave++;
      Battle.spawnEnemy(); // HP wird mitgenommen (kein Heilen)
    }
  },

  /* ===== WorldBoss ===== */
  /* WorldBoss (neu) starten: gemeinsamen HP-Pool setzen, Boss spawnen */
  startWorldBoss(level) {
    const s = Game.state;
    // WorldBoss zeigt immer die 5 STÄRKSTEN Monster (rein visuell; Schaden = ganze Sammlung)
    Battle.wbTeam = Game.strongestMonsters(Game.MAX_TEAM);
    s.worldBoss.level = Math.max(1, level);
    Battle.mode = "worldboss";
    Battle.phase = "team";
    Battle.teamPointer = 0;
    Battle.lastAttackerId = null;
    // gemeinsamer Team-HP-Pool = Gesamt-HP der ganzen Sammlung
    Battle.wbMaxHp = Math.max(1, Game.totalHP());
    Battle.wbHp = Battle.wbMaxHp;
    Battle.spawnWorldBoss();
    // eigene Taktung starten: Team nacheinander (300ms), dann Boss
    Battle.wbClearTimers();
    Battle.wbDelay(0, Battle.wbRound);
  },

  spawnWorldBoss() {
    const s = Game.state;
    const cfg = DATA.worldBoss;
    const lv = s.worldBoss.level;
    const i = (lv - 1) % cfg.names.length;

    // FIXE HP — unabhängig vom Spieler, aber pro Stufe stärker
    const hp = Math.round(cfg.baseHp * Math.pow(cfg.hpGrowth, lv - 5));
    // Angriff trifft den Team-HP-Pool kräftig (~10% pro Treffer, steigt mit Stufe)
    const pool = Math.max(1, Battle.wbMaxHp || Game.totalHP());
    const attack = Math.round(pool * cfg.dmgPct * Math.pow(lv, 0.08));

    s.enemy = {
      name: `${cfg.names[i]} (Stufe ${lv})`, emoji: cfg.emojis[i],
      element: Object.keys(DATA.elements)[Math.floor(Math.random() * 5)],
      level: lv, hp, maxHp: hp, attack, reward: 0, isWorldBoss: true,
    };
  },

  onWorldBossDefeated() {
    const s = Game.state;
    const cfg = DATA.worldBoss;
    const lv = s.worldBoss.level;

    // Belohnungen (deutlich höher als normale Stages)
    const gold = Math.round(cfg.goldBase * Math.pow(lv, cfg.goldLevelPow));
    const eggs = 1 + Math.floor(lv / 3);
    const crystals = 5 + lv * 2;
    const stones = 1 + Math.floor(lv / 2);

    s.gold += gold; s.goldEarned = (s.goldEarned || 0) + gold;
    s.inventory.eggs += eggs;
    s.inventory.crystals += crystals;
    s.inventory.upgradeStones += stones;
    s.kills = (s.kills || 0) + 1;
    Game.addPlayerExp(50 + lv * 15);

    // Bestwert + nächste Stufe freischalten
    s.worldBoss.best = Math.max(s.worldBoss.best || 0, lv);
    s.worldBoss.level = lv + 1;

    // Zurück ins Kampf-Menü (Modus pausieren) + Belohnungs-Popup
    Battle.mode = null;
    Battle.wbClearTimers();
    s.enemy = null;
    UI.kampfView = "modes";
    UI.showWorldBossReward(lv, { gold, eggs, crystals, stones });
    if (UI.current === "home") UI.render();
  },

  /* nächstes lebendes Team-Monster (für Animation/Reihenfolge) */
  nextAttacker(team) {
    let guard = 0;
    while (guard++ < team.length) {
      const cand = team[Battle.teamPointer % team.length];
      Battle.teamPointer = (Battle.teamPointer + 1) % Math.max(1, team.length);
      if (cand && cand.hp > 0) return cand;
    }
    return null;
  },

  /* ===== WorldBoss-Runde: Team greift nacheinander an (300ms), danach Boss 1× ===== */
  wbRound() {
    if (Battle.mode !== "worldboss") return;
    const s = Game.state;
    if (!s.enemy) Battle.spawnWorldBoss();
    if (Battle.wbHp <= 0) { Battle.wbLost(); return; }

    const team = (Battle.wbTeam && Battle.wbTeam.length) ? Battle.wbTeam.slice() : [];
    const STEP = 300;
    // Gesamtangriff der ganzen Sammlung, aufgeteilt auf die angezeigten Team-Monster
    const perMon = Math.max(1, Math.round(Game.totalAttack() / Math.max(1, team.length)));
    const state = { killed: false };
    let t = 0;

    // 1) jedes Team-Monster greift nacheinander an
    team.forEach(m => {
      Battle.wbDelay(t, () => {
        if (state.killed || !s.enemy || s.enemy.hp <= 0) return;
        const variance = 0.85 + Math.random() * 0.30;
        const dmg = Math.max(1, Math.round(perMon * variance));
        s.enemy.hp -= dmg;
        Battle.fx = { type: "monster", attackerId: m.id, dmg };
        UI.refresh();
        if (s.enemy.hp <= 0) { state.killed = true; Battle.onWorldBossDefeated(); }
      });
      t += STEP;
    });

    // 2) danach schlägt der Boss 1× auf den Team-HP-Pool
    Battle.wbDelay(t + 200, () => {
      if (state.killed || !s.enemy || s.enemy.hp <= 0) return;
      const variance = 0.85 + Math.random() * 0.30;
      const floor = Math.max(1, Math.round(Battle.wbMaxHp * 0.03));
      const dmg = Math.max(floor, Math.round(s.enemy.attack * variance - Game.totalDefense() * 0.1));
      Battle.wbHp = Math.max(0, Battle.wbHp - dmg);
      Battle.fx = { type: "enemy", targetId: "wbpool", dmg };
      UI.refresh();
      if (Battle.wbHp <= 0) Battle.wbLost();
    });

    // 3) nächste Runde
    s.playSeconds = (s.playSeconds || 0) + (t + 1300) / 1000;
    Battle.wbDelay(t + 1100, () => { if (!state.killed) Battle.wbRound(); });
  },

  wbLost() {
    UI.toast("💀 WorldBoss-Team gefallen – Neustart", "bad");
    Battle.startWorldBoss(Game.state.worldBoss.level);
    if (UI.current === "home") UI.render();
  },

  /* Ablauf: Monster1 → Gegner → Monster2 → Gegner … (abwechselnd, ein Schlag pro Tick).
     Läuft nur, wenn ein Modus aktiv ist (Battle.mode). */
  tick() {
    if (!Battle.mode) return; // pausiert (Menü-Ansicht)
    if (Battle.mode === "worldboss") return; // WorldBoss hat eigene Taktung (wbRound)

    const s = Game.state;
    if (!s.enemy) Battle.spawnEnemy();
    const team = s.team;
    const alive = team.filter(m => m.hp > 0);

    if (alive.length === 0) { // Tod im Stage-Modus → zurück zur Stage-Auswahl
      UI.toast(`💀 Stage ${s.stage.current} verloren`, "bad");
      Battle.mode = null;
      UI.kampfView = "stageSelect";
      if (UI.current === "home") UI.render();
      return;
    }

    s.playSeconds = (s.playSeconds || 0) + Battle.tickMs / 1000;

    if (Battle.phase === "team") {
      const attacker = Battle.nextAttacker(team);
      if (!attacker) { UI.refresh(); return; }
      const dmg = Battle.calculateDamage(attacker, s.enemy).dmg;
      s.enemy.hp -= dmg;
      Battle.lastAttackerId = attacker.id;
      Battle.fx = { type: "monster", attackerId: attacker.id, dmg };

      if (s.enemy.hp <= 0) { Battle.giveReward(); Battle.onEnemyDefeated(); }
      else Battle.phase = "enemy";
    } else {
      let target = team.find(m => m.id === Battle.lastAttackerId && m.hp > 0);
      if (!target) target = alive[Math.floor(Math.random() * alive.length)];
      const dmg = Battle.calculateDamage(s.enemy, target).dmg;
      target.hp = Math.max(0, target.hp - dmg);
      Battle.fx = { type: "enemy", targetId: target.id, dmg };
      Battle.phase = "team";
    }
    UI.refresh();
  },

  giveReward() {
    const s = Game.state;
    const e = s.enemy;

    // Gold
    s.gold += e.reward;
    s.goldEarned = (s.goldEarned || 0) + e.reward;

    // Spieler-Erfahrung (Monster haben kein Level)
    const xp = Math.max(3, Math.round(e.level * 2.5));
    s.xpEarned = (s.xpEarned || 0) + xp;
    s.kills = (s.kills || 0) + 1;
    Game.addPlayerExp(xp);

    UI.toast("+" + e.reward + " 💰", "gold");

    // Drops
    Battle.rollDrops(e);
  },

  rollDrops(e) {
    const s = Game.state;
    const r = Math.random();
    // 4% Monster-Drop, 6% Ei, 8% Kristall, 5% Upgrade-Stein
    if (r < 0.04 && s.collection.length < 200) {
      const mon = Monster.randomOfRarity("normal");
      Game.addMonster(mon);
      UI.toast("🎁 " + mon.name + " erbeutet!", "good");
    } else if (r < 0.10) {
      s.inventory.eggs++;
      UI.toast("🥚 Monster-Ei gefunden!", "good");
    } else if (r < 0.18) {
      s.inventory.crystals += 1 + Math.floor(e.level / 20);
      UI.toast("💎 Kristall gefunden!", "good");
    } else if (r < 0.23) {
      s.inventory.upgradeStones++;
      UI.toast("🪨 Upgrade-Stein gefunden!", "good");
    }
  },
};
