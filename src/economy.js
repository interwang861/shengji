// ============================================================
//  economy.js  —  数值计算（纯函数，不碰 DOM、不改全局状态）
// ============================================================

import { RESOURCES, BUILDINGS, UNITS, RANK, MAX_RANK, WAREHOUSE, TRAIN_SPEED_PER_LEVEL } from './config.js';

export function getBuildingDef(id) { return BUILDINGS.find((b) => b.id === id); }
export function getUnitDef(id) { return UNITS.find((u) => u.id === id); }

// 升到下一级的建筑成本（level=当前等级，0 表示尚未建造）
export function upgradeCost(def, level) {
  const cost = {};
  for (const [res, amount] of Object.entries(def.baseCost)) {
    cost[res] = Math.ceil(amount * Math.pow(def.costGrowth, level));
  }
  return cost;
}

// 升级耗时（秒）。level=当前等级：0 表示初次建造，用 buildTime；其后按 timeGrowth 递增。
export function upgradeSeconds(def, level) {
  const base = def.buildTime || 10;
  if (level <= 0) return base;
  return Math.round(base * Math.pow(def.timeGrowth || 2, level));
}

export function buildingProduction(def, level) {
  const out = {};
  if (level <= 0) return out;
  for (const [res, perLevel] of Object.entries(def.produces || {})) out[res] = perLevel * level;
  return out;
}

export function totalProduction(buildingLevels) {
  const total = {};
  for (const res of Object.keys(RESOURCES)) total[res] = 0;
  for (const def of BUILDINGS) {
    const prod = buildingProduction(def, buildingLevels[def.id] || 0);
    for (const [res, amt] of Object.entries(prod)) total[res] += amt;
  }
  return total;
}

// 仓库容量曲线：cap(1)=baseCap，inc(k)=incBase × incGrowth^(k-1)。
export function warehouseCap(level) {
  if (level <= 0) return 0;
  const { baseCap, incBase, incGrowth } = WAREHOUSE;
  if (level === 1) return baseCap;
  const sumInc = incBase * (Math.pow(incGrowth, level - 1) - 1) / (incGrowth - 1);
  return Math.round(baseCap + sumInc);
}

export function storageCap(res, buildingLevels) {
  let cap = RESOURCES[res].baseCap;
  for (const def of BUILDINGS) {
    const lvl = buildingLevels[def.id] || 0;
    if (lvl <= 0) continue;
    if (def.isWarehouse) cap += warehouseCap(lvl);
    else if (def.storage && def.storage[res]) cap += def.storage[res] * lvl;
  }
  return cap;
}

// 是否买得起：{ ok, missing: { res: 差额 } }
export function affordability(cost, resources) {
  const missing = {};
  let ok = true;
  for (const [res, need] of Object.entries(cost)) {
    const have = resources[res] || 0;
    if (have < need) { ok = false; missing[res] = need - have; }
  }
  return { ok, missing };
}

// 按一份单位成本，最多能买几份
export function maxAffordable(cost, resources) {
  let max = Infinity;
  for (const [res, need] of Object.entries(cost)) {
    if (need > 0) max = Math.min(max, Math.floor((resources[res] || 0) / need));
  }
  return Number.isFinite(max) ? max : 0;
}

// 多份成本
export function scaleCost(cost, qty) {
  const out = {};
  for (const [res, v] of Object.entries(cost)) out[res] = v * qty;
  return out;
}

export function isMaxed(def, level) { return def.maxLevel != null && level >= def.maxLevel; }

// ---------- 军队相关 ----------

// 科研实验室提供的全军攻击加成（倍率，如 1.15）
export function labAtkBonus(buildingLevels) {
  const lab = getBuildingDef('lab');
  const lvl = buildingLevels.lab || 0;
  return 1 + (lab.armyAtkPerLevel || 0) * lvl;
}

// 某兵种在「阶级 rank(1~10) + 实验室加成」下的有效属性
export function unitEffectiveStats(unitDef, rank, labBonus) {
  const r = Math.max(0, (rank || 1) - 1);          // 1 阶为基准，无加成
  const atkMul = (1 + RANK.atkPerRank * r) * labBonus;
  const hpMul = 1 + RANK.hpPerRank * r;
  return { atk: unitDef.atk * atkMul, hp: unitDef.hp * hpMul };
}

// 兵种单个训练耗时（秒）：随训练建筑等级加快。
export function effectiveTrainTime(unitDef, buildingLevel) {
  const speed = 1 + TRAIN_SPEED_PER_LEVEL * Math.max(0, (buildingLevel || 1) - 1);
  return unitDef.trainTime / speed;
}

// 兵种从 rank 进阶到 rank+1 的科研成本（随阶数与档位上升）
export function rankCost(unitDef, rank) {
  const tierMul = 1 + RANK.tierFactor * ((unitDef.tier || 1) - 1);
  return { research: Math.ceil(RANK.baseCost * Math.pow(RANK.costGrowth, rank - 1) * tierMul) };
}

// 进阶耗时（秒）= 训练耗时 × timeMult × timeGrowth^(rank-1)（随阶数升高而变长）
export function rankSeconds(unitDef, buildingLevel, rank) {
  const r = Math.max(0, (rank || 1) - 1);
  return Math.round(RANK.timeMult * effectiveTrainTime(unitDef, buildingLevel) * Math.pow(RANK.timeGrowth, r));
}

export function isRankMaxed(rank) { return (rank || 1) >= MAX_RANK; }

// 组装玩家出征编队：[{ id, name, count, hp, atk }]（含全部加成）
export function buildPlayerArmy(units, unitRanks, buildingLevels) {
  const labBonus = labAtkBonus(buildingLevels);
  const army = [];
  for (const def of UNITS) {
    const count = units[def.id] || 0;
    if (count <= 0) continue;
    const s = unitEffectiveStats(def, unitRanks[def.id] || 1, labBonus);
    army.push({ id: def.id, name: def.name, count, hp: s.hp, atk: s.atk });
  }
  return army;
}

// 编队总览：总攻击、总生命
export function armyTotals(army) {
  let atk = 0, hp = 0, count = 0;
  for (const g of army) { atk += g.atk * g.count; hp += g.hp * g.count; count += g.count; }
  return { atk, hp, count };
}
