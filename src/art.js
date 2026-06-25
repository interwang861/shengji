// ============================================================
//  art.js  —  手绘 SVG 矢量美术
//  · BUILDING_ART：7 座建筑，key 与 config.js 的建筑 id 对应
//  · RESOURCE_ART：资源图标
//  建筑 SVG 内部带 class（b-radar / b-pump / b-smoke ...），
//  在 main.css 里做待机动画；建造后由卡片状态触发。
// ============================================================

// 通用：地面阴影
const SHADOW = '<ellipse cx="32" cy="56" rx="23" ry="4.5" fill="#0a1016"/>';

export const BUILDING_ART = {
  // 基地 —— 指挥部 + 旋转雷达
  base: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <rect x="13" y="32" width="38" height="22" rx="3" fill="#2f4256"/>
    <rect x="13" y="32" width="38" height="6" rx="3" fill="#3c5468"/>
    <rect x="18" y="42" width="7" height="12" rx="1" fill="#0e1822"/>
    <rect x="30" y="42" width="6" height="6" fill="#41cfe0" class="b-blink"/>
    <rect x="40" y="42" width="6" height="6" fill="#41cfe0"/>
    <rect x="30" y="26" width="4" height="8" fill="#1f2e3c"/>
    <rect x="30" y="24" width="20" height="4" rx="2" fill="#4a6378"/>
    <g class="b-radar">
      <path d="M32 24 a13 7 0 0 1 13 4 l-13 1 z" fill="#8fa6b8"/>
      <path d="M32 24 a13 7 0 0 1 13 4" fill="none" stroke="#b9c9d6" stroke-width="1.5"/>
      <circle cx="32" cy="24" r="3" fill="#f0a23c"/>
    </g>
  </svg>`,

  // 矿石场 —— 矿洞 + 矿石结晶
  oreMine: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <path d="M10 54 L20 30 L44 30 L54 54 Z" fill="#33444f"/>
    <path d="M20 30 L44 30 L54 54 L44 54 Z" fill="#283740"/>
    <path d="M24 54 a8 8 0 0 1 16 0 Z" fill="#0c141a"/>
    <path d="M27 30 L31 18 L35 30 Z" fill="#8fa6b8" class="b-spark"/>
    <path d="M34 30 L40 22 L44 30 Z" fill="#a9bccb" class="b-spark"/>
    <path d="M31 18 L33 22 L29 22 Z" fill="#d6e4ef"/>
    <rect x="44" y="48" width="12" height="6" rx="1" fill="#4a6378"/>
    <circle cx="47" cy="55" r="3" fill="#1f2e3c"/>
    <circle cx="53" cy="55" r="3" fill="#1f2e3c"/>
  </svg>`,

  // 石油场 —— 抽油机
  oilField: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <rect x="12" y="50" width="40" height="4" rx="1" fill="#2a3742"/>
    <path d="M24 50 L28 30 L36 30 L40 50 Z" fill="#3c5468"/>
    <path d="M28 30 L36 30 L34 36 L30 36 Z" fill="#4a6378"/>
    <g class="b-pump">
      <rect x="18" y="26" width="30" height="4" rx="2" fill="#5a7488"/>
      <rect x="44" y="22" width="5" height="14" rx="1" fill="#c9a24b"/>
      <circle cx="20" cy="28" r="4" fill="#7e94a8"/>
    </g>
    <circle cx="32" cy="33" r="2.5" fill="#1f2e3c"/>
    <rect x="46" y="34" width="4" height="6" fill="#1a2630"/>
  </svg>`,

  // 科研实验室 —— 圆顶 + 烧瓶
  lab: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <rect x="14" y="38" width="36" height="16" rx="2" fill="#2f4256"/>
    <path d="M14 38 a18 16 0 0 1 36 0 Z" fill="#374e63"/>
    <path d="M14 38 a18 16 0 0 1 36 0" fill="none" stroke="#4a6378" stroke-width="1.5"/>
    <rect x="29" y="14" width="6" height="10" rx="1" fill="#5a7488"/>
    <circle cx="32" cy="13" r="3" fill="#f0a23c" class="b-blink"/>
    <path d="M27 34 h10 l-2 8 a4 4 0 0 1 -6 0 Z" fill="#a886e6" opacity="0.9"/>
    <circle cx="30" cy="40" r="1.3" fill="#fff" class="b-spark"/>
    <circle cx="34" cy="38" r="1" fill="#fff" class="b-spark"/>
    <rect x="42" y="44" width="5" height="6" fill="#41cfe0"/>
  </svg>`,

  // 兵营 —— 营房 + 飘扬军旗
  barracks: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <path d="M12 54 V34 a20 12 0 0 1 40 0 V54 Z" fill="#33453a"/>
    <path d="M12 34 a20 12 0 0 1 40 0" fill="#3c5447"/>
    <rect x="27" y="40" width="10" height="14" rx="1" fill="#0e1822"/>
    <rect x="18" y="40" width="6" height="6" fill="#6b8a72"/>
    <rect x="40" y="40" width="6" height="6" fill="#6b8a72"/>
    <rect x="47" y="14" width="2.5" height="24" fill="#5a7488"/>
    <path d="M49 15 h12 v8 h-12 Z" fill="#e8705a" class="b-flag"/>
    <circle cx="48" cy="13" r="2" fill="#f0a23c"/>
  </svg>`,

  // 战车工厂 —— 厂房 + 烟囱冒烟 + 战车
  vehicleFactory: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <rect x="10" y="34" width="44" height="20" rx="2" fill="#2f4256"/>
    <path d="M10 34 l8 -6 v6 Z M18 34 l8 -6 v6 Z M26 34 l8 -6 v6 Z M34 34 l8 -6 v6 Z M42 34 l8 -6 v6 Z" fill="#3c5468"/>
    <rect x="44" y="20" width="6" height="14" fill="#4a6378"/>
    <circle class="b-smoke" cx="47" cy="18" r="3" fill="#7e94a8" opacity="0.7"/>
    <circle class="b-smoke b-smoke2" cx="47" cy="14" r="4" fill="#7e94a8" opacity="0.5"/>
    <rect x="16" y="44" width="20" height="7" rx="2" fill="#5a6b4a"/>
    <rect x="22" y="40" width="9" height="5" rx="1" fill="#6b8055"/>
    <rect x="30" y="41" width="10" height="2.5" rx="1" fill="#445239"/>
    <circle cx="20" cy="52" r="3" fill="#1f2e3c"/>
    <circle cx="32" cy="52" r="3" fill="#1f2e3c"/>
  </svg>`,

  // 飞机场 —— 塔台 + 跑道 + 战机
  airfield: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <path d="M8 54 L20 44 L60 44 L52 54 Z" fill="#2a3742"/>
    <path d="M22 49 h30 M26 47 h22" stroke="#566876" stroke-width="1.5" stroke-dasharray="4 3"/>
    <rect x="12" y="26" width="9" height="20" rx="1" fill="#2f4256"/>
    <path d="M11 26 h11 v-5 l-5 -3 -6 3 Z" fill="#3c5468"/>
    <rect x="13" y="22" width="7" height="4" fill="#41cfe0"/>
    <circle cx="16.5" cy="17" r="2" fill="#e8705a" class="b-blink"/>
    <g class="b-plane">
      <path d="M34 38 l10 -2 l4 2 l-4 2 Z" fill="#9fb3c2"/>
      <path d="M40 36 l-3 -5 h2 l4 4 Z" fill="#7e94a8"/>
      <path d="M40 40 l-3 5 h2 l4 -4 Z" fill="#7e94a8"/>
      <circle cx="46" cy="38" r="1.4" fill="#f0a23c"/>
    </g>
  </svg>`,

  // 冶炼厂 —— 熔炉 + 烟囱 + 金属熔流
  smelter: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <rect x="12" y="30" width="34" height="24" rx="3" fill="#2f4256"/>
    <rect x="12" y="30" width="34" height="6" rx="3" fill="#3c5468"/>
    <rect x="38" y="16" width="7" height="16" fill="#4a6378"/>
    <circle class="b-smoke" cx="41.5" cy="14" r="3" fill="#7e94a8" opacity="0.6"/>
    <circle class="b-smoke b-smoke2" cx="41.5" cy="10" r="4" fill="#7e94a8" opacity="0.4"/>
    <rect x="17" y="42" width="18" height="9" rx="1" fill="#1a2630"/>
    <rect x="20" y="38" width="12" height="9" rx="2" fill="#f0a23c" class="b-blink"/>
    <path d="M21 47 q5 4 10 0" fill="none" stroke="#e8705a" stroke-width="2"/>
    <circle cx="24" cy="42" r="1.3" fill="#fff" class="b-spark"/>
    <circle cx="29" cy="43" r="1.1" fill="#fff" class="b-spark"/>
  </svg>`,

  // 仓库 —— 仓储库房 + 集装箱 + 卷帘门
  warehouse: `<svg viewBox="0 0 64 64" class="bart">${SHADOW}
    <path d="M10 30 L32 20 L54 30 V54 H10 Z" fill="#2f4256"/>
    <path d="M10 30 L32 20 L54 30 L32 28 Z" fill="#3c5468"/>
    <rect x="22" y="36" width="20" height="18" rx="1" fill="#1a2630"/>
    <g fill="#4a6378"><rect x="24" y="38" width="16" height="3"/><rect x="24" y="43" width="16" height="3"/><rect x="24" y="48" width="16" height="3"/></g>
    <rect x="12" y="44" width="9" height="10" rx="1" fill="#cda64e"/>
    <rect x="12" y="44" width="9" height="3.4" fill="#dbb866"/>
    <rect x="43" y="46" width="9" height="8" rx="1" fill="#41cfe0"/>
    <rect x="43" y="46" width="9" height="3" fill="#6fdcea"/>
    <circle cx="32" cy="25" r="2" fill="#f0a23c" class="b-blink"/>
  </svg>`,
};

