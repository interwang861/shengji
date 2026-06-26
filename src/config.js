// ============================================================
//  config.js  —  游戏内容配置（数据驱动）
// ============================================================

export const STARTING_RESOURCES = { ore: 10000, oil: 10000, metal: 10000, power: 10000, research: 10000 };
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
export const MAX_LEVEL = 100;

// ---------- 资源 ----------
export const RESOURCES = {
  ore:      { name: '矿石', color: 'var(--res-ore)',      baseCap: 2000 },
  oil:      { name: '石油', color: 'var(--res-oil)',      baseCap: 1500 },
  metal:    { name: '金属', color: 'var(--res-metal)',    baseCap: 1200 },
  power:    { name: '电力', color: 'var(--res-power)',    baseCap: 800 },
  research: { name: '科研', color: 'var(--res-research)', baseCap: 600 },
};
export const RESOURCE_ORDER = ['ore', 'oil', 'metal', 'power', 'research'];

// ---------- 仓库容量曲线 ----------
// cap(1)=10000；inc(k)=incBase × incGrowth^(k-1)（第 k→k+1 级的增量）。
// incGrowth=1.1393 经过计算：仓库满级(100)容量 ≈ 基地满级单次升级花费 / 0.9，
// 其余建筑的满级单次花费落在仓库满级容量的 72%~90%。
export const WAREHOUSE = { baseCap: 10000, incBase: 1000, incGrowth: 1.1393 };

// ---------- 建筑 ----------
export const BUILDINGS = [
  {
    id: 'base', name: '基地',
    desc: '营地核心，供应电力并提升各资源基础存储上限。',
    produces: { power: 1.1 },
    prodGrowth: 1.004,
    storage: { ore: 1000, oil: 800, metal: 600, power: 300, research: 200 },
    baseCost: { ore: 120, oil: 90, metal: 60, power: 200, research: 35 }, costGrowth: 1.15,
    buildTime: 20, timeGrowth: 1.1091, // 总1~100级合计60天
  },
  {
    id: 'warehouse', name: '仓库',
    desc: '不产出资源，仅大幅提升所有资源存储上限。初始 1 万，每级递增。',
    isWarehouse: true,
    baseCost: { ore: 180, oil: 35, metal: 120, power: 90, research: 60 }, costGrowth: 1.15,
    buildTime: 18, timeGrowth: 1.1076, // 总48天
  },
  {
    id: 'oreMine', name: '矿石场',
    desc: '开采矿脉，产出最基础的建造原料。',
    produces: { ore: 0.85 },
    prodGrowth: 1.004,
    baseCost: { ore: 60, oil: 35, metal: 180, power: 120, research: 90 }, costGrowth: 1.15,
    buildTime: 8, timeGrowth: 1.1148, // 总45天
  },
  {
    id: 'oilField', name: '石油场',
    desc: '抽取原油，为战车与战机提供燃料。',
    produces: { oil: 0.85 },
    prodGrowth: 1.004,
    baseCost: { ore: 90, oil: 180, metal: 60, power: 35, research: 120 }, costGrowth: 1.15,
    buildTime: 10, timeGrowth: 1.1122, // 总45天
  },
  {
    id: 'smelter', name: '冶炼厂',
    desc: '将矿石冶炼为金属——高级建筑与重型单位的关键材料。',
    produces: { metal: 0.85 },
    prodGrowth: 1.004,
    baseCost: { ore: 120, oil: 90, metal: 60, power: 35, research: 180 }, costGrowth: 1.15,
    buildTime: 14, timeGrowth: 1.1097, // 总45天
  },
  {
    id: 'lab', name: '科研实验室',
    desc: '产出科研点（用于兵种进阶），每级再为全军提供 +5% 攻击。',
    produces: { research: 0.85 },
    prodGrowth: 1.004,
    armyAtkPerLevel: 0.05,
    baseCost: { ore: 35, oil: 120, metal: 90, power: 60, research: 180 }, costGrowth: 1.15,
    buildTime: 25, timeGrowth: 1.1049, // 总50天
  },
  {
    id: 'barracks', name: '兵营',
    desc: '训练步兵系兵种。每升 10 级解锁更强的一档，升级亦加快训练速度。',
    trainsFamily: 'infantry',
    baseCost: { ore: 180, oil: 60, metal: 35, power: 120, research: 90 }, costGrowth: 1.15,
    buildTime: 15, timeGrowth: 1.1042, // 总40天
  },
  {
    id: 'vehicleFactory', name: '战车工厂',
    desc: '生产装甲载具。每升 10 级解锁更强的一档，升级亦加快生产速度。',
    trainsFamily: 'tank',
    baseCost: { ore: 90, oil: 60, metal: 180, power: 35, research: 120 }, costGrowth: 1.15,
    buildTime: 30, timeGrowth: 1.1038, // 总55天
  },
  {
    id: 'airfield', name: '飞机场',
    desc: '出动空中力量。每升 10 级解锁更强的一档，升级亦加快出动速度。',
    trainsFamily: 'aircraft',
    baseCost: { ore: 120, oil: 180, metal: 90, power: 60, research: 35 }, costGrowth: 1.15,
    buildTime: 45, timeGrowth: 1.1023, // 总55天
  },
];

