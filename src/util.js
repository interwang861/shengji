// ============================================================
//  util.js  —  通用小工具
// ============================================================

// 把大数字格式化为 1.2K / 3.4M 这类紧凑写法。
export function formatNumber(n) {
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) return sign + Math.floor(n).toString();
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  let u = -1;
  do {
    n /= 1000;
    u++;
  } while (n >= 1000 && u < units.length - 1);
  return sign + n.toFixed(n < 10 ? 1 : 0) + units[u];
}

// 把秒数格式化为倒计时时钟：MM:SS 或 H:MM:SS。
export function formatClock(seconds) {
  seconds = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// 把秒数格式化为「2小时15分」这类可读时长。
export function formatDuration(seconds) {
  seconds = Math.floor(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h) parts.push(h + '小时');
  if (m) parts.push(m + '分');
  if (!h && !m) parts.push(s + '秒');
  return parts.join('');
}
