// ============================================================
//  ui.js  —  界面渲染与交互（唯一碰 DOM 的地方）
// ============================================================

import { RESOURCES, RESOURCE_ORDER, BUILDINGS, UNITS, STAGES, STAGES_PER_PAGE, TRAIN_SPEED_PER_LEVEL } from './config.js';
import { state } from './state.js';
import {
  getBuildingDef, getUnitDef, upgradeCost, upgradeSeconds, buildingProduction, totalProduction,
  storageCap, affordability, maxAffordable, scaleCost,
  unitEffectiveStats, labAtkBonus, effectiveTrainTime,
  rankCost, rankSeconds, isRankMaxed, buildPlayerArmy, armyTotals,
} from './economy.js';
import {
  buildOrUpgrade, trainUnit, attackStage, rankUpUnit,
  isUnitUnlocked, isStageUnlocked, isUpgrading, getConstruction,
  isTraining, getTraining, isRanking, getRanking, MAX_LEVEL,
} from './game.js';
import { MAX_RANK } from './config.js';
import { formatNumber, formatDuration, formatClock } from './util.js';
import { BUILDING_ART, RESOURCE_ART, UNIT_ART, ENEMY_ART } from './art.js';
import { sfx } from './sfx.js';

let onAction = () => {};
const resourceNodes = {};
const buildingNodes = {};
const unitNodes = {};
const groupNodes = {};
const stageNodes = {};
let currentPage = 0;
const TOTAL_PAGES = Math.ceil(STAGES.length / STAGES_PER_PAGE);

export function initUI({ onChange } = {}) {
  onAction = onChange || (() => {});
  buildResourceBar();
  buildBuildingGrid();
  buildArmyTab();
  buildCampaign();
  buildQuickNav();
  bindTabs();
  bindMenu();
  startNumberLoop();
  updateUI();
}

function costChips(cost) {
  return Object.entries(cost)
    .map(([res, n]) =>
      `<span class="cost" data-cost="${res}" style="--res-color:${RESOURCES[res].color}">
         <span class="cost__icon">${RESOURCE_ART[res] || ''}</span><span class="cost__num">${formatNumber(n)}</span>
       </span>`)
    .join('');
}

// ---------- 资源栏（数字 + 进度条）----------
function buildResourceBar() {
  const bar = document.getElementById('resource-bar');
  bar.innerHTML = '';
  for (const res of RESOURCE_ORDER) {
    const def = RESOURCES[res];
    const el = document.createElement('div');
    el.className = 'resource';
    el.style.setProperty('--res-color', def.color);
    el.innerHTML = `
      <span class="resource__icon">${RESOURCE_ART[res] || ''}</span>
      <div class="resource__body">
        <div class="resource__line">
          <span class="resource__name">${def.name}</span>
          <span class="resource__rate" data-rate></span>
        </div>
        <div class="resource__amount"><span class="resource__value" data-value>0</span><span class="resource__cap" data-cap></span></div>
        <div class="resource__track"><i data-bar></i></div>
      </div>`;
    bar.appendChild(el);
    resourceNodes[res] = {
      value: el.querySelector('[data-value]'),
      cap: el.querySelector('[data-cap]'),
      rate: el.querySelector('[data-rate]'),
      bar: el.querySelector('[data-bar]'),
      display: state.resources[res], target: state.resources[res],
      capValue: RESOURCES[res].baseCap,
    };
  }
}

