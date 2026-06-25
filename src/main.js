// ============================================================
//  main.js  —  程序入口（装配一切）
// ============================================================

import { load, save, resetSave } from './state.js';
import { tick } from './game.js';
import { initUI, updateUI, showOfflineReport } from './ui.js';

const UI_FPS = 5;
const AUTOSAVE_INTERVAL = 10;

function boot() {
  const { offline, gained } = load();

  initUI({
    onChange: (action) => {
      if (action === 'reset') { resetSave(); updateUI(); }
      save();
    },
  });

  updateUI();
  showOfflineReport(offline, gained);

  setInterval(tick, 1000 / 30);
  setInterval(updateUI, 1000 / UI_FPS);
  setInterval(save, AUTOSAVE_INTERVAL * 1000);

  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('beforeunload', save);
}

boot();
