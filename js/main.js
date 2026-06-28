/* ===== main.js — Bootstrap: laden, init, Loop, Autosave ===== */
(function () {
  function boot() {
    // Spielzustand zuerst initialisieren, dann UI (Render greift auf Game.state zu)
    const firstStart = Game.init();
    UI.init();


    UI.render();

    // Kampf-Loop starten
    Battle.start();

    // Tutorial beim allerersten Start
    if (firstStart) UI.showTutorial();

    // Autosave alle 30 Sekunden
    setInterval(() => {
      if (Game.state.settings.autosave) Save.saveGame();
    }, 30000);

    // Speichern beim Schließen (lastSaveTime für Offline-Progress)
    window.addEventListener("beforeunload", () => Save.saveGame());

    // Erstes Speichern, damit lastSaveTime gesetzt ist
    Save.saveGame();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
