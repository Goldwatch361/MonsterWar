/* ===== ui.js — Rendering, Tabs, Toasts, Modals ===== */
const UI = {
  current: "home",
  prevEnemyHp: null,
  kampfView: "modes",   // modes | team | stageSelect | fight
  pendingMode: null,    // welcher Modus in der Team-Auswahl vorbereitet wird
  fusionOpen: {},       // welche Rang-Spoiler im Fusion-Tab aufgeklappt sind
  collOpen: {},         // Rang-Spoiler im Sammlung-Reiter
  dexOpen: {},          // Rang-Spoiler im Dex-Reiter
  monsterTab: "collection", // Unter-Reiter: collection | dex | fusion

  init() {
    document.querySelectorAll("#tabbar .tab").forEach(btn => {
      btn.addEventListener("click", () => UI.switchTab(btn.dataset.tab));
    });
    // Modal: Klick außerhalb schließt (nur wenn als schließbar markiert)
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target.id === "modal" && UI._modalClosable) UI.closeModal();
    });
    UI.switchTab("home");
  },

  switchTab(tab) {
    UI.current = tab;
    document.querySelectorAll("#tabbar .tab").forEach(b => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    UI.render();
  },

  /* ---- Hilfsfunktionen ---- */
  el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  },
  rarColor: (r) => DATA.rarities[r].color,
  /* Glow-Klasse nach Rang-Stufe: Legendär+ pulsiert, Erhaben+ ultra, Unaussprechlich regenbogen */
  glowClass(r) {
    const o = DATA.rarities[r].order;
    if (o >= 19) return "glow-prismatic";
    if (o >= 10) return "glow-ultra";
    if (o >= 3)  return "glow-strong";
    return "";
  },
  /* Große Zahlen lesbar kürzen: 1 500 → "1,5k"; 2 400 000 → "2,4 Mio"; 1 500 000 000 → "1,5 Mrd" */
  fmt(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(".", ",") + " Mrd";
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace(".", ",") + " Mio";
    if (n >= 10_000)        return (n / 1_000).toFixed(1).replace(".", ",") + "k";
    return Math.round(n).toLocaleString("de-DE");
  },
  waveDotsHtml(st, W) {
    let dots = "";
    for (let w = 1; w <= W; w++) {
      const cls = w < st.wave ? "done" : (w === st.wave ? "now" : "");
      const boss = w === W ? " boss" : "";
      dots += `<span class="wave-dot ${cls}${boss}">${w === W ? "👑" : w}</span>`;
    }
    return dots;
  },
  elChip(el) {
    const e = DATA.elements[el];
    return `<span class="elchip" style="color:${e.color}">${e.icon} ${e.name}</span>`;
  },

  /* ---- Haupt-Render pro Tab (scroll-erhaltend → nahtlos) ---- */
  render() {
    UI.updateTopbar();
    const view = document.getElementById("view");
    const sy = window.scrollY; // Scroll-Position merken, damit nichts springt
    switch (UI.current) {
      case "home":     view.innerHTML = UI.renderHome();    UI.refresh(); break;
      case "monster":  view.innerHTML = UI.renderMonster(); break;
      case "summon":   view.innerHTML = UI.renderSummon();  break;
      case "settings": view.innerHTML = UI.renderSettings();break;
    }
    window.scrollTo(0, sy);
  },

  updateTopbar() {
    const s = Game.state; if (!s) return;
    document.getElementById("gold").textContent = Math.floor(s.gold).toLocaleString("de-DE");
    document.getElementById("crystals").textContent = s.inventory.crystals;
    document.getElementById("eggs").textContent = s.inventory.eggs;
    document.getElementById("stones").textContent = s.inventory.upgradeStones;
    document.getElementById("totalAtk").textContent = UI.fmt(Game.totalAttack());
    document.getElementById("totalDef").textContent = UI.fmt(Game.totalDefense());
    document.getElementById("playerLevel").textContent = s.playerLevel;
    // Spieler-XP-Leiste
    const need = Game.playerExpToNext();
    const pct = Math.max(0, Math.min(100, ((s.playerExp || 0) / need) * 100));
    document.getElementById("pxp-fill").style.width = pct + "%";
    document.getElementById("pxp-txt").textContent = `${Math.floor(s.playerExp || 0)} / ${need} XP`;
  },

  // Stage-Kämpfer: mit eigener HP-Leiste
  fighterHtml(m) {
    const hpPct = Math.max(0, (m.hp / m.maxHp) * 100);
    return `
      <div class="fighter ${m.fused ? "fused" : ""}" id="fighter-${m.id}" style="--rcolor:${UI.rarColor(m.rarity)}">
        <div class="f-emoji">${m.emoji}</div>
        <div class="f-body">
          <div class="f-name">${m.name}</div>
          <div class="hpbar small"><div class="fill" style="width:${hpPct}%"></div></div>
          <div class="f-hp">${Math.ceil(m.hp)} / ${m.maxHp}</div>
        </div>
      </div>`;
  },

  // WorldBoss-Kämpfer: ohne eigene HP (gemeinsamer Pool zählt)
  fighterMiniHtml(m) {
    return `
      <div class="fighter mini ${m.fused ? "fused" : ""}" id="fighter-${m.id}" style="--rcolor:${UI.rarColor(m.rarity)}">
        <div class="f-emoji">${m.emoji}</div>
        <div class="f-body"><div class="f-name">${m.name}</div></div>
      </div>`;
  },

  arenaSceneSVG(mode) {
    if (mode !== 'stage') return '';
    return `<div class="arena-scene"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="38" fill="#1a2c38"/>
  <rect width="400" height="38" fill="#3a6080" opacity=".15"/>
  <rect width="400" height="27" y="38" fill="#2a1c0c"/>
  <rect width="400" height="1" y="46" fill="#180e06" opacity=".8"/>
  <rect width="400" height="1" y="56" fill="#180e06" opacity=".8"/>
  <path d="M5,65 L5,56 A17.5,17.5 0 0 0 40,56 L40,65Z" fill="#0d0804"/>
  <path d="M45,65 L45,56 A17.5,17.5 0 0 0 80,56 L80,65Z" fill="#0d0804"/>
  <path d="M85,65 L85,56 A17.5,17.5 0 0 0 120,56 L120,65Z" fill="#0d0804"/>
  <path d="M125,65 L125,56 A17.5,17.5 0 0 0 160,56 L160,65Z" fill="#0d0804"/>
  <path d="M165,65 L165,56 A17.5,17.5 0 0 0 200,56 L200,65Z" fill="#0d0804"/>
  <path d="M205,65 L205,56 A17.5,17.5 0 0 0 240,56 L240,65Z" fill="#0d0804"/>
  <path d="M245,65 L245,56 A17.5,17.5 0 0 0 280,56 L280,65Z" fill="#0d0804"/>
  <path d="M285,65 L285,56 A17.5,17.5 0 0 0 320,56 L320,65Z" fill="#0d0804"/>
  <path d="M325,65 L325,56 A17.5,17.5 0 0 0 360,56 L360,65Z" fill="#0d0804"/>
  <path d="M365,65 L365,56 A17.5,17.5 0 0 0 400,56 L400,65Z" fill="#0d0804"/>
  <rect width="400" height="80" y="65" fill="#6a5030"/>
  <rect width="400" height="12" y="65" fill="#8a6840" opacity=".35"/>
  <rect width="400" height="1" y="78" fill="#3a2010" opacity=".7"/>
  <rect width="400" height="1" y="91" fill="#3a2010" opacity=".7"/>
  <rect width="400" height="1" y="104" fill="#3a2010" opacity=".7"/>
  <rect width="400" height="1" y="117" fill="#3a2010" opacity=".7"/>
  <rect width="400" height="1" y="130" fill="#3a2010" opacity=".7"/>
  <rect x="0"   y="65" width="14" height="80" fill="#4a3018"/>
  <rect x="97"  y="65" width="14" height="80" fill="#4a3018"/>
  <rect x="194" y="65" width="14" height="80" fill="#4a3018"/>
  <rect x="291" y="65" width="14" height="80" fill="#4a3018"/>
  <rect x="388" y="65" width="12" height="80" fill="#4a3018"/>
  <line x1="14"  y1="65" x2="14"  y2="145" stroke="#281808" stroke-width="1.5"/>
  <line x1="97"  y1="65" x2="97"  y2="145" stroke="#281808" stroke-width="1.5"/>
  <line x1="111" y1="65" x2="111" y2="145" stroke="#281808" stroke-width="1.5"/>
  <line x1="194" y1="65" x2="194" y2="145" stroke="#281808" stroke-width="1.5"/>
  <line x1="208" y1="65" x2="208" y2="145" stroke="#281808" stroke-width="1.5"/>
  <line x1="291" y1="65" x2="291" y2="145" stroke="#281808" stroke-width="1.5"/>
  <line x1="305" y1="65" x2="305" y2="145" stroke="#281808" stroke-width="1.5"/>
  <line x1="388" y1="65" x2="388" y2="145" stroke="#281808" stroke-width="1.5"/>
  <path d="M14,145 L14,130 A41.5,41.5 0 0 0 97,130 L97,145Z"    fill="#0d0804"/>
  <path d="M111,145 L111,130 A41.5,41.5 0 0 0 194,130 L194,145Z" fill="#0d0804"/>
  <path d="M208,145 L208,130 A41.5,41.5 0 0 0 291,130 L291,145Z" fill="#0d0804"/>
  <path d="M305,145 L305,130 A41.5,41.5 0 0 0 388,130 L388,145Z" fill="#0d0804"/>
  <path d="M14,130 A41.5,41.5 0 0 0 97,130"   fill="none" stroke="#8a6840" stroke-width="5" opacity=".4"/>
  <path d="M111,130 A41.5,41.5 0 0 0 194,130" fill="none" stroke="#8a6840" stroke-width="5" opacity=".4"/>
  <path d="M208,130 A41.5,41.5 0 0 0 291,130" fill="none" stroke="#8a6840" stroke-width="5" opacity=".4"/>
  <path d="M305,130 A41.5,41.5 0 0 0 388,130" fill="none" stroke="#8a6840" stroke-width="5" opacity=".4"/>
  <rect x="51"  y="88" width="10" height="16" rx="2" fill="#7a5e38"/>
  <rect x="148" y="88" width="10" height="16" rx="2" fill="#7a5e38"/>
  <rect x="245" y="88" width="10" height="16" rx="2" fill="#7a5e38"/>
  <rect x="342" y="88" width="10" height="16" rx="2" fill="#7a5e38"/>
  <ellipse cx="104" cy="68" rx="4" ry="6" fill="#ffdd50" opacity=".85"/>
  <ellipse cx="201" cy="68" rx="4" ry="6" fill="#ffdd50" opacity=".85"/>
  <ellipse cx="298" cy="68" rx="4" ry="6" fill="#ffdd50" opacity=".85"/>
  <ellipse cx="104" cy="74" rx="12" ry="18" fill="#ff9020" opacity=".35"/>
  <ellipse cx="201" cy="74" rx="12" ry="18" fill="#ff9020" opacity=".35"/>
  <ellipse cx="298" cy="74" rx="12" ry="18" fill="#ff9020" opacity=".35"/>
  <rect width="400" height="55" y="145" fill="#8c6828"/>
  <rect width="400" height="55" y="145" fill="#a08030" opacity=".30"/>
  <ellipse cx="200" cy="172" rx="130" ry="10" fill="#705020" opacity=".45"/>
  <line x1="50"  y1="153" x2="165" y2="167" stroke="#6a4c1e" stroke-width="1" opacity=".5"/>
  <line x1="225" y1="161" x2="355" y2="152" stroke="#6a4c1e" stroke-width="1" opacity=".4"/>
  <rect width="42" height="200" fill="#0a0604" opacity=".5"/>
  <rect x="358" width="42" height="200" fill="#0a0604" opacity=".5"/>
  <rect width="400" height="14" fill="#040302" opacity=".55"/>
</svg></div>`;
  },

  /* Gemeinsame Arena (Team links / Gegner rechts). wb=true → WorldBoss mit Team-HP-Pool */
  arenaHtml(wb = false) {
    const s = Game.state;
    const wbTeam = (Battle.wbTeam && Battle.wbTeam.length) ? Battle.wbTeam : Game.strongestMonsters(Game.MAX_TEAM);
    const teamInner = wb
      ? `<div class="wb-team">${wbTeam.map(m => UI.fighterMiniHtml(m)).join("") || '<div class="hint">Kein Monster.</div>'}</div>
         <div class="wb-pool" id="wbpool">
           <div class="wb-pool-label">❤️ Team-HP (gesamte Sammlung)</div>
           <div class="hpbar"><div class="fill" id="wb-hpfill" style="width:100%"></div><div class="txt" id="wb-hptext"></div></div>
         </div>`
      : (s.team.map(m => UI.fighterHtml(m)).join("") || '<div class="hint">Kein Monster im Team.</div>');

    return `
      <div class="arena">
        <div class="team-side" id="team-side">${teamInner}</div>
        <div class="vs">⚔️</div>
        <div class="enemy-side">
          <div class="enemy-fighter ${wb ? "boss" : ""}" id="enemy-fighter">
            <div class="enemy-emoji" id="bt-emoji">❔</div>
            <div class="enemy-name" id="bt-name">—</div>
            <div class="enemy-sub" id="bt-sub"></div>
            <div class="hpbar"><div class="fill" id="bt-hpfill" style="width:100%"></div>
              <div class="txt" id="bt-hptext"></div></div>
          </div>
        </div>
      </div>`;
  },

  /* Kampf-Tab: Router — Modus-Auswahl → Team-Auswahl → (Stage-Auswahl) → Kampf */
  renderHome() {
    switch (UI.kampfView) {
      case "team":        return UI.renderTeamSelect();
      case "stageSelect": return UI.renderStageSelect();
      case "fight":       return Battle.mode === "worldboss" ? UI.renderWorldBossFight() : UI.renderStageFight();
      default:            return UI.renderModeSelect();
    }
  },

  renderModeSelect() {
    const s = Game.state;
    return `
      <div class="panel">
        <h2>⚔️ Kampf — Modus wählen</h2>
        <div class="mode-grid">
          <button class="mode-card" onclick="Game.chooseMode('stage')">
            <div class="mc-emoji">🏟️</div>
            <div class="mc-name">Stage-Kampf</div>
            <div class="mc-desc">Wellen-Gauntlet in Stages. Besiege 5 Wellen, schalte die nächste Stage frei.</div>
            <div class="mc-info">Aktuell: Stage ${s.stage.current} · frei bis ${s.stage.unlocked}</div>
            <div class="mc-go">Wählen ▶</div>
          </button>
          <button class="mode-card boss" onclick="Game.chooseMode('worldboss')">
            <div class="mc-emoji">🌌</div>
            <div class="mc-name">WorldBoss</div>
            <div class="mc-desc">Atk & Def deiner gewählten Monster <b>× Anzahl die du besitzt</b>. Riesige HP, fette Belohnungen.</div>
            <div class="mc-info">Stufe ${s.worldBoss.level} · Beste ${s.worldBoss.best || 0}</div>
            <div class="mc-go">Wählen ▶</div>
          </button>
        </div>
      </div>`;
  },

  /* Team-Auswahl (nur Stage) — Monster hinzufügen + Team-Box unten */
  renderTeamSelect() {
    const s = Game.state;
    const groups = Game.collectionGroups();
    const full = s.team.length >= Game.MAX_TEAM;

    const cards = groups.map(g => {
      const m = g.sample;
      const inTeam = g.members.filter(x => s.team.some(t => t.id === x.id)).length;
      const canAdd = inTeam < g.count && !full;
      return `
        <div class="mon ${m.fused ? "fused" : ""} ${UI.glowClass(m.rarity)}" style="--rcolor:${UI.rarColor(m.rarity)}">
          <div class="count-badge">×${g.count}</div>
          <div class="mhead">
            <div class="memoji">${m.emoji}</div>
            <div>
              <div class="mname">${m.name}</div>
              <div class="mmeta"><span class="rarity">${DATA.rarities[m.rarity].name}</span></div>
            </div>
          </div>
          <div class="stats">
            <span class="s-atk">⚔️ <b>${UI.fmt(m.attack)}</b></span>
            <span class="s-def">🛡️ <b>${UI.fmt(m.defense)}</b></span>
            <span style="color:var(--accent2)">Team ${inTeam}/${g.count}</span>
          </div>
          <div class="btn-row">
            <button class="btn sm ${canAdd ? "good" : "ghost"}" onclick="Game.teamAddFromGroup('${g.key}')" ${canAdd ? "" : "disabled"}>
              ＋ Hinzufügen</button>
          </div>
        </div>`;
    }).join("");

    // Team-Box (5 Slots) — gefüllte Slots klickbar zum Entfernen
    let slots = "";
    for (let i = 0; i < Game.MAX_TEAM; i++) {
      const m = s.team[i];
      slots += m
        ? `<div class="team-slot filled ${UI.glowClass(m.rarity)}" style="--rcolor:${UI.rarColor(m.rarity)}" onclick="Game.teamRemoveById('${m.id}')" title="Entfernen">
             <div class="ts-emoji">${m.emoji}</div><div class="ts-x">✕</div></div>`
        : `<div class="team-slot empty">＋</div>`;
    }

    return `
      <div class="panel">
        <div class="mode-bar"><button class="btn ghost sm" onclick="Game.backToModes()">← Modus</button></div>
        <h2>🏟️ Stage — Team wählen</h2>
        <p class="hint" style="text-align:left;padding:0 0 8px">Tippe <b>Hinzufügen</b>, um Monster ins Team zu holen (max. 5). Im Team unten antippen, um es zu entfernen.</p>
        <div class="coll-grid">${cards || '<div class="hint">Noch keine Monster.</div>'}</div>
      </div>
      <div style="height:180px"></div>
      <div class="team-box">
        <div class="tb-title">Dein Team <span>(${s.team.length}/${Game.MAX_TEAM})</span></div>
        <div class="team-slots">${slots}</div>
        <div class="btn-row">
          <button class="btn ghost" onclick="Game.clearTeam()" ${s.team.length ? "" : "disabled"}>Leeren</button>
          <button class="btn" onclick="Game.confirmTeam()" ${s.team.length >= 1 ? "" : "disabled"}>Weiter ▶</button>
        </div>
      </div>`;
  },

  /* Stage-Auswahl (nach Team-Wahl) — kompakte Kachel-Ansicht */
  renderStageSelect() {
    const s = Game.state;
    const st = s.stage;
    const W = Battle.WAVES_PER_STAGE;
    const frontier = st.unlocked;

    let tiles = "";
    for (let i = 1; i <= st.unlocked; i++) {
      const best = st.best[i] || 0;
      const cleared = best >= W;
      const isF = i === frontier && !cleared;
      const status = isF ? "🚩" : cleared ? "✓" : (best ? `${best}/${W}` : "·");
      tiles += `<button class="stage-tile ${cleared ? "cleared" : ""} ${isF ? "frontier" : ""}" onclick="Game.startStageRun(${i})" title="Stage ${i} · Lv ${(i - 1) * W + 1}–${i * W}">
          <span class="st-num">${i}</span><span class="st-stat">${status}</span></button>`;
    }

    return `
      <div class="panel">
        <div class="mode-bar"><button class="btn ghost sm" onclick="Game.backToTeam()">← Team</button></div>
        <h2>🏟️ Stage wählen</h2>
        <button class="btn frontier-btn" onclick="Game.startStageRun(${frontier})">🚩 Höchste Stage spielen — Stage ${frontier}</button>
        <p class="hint" style="text-align:left;padding:6px 0 8px">Die höchste Stage (🚩) führt nach Sieg automatisch weiter — bis dein Team fällt. Geschaffte Stages (✓) kannst du einzeln wiederholen.</p>
        <div class="stage-tiles">${tiles}</div>
      </div>`;
  },

  renderStageFight() {
    const s = Game.state;
    const st = s.stage;
    const W = Battle.WAVES_PER_STAGE;
    const dots = UI.waveDotsHtml(st, W);
    return `
      <div class="panel">
        <div class="mode-bar">
          <button class="btn ghost sm" onclick="Game.backToStageSelect()">← Stages</button>
          <button class="btn ghost sm" onclick="Game.restartStageRun()">↻ Neu starten</button>
        </div>
        <div class="stage-head">
          <div class="stage-now" id="stg-now">🏟️ Stage ${st.current} · Welle ${st.wave}/${W}${Battle.frontier ? " 🚩" : ""}</div>
          <div class="wave-track" id="stg-dots">${dots}</div>
        </div>
      </div>
      <div class="panel arena-bg stage">
        ${UI.arenaSceneSVG('stage')}
        <h2>Kampf-Arena <span style="color:var(--muted);font-weight:400">(Team ${s.team.length}/${Game.MAX_TEAM})</span></h2>
        ${UI.arenaHtml()}
        <div class="auto-note"><span class="dot"></span>Kampf läuft automatisch</div>
      </div>`;
  },

  renderWorldBossFight() {
    const s = Game.state;
    return `
      <div class="panel">
        <div class="mode-bar">
          <button class="btn ghost sm" onclick="Game.backToModes()">← Zurück</button>
          <button class="btn ghost sm" onclick="Game.restartWorldBoss()">↻ Neu starten</button>
        </div>
        <h2>🌌 WorldBoss — Stufe ${s.worldBoss.level}</h2>
        <div class="wb-stats">
          <div class="kv"><span>Angriff (gesamte Sammlung)</span><b style="color:var(--hp2)">⚔️ ${UI.fmt(Game.totalAttack())}</b></div>
          <div class="kv"><span>Verteidigung (gesamte Sammlung)</span><b style="color:var(--xp)">🛡️ ${UI.fmt(Game.totalDefense())}</b></div>
          <div class="kv"><span>Bisher beste Stufe</span><b>${s.worldBoss.best || 0}</b></div>
        </div>
      </div>
      <div class="panel arena-bg worldboss">
        <h2>🌋 Infernale Arena</h2>
        ${UI.arenaHtml(true)}
        <div class="auto-note"><span class="dot"></span>Deine gesamte Sammlung kämpft als ein HP-Pool</div>
      </div>`;
  },

  /* Animations-Klasse neu auslösen (Reflow erzwingen, danach aufräumen) */
  retrigger(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 520);
  },

  /* Schwebende Schadenszahl über einem Element anzeigen */
  floatDamage(el, amount, kind) {
    if (!el || amount == null) return;
    const d = document.createElement("div");
    d.className = "dmg-float " + (kind || "");
    d.textContent = "-" + Math.round(amount).toLocaleString("de-DE");
    el.appendChild(d);
    setTimeout(() => d.remove(), 850);
  },

  /* Leichtgewichtige Aktualisierung des Kampfbildschirms (jeden Tick) */
  refresh() {
    UI.updateTopbar();
    if (UI.current !== "home") return;
    const s = Game.state;
    const e = s.enemy; if (!e) return;
    const wb = Battle.mode === "worldboss";

    const teamSide = document.getElementById("team-side");
    if (!teamSide) return; // Home noch nicht gerendert
    const expectFighters = wb ? (Battle.wbTeam ? Battle.wbTeam.length : 0) : s.team.length;
    if (teamSide.querySelectorAll(".fighter").length !== expectFighters) { UI.render(); return; }

    // Stage-Kopf live aktualisieren (nur Stage)
    const st = s.stage, W = Battle.WAVES_PER_STAGE;
    const now = document.getElementById("stg-now");
    if (now) now.textContent = `🏟️ Stage ${st.current} · Welle ${st.wave}/${W}${Battle.frontier ? " 🚩" : ""}`;
    const dotsEl = document.getElementById("stg-dots");
    if (dotsEl) dotsEl.innerHTML = UI.waveDotsHtml(st, W);

    // Gegner aktualisieren
    document.getElementById("bt-emoji").textContent = e.emoji;
    document.getElementById("bt-name").textContent = e.name;
    document.getElementById("bt-sub").innerHTML = e.isWorldBoss
      ? `🌌 WorldBoss · Stufe ${e.level}`
      : `Lv ${e.level} · ${UI.elChip(e.element)} · 💰 ${e.reward}`;
    document.getElementById("bt-hpfill").style.width = Math.max(0, (e.hp / e.maxHp) * 100) + "%";
    document.getElementById("bt-hptext").textContent =
      Math.max(0, Math.ceil(e.hp)).toLocaleString("de-DE") + " / " + e.maxHp.toLocaleString("de-DE");

    if (wb) {
      // WorldBoss: gemeinsamen Team-HP-Pool aktualisieren
      const fill = document.getElementById("wb-hpfill");
      if (fill) {
        fill.style.width = Math.max(0, (Battle.wbHp / Battle.wbMaxHp) * 100) + "%";
        document.getElementById("wb-hptext").textContent =
          Math.max(0, Math.ceil(Battle.wbHp)).toLocaleString("de-DE") + " / " + Battle.wbMaxHp.toLocaleString("de-DE");
      }
    } else {
      // Stage: einzelne Monster-HP aktualisieren
      for (const m of s.team) {
        const f = document.getElementById("fighter-" + m.id);
        if (!f || !f.querySelector(".f-hp")) continue;
        f.querySelector(".f-name").textContent = m.name;
        f.querySelector(".hpbar .fill").style.width = Math.max(0, (m.hp / m.maxHp) * 100) + "%";
        f.querySelector(".f-hp").textContent = Math.max(0, Math.ceil(m.hp)) + " / " + m.maxHp;
        f.classList.toggle("dead", m.hp <= 0);
      }
    }

    // Kick-/Treffer-Animationen + Schadenszahlen
    const fx = Battle.fx; Battle.fx = null;
    if (fx) {
      const enemyEl = document.getElementById("enemy-fighter");
      if (fx.type === "monster") {
        UI.retrigger(document.getElementById("fighter-" + fx.attackerId), "attacking");
        UI.retrigger(enemyEl, "hurt");
        UI.floatDamage(enemyEl, fx.dmg, "dmg-enemy");
      } else {
        UI.retrigger(enemyEl, "attacking");
        if (fx.targetId === "wbpool") {
          const pool = document.getElementById("wbpool");
          UI.retrigger(pool, "hurt");
          UI.floatDamage(pool, fx.dmg, "dmg-player");
        } else {
          const tgt = document.getElementById("fighter-" + fx.targetId);
          UI.retrigger(tgt, "hurt");
          UI.floatDamage(tgt, fx.dmg, "dmg-player");
        }
      }
    }
  },

  /* Gestapelte Gruppen-Karte (identische Monster zusammengefasst, mit Anzahl) */
  monGroupCard(g) {
    const m = g.sample;
    const rc = UI.rarColor(m.rarity);
    return `
      <div class="mon ${m.fused ? "fused" : ""} ${UI.glowClass(m.rarity)}" style="--rcolor:${rc}">
        <div class="count-badge">×${g.count}</div>
        <div class="mhead">
          <div class="memoji">${m.emoji}</div>
          <div>
            <div class="mname">${m.name}</div>
            <div class="mmeta"><span class="rarity">${DATA.rarities[m.rarity].name}</span></div>
          </div>
        </div>
        <div class="mmeta" style="margin-top:4px">${UI.elChip(m.element)}</div>
        <div class="stats">
          <span class="s-hp">❤️ <b>${UI.fmt(m.maxHp)}</b></span>
          <span class="s-atk">⚔️ <b>${UI.fmt(m.attack)}</b></span>
          <span class="s-def">🛡️ <b>${UI.fmt(m.defense)}</b></span>
        </div>
      </div>`;
  },

  /* ---- Sammlung-Tab mit Unter-Reitern: Sammlung / Dex / Fusion ---- */
  setMonsterTab(t) { UI.monsterTab = t; UI.render(); },

  renderMonster() {
    const tab = UI.monsterTab || "collection";
    const subbar = `
      <div class="subtabs">
        <button class="subtab ${tab === "collection" ? "active" : ""}" onclick="UI.setMonsterTab('collection')">Sammlung</button>
        <button class="subtab ${tab === "dex" ? "active" : ""}" onclick="UI.setMonsterTab('dex')">Dex</button>
        <button class="subtab ${tab === "fusion" ? "active" : ""}" onclick="UI.setMonsterTab('fusion')">⚛️ Fusion</button>
      </div>`;
    const content = tab === "dex" ? UI.renderDex() : tab === "fusion" ? UI.renderFusion() : UI.renderCollection();
    return subbar + content;
  },

  /* Rang-Akkordeon-Sektion (gemeinsam für Sammlung & Dex) */
  rankSection(rarity, innerHtml, count, open, toggleAttr) {
    const rc = UI.rarColor(rarity);
    return `
      <div class="rank-section">
        <button class="rank-head" style="--rcolor:${rc}" ${toggleAttr}>
          <span class="rh-name" style="color:${rc}">${DATA.rarities[rarity].name}</span>
          <span class="rh-info">${count}</span>
          <span class="rh-arrow">${open ? "▲" : "▼"}</span>
        </button>
        ${open ? `<div class="coll-grid rank-body">${innerHtml}</div>` : ""}
      </div>`;
  },

  /* Sammlung: alle besessenen Monster, nach Rang aufklappbar (höchster oben) */
  renderCollection() {
    const s = Game.state;
    const groups = Game.collectionGroups();
    const byRank = {};
    for (const g of groups) (byRank[g.sample.rarity] ||= []).push(g);
    const ranks = DATA.rarityOrder.slice().reverse().filter(r => byRank[r]); // höchster Rang oben

    const sections = ranks.map(rarity => {
      const list = byRank[rarity];
      const open = UI.collOpen[rarity] !== false; // standardmäßig offen
      const cards = list.map(g => UI.monGroupCard(g)).join("");
      const total = list.reduce((n, g) => n + g.count, 0);
      return UI.rankSection(rarity, cards, `${list.length} Arten · ${total} Monster`, open, `onclick="UI.toggleCollRank('${rarity}')"`);
    }).join("");

    return `
      <div class="panel">
        <h2>Sammlung <span style="color:var(--muted);font-weight:400">(${s.collection.length} Monster)</span></h2>
        ${sections || '<div class="hint">Noch keine Monster.</div>'}
      </div>`;
  },
  toggleCollRank(rarity) { UI.collOpen[rarity] = UI.collOpen[rarity] === false; UI.render(); },

  /* Eine Monster-Form berechnen: Vorlage bei einem bestimmten Rang (base = nicht fusioniert,
     höhere Ränge = fusioniert ×3.5). Gibt null zurück, wenn der Rang unter dem Basis-Rang liegt. */
  dexForm(id, rarity) {
    const t = DATA.templates[id];
    const baseOrder = DATA.rarities[t.rarity].order;
    const order = DATA.rarities[rarity].order;
    if (order < baseOrder) return null; // existiert nicht (Fusion geht nur aufwärts)
    const fused = order > baseOrder;
    const mult = DATA.rarities[rarity].mult * (fused ? 3.5 : 1);
    const title = fused ? (DATA.rarityTitles[rarity] || "") : "";
    return {
      id, rarity, fused,
      name: title ? `${title} ${t.name}` : t.name,
      emoji: t.emoji, element: t.element,
      maxHp: Math.round(t.hp * mult), attack: Math.round(t.attack * mult), defense: Math.round(t.defense * mult),
    };
  },

  /* Dex: ALLE existierenden Monster über ALLE Ränge; nicht besessene nur ausgegraut */
  renderDex() {
    const s = Game.state;
    // besessene Formen als templateId|rarity zählen
    const owned = {};
    for (const m of s.collection) { const k = m.templateId + "|" + m.rarity; owned[k] = (owned[k] || 0) + 1; }

    const templateIds = Object.keys(DATA.templates);
    const ranks = DATA.rarityOrder.slice().reverse(); // höchster Rang oben
    let totalForms = 0, discoveredForms = 0;

    const sections = ranks.map(rarity => {
      const forms = templateIds
        .map(id => UI.dexForm(id, rarity))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (!forms.length) return "";
      const open = !!UI.dexOpen[rarity]; // Dex ist groß → standardmäßig zugeklappt
      const ownedHere = forms.filter(f => owned[f.id + "|" + rarity]).length;
      totalForms += forms.length; discoveredForms += ownedHere;

      const cards = forms.map(f => {
        const cnt = owned[f.id + "|" + rarity] || 0;
        const isOwned = cnt > 0;
        return `
          <div class="mon dex ${isOwned ? UI.glowClass(rarity) : "unowned"} ${f.fused ? "fused" : ""}" style="--rcolor:${UI.rarColor(rarity)}">
            ${isOwned ? `<div class="count-badge">×${cnt}</div>` : `<div class="dex-lock">🔒</div>`}
            <div class="mhead">
              <div class="memoji">${f.emoji}</div>
              <div>
                <div class="mname">${f.name}</div>
                <div class="mmeta"><span class="rarity">${DATA.rarities[rarity].name}</span></div>
              </div>
            </div>
            <div class="mmeta" style="margin-top:4px">${UI.elChip(f.element)}</div>
            <div class="stats">
              <span class="s-hp">❤️ <b>${UI.fmt(f.maxHp)}</b></span>
              <span class="s-atk">⚔️ <b>${UI.fmt(f.attack)}</b></span>
              <span class="s-def">🛡️ <b>${UI.fmt(f.defense)}</b></span>
            </div>
          </div>`;
      }).join("");
      return UI.rankSection(rarity, cards, `${ownedHere}/${forms.length} entdeckt`, open, `onclick="UI.toggleDexRank('${rarity}')"`);
    }).join("");

    return `
      <div class="panel">
        <h2>📖 Dex <span style="color:var(--muted);font-weight:400">(${discoveredForms}/${totalForms} entdeckt)</span></h2>
        <p class="hint" style="text-align:left;padding:0 0 8px">Alle Monster über alle Ränge. Nicht besessene sind ausgegraut. Tippe einen Rang zum Aufklappen.</p>
        ${sections}
      </div>`;
  },
  toggleDexRank(rarity) { UI.dexOpen[rarity] = !UI.dexOpen[rarity]; UI.render(); },

  renderSummon() {
    const s = Game.state;
    const banners = DATA.summonBanners.map(b => {
      const locked = s.playerLevel < b.minLevel;
      const have = b.currency === "crystals" ? s.inventory.crystals : s.gold;
      const afford = have >= b.cost;
      const curIcon = b.currency === "crystals" ? "💎" : "💰";
      // kompakte Raten-Chips (höchster Rang zuerst)
      const rates = b.table.slice().sort((x, y) => DATA.rarities[y.rarity].order - DATA.rarities[x.rarity].order)
        .map(r => `<span class="rate-chip" style="color:${DATA.rarities[r.rarity].color};border-color:${DATA.rarities[r.rarity].color}">${DATA.rarities[r.rarity].name.slice(0, 3)} ${(r.chance * 100).toFixed(r.chance < 0.01 ? 1 : 0)}%</span>`).join("");
      const maxN = Game.summonAffordable(b);
      return `
        <div class="summon-card ${locked ? "locked" : ""}">
          <div class="sc-head">
            <span class="sc-emoji">${b.emoji}</span>
            <div class="sc-title">
              <div class="sc-name">${b.name}</div>
              <div class="sc-cost">${b.cost.toLocaleString("de-DE")} ${curIcon}</div>
            </div>
          </div>
          <div class="sc-rates">${rates}</div>
          ${locked
            ? `<div class="sc-lock">🔒 Ab Level ${b.minLevel}</div>`
            : `<div class="summon-btns">
                 <button class="btn sm" onclick="Game.summon('${b.id}',1)" ${afford ? "" : "disabled"}>×1</button>
                 <button class="btn sm" onclick="Game.summon('${b.id}',10)" ${maxN >= 10 ? "" : "disabled"}>×10</button>
                 <button class="btn sm good" onclick="Game.summon('${b.id}','max')" ${maxN >= 1 ? "" : "disabled"}>Max ${maxN >= 1 ? maxN : 0}</button>
               </div>`}
        </div>`;
    }).join("");

    return `
      <div class="panel">
        <div class="items-strip">
          <span>🥚 <b>${s.inventory.eggs}</b></span>
          <span>💎 <b>${s.inventory.crystals}</b></span>
          <span>🪨 <b>${s.inventory.upgradeStones}</b></span>
          <button class="btn sm ghost" onclick="Game.hatchEgg()" ${s.inventory.eggs > 0 ? "" : "disabled"}>🥚 Ausbrüten</button>
        </div>
      </div>
      <div class="panel">
        <h2>🔮 Beschwörung</h2>
        <div class="summon-grid">${banners}</div>
      </div>`;
  },

  /* Fusion-Tab: pro Rang ein aufklappbarer Spoiler; Anzahl der Fusionen wählbar */
  toggleFusionRank(rarity) {
    UI.fusionOpen[rarity] = !UI.fusionOpen[rarity];
    UI.render();
  },
  doFuse(idx) {
    const key = UI._fuseKeys[idx];
    const sel = document.getElementById("fuseamt-" + idx);
    const val = sel ? sel.value : "1";
    Game.fuseGroup(key, val === "max" ? "max" : parseInt(val, 10));
  },

  renderFusion() {
    const groups = Game.collectionGroups();
    UI._fuseKeys = [];
    let idx = 0;
    // nach Rang gruppieren
    const byRank = {};
    for (const g of groups) (byRank[g.sample.rarity] ||= []).push(g);

    const sections = DATA.rarityOrder.filter(r => byRank[r]).map(rarity => {
      const list = byRank[rarity];
      const rc = UI.rarColor(rarity);
      const open = !!UI.fusionOpen[rarity];
      const fuseableCount = list.filter(g => g.count >= 2).length;

      const cards = list.map(g => {
        const m = g.sample;
        const maxPairs = Math.floor(g.count / 2);
        const canFuse = maxPairs >= 1;
        let options = "";
        for (let p = 1; p <= maxPairs; p++) options += `<option value="${p}">${p}×</option>`;
        if (maxPairs > 1) options += `<option value="max">Max (${maxPairs}×)</option>`;
        const i = idx++;
        UI._fuseKeys[i] = g.key;
        return `
          <div class="mon ${m.fused ? "fused" : ""} ${UI.glowClass(m.rarity)}" style="--rcolor:${UI.rarColor(m.rarity)}">
            <div class="count-badge">×${g.count}</div>
            <div class="mhead">
              <div class="memoji">${m.emoji}</div>
              <div>
                <div class="mname">${m.name}</div>
                <div class="mmeta"><span class="rarity">${DATA.rarities[m.rarity].name}</span></div>
              </div>
            </div>
            <div class="stats">
              <span class="s-atk">⚔️ <b>${UI.fmt(m.attack)}</b></span>
              <span class="s-def">🛡️ <b>${UI.fmt(m.defense)}</b></span>
            </div>
            ${canFuse ? `
              <div class="fuse-row">
                <select id="fuseamt-${i}" class="fuse-sel">${options}</select>
                <button class="btn sm good" onclick="UI.doFuse(${i})">⚛ Fusionieren</button>
              </div>
              <div class="mmeta">→ ${DATA.rarities[DATA.nextRarity(m.rarity)].name}</div>`
              : `<div class="mmeta" style="margin-top:8px">Nur 1× — keine Fusion möglich</div>`}
          </div>`;
      }).join("");

      return `
        <div class="rank-section">
          <div class="rank-head-row">
            <button class="rank-head" style="--rcolor:${rc}" onclick="UI.toggleFusionRank('${rarity}')">
              <span class="rh-name" style="color:${rc}">${DATA.rarities[rarity].name}</span>
              <span class="rh-info">${list.length} Arten${fuseableCount ? ` · ${fuseableCount} fusionierbar` : ""}</span>
              <span class="rh-arrow">${open ? "▲" : "▼"}</span>
            </button>
            ${fuseableCount ? `<button class="btn sm good rank-fuse-all" onclick="Game.fuseAllInRank('${rarity}')">⚛ Alle</button>` : ""}
          </div>
          ${open ? `<div class="coll-grid rank-body">${cards}</div>` : ""}
        </div>`;
    }).join("");

    return `
      <div class="panel">
        <h2>⚛️ Fusion</h2>
        <p class="hint" style="text-align:left;padding:0 0 8px">Pro Rang aufklappbar. Verbinde 2 gleiche Monster desselben Rangs → nächsthöherer Rang (+50% Stats). Anzahl der Fusionen wählbar.</p>
        ${sections || '<div class="hint">Noch keine Monster.</div>'}
      </div>`;
  },

  renderSettings() {
    const s = Game.state;
    const mins = Math.floor((s.playSeconds || 0) / 60);
    return `
      <div class="panel">
        <h2>📊 Statistik</h2>
        <div class="kv"><span>Gegner besiegt</span><b>${s.kills || 0}</b></div>
        <div class="kv"><span>Höchste freigeschaltete Stage</span><b>${s.stage.unlocked}</b></div>
        <div class="kv"><span>Aktuelle Stage</span><b>Stage ${s.stage.current} · Welle ${s.stage.wave}</b></div>
        <div class="kv"><span>Monster gesammelt</span><b>${s.collection.length}</b></div>
        <div class="kv"><span>Spielzeit</span><b>${mins} min</b></div>
      </div>
      <div class="panel">
        <h2>⚙️ Einstellungen</h2>
        <div class="kv"><span>Autosave (alle 30s)</span>
          <button class="btn sm ${s.settings.autosave?"good":"ghost"}" onclick="Game.toggleSetting('autosave')">
            ${s.settings.autosave?"AN":"AUS"}</button></div>
        <div class="btn-row" style="margin-top:12px">
          <button class="btn" onclick="Game.manualSave()">💾 Jetzt speichern</button>
        </div>
        <div class="btn-row">
          <button class="btn bad" onclick="Game.askReset()">🗑️ Spielstand löschen</button>
        </div>
      </div>`;
  },

  /* ---- Toast ---- */
  toast(msg, type = "") {
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = msg;
    document.getElementById("toasts").appendChild(t);
    setTimeout(() => t.remove(), 2600);
  },

  /* ---- Modal ---- */
  modal(html, closable = true) {
    UI._modalClosable = closable;
    document.getElementById("modal-box").innerHTML = html;
    document.getElementById("modal").classList.remove("hidden");
  },
  closeModal() {
    document.getElementById("modal").classList.add("hidden");
  },

  showTutorial() {
    UI.modal(`
      <div class="emoji-xl">🐺</div>
      <h2>Willkommen, Warlord!</h2>
      <p>Dein <b>Flammenwolf</b> ist bereit. Der Kampf läuft <b>automatisch</b> — dein Team greift alle 2 Sekunden an.</p>
      <p>Besiege Gegner für <b style="color:var(--gold)">Gold</b> & XP, <b>beschwöre</b> neue Monster und <b>fusioniere</b> gleiche Monster zu höheren Rängen.</p>
      <p>Auch wenn du offline bist, sammelt dein Team weiter Belohnungen (max. 8 Std).</p>
      <button class="btn" style="margin-top:14px" onclick="UI.closeModal()">Los geht's! ⚔️</button>
    `);
  },

  showWorldBossReward(level, r) {
    UI.modal(`
      <div class="emoji-xl">🏆</div>
      <h2>WorldBoss Stufe ${level} besiegt!</h2>
      <div class="reward-line">+${r.gold.toLocaleString("de-DE")} 💰</div>
      <div class="reward-line">+${r.eggs} 🥚 · +${r.crystals} 💎 · +${r.stones} 🪨</div>
      <p>Stufe ${level + 1} ist jetzt verfügbar.</p>
      <button class="btn" style="margin-top:14px" onclick="UI.closeModal()">Weiter</button>
    `);
  },

  showOffline(info) {
    const h = Math.floor(info.capped / 3600);
    const m = Math.floor((info.capped % 3600) / 60);
    const timeStr = h > 0 ? `${h} Std ${m} Min` : `${m} Min`;
    UI.modal(`
      <div class="emoji-xl">💤</div>
      <h2>Willkommen zurück!</h2>
      <p>Du warst <b>${timeStr}</b> weg.</p>
      <div class="reward-line">+${info.gold.toLocaleString("de-DE")} 💰</div>
      <div class="reward-line">+${info.xp.toLocaleString("de-DE")} XP</div>
      <button class="btn" style="margin-top:14px" onclick="UI.closeModal()">Einsammeln</button>
    `);
  },
};