// ---------- 建筑 ----------
function buildBuildingGrid() {
  const grid = document.getElementById('building-grid');
  grid.innerHTML = '';
  for (const def of BUILDINGS) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card__art">${BUILDING_ART[def.id] || ''}</div>
      <header class="card__head"><div class="card__title"><h3>${def.name}</h3><span class="card__level" data-level></span></div></header>
      <p class="card__desc">${def.desc}</p>
      <div class="card__prod" data-prod></div>
      <div class="card__time" data-time></div>
      <button class="card__btn" type="button"><span class="card__btn-label"></span><span class="card__cost" data-cost></span></button>
      <div class="card__progress" data-progress hidden>
        <div class="card__progress-bar"><i data-pfill></i></div>
        <div class="card__progress-info"><span data-plabel></span><span class="card__progress-time" data-pcount></span></div>
      </div>`;
    grid.appendChild(card);
    const button = card.querySelector('.card__btn');
    button.addEventListener('click', () => {
      if (buildOrUpgrade(def.id)) { sfx.build(); flash(card); onAction(); updateUI(); }
      else { sfx.denied(); shake(button); }
    });
    buildingNodes[def.id] = {
      card, level: card.querySelector('[data-level]'),
      prod: card.querySelector('[data-prod]'), time: card.querySelector('[data-time]'),
      label: card.querySelector('.card__btn-label'), cost: card.querySelector('[data-cost]'), button,
      progress: card.querySelector('[data-progress]'), pfill: card.querySelector('[data-pfill]'),
      plabel: card.querySelector('[data-plabel]'), pcount: card.querySelector('[data-pcount]'),
    };
  }
}

// ---------- 军队（按训练建筑分组）----------
function buildArmyTab() {
  const wrap = document.getElementById('unit-grid');
  wrap.innerHTML = '';
  const military = BUILDINGS.filter((b) => b.trainsFamily);
  for (const b of military) {
    const group = document.createElement('section');
    group.className = 'unit-group';
    group.innerHTML = `
      <header class="unit-group__head">
        <h3>${b.name}<span class="unit-group__lv" data-glv></span></h3>
        <span class="unit-group__speed" data-gspeed></span>
      </header>
      <div class="unit-grid-inner" data-ginner></div>`;
    wrap.appendChild(group);
    const inner = group.querySelector('[data-ginner]');
    groupNodes[b.id] = { glv: group.querySelector('[data-glv]'), gspeed: group.querySelector('[data-gspeed]') };

    for (const def of UNITS.filter((u) => u.building === b.id)) {
      const card = document.createElement('article');
      card.className = 'unit-card';
      card.innerHTML = `
        <div class="unit-card__lock" data-lock hidden><span data-locktext></span></div>
        <div class="unit-card__top">
          <div class="unit-card__art">${UNIT_ART[def.art] || ''}</div>
          <div class="unit-card__id">
            <h3>${def.name}<span class="tier-badge">T${def.tier}</span><span class="rank-badge" data-rank></span></h3>
            <div class="unit-stats" data-stats></div>
          </div>
          <div class="unit-card__own"><span data-own>0</span><small>拥有</small></div>
        </div>
        <div class="unit-cost">单价 ${costChips(def.cost)} <span class="unit-time">· 耗时 <span data-ptime></span></span></div>
        <div class="unit-actions" data-actions>
          <button class="mini-btn" data-train="1" type="button">+1</button>
          <button class="mini-btn" data-train="5" type="button">+5</button>
          <button class="mini-btn mini-btn--max" data-train="max" type="button">最多</button>
        </div>
        <div class="unit-progress" data-prog hidden>
          <div class="ubar"><i data-ufill></i></div>
          <div class="uprog-info"><span data-ulabel></span><span class="uprog-time" data-ucount></span></div>
        </div>
        <div class="unit-rank" data-rankrow>
          <button class="mini-btn mini-btn--rank" data-rankup type="button">进阶<span data-rankcost></span></button>
        </div>
        <div class="unit-progress unit-progress--rank" data-rprog hidden>
          <div class="ubar ubar--rank"><i data-rfill></i></div>
          <div class="uprog-info"><span data-rlabel></span><span class="uprog-time" data-rcount></span></div>
        </div>`;
      inner.appendChild(card);

      const train = (qty) => {
        const n = trainUnit(def.id, qty);
        if (n > 0) { sfx.build(); onAction(); updateUI(); }
        else { sfx.denied(); shake(card.querySelector('[data-actions]')); }
      };
      card.querySelectorAll('[data-train]').forEach((btn) =>
        btn.addEventListener('click', () => train(btn.dataset.train === 'max' ? 'max' : +btn.dataset.train)));
      card.querySelector('[data-rankup]').addEventListener('click', () => {
        if (rankUpUnit(def.id)) { sfx.build(); onAction(); updateUI(); }
        else { sfx.denied(); shake(card.querySelector('[data-rankrow]')); }
      });

      unitNodes[def.id] = {
        card, lock: card.querySelector('[data-lock]'), locktext: card.querySelector('[data-locktext]'),
        stats: card.querySelector('[data-stats]'), own: card.querySelector('[data-own]'),
        rank: card.querySelector('[data-rank]'),
        ptime: card.querySelector('[data-ptime]'), actions: card.querySelector('[data-actions]'),
        trainBtns: card.querySelectorAll('[data-train]'),
        prog: card.querySelector('[data-prog]'), ufill: card.querySelector('[data-ufill]'),
        ulabel: card.querySelector('[data-ulabel]'), ucount: card.querySelector('[data-ucount]'),
        rankrow: card.querySelector('[data-rankrow]'), rankBtn: card.querySelector('[data-rankup]'),
        rankcost: card.querySelector('[data-rankcost]'),
        rprog: card.querySelector('[data-rprog]'), rfill: card.querySelector('[data-rfill]'),
        rlabel: card.querySelector('[data-rlabel]'), rcount: card.querySelector('[data-rcount]'),
      };
    }
  }
}

// ---------- 征战（100 关，分页）----------
function buildCampaign() {
  const grid = document.getElementById('stage-grid');
  grid.innerHTML = '';
  for (let p = 0; p < TOTAL_PAGES; p++) {
    const page = document.createElement('div');
    page.className = 'stage-page';
    page.dataset.page = p;
    if (p !== 0) page.hidden = true;
    grid.appendChild(page);
    for (const stage of STAGES.slice(p * STAGES_PER_PAGE, (p + 1) * STAGES_PER_PAGE)) {
      const card = document.createElement('article');
      card.className = 'stage-card';
      const enemyPreview = stage.enemies
        .map((e) => `<span class="enemy-chip"><span class="enemy-chip__art">${ENEMY_ART[e.art] || ''}</span>×${e.count}</span>`).join('');
      const lootChips = Object.entries(stage.loot)
        .map(([r, v]) => `<span class="cost" style="--res-color:${RESOURCES[r].color}"><span class="cost__icon">${RESOURCE_ART[r]}</span><span class="cost__num">${formatNumber(v)}</span></span>`).join('');
      let ehp = 0, eatk = 0;
      for (const e of stage.enemies) { ehp += e.hp * e.count; eatk += e.atk * e.count; }
      card.innerHTML = `
        <div class="stage-card__head">
          <div class="stage-card__art">${ENEMY_ART[stage.art] || ''}</div>
          <div class="stage-card__id"><h3>${stage.name}<span class="stage-clear" data-clear hidden>已通关</span></h3><p>${stage.desc}</p></div>
        </div>
        <div class="stage-meta">
          <div class="stage-enemies">${enemyPreview}</div>
          <div class="stage-power"><span class="stat stat--atk">攻 ${formatNumber(eatk)}</span><span class="stat stat--hp">命 ${formatNumber(ehp)}</span></div>
        </div>
        <div class="stage-loot">战利品 ${lootChips}${stage.firstClear ? `<span class="first-badge" data-first>首通+科研${stage.firstClear.research || ''}</span>` : ''}</div>
        <button class="stage-btn" data-go type="button"><span data-golabel>出征</span></button>`;
      page.appendChild(card);
      card.querySelector('[data-go]').addEventListener('click', () => doBattle(stage.id));
      stageNodes[stage.id] = {
        card, clear: card.querySelector('[data-clear]'), first: card.querySelector('[data-first]'),
        goBtn: card.querySelector('[data-go]'), goLabel: card.querySelector('[data-golabel]'),
      };
    }
  }
  // 默认翻到已解锁的最高页
  let lastUnlocked = 0;
  STAGES.forEach((s, i) => { if (isStageUnlocked(s.id)) lastUnlocked = i; });
  currentPage = Math.floor(lastUnlocked / STAGES_PER_PAGE);
  buildPager();
  showPage(currentPage);
}

function buildPager() {
  const pager = document.getElementById('stage-pager');
  if (!pager) return;
  pager.innerHTML = `
    <button class="pager-btn" data-prev type="button">‹</button>
    <div class="pager-nums" data-nums></div>
    <button class="pager-btn" data-next type="button">›</button>`;
  const nums = pager.querySelector('[data-nums]');
  for (let p = 0; p < TOTAL_PAGES; p++) {
    const b = document.createElement('button');
    b.className = 'pager-num'; b.textContent = p + 1; b.dataset.p = p;
    b.addEventListener('click', () => showPage(p));
    nums.appendChild(b);
  }
  pager.querySelector('[data-prev]').addEventListener('click', () => showPage(currentPage - 1));
  pager.querySelector('[data-next]').addEventListener('click', () => showPage(currentPage + 1));
}

function showPage(p) {
  p = Math.max(0, Math.min(TOTAL_PAGES - 1, p));
  currentPage = p;
  document.querySelectorAll('.stage-page').forEach((pg) => { pg.hidden = +pg.dataset.page !== p; });
  document.querySelectorAll('.pager-num').forEach((b) => b.classList.toggle('is-active', +b.dataset.p === p));
  sfx.tick();
  updateUI();
}

// ---------- 刷新 ----------
export function updateUI() {
  const rates = totalProduction(state.buildingLevels);

  for (const res of RESOURCE_ORDER) {
    const n = resourceNodes[res];
    const cap = storageCap(res, state.buildingLevels);
    n.capValue = cap;
    n.target = state.resources[res];
    n.cap.textContent = ' / ' + formatNumber(cap);
    n.value.classList.toggle('is-full', state.resources[res] >= cap - 0.001);
    const rate = rates[res] || 0;
    n.rate.textContent = rate > 0 ? '+' + rate.toFixed(rate < 10 ? 1 : 0) + '/s' : '';
  }

  for (const def of BUILDINGS) {
    const node = buildingNodes[def.id];
    const level = state.buildingLevels[def.id] || 0;
    node.level.textContent = level > 0 ? `Lv.${level}` : '未建造';
    node.card.classList.toggle('card--owned', level > 0);
    const prod = buildingProduction(def, level);
    const txt = Object.entries(prod).map(([r, v]) => `${RESOURCES[r].name} +${v.toFixed(v < 10 ? 1 : 0)}/s`).join('　');
    if (def.trainsFamily) node.prod.textContent = `每 10 级解锁新兵种 · 升级加快训练`;
    else if (def.id === 'lab') node.prod.textContent = level > 0 ? `${txt}　全军攻击 +${level * 5}%` : '产出科研 + 全军攻击加成';
    else if (def.id === 'warehouse') node.prod.textContent = level > 0 ? `存储上限 +${formatNumber(100000 * level)}` : '大幅提升存储上限';
    else node.prod.textContent = level > 0 ? (txt || '提升存储上限') : (def.storage ? '提升存储上限' : '尚未产出');

    if (isUpgrading(def.id)) {
      const c = getConstruction(def.id);
      const now = Date.now();
      const pct = Math.max(0, Math.min(1, c.duration > 0 ? (c.duration - (c.endAt - now) / 1000) / c.duration : 1));
      node.progress.hidden = false; node.button.hidden = true; node.time.textContent = '';
      node.pfill.style.width = (pct * 100).toFixed(1) + '%';
      node.plabel.textContent = `${c.fromLevel === 0 ? '建造中' : '升级中'} Lv.${c.fromLevel}→${c.fromLevel + 1}`;
      node.pcount.textContent = formatClock((c.endAt - now) / 1000);
      node.card.classList.add('card--building');
    } else {
      node.progress.hidden = true; node.button.hidden = false; node.card.classList.remove('card--building');
      if (level >= MAX_LEVEL) {
        node.label.textContent = '已满级'; node.cost.innerHTML = ''; node.time.textContent = `Lv.${MAX_LEVEL} 顶级`;
        node.button.classList.remove('is-affordable'); node.button.classList.add('is-locked'); node.button.disabled = true;
      } else {
        const cost = upgradeCost(def, level);
        const { ok, missing } = affordability(cost, state.resources);
        node.button.disabled = false;
        node.label.textContent = level === 0 ? '建造' : '升级';
        node.cost.innerHTML = costChips(cost); markLack(node.cost, missing);
        node.button.classList.toggle('is-affordable', ok); node.button.classList.toggle('is-locked', !ok);
        node.time.textContent = `耗时 ${formatClock(upgradeSeconds(def, level))}`;
      }
    }
  }

  // 军队分组与单位
  const labBonus = labAtkBonus(state.buildingLevels);
  const now = Date.now();
  for (const b of BUILDINGS.filter((x) => x.trainsFamily)) {
    const lvl = state.buildingLevels[b.id] || 0;
    const g = groupNodes[b.id];
    g.glv.textContent = lvl > 0 ? ` Lv.${lvl}` : '（未建造）';
    g.gspeed.textContent = lvl > 1 ? `训练加速 +${Math.round(TRAIN_SPEED_PER_LEVEL * (lvl - 1) * 100)}%` : '';
  }
  for (const def of UNITS) {
    const node = unitNodes[def.id];
    const unlocked = isUnitUnlocked(def.id);
    const bname = getBuildingDef(def.building).name;
    const rank = state.unitRanks[def.id] || 1;
    node.lock.hidden = unlocked;
    node.card.classList.toggle('is-locked', !unlocked);
    if (!unlocked) node.locktext.textContent = `${bname}达 Lv.${def.unlockLevel} 解锁`;
    const s = unitEffectiveStats(def, rank, labBonus);
    node.own.textContent = formatNumber(state.units[def.id] || 0);
    node.rank.textContent = `阶 ${rank}/${MAX_RANK}`;
    node.stats.innerHTML = `<span class="stat stat--atk">攻 ${formatNumber(Math.round(s.atk))}</span><span class="stat stat--hp">命 ${formatNumber(Math.round(s.hp))}</span>`;
    node.ptime.textContent = formatClock(effectiveTrainTime(def, state.buildingLevels[def.building] || 1));

    // 训练行 / 训练进度
    if (isTraining(def.id)) {
      const job = getTraining(def.id);
      const remainTime = (job.endAt - now) / 1000;
      const frac = Math.max(0, Math.min(1, job.perUnit > 0 ? 1 - remainTime / job.perUnit : 1));
      node.prog.hidden = false; node.actions.hidden = true;
      node.ufill.style.width = (frac * 100).toFixed(1) + '%';
      node.ulabel.textContent = `训练中 · 剩余 ${formatNumber(job.remaining)}`;
      node.ucount.textContent = formatClock(remainTime);
    } else {
      node.prog.hidden = true; node.actions.hidden = false;
      node.trainBtns.forEach((btn) => {
        const qty = btn.dataset.train === 'max' ? maxAffordable(def.cost, state.resources) : +btn.dataset.train;
        btn.classList.toggle('is-ready', unlocked && qty > 0 && affordability(scaleCost(def.cost, qty), state.resources).ok);
      });
    }

    // 进阶行 / 进阶进度
    if (isRanking(def.id)) {
      const r = getRanking(def.id);
      const remain = (r.endAt - now) / 1000;
      const frac = Math.max(0, Math.min(1, r.duration > 0 ? (r.duration - remain) / r.duration : 1));
      node.rprog.hidden = false; node.rankrow.hidden = true;
      node.rfill.style.width = (frac * 100).toFixed(1) + '%';
      node.rlabel.textContent = `进阶中 阶 ${r.fromRank}→${r.fromRank + 1}`;
      node.rcount.textContent = formatClock(remain);
    } else {
      node.rprog.hidden = true; node.rankrow.hidden = false;
      if (isRankMaxed(rank)) {
        node.rankBtn.textContent = '满阶'; node.rankBtn.classList.remove('is-ready'); node.rankBtn.disabled = true;
      } else {
        const rc = rankCost(def, rank);
        const rt = rankSeconds(def, state.buildingLevels[def.building] || 1, rank);
        const ok = unlocked && affordability(rc, state.resources).ok;
        node.rankBtn.disabled = false;
        node.rankBtn.innerHTML = `进阶<span data-rankcost> 科研${formatNumber(rc.research)} · ${formatClock(rt)}</span>`;
        node.rankBtn.classList.toggle('is-ready', ok);
      }
    }
  }

  // 我军总览
  const army = buildPlayerArmy(state.units, state.unitRanks, state.buildingLevels);
  const t = armyTotals(army);
  const summaryHTML = `
    <div class="sum"><small>总兵力</small><b>${formatNumber(t.count)}</b></div>
    <div class="sum"><small>总攻击</small><b class="t-atk">${formatNumber(Math.round(t.atk))}</b></div>
    <div class="sum"><small>总生命</small><b class="t-hp">${formatNumber(Math.round(t.hp))}</b></div>`;
  document.getElementById('army-summary').innerHTML = summaryHTML;
  document.getElementById('campaign-army').innerHTML = summaryHTML;

  // 当前页关卡
  const start = currentPage * STAGES_PER_PAGE;
  for (const stage of STAGES.slice(start, start + STAGES_PER_PAGE)) {
    const node = stageNodes[stage.id];
    if (!node) continue;
    const cleared = !!state.clearedStages[stage.id];
    const unlocked = isStageUnlocked(stage.id);
    node.clear.hidden = !cleared;
    if (node.first) node.first.style.display = cleared ? 'none' : '';
    node.card.classList.toggle('is-stagelocked', !unlocked);
    node.goBtn.disabled = !unlocked;
    node.goLabel.textContent = unlocked ? (cleared ? '再次出征' : '出征') : '未解锁';
  }
}

// ---------- 战斗 ----------
function doBattle(stageId) {
  if (!isStageUnlocked(stageId)) return;
  const army = buildPlayerArmy(state.units, state.unitRanks, state.buildingLevels);
  if (army.length === 0) { showToast('你还没有任何兵力，先去「军队」训练吧。'); return; }
  const outcome = attackStage(stageId);
  if (!outcome) return;
  onAction();
  openBattleModal(outcome);
}

function openBattleModal({ result, stage, loot, firstClear }) {
  const modal = document.getElementById('battle-modal');
  const lossHTML = Object.entries(result.playerLoss).filter(([, n]) => n > 0)
    .map(([id, n]) => `<span class="loss">${getUnitDef(id).name} -${n}</span>`).join('') || '<span class="loss loss--none">无损失</span>';
  const lootAll = { ...loot };
  if (firstClear) for (const [r, v] of Object.entries(firstClear)) lootAll[r] = (lootAll[r] || 0) + v;
  const lootHTML = result.win
    ? Object.entries(lootAll).map(([r, v]) => `<span class="cost" style="--res-color:${RESOURCES[r].color}"><span class="cost__icon">${RESOURCE_ART[r]}</span><span class="cost__num">+${formatNumber(v)}</span></span>`).join('') : '';

  modal.innerHTML = `
    <div class="modal">
      <h3 class="modal__title">进攻 · ${stage.name}</h3>
      <div class="bvs">
        <div class="bvs__side"><span>我军</span><div class="hpbar hpbar--p"><i data-pbar></i></div></div>
        <div class="bvs__vs">VS</div>
        <div class="bvs__side"><span>敌军</span><div class="hpbar hpbar--e"><i data-ebar></i></div></div>
      </div>
      <div class="modal__result" data-result hidden></div>
      <button class="stage-btn modal__ok" data-ok type="button" hidden>确定</button>
    </div>`;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-in'));
  const pbar = modal.querySelector('[data-pbar]'), ebar = modal.querySelector('[data-ebar]');
  const snaps = result.snapshots; let i = 0;
  const step = () => {
    const s = snaps[Math.min(i, snaps.length - 1)];
    pbar.style.width = (s.p * 100) + '%'; ebar.style.width = (s.e * 100) + '%';
    if (i % 2 === 0) sfx.hit();
    i++;
    if (i < snaps.length) setTimeout(step, Math.max(70, 900 / snaps.length)); else finish();
  };
  const finish = () => {
    const res = modal.querySelector('[data-result]'); res.hidden = false;
    res.innerHTML = `
      <div class="verdict ${result.win ? 'verdict--win' : 'verdict--lose'}">${result.win ? '战 斗 胜 利' : '进 攻 失 败'}</div>
      <div class="result-row"><span class="result-label">我军损失</span><span>${lossHTML}</span></div>
      ${result.win ? `<div class="result-row"><span class="result-label">战利品</span><span class="loot">${lootHTML}</span></div>` : '<div class="result-row result-row--tip">兵力不足，撤退整顿后再来。</div>'}`;
    modal.querySelector('[data-ok]').hidden = false;
    if (result.win) sfx.win(); else sfx.lose();
  };
  setTimeout(step, 220);
  const close = () => { modal.classList.remove('is-in'); setTimeout(() => { modal.hidden = true; modal.innerHTML = ''; }, 250); updateUI(); };
  modal.querySelector('[data-ok]').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal && !modal.querySelector('[data-ok]').hidden) close(); });
}

// ---------- 标签页 / 菜单 ----------
function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('is-active', p.id === 'panel-' + name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  sfx.tick();
}
function bindTabs() {
  document.getElementById('tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab'); if (btn) switchTab(btn.dataset.tab);
  });
}
function buildQuickNav() {
  const nav = document.createElement('div');
  nav.className = 'quicknav';
  nav.innerHTML = `
    <div class="quicknav__items" data-items>
      <button class="quicknav__item" data-qtab="buildings" type="button"><span>🏛️</span>建筑</button>
      <button class="quicknav__item" data-qtab="army" type="button"><span>🪖</span>兵种</button>
      <button class="quicknav__item" data-qtab="campaign" type="button"><span>👾</span>野怪</button>
    </div>
    <button class="quicknav__toggle" data-toggle type="button" aria-label="快速切换">⚡</button>`;
  document.body.appendChild(nav);
  const items = nav.querySelector('[data-items]');
  nav.querySelector('[data-toggle]').addEventListener('click', () => {
    nav.classList.toggle('is-open'); sfx.tick();
  });
  nav.querySelectorAll('[data-qtab]').forEach((b) =>
    b.addEventListener('click', () => { switchTab(b.dataset.qtab); nav.classList.remove('is-open'); }));
}
function bindMenu() {
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    if (confirm('确定要重置营地吗？所有进度将清空且无法恢复。')) onAction('reset');
  });
  const soundBtn = document.getElementById('sound-btn');
  if (soundBtn) {
    const sync = () => { soundBtn.textContent = sfx.isMuted() ? '🔇 音效' : '🔊 音效'; soundBtn.classList.toggle('is-off', sfx.isMuted()); };
    sync();
    soundBtn.addEventListener('click', () => { sfx.setMuted(!sfx.isMuted()); sync(); if (!sfx.isMuted()) sfx.tick(); });
  }
}

// ---------- 数字滚动 + 资源进度条 ----------
function startNumberLoop() {
  const frame = () => {
    for (const res of RESOURCE_ORDER) {
      const n = resourceNodes[res];
      const diff = n.target - n.display;
      n.display = Math.abs(diff) < 0.01 ? n.target : n.display + diff * 0.18;
      n.value.textContent = formatNumber(n.display);
      const pct = n.capValue > 0 ? Math.max(0, Math.min(1, n.display / n.capValue)) : 0;
      n.bar.style.width = (pct * 100).toFixed(1) + '%';
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---------- 小工具 ----------
function markLack(container, missing) {
  container.querySelectorAll('.cost').forEach((c) => c.classList.toggle('cost--lack', !!missing[c.dataset.cost]));
}
function flash(card) { card.classList.remove('card--flash'); void card.offsetWidth; card.classList.add('card--flash'); }
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

export function showToast(html, duration = 5000) {
  const wrap = document.getElementById('toast');
  const el = document.createElement('div'); el.className = 'toast__item'; el.innerHTML = html;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 300); }, duration);
}
export function showOfflineReport(seconds, gained) {
  const items = Object.entries(gained).filter(([, v]) => v >= 1);
  if (seconds < 60 || items.length === 0) return;
  const list = items.map(([res, v]) => `${RESOURCES[res].name} +${formatNumber(v)}`).join('　');
  showToast(`<strong>指挥官，欢迎回营</strong><br>离线 ${formatDuration(seconds)}，营地产出：<br>${list}`, 7000);
}
