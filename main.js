import { Engine } from './js/engine/03-engine.js';
import { GameRenderer } from './game-renderer.js';
import { GameAssets } from './game-assets.js';
import { ForgeTokens } from './js/engine/15-forge-tokens.js';
import { FrontierDirector } from './js/engine/16-frontier-director.js';
import { OfflineSolver } from './js/engine/07-offline-solver.js';
import { formatBigInt } from './js/engine/00-bigint.js';
import { UPGRADE_TREE, getUpgradeCost } from './js/data/upgrade-tree.js';
import { defaultRegistry } from './js/engine/10-ability-registry.js';
import { EffectConsumers } from './js/engine/11-ability-effects.js';
import { SessionPersistence } from './js/engine/05-session-persistence.js';
import { InputManager } from './js/engine/04-input.js';
import { TalentTree } from './js/engine/07-talent-tree.js';
import { ShopSystem } from './js/engine/08-shop.js';
import { LoadoutManager } from './js/engine/09-loadout.js';

GAME = { engine: null, renderer: null, assets: null, forgeTokens: null, frontierDirector: null, persistence: null, inputs: null, talentTree: null, shop: null, loadout: null };

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
    class_ranger: 'assets/art/units/ranger_idle_01.png',
    class_mage: 'assets/art/units/mage_idle_01.png',
    class_rogue: 'assets/art/units/rogue_idle_01.png',
    boss_fury: 'assets/art/bosses/moss_guardian.png',
    boss_fortress: 'assets/art/bosses/iron_golem.png',
    boss_void: 'assets/art/bosses/shadow_wyrm.png',
    vfx_fire: 'assets/art/vfx/fire_blast.png',
    vfx_frost: 'assets/art/vfx/frost_nova.png',
    vfx_void: 'assets/art/vfx/void_bolt.png',
    vfx_holy: 'assets/art/vfx/holy_light.png',
    vfx_crit: 'assets/art/vfx/crit_spark.png',
    fg_rock: 'assets/art/mossroad/foreground/rock_cluster_01.png',
    ambient_spore: 'assets/art/mossroad/ambient/spore_mist.png',
  });

  GAME.engine.on('render', (state) => {
    renderParticles(GAME.renderer);
    GAME.renderer.render(state);
    updateHUD(state);
  });

  GAME.persistence = new SessionPersistence();
  const saveData = GAME.persistence.load();
  if (saveData) {
    try {
      GAME.engine.init(saveData);
    } catch {
      GAME.engine.init();
    }
  } else {
    GAME.engine.init();
  }

  GAME.inputs = new InputManager();
  GAME.talentTree = new TalentTree();
  GAME.talentTree.define('sharp_edges', { name: 'Sharp Edges', cost: 1, effect: { baseAttackDamage: 2 } });
  GAME.talentTree.define('iron_skin', { name: 'Iron Skin', cost: 1, effect: { baseArmor: 1 } });
  GAME.talentTree.define('blood_pact', { name: 'Blood Pact', cost: 2, requires: ['iron_skin'], effect: { lifeSteal: 0.05 } });
  GAME.shop = new ShopSystem();
  GAME.loadout = new LoadoutManager();

  GAME.engine.start();
  buildClassPanel();
  buildMapPanel();
  buildTitleBar();
  buildUpgradePanel();
  buildSkillBar();
  buildSkillsPanel();
  buildManagePanel();
  buildShopPanel();
  buildTalentPanel();

  const lastSave = GAME.persistence.load();
  if (lastSave) {
    const offline = Math.floor((Date.now() - (parseInt(localStorage.getItem('TF_SAVE_v6_ts') || '0', 10))) / 1000);
    if (offline > 60) showOfflineModal(offline);
  }

  setInterval(() => {
    GAME.persistence.save(GAME.engine.state);
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

  const upgradeBtn = document.getElementById('upgrade-btn');
  if (upgradeBtn) {
    upgradeBtn.onclick = () => {
      document.getElementById('upgrade-panel').classList.toggle('hidden');
      refreshUpgradePanel();
    };
  }

  const skillsBtn = document.getElementById('skills-btn');
  if (skillsBtn) {
    skillsBtn.onclick = () => {
      document.getElementById('skills-panel').classList.toggle('hidden');
    };
  }

  const shopBtn = document.getElementById('shop-btn');
  if (shopBtn) {
    shopBtn.onclick = () => {
      document.getElementById('shop-panel').classList.toggle('hidden');
      buildShopPanel();
    };
  }

  const talentBtn = document.getElementById('talent-btn');
  if (talentBtn) {
    talentBtn.onclick = () => {
      document.getElementById('talent-panel').classList.toggle('hidden');
      buildTalentPanel();
    };
  }

  const manageBtn = document.getElementById('manage-btn');
  if (manageBtn) {
    manageBtn.onclick = () => {
      document.getElementById('manage-panel').classList.toggle('hidden');
      buildManagePanel();
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

function buildSkillBar() {
  const bar = document.getElementById('skill-bar');
  if (!bar) return;
  bar.innerHTML = '';

  const abilities = [
    { id: 'basic_attack', key: '1', icon: '⚔️' },
    { id: 'heavy_slash', key: '2', icon: '💥' },
    { id: 'minor_heal', key: '3', icon: '💚' },
    { id: 'power_strike', key: '4', icon: '⚡' },
    { id: 'fireball', key: '5', icon: '🔥' },
  ];

  for (const ab of abilities) {
    const slot = document.createElement('div');
    slot.className = 'skill-slot';
    slot.dataset.abilityId = ab.id;
    slot.innerHTML = `<span class="skill-key">${ab.key}</span><span class="skill-icon">${ab.icon}</span><div class="cd-overlay" id="cd-${ab.id}"></div>`;
    slot.onclick = () => activateAbility(ab.id);
    bar.appendChild(slot);
  }
}

function activateAbility(abilityId) {
  const registry = defaultRegistry;
  const targets = [];
  const stage = GAME.engine.state.getStageData();
  if (stage?.waves) {
    for (const w of stage.waves) {
      for (const e of w.enemies) {
        if (e.hp > 0) targets.push(e);
      }
    }
  }
  if (targets.length === 0) return;

  const results = registry.apply(abilityId, GAME.engine.state.hero, targets, GAME.engine.state);
  for (const r of results) {
    if (r.targetId && r.result && typeof r.result === 'object' && r.result.hp !== undefined) {
      const enemy = targets.find(t => t.id === r.targetId);
      if (enemy) enemy.hp = r.result.hp;
    }
  }
  GAME.renderer?.addWorldFx?.(GAME.renderer.width * 0.5, GAME.renderer.laneY, '#ffcc00', 8);
}

function showOfflineModal(offlineSeconds) {
  const modal = document.getElementById('offline-modal');
  const content = document.getElementById('offline-content');
  if (!modal || !content) return;

  const solver = new OfflineSolver(GAME.engine.state);
  const result = solver.solve(offlineSeconds);
  if (!result) return;

  content.innerHTML = `
    <div>Offline for: ${OfflineSolver.format(result.offlineSeconds)}</div>
    <div>Depth advanced: +${result.depthAdvanced}</div>
    <div>Gold earned: +${formatBigInt(result.totalGold)}</div>
    <div>Items found: ${result.itemsFound}</div>
    <div>Meaningful: ${result.meaningfulItems}</div>
    <div>Salvaged: ${result.lowRaritySalvaged}</div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('offline-close').onclick = () => {
    modal.classList.add('hidden');
    if (result.totalGold > 0) {
      GAME.engine.state.hero.gold = (GAME.engine.state.hero.gold || 0) + result.totalGold;
    }
  };
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

function buildUpgradePanel() {
  const list = document.getElementById('upgrade-list');
  if (!list) return;
  list.innerHTML = '';
  list.innerHTML = '';

  for (const [id, defn] of Object.entries(UPGRADE_TREE)) {
    const row = document.createElement('div');
    row.className = 'upgrade-row';

    const icon = document.createElement('span');
    icon.className = 'upgrade-icon';
    icon.textContent = defn.icon;

    const info = document.createElement('div');
    info.className = 'upgrade-info';

    const name = document.createElement('div');
    name.className = 'upgrade-name';
    name.textContent = defn.name;

    const rank = document.createElement('div');
    rank.className = 'upgrade-rank';
    rank.id = `upgrade-rank-${id}`;
    rank.textContent = `Rank 0/${defn.maxRank}`;

    info.appendChild(name);
    info.appendChild(rank);

    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    btn.id = `upgrade-btn-${id}`;
    btn.textContent = `${defn.costBase} G`;
    btn.onclick = () => purchaseUpgrade(id);

    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(btn);
    list.appendChild(row);
  }

  const upgradeBtn = document.getElementById('upgrade-btn');
  if (upgradeBtn) {
    upgradeBtn.onclick = () => {
      document.getElementById('upgrade-panel').classList.toggle('hidden');
      refreshUpgradePanel();
    };
  }
}

function purchaseUpgrade(id) {
  const result = GAME.engine.purchaseUpgrade(id);
  if (result.success) {
    refreshUpgradePanel();
  } else {
    const btn = document.getElementById(`upgrade-btn-${id}`);
    if (btn) {
      btn.textContent = result.reason === 'MAX_RANK' ? 'MAX' : '???';
      btn.disabled = true;
    }
  }
}

function refreshUpgradePanel() {
  for (const [id, defn] of Object.entries(UPGRADE_TREE)) {
    const rankEl = document.getElementById(`upgrade-rank-${id}`);
    const btnEl = document.getElementById(`upgrade-btn-${id}`);
    if (!rankEl || !btnEl) continue;

    const currentRank = GAME.engine.state.hero.upgrades?.[id] || 0;
    rankEl.textContent = `Rank ${currentRank}/${defn.maxRank}`;

    if (currentRank >= defn.maxRank) {
      btnEl.textContent = 'MAX';
      btnEl.disabled = true;
    } else {
      const cost = getUpgradeCost(id, currentRank);
      const affordable = (GAME.engine.state.hero.gold || 0) >= cost;
      btnEl.textContent = `${formatBigInt(cost)} G`;
      btnEl.disabled = !affordable;
    }
  }
}

function buildSkillsPanel() {
  const list = document.getElementById('skills-list');
  if (!list) return;
  list.innerHTML = '';

  const abilities = [
    { id: 'basic_attack', name: 'Basic Attack', desc: 'Deal 10 damage.', icon: '⚔️' },
    { id: 'heavy_slash', name: 'Heavy Slash', desc: 'Deal 25 damage.', icon: '💥' },
    { id: 'minor_heal', name: 'Minor Heal', desc: 'Restore 15 HP.', icon: '💚' },
    { id: 'power_strike', name: 'Power Strike', desc: 'Deal 20 damage and buff attack +5 for 3s.', icon: '⚡' },
    { id: 'fireball', name: 'Fireball', desc: 'Launch 3 projectiles.', icon: '🔥' },
    { id: 'summon_skeleton', name: 'Summon Skeleton', desc: 'Summon a skeleton minion.', icon: '💀' },
  ];

  for (const ab of abilities) {
    const row = document.createElement('div');
    row.className = 'upgrade-row';
    row.innerHTML = `<span style="font-size:16px;">${ab.icon}</span><div><div>${ab.name}</div><div style="font-size:10px;color:#aaa;">${ab.desc}</div></div>`;
    list.appendChild(row);
  }
}

function buildManagePanel() {
  const container = document.getElementById('equipment-slots');
  if (!container) return;
  container.innerHTML = '';

  const slots = [
    { id: 'weapon', name: 'Weapon', icon: '🗡️' },
    { id: 'armor', name: 'Armor', icon: '🛡️' },
    { id: 'motif', name: 'Motif', icon: '✨' },
    { id: 'gem', name: 'Gem', icon: '💎' },
    { id: 'aura', name: 'Aura', icon: '🌊' },
  ];

  for (const slot of slots) {
    const equipped = GAME.engine.state.equipment?.[slot.id];
    const row = document.createElement('div');
    row.className = 'upgrade-row';
    row.innerHTML = `<span>${slot.icon}</span><div><div>${slot.name}</div><div style="font-size:10px;color:#aaa;">${equipped || 'Empty'}</div></div>`;
    container.appendChild(row);
  }
}

function buildShopPanel() {
  const list = document.getElementById('shop-list');
  if (!list) return;
  list.innerHTML = '';
  const rng = GAME.engine.rng;
  GAME.shop.generateCatalog(rng, GAME.engine.state.progression.currentStageNumber, 6);
  for (let i = 0; i < GAME.shop.catalog.length; i++) {
    const item = GAME.shop.catalog[i];
    const row = document.createElement('div');
    row.className = 'upgrade-row';
    row.innerHTML = `<span>${item.rarity === 'common' ? '⚪' : item.rarity === 'uncommon' ? '🟢' : item.rarity === 'rare' ? '🔵' : '🟣'}</span><div><div>${item.name}</div><div style="font-size:10px;color:#aaa;">${item.price} G</div></div>`;
    const btn = document.createElement('button');
    btn.textContent = 'Buy';
    btn.onclick = () => {
      const res = GAME.shop.buy(i, GAME.engine.state);
      if (res.success) buildShopPanel();
    };
    row.appendChild(btn);
    list.appendChild(row);
  }
}

function buildTalentPanel() {
  const list = document.getElementById('talent-list');
  if (!list) return;
  list.innerHTML = '';
  for (const [id, node] of GAME.talentTree.nodes) {
    const row = document.createElement('div');
    row.className = 'upgrade-row';
    const canActivate = GAME.talentTree.canActivate(id);
    row.innerHTML = `<span>${node.icon}</span><div><div>${node.name}</div><div style="font-size:10px;color:#aaa;">Cost ${node.cost}</div></div>`;
    if (!node.activated) {
      const btn = document.createElement('button');
      btn.textContent = canActivate ? 'Buy' : 'Locked';
      btn.disabled = !canActivate;
      btn.onclick = () => {
        if (GAME.talentTree.activate(id)) buildTalentPanel();
      };
      row.appendChild(btn);
    } else {
      const status = document.createElement('span');
      status.textContent = 'Active';
      status.style.color = '#22b14c';
      row.appendChild(status);
    }
    list.appendChild(row);
  }
}

function renderParticles(renderer) {
  if (!renderer || !renderer.ctx) return;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
