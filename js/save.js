/* ===== save.js — Speichern, Laden, Offline-Fortschritt ===== */
const Save = {
  KEY: "mdi_save_v1",
  VERSION: 1,

  saveGame() {
    const s = Game.state;
    s.lastSaveTime = Date.now();
    try {
      localStorage.setItem(Save.KEY, JSON.stringify(s));
      return true;
    } catch (e) {
      console.error("Speichern fehlgeschlagen", e);
      return false;
    }
  },

  loadGame() {
    try {
      const raw = localStorage.getItem(Save.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // einfache Migration / Defaults
      if (!data.inventory) data.inventory = { eggs: 0, crystals: 0, upgradeStones: 0 };
      if (!data.settings) data.settings = { sound: true, autosave: true };
      if (!data.stage) data.stage = { current: 1, unlocked: 1, wave: 1, best: {} };
      if (!data.worldBoss) data.worldBoss = { level: 1, best: 0 };
      if (data.playerExp == null) data.playerExp = 0;
      data.team = data.team || [];
      data.collection = data.collection || [];
      // Stats sicherstellen
      [...data.team, ...data.collection].forEach(m => Monster.recalc(m, true));
      return data;
    } catch (e) {
      console.error("Laden fehlgeschlagen", e);
      return null;
    }
  },

  hasSave() {
    return !!localStorage.getItem(Save.KEY);
  },

  resetGame() {
    localStorage.removeItem(Save.KEY);
  },

  /* Offline-Belohnung berechnen (gecappt auf 8h).
     Basis: durchschnittliche Gold-/XP-Rate aus bisheriger Spielzeit. */
  computeOffline(state) {
    if (!state.lastSaveTime) return null;
    let seconds = Math.floor((Date.now() - state.lastSaveTime) / 1000);
    if (seconds < 60) return null; // unter 1 Minute lohnt sich kein Popup
    const capped = Math.min(seconds, DATA.offlineCapSeconds);

    const played = Math.max(30, state.playSeconds || 0);
    const goldRate = (state.goldEarned || 0) / played; // Gold pro Sekunde
    const xpRate = (state.xpEarned || 0) / played;

    // 50% Effizienz im Idle-Offline-Modus, kleiner Fallback wenn noch keine Rate
    const eff = 0.5;
    const gold = Math.max(0, Math.round((goldRate * eff || DATA.enemyBase.reward / 20) * capped));
    const xp = Math.max(0, Math.round((xpRate * eff || 1) * capped));

    return { seconds, capped, gold, xp };
  },
};
