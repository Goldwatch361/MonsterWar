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
      if (!data.inventory) data.inventory = { eggs: 0, crystals: 0 };
      delete data.inventory.upgradeStones;
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

};