// ---------- 资源图标（小尺寸 SVG）----------
export const RESOURCE_ART = {
  ore: `<svg viewBox="0 0 24 24"><path d="M5 16 L9 6 L15 6 L19 16 L14 20 L10 20 Z" fill="currentColor"/><path d="M9 6 L12 11 L15 6 Z" fill="#fff" opacity="0.35"/></svg>`,
  oil: `<svg viewBox="0 0 24 24"><path d="M12 3 C7 9 6 12 6 15 a6 6 0 0 0 12 0 c0-3-1-6-6-12 Z" fill="currentColor"/><ellipse cx="10" cy="14" rx="2" ry="3" fill="#fff" opacity="0.3"/></svg>`,
  metal: `<svg viewBox="0 0 24 24"><path d="M3 15 l4 -4 h10 l4 4 l-4 4 h-10 Z" fill="currentColor"/><path d="M7 11 l3 4 h-7 Z" fill="#fff" opacity="0.3"/><path d="M17 11 l-3 4 h7 Z" fill="#000" opacity="0.15"/></svg>`,
  power: `<svg viewBox="0 0 24 24"><path d="M13 2 L4 14 h6 l-1 8 l9-12 h-6 Z" fill="currentColor"/></svg>`,
  research: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/></g></svg>`,
  might: `<svg viewBox="0 0 24 24"><path d="M12 2 L20 5 V11 C20 16 16 20 12 22 C8 20 4 16 4 11 V5 Z" fill="currentColor"/><path d="M12 6 l5 2 v3 c0 3-2.5 5.5-5 7 Z" fill="#fff" opacity="0.25"/></svg>`,
};

// ---------- 兵种图标（fill 用 currentColor，颜色由外层决定）----------
export const UNIT_ART = {
  infantry: `<svg viewBox="0 0 40 40"><circle cx="20" cy="11" r="5" fill="currentColor"/><path d="M14 11 a6 4 0 0 1 12 0 Z" fill="currentColor"/><path d="M13 22 a7 7 0 0 1 14 0 v10 h-14 Z" fill="currentColor"/><rect x="24" y="14" width="11" height="2.4" rx="1" transform="rotate(20 24 14)" fill="currentColor"/></svg>`,
  tank: `<svg viewBox="0 0 40 40"><rect x="6" y="24" width="28" height="7" rx="3" fill="currentColor"/><circle cx="11" cy="31" r="3" fill="currentColor"/><circle cx="20" cy="31" r="3" fill="currentColor"/><circle cx="29" cy="31" r="3" fill="currentColor"/><path d="M12 24 v-5 a4 4 0 0 1 4-4 h8 a4 4 0 0 1 4 4 v5 Z" fill="currentColor"/><rect x="26" y="17" width="11" height="2.6" rx="1" fill="currentColor"/></svg>`,
  aircraft: `<svg viewBox="0 0 40 40"><path d="M19 5 l3 0 l2 14 l9 5 l0 3 l-11 -3 l0 7 l4 3 l0 2 l-7 -2 l-7 2 l0 -2 l4 -3 l0 -7 l-11 3 l0 -3 l9 -5 l2 -14 Z" fill="currentColor"/></svg>`,
};

// ---------- 野怪图标 ----------
export const ENEMY_ART = {
  beast: `<svg viewBox="0 0 40 40"><path d="M8 16 l4 -7 l4 5 h8 l4 -5 l4 7 v10 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 Z" fill="currentColor"/><circle cx="16" cy="20" r="1.8" fill="#0e1620"/><circle cx="24" cy="20" r="1.8" fill="#0e1620"/><path d="M17 27 l3 2 l3 -2" fill="none" stroke="#0e1620" stroke-width="1.6"/></svg>`,
  bandit: `<svg viewBox="0 0 40 40"><circle cx="20" cy="18" r="12" fill="currentColor"/><rect x="8" y="16" width="24" height="6" fill="#0e1620"/><circle cx="15" cy="19" r="1.6" fill="currentColor"/><circle cx="25" cy="19" r="1.6" fill="currentColor"/><path d="M14 30 l6 4 l6 -4" fill="currentColor"/></svg>`,
  bug: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="22" rx="8" ry="11" fill="currentColor"/><circle cx="20" cy="11" r="5" fill="currentColor"/><path d="M12 16 l-6 -4 M28 16 l6 -4 M12 22 l-7 0 M28 22 l7 0 M12 28 l-6 4 M28 28 l6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="17" cy="10" r="1.4" fill="#0e1620"/><circle cx="23" cy="10" r="1.4" fill="#0e1620"/></svg>`,
  mech: `<svg viewBox="0 0 40 40"><rect x="9" y="12" width="22" height="18" rx="3" fill="currentColor"/><rect x="14" y="17" width="12" height="5" rx="1" fill="#0e1620"/><rect x="16" y="6" width="8" height="6" rx="1" fill="currentColor"/><circle cx="20" cy="6" r="2" fill="#0e1620"/><rect x="6" y="16" width="3" height="11" fill="currentColor"/><rect x="31" y="16" width="3" height="11" fill="currentColor"/><rect x="13" y="30" width="5" height="5" fill="currentColor"/><rect x="22" y="30" width="5" height="5" fill="currentColor"/></svg>`,
  drone: `<svg viewBox="0 0 40 40"><circle cx="9" cy="10" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="31" cy="10" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="31" cy="10" r="1.5" fill="currentColor"/><path d="M9 10 L20 20 L31 10" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="18" width="12" height="9" rx="3" fill="currentColor"/><circle cx="20" cy="23" r="2" fill="#0e1620"/></svg>`,
  fortress: `<svg viewBox="0 0 40 40"><path d="M6 34 V18 l4 0 v-4 l4 0 v4 l4 0 v-4 l4 0 v4 l4 0 v-4 l4 0 v4 l0 0 V34 Z" fill="currentColor"/><rect x="16" y="22" width="8" height="12" fill="#0e1620"/><rect x="18" y="8" width="4" height="10" fill="currentColor"/><rect x="22" y="11" width="12" height="3" rx="1" transform="rotate(-12 22 11)" fill="currentColor"/></svg>`,
};
