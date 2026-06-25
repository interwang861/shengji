// ============================================================
//  combat.js  —  PvE 自动战斗模拟（纯函数）
//  模型：双方各算「总生命池」和「总火力」，逐回合互相削减生命，
//  直到一方生命见底；按损失生命的比例折算双方伤亡。
//  这样既有「以多打少」的策略感，也保留「赢了也会减员」的真实感。
// ============================================================

const MAX_ROUNDS = 60;

function sumSide(groups) {
  let hp = 0, atk = 0;
  for (const g of groups) { hp += g.hp * g.count; atk += g.atk * g.count; }
  return { hp, atk };
}

// rng 可注入（测试用），默认 Math.random
export function simulateBattle(playerArmy, enemyArmy, rng = Math.random) {
  const p0 = sumSide(playerArmy);
  const e0 = sumSide(enemyArmy);

  // 空军队直接判负
  if (p0.hp <= 0 || playerArmy.length === 0) {
    return {
      win: false, rounds: 0, snapshots: [{ p: 0, e: 1 }],
      playerLoss: {}, totals: { player: p0, enemy: e0 },
    };
  }

  // ±10% 临场波动
  const jitter = () => 0.9 + rng() * 0.2;
  const pATK = p0.atk * jitter();
  const eATK = e0.atk * jitter();

  let pHP = p0.hp, eHP = e0.hp, rounds = 0;
  const snapshots = [{ p: 1, e: 1 }];
  while (pHP > 0 && eHP > 0 && rounds < MAX_ROUNDS) {
    eHP -= pATK;
    pHP -= eATK;
    rounds++;
    snapshots.push({ p: Math.max(0, pHP) / p0.hp, e: Math.max(0, eHP) / e0.hp });
  }

  const win = eHP <= 0 && pHP > 0;

  // 伤亡 = 损失生命比例，折算到各兵种数量
  const lossFrac = Math.min(1, (p0.hp - Math.max(0, pHP)) / p0.hp);
  const playerLoss = {};
  for (const g of playerArmy) {
    let lost = Math.round(g.count * lossFrac);
    if (!win) lost = Math.max(lost, Math.ceil(g.count * Math.max(lossFrac, 0.6)));
    playerLoss[g.id] = Math.min(g.count, lost);
  }

  return { win, rounds, snapshots, playerLoss, totals: { player: p0, enemy: e0 } };
}
