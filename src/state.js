// ============================================================
//  state.js  —  游戏状态 + 存档（localStorage）
// ============================================================

import { STARTING_RESOURCES, RESOURCES, BUILDINGS, UNITS, MAX_OFFLINE_SECONDS } from './config.js';
import { totalProduction, storageCap } from './economy.js';

const SAVE_KEY = 'steel-front-save-v1';

export const state = createInitialState();

function createInitialState() {
  const resources = {};
  for (const res of Object.keys(RESOURCES)) resources[res] = STARTING_RESOURCES[res] || 0;

  const buildingLevels = {};
  for (const def of BUILDINGS) buildingLevels[def.id] = 0;

  const units = {}, unitRanks = {};
  for (const u of UNITS) { units[u.id] = 0; unitRanks[u.id] = 1; }  // 阶级 1~10，初始 1

  return {
    resources,
    buildingLevels,
    constructions: {},   // { id: { endAt(ms), duration(s), fromLevel } } 建造/升级
    training: {},        // { unitId: { endAt(ms), perUnit(s), remaining } } 训练队列
    ranking: {},         // { unitId: { endAt(ms), duration(s), fromRank } } 进阶队列
    units,
    unitRanks,
    clearedStages: {},
    lastSave: Date.now(),
    createdAt: Date.now(),
  };
}

export function applyProduction(dt) {
  const rates = totalProduction(state.buildingLevels);
  const gained = {};
  for (const [res, rate] of Object.entries(rates)) {
    if (rate <= 0) continue;
    const cap = storageCap(res, state.buildingLevels);
    const before = state.resources[res];
    const after = Math.min(cap, before + rate * dt);
    gained[res] = after - before;
    state.resources[res] = after;
  }
  return gained;
}

// 结算已完成的建造/升级（endAt 为绝对时间戳，离线期间到点的会在读档时一并完成）。
// 返回已完成的建筑 id 列表。
export function processConstructions(now = Date.now()) {
  const done = [];
  for (const [id, c] of Object.entries(state.constructions)) {
    if (now >= c.endAt) {
      state.buildingLevels[id] = (state.buildingLevels[id] || 0) + 1;
      delete state.constructions[id];
      done.push(id);
    }
  }
  return done;
}

// 结算训练队列：到点的逐个出兵（支持离线一次补完多个）。
export function processTraining(now = Date.now()) {
  for (const [unitId, job] of Object.entries(state.training)) {
    let guard = 0;
    while (job.remaining > 0 && now >= job.endAt && guard < 100000) {
      state.units[unitId] = (state.units[unitId] || 0) + 1;
      job.remaining -= 1;
      guard++;
      if (job.remaining > 0) job.endAt += job.perUnit * 1000;
    }
    if (job.remaining <= 0) delete state.training[unitId];
  }
}

// 结算进阶队列：到点则阶级 +1。
export function processRanking(now = Date.now()) {
  const done = [];
  for (const [unitId, r] of Object.entries(state.ranking)) {
    if (now >= r.endAt) {
      state.unitRanks[unitId] = (state.unitRanks[unitId] || 1) + 1;
      delete state.ranking[unitId];
      done.push(unitId);
    }
  }
  return done;
}

export function save() {
  state.lastSave = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; }
  catch (err) { console.warn('存档失败：', err); return false; }
}

export function load() {
  let raw;
  try { raw = localStorage.getItem(SAVE_KEY); }
  catch (err) { console.warn('读取存档失败：', err); return { offline: 0, gained: {}, completed: [] }; }
  if (!raw) return { offline: 0, gained: {}, completed: [] };

  let data;
  try { data = JSON.parse(raw); }
  catch { console.warn('存档损坏，重新开始。'); return { offline: 0, gained: {}, completed: [] }; }

  for (const res of Object.keys(state.resources))
    if (typeof data.resources?.[res] === 'number') state.resources[res] = data.resources[res];
  for (const id of Object.keys(state.buildingLevels))
    if (typeof data.buildingLevels?.[id] === 'number') state.buildingLevels[id] = data.buildingLevels[id];
  for (const id of Object.keys(state.units))
    if (typeof data.units?.[id] === 'number') state.units[id] = data.units[id];
  for (const id of Object.keys(state.unitRanks))
    if (typeof data.unitRanks?.[id] === 'number' && data.unitRanks[id] >= 1) state.unitRanks[id] = data.unitRanks[id];
  if (data.clearedStages && typeof data.clearedStages === 'object') state.clearedStages = { ...data.clearedStages };
  // 仅恢复仍属于现有建筑、且结构合法的在建条目
  if (data.constructions && typeof data.constructions === 'object') {
    for (const [id, c] of Object.entries(data.constructions)) {
      if (state.buildingLevels[id] != null && c && typeof c.endAt === 'number')
        state.constructions[id] = { endAt: c.endAt, duration: c.duration || 0, fromLevel: c.fromLevel ?? 0 };
    }
  }
  if (data.training && typeof data.training === 'object') {
    for (const [id, j] of Object.entries(data.training)) {
      if (state.units[id] != null && j && typeof j.endAt === 'number' && j.remaining > 0)
        state.training[id] = { endAt: j.endAt, perUnit: j.perUnit || 1, remaining: j.remaining };
    }
  }
  if (data.ranking && typeof data.ranking === 'object') {
    for (const [id, r] of Object.entries(data.ranking)) {
      if (state.unitRanks[id] != null && r && typeof r.endAt === 'number')
        state.ranking[id] = { endAt: r.endAt, duration: r.duration || 0, fromRank: r.fromRank || 1 };
    }
  }

  state.createdAt = data.createdAt || Date.now();
  state.lastSave = data.lastSave || Date.now();

  let offline = (Date.now() - state.lastSave) / 1000;
  offline = Math.max(0, Math.min(offline, MAX_OFFLINE_SECONDS));
  const gained = offline > 0 ? applyProduction(offline) : {};
  const completed = processConstructions(Date.now()); // 完成离线期间到点的建造
  processTraining(Date.now());                        // 完成离线期间到点的训练
  processRanking(Date.now());                         // 完成离线期间到点的进阶
  return { offline, gained, completed };
}

export function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (err) { console.warn(err); }
  Object.assign(state, createInitialState());
}
