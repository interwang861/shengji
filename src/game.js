// ============================================================
//  game.js  —  游戏循环 + 玩家动作（所有状态改动集中在此）
// ============================================================

import { STAGES, MAX_LEVEL } from './config.js';
import { state, applyProduction, processConstructions, processTraining, processRanking } from './state.js';
import {
  getBuildingDef, getUnitDef, upgradeCost, upgradeSeconds, affordability,
  scaleCost, maxAffordable, rankCost, rankSeconds, isRankMaxed, effectiveTrainTime, buildPlayerArmy,
} from './economy.js';
import { simulateBattle } from './combat.js';

export { MAX_LEVEL };

let lastTick = Date.now();

export function tick() {
  const now = Date.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;
  if (dt > 0) applyProduction(dt);
  processConstructions(now);
  processTraining(now);
  processRanking(now);
}

function spend(cost) {
  for (const [res, amount] of Object.entries(cost)) state.resources[res] -= amount;
}

// ---------- 建造 / 升级建筑（计时）----------
export function isUpgrading(id) { return !!state.constructions[id]; }
export function getConstruction(id) { return state.constructions[id] || null; }

export function buildOrUpgrade(id, now = Date.now()) {
  const def = getBuildingDef(id);
  if (!def) return false;
  if (isUpgrading(id)) return false;
  const level = state.buildingLevels[id] || 0;
  if (level >= MAX_LEVEL) return false;
  const cost = upgradeCost(def, level);
  if (!affordability(cost, state.resources).ok) return false;
  spend(cost);
  const duration = upgradeSeconds(def, level);
  state.constructions[id] = { endAt: now + duration * 1000, duration, fromLevel: level };
  return true;
}

// ---------- 兵种解锁：对应建筑等级 ≥ 解锁等级 ----------
export function isUnitUnlocked(unitId) {
  const u = getUnitDef(unitId);
  return u && (state.buildingLevels[u.building] || 0) >= u.unlockLevel;
}

// ---------- 训练兵种（计时队列）----------
export function isTraining(unitId) { return !!state.training[unitId]; }
export function getTraining(unitId) { return state.training[unitId] || null; }

export function trainUnit(unitId, qty, now = Date.now()) {
  const u = getUnitDef(unitId);
  if (!u || !isUnitUnlocked(unitId)) return 0;
  let n = qty === 'max' ? maxAffordable(u.cost, state.resources) : qty;
  if (n <= 0) return 0;
  const cost = scaleCost(u.cost, n);
  if (!affordability(cost, state.resources).ok) return 0;
  spend(cost);
  const per = effectiveTrainTime(u, state.buildingLevels[u.building] || 1);
  const job = state.training[unitId];
  if (job) {
    job.remaining += n;                       // 同兵种排队追加
  } else {
    state.training[unitId] = { endAt: now + per * 1000, perUnit: per, remaining: n };
  }
  return n;
}

// ---------- 兵种进阶（科研 + 时间）----------
export function isRanking(unitId) { return !!state.ranking[unitId]; }
export function getRanking(unitId) { return state.ranking[unitId] || null; }

export function rankUpUnit(unitId, now = Date.now()) {
  const u = getUnitDef(unitId);
  if (!u || !isUnitUnlocked(unitId)) return false;
  if (isRanking(unitId)) return false;
  const rank = state.unitRanks[unitId] || 1;
  if (isRankMaxed(rank)) return false;
  const cost = rankCost(u, rank);
  if (!affordability(cost, state.resources).ok) return false;
  spend(cost);
  const duration = rankSeconds(u, state.buildingLevels[u.building] || 1, rank);
  state.ranking[unitId] = { endAt: now + duration * 1000, duration, fromRank: rank };
  return true;
}

export function isStageUnlocked(stageId) {
  const idx = STAGES.findIndex((s) => s.id === stageId);
  if (idx <= 0) return true;
  return !!state.clearedStages[STAGES[idx - 1].id];
}

// ---------- 出征打野怪 ----------
export function attackStage(stageId, rng) {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage || !isStageUnlocked(stageId)) return null;
  const army = buildPlayerArmy(state.units, state.unitRanks, state.buildingLevels);
  if (army.length === 0) return null;

  const enemy = stage.enemies.map((e) => ({ ...e }));
  const result = simulateBattle(army, enemy, rng);

  for (const [id, lost] of Object.entries(result.playerLoss))
    state.units[id] = Math.max(0, (state.units[id] || 0) - lost);

  let loot = {}, firstClear = null;
  if (result.win) {
    loot = { ...stage.loot };
    const wasFirst = !state.clearedStages[stageId];
    state.clearedStages[stageId] = true;
    if (wasFirst && stage.firstClear) firstClear = { ...stage.firstClear };
    const gain = { ...loot };
    if (firstClear) for (const [r, v] of Object.entries(firstClear)) gain[r] = (gain[r] || 0) + v;
    for (const [r, v] of Object.entries(gain)) state.resources[r] = (state.resources[r] || 0) + v;
  }
  return { result, stage, loot, firstClear };
}
