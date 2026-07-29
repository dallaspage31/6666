import { Engine } from './js/engine/03-engine.js';
import { GameRenderer } from './game-renderer.js';
import { GameAssets } from './game-assets.js';
import { ForgeTokens } from './js/engine/15-forge-tokens.js';
import { FrontierDirector } from './js/engine/16-frontier-director.js';

GAME = { engine: null, renderer: null, assets: null, forgeTokens: null, frontierDirector: null };

const CLASS_LIST = [
  { id: 'guardian', name: 'Guardian' },
  { id: 'ranger', name: 'Ranger' },
  { id: 'mage', name: 'Mage' },
  { id: 'rogue', name: 'Rogue' },
];

async function boot() {
  const canvas = document.getElementById('combat-canvas');
  GAME.assets = new GameAssets();
  GAME.renderer = new GameRenderer(canvas, GAME.assets);
  GAME.engine = new Engine();
  GAME.forgeTokens = new ForgeTokens(GAME.engine.state);
  GAME.frontierDirector = new FrontierDirector(GAME.engine.state, GAME.engine.rng);

  GAME.assets.registerBatch({
    class_guardian: 'assets/art/units/wolf_idle_01.png',
    boss_fury: 'assets/art/bosses/moss_guardian.png',
    vfx_fire: 'assets/art/vfx/fire_blast.png',
    fg_rock: 'assets/art/mossroad/foreground/rock_cluster_01.png',
    ambient_spore: 'assets/art/mossroad/ambient/spore_mist.png',
  });

  GAME.engine.on('render', (state) => {
    GAME.renderer.render(state);
    updateHUD(state);
  });

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
  buildClassPanel();
  buildMapPanel();
  buildTitleBar();

  const lastSave = localStorage.getItem('TF_SAVE_v6_ts');
  if (lastSave) {
    const offline = Math.floor((Date.now() - parseInt(lastSave, 10)) / 1000);
    if (offline > 60) showOfflineModal(offline);
  }

  setInterval(() => {
    const data = JSON.stringify(GAME.engine.state);
    localStorage.setItem('TF_SAVE_v6', data);
    localStorage.setItem('TF_SAVE_v6_ts', String(Date.now()));
  }, 5000);
}

function updateHUD(state) {
  const classBtn = document.getElementById('class-name');
  const stageLabel = document.getElementById('stage-label');
  if (classBtn) classBtn.textContent = state.hero.classId || 'None';
  if (stageLabel) {
    if (state.frontier?.active) {
      stageLabel.textContent = `Frontier D${state.frontier.depth} · ${state.frontier.biome}`;
    } else {
      stageLabel.textContent = `Stage ${state.progression.currentStageNumber}`;
    }
  }
}

function buildClassPanel() {
  const list = document.getElementById('class-list');
  if (!list) return;
  list.innerHTML = '';
  for (const cls of CLASS_LIST) {
    const btn = document.createElement('button');
    btn.textContent = cls.name;
    btn.onclick = () => {
      GAME.engine.state.hero.classId = cls.id;
      updateHUD(GAME.engine.state);
      document.getElementById('class-panel').classList.add('hidden');
    };
    list.appendChild(btn);
  }

  const classBtn = document.getElementById('class-btn');
  if (classBtn) {
    classBtn.onclick = () => {
      document.getElementById('class-panel').classList.toggle('hidden');
    };
  }

  const frontierBtn = document.getElementById('frontier-btn');
  if (frontierBtn) {
    frontierBtn.onclick = () => {
      document.getElementById('map-panel').classList.toggle('hidden');
      updateMapPanel(GAME.engine.state);
    };
  }
}

function buildTitleBar() {
  const container = document.getElementById('class-cards');
  if (!container) return;
  container.innerHTML = '';
  for (const cls of CLASS_LIST) {
    const card = document.createElement('div');
    card.className = 'class-card';
    card.textContent = cls.name;
    card.dataset.classId = cls.id;
    card.onclick = () => {
      GAME.engine.state.hero.classId = cls.id;
      updateHUD(GAME.engine.state);
      document.querySelectorAll('.class-card').forEach((c) => c.classList.toggle('active', c.dataset.classId === cls.id));
    };
    container.appendChild(card);
  }
}