// ---------- 兵种（按建筑分 10 档，随建筑等级解锁）----------
const UNIT_FAMILIES = {
  barracks: {
    family: 'infantry', art: 'infantry',
    names: ['步兵', '炮兵', '地雷兵', '坦克兵', '海豹部队', '野战军', '基因战士', '飞行兵', '超级战士', '超级指挥官'],
    hp: 50, atk: 12, statGrowth: 1.62, cost: { ore: 6, oil: 5, metal: 5, power: 5, research: 6 }, costGrowth: 1.5,
    trainTime: 4, timeGrowth: 1.42,
  },
  vehicleFactory: {
    family: 'tank', art: 'tank',
    names: ['轻型战车', '装甲车', '反坦克车', '主战坦克', '火箭车', '防空车', '重型坦克', '导弹车', '巨炮战车', '末日战车'],
    hp: 200, atk: 38, statGrowth: 1.6, cost: { ore: 26, oil: 26, metal: 32, power: 24, research: 22 }, costGrowth: 1.5,
    trainTime: 10, timeGrowth: 1.4,
  },
  airfield: {
    family: 'aircraft', art: 'aircraft',
    names: ['侦察机', '战斗机', '攻击机', '轰炸机', '武装直升机', '隐形战机', '电子战机', '空中炮艇', '战略轰炸机', '末日空母'],
    hp: 110, atk: 75, statGrowth: 1.6, cost: { ore: 28, oil: 34, metal: 26, power: 30, research: 30 }, costGrowth: 1.5,
    trainTime: 8, timeGrowth: 1.4,
  },
};

function makeUnits() {
  const units = [];
  for (const [building, f] of Object.entries(UNIT_FAMILIES)) {
    f.names.forEach((name, i) => {
      const cost = {};
      for (const [r, v] of Object.entries(f.cost)) cost[r] = Math.ceil(v * Math.pow(f.costGrowth, i));
      units.push({
        id: `${building}_t${i + 1}`, name, family: f.family, art: f.art, building, tier: i + 1,
        unlockLevel: i === 0 ? 1 : i * 10,
        hp: Math.round(f.hp * Math.pow(f.statGrowth, i)),
        atk: Math.round(f.atk * Math.pow(f.statGrowth, i)),
        cost,
        trainTime: Math.round(f.trainTime * Math.pow(f.timeGrowth, i)),
      });
    });
  }
  return units;
}
export const UNITS = makeUnits();

// 建筑每级训练加速
export const TRAIN_SPEED_PER_LEVEL = 0.05;

// ---------- 兵种进阶（消耗科研，需时间）----------
// 每个兵种独立，1~10 阶；新解锁默认 1 阶。每阶 +12% 攻击与生命。
// 进阶耗时 = 该兵种当前训练耗时 × timeMult(20)。进阶成本 = 科研，随阶数与档位上升。
export const MAX_RANK = 10;
export const RANK = { atkPerRank: 0.12, hpPerRank: 0.12, baseCost: 50, costGrowth: 1.55, tierFactor: 0.6, timeMult: 20, timeGrowth: 1.6 };

