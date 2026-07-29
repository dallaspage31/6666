import { Engine } from './js/engine/03-engine.js';
import { GameRenderer } from './game-renderer.js';
import { GameAssets } from './game-assets.js';
import { ForgeTokens } from './js/engine/15-forge-tokens.js';
import { FrontierDirector } from './js/engine/16-frontier-director.js';

GAME = { engine: null, renderer: null, assets: null, forgeTokens: null, frontierDirector: null };

async function boot() {
  const canvas = document.getElementById('combat-canvas');
  GAME.renderer = new GameRenderer(canvas);
  GAME.assets = new GameAssets();
  GAME.engine = new Engine();
  GAME.forgeTokens = new ForgeTokens(GAME.engine.state);
  GAME.frontierDirector = new FrontierDirector(GAME.engine.state, GAME.engine.rng);

  GAME.engine.on('render', (state) => GAME.renderer.render(state));

  const save = localStorage.getItem('TF_SAVE_v6');
  if (save) {
    try {
      const data = JSON.parse(save);
      GAME.engine.init(data);
    } catch {
      GAME.engine.init();
    }
  } else {
    GAME.engine.init();
  }

  GAME.engine.start();
  setInterval(() => {
    const data = JSON.stringify(GAME.engine.state);
    localStorage.setItem('TF_SAVE_v6', data);
  }, 5000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