function showOfflineModal(offlineSeconds) {
  const modal = document.getElementById('offline-modal');
  const content = document.getElementById('offline-content');
  if (!modal || !content) return;
  const hours = Math.floor(offlineSeconds / 3600);
  const minutes = Math.floor((offlineSeconds % 3600) / 60);
  content.innerHTML = `
    <div>Offline for: ${hours}h ${minutes}m</div>
    <div>Frontier depth progressed</div>
    <div>Gold earned: +${Math.floor(offlineSeconds * 1.5)}</div>
    <div>Items found: ${Math.floor(offlineSeconds / 10)}</div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('offline-close').onclick = () => modal.classList.add('hidden');
}

  const classBtn = document.getElementById('class-btn');
  if (classBtn) {
    classBtn.onclick = () => {
      document.getElementById('class-panel').classList.toggle('hidden');
    };
  }

  const frontierBtn = document.getElementById('frontier-btn');
  if (frontierBtn) {
    frontierBtn.onclick = () => {
      document.getElementById('map-panel').classList.toggle('hidden');
      updateMapPanel(GAME.engine.state);
    };
  }
}

function buildMapPanel() {
  const startBtn = document.getElementById('frontier-start');
  const resumeBtn = document.getElementById('frontier-resume');
  const leaveBtn = document.getElementById('frontier-leave');

  if (startBtn) {
    startBtn.onclick = () => {
      GAME.engine.state.frontier = {
        active: true,
        seed: Date.now(),
        depth: 1,
        checkpointDepth: 1,
        policy: 'push',
        heat: 0,
        committed: false,
        bestDepth: 0,
      };
      updateHUD(GAME.engine.state);
      updateMapPanel(GAME.engine.state);
    };
  }

  if (resumeBtn) {
    resumeBtn.onclick = () => {
      if (GAME.engine.state.frontier?.active) {
        updateHUD(GAME.engine.state);
        updateMapPanel(GAME.engine.state);
        document.getElementById('map-panel').classList.add('hidden');
      }
    };
  }

  if (leaveBtn) {
    leaveBtn.onclick = () => {
      GAME.frontierDirector.leaveExpedition();
      updateHUD(GAME.engine.state);
      updateMapPanel(GAME.engine.state);
    };
  }
}

function updateMapPanel(state) {
  const statusEl = document.getElementById('frontier-status');
  const infoEl = document.getElementById('frontier-info');
  const bestEl = document.getElementById('frontier-best');
  const currentEl = document.getElementById('frontier-current');
  const checkpointEl = document.getElementById('frontier-checkpoint');
  const policyEl = document.getElementById('frontier-policy');
  const seedEl = document.getElementById('frontier-seed');

  if (!statusEl || !infoEl) return;

  const completed = state.progression.campaignCompleted || state.progression.currentStageNumber >= 120;
  if (!completed) {
    statusEl.textContent = 'Locked — complete Campaign Stage 120';
    infoEl.classList.add('hidden');
    return;
  }

  statusEl.textContent = state.frontier?.active ? 'Active Expedition' : 'Available';
  infoEl.classList.remove('hidden');

  if (state.frontier) {
    if (bestEl) bestEl.textContent = state.frontier.bestDepth || 0;
    if (currentEl) currentEl.textContent = `D${state.frontier.depth}`;
    if (checkpointEl) checkpointEl.textContent = state.frontier.checkpointDepth || 1;
    if (policyEl) policyEl.textContent = state.frontier.policy || 'push';
    if (seedEl) seedEl.textContent = state.frontier.seed || '—';
  } else {
    if (bestEl) bestEl.textContent = '0';
    if (currentEl) currentEl.textContent = '—';
    if (checkpointEl) checkpointEl.textContent = '1';
    if (policyEl) policyEl.textContent = 'push';
    if (seedEl) seedEl.textContent = '—';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