// ---------- 野怪关卡（共 100 关，每 10 关一页）----------
const STAGES_HAND = [
  { id: 's1', name: '野狗群', art: 'beast', desc: '聚集在营地外的变异野狗，新兵练手的好对象。',
    enemies: [{ name: '野狗', art: 'beast', hp: 30, atk: 6, count: 6 }], loot: { ore: 120, oil: 40, metal: 30 }, firstClear: { research: 20 } },
  { id: 's2', name: '流寇营地', art: 'bandit', desc: '一伙打家劫舍的流寇，人多但装备简陋。',
    enemies: [{ name: '流寇', art: 'bandit', hp: 45, atk: 11, count: 9 }], loot: { ore: 200, oil: 80, metal: 60 }, firstClear: { research: 30 } },
  { id: 's3', name: '变异虫巢', art: 'bug', desc: '地下涌出的变异巨虫，血厚需要持续输出。',
    enemies: [{ name: '巨虫', art: 'bug', hp: 130, atk: 18, count: 6 }], loot: { ore: 320, oil: 140, metal: 110, power: 40 }, firstClear: { research: 40 } },
  { id: 's4', name: '机械哨兵', art: 'mech', desc: '遗弃军事区的自动哨兵，装甲坚硬，建议带战车。',
    enemies: [{ name: '哨兵', art: 'mech', hp: 170, atk: 32, count: 6 }], loot: { ore: 480, oil: 220, metal: 180, power: 80 }, firstClear: { research: 60 } },
  { id: 's5', name: '强盗装甲队', art: 'mech', desc: '武装到牙齿的劫掠车队，火力凶猛，建议带战车与升阶。',
    enemies: [{ name: '装甲车', art: 'mech', hp: 520, atk: 70, count: 5 }, { name: '机枪手', art: 'bandit', hp: 120, atk: 28, count: 8 }], loot: { ore: 700, oil: 360, metal: 300, power: 140 }, firstClear: { research: 90 } },
  { id: 's6', name: '空中蜂群', art: 'drone', desc: '失控的无人机群，攻击极高，需要厚实阵容硬扛。',
    enemies: [{ name: '无人机', art: 'drone', hp: 200, atk: 70, count: 16 }], loot: { ore: 1000, oil: 560, metal: 480, power: 240, research: 60 }, firstClear: { research: 140 } },
  { id: 's7', name: '钢铁要塞', art: 'fortress', desc: '盘踞此地的堡垒，攻防俱强，没有进阶部队很难啃下。',
    enemies: [{ name: '要塞炮台', art: 'fortress', hp: 6000, atk: 300, count: 1 }, { name: '护卫战车', art: 'mech', hp: 700, atk: 90, count: 5 }], loot: { ore: 2000, oil: 1200, metal: 1000, power: 500, research: 150 }, firstClear: { research: 300 } },
];
const STAGE_ARTS = ['beast', 'bandit', 'bug', 'mech', 'drone'];
const STAGE_POOL = ['野犬群', '流寇团伙', '变异虫群', '机械哨队', '装甲纵队', '无人机群', '叛军哨站', '污染兽群', '废土劫掠者', '合成体部队'];
const BOSS_NAMES = ['钢铁要塞', '红色巨像', '死亡之爪', '天启战车', '末日母舰', '深渊领主', '机械暴君', '泰坦核心', '湮灭装置', '终焉指挥官'];

function makeStages() {
  const stages = [...STAGES_HAND];
  for (let n = 8; n <= 100; n++) {
    const boss = n % 10 === 0;
    const hp = Math.round(110 * Math.pow(1.17, n));
    const atk = Math.round(16 * Math.pow(1.155, n));
    if (boss) {
      const bn = BOSS_NAMES[(n / 10 - 1) % BOSS_NAMES.length];
      stages.push({
        id: 's' + n, name: `${bn}（${n}）`, art: 'fortress', desc: '该区域的统御者，攻防俱强。',
        enemies: [{ name: bn, art: 'fortress', hp: hp * 9, atk: Math.round(atk * 1.6), count: 1 }, { name: '护卫', art: 'mech', hp: Math.round(hp * 1.2), atk, count: 4 }],
        loot: { ore: Math.round(900 * Math.pow(1.14, n)), oil: Math.round(520 * Math.pow(1.14, n)), metal: Math.round(440 * Math.pow(1.14, n)), power: Math.round(120 * Math.pow(1.13, n)), research: 60 + n },
        firstClear: { research: 80 + n * 3 },
      });
    } else {
      const art = STAGE_ARTS[n % STAGE_ARTS.length];
      const poolName = STAGE_POOL[n % STAGE_POOL.length];
      stages.push({
        id: 's' + n, name: `${poolName}（${n}）`, art, desc: '盘踞在推进路线上的野怪据点。',
        enemies: [{ name: poolName, art, hp, atk, count: 6 + (n % 5) }],
        loot: { ore: Math.round(220 * Math.pow(1.14, n)), oil: Math.round(120 * Math.pow(1.14, n)), metal: Math.round(90 * Math.pow(1.14, n)), power: Math.round(30 * Math.pow(1.13, n)) },
        firstClear: { research: 40 + n * 2 },
      });
    }
  }
  return stages;
}
export const STAGES = makeStages();
export const STAGES_PER_PAGE = 10;
