// ============================================================
//  sfx.js  —  极简音效（Web Audio 实时合成，不需要任何音频文件）
// ============================================================

let ctx = null;
let muted = false;

// 从本地读取静音偏好
try {
  muted = localStorage.getItem('rb-muted') === '1';
} catch {}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  // 浏览器策略：首次交互后才能播放
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 播放一个简单的音符
function tone({ freq = 440, type = 'sine', dur = 0.12, gain = 0.12, slide = 0 }) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  osc.connect(g).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + dur);
}

export const sfx = {
  // 建造/升级成功：上扬的双音
  build() {
    tone({ freq: 440, type: 'triangle', dur: 0.1, gain: 0.12 });
    setTimeout(() => tone({ freq: 660, type: 'triangle', dur: 0.14, gain: 0.12 }), 70);
  },
  // 买不起：低沉的钝响
  denied() {
    tone({ freq: 160, type: 'sawtooth', dur: 0.16, gain: 0.07, slide: 0.6 });
  },
  // 悬停轻点
  tick() {
    tone({ freq: 520, type: 'sine', dur: 0.04, gain: 0.04 });
  },
  // 战斗命中
  hit() {
    tone({ freq: 220 + Math.random() * 80, type: 'square', dur: 0.05, gain: 0.05, slide: 0.5 });
  },
  // 胜利号角
  win() {
    [523, 659, 784].forEach((f, k) =>
      setTimeout(() => tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.12 }), k * 110));
  },
  // 失败
  lose() {
    [330, 247, 165].forEach((f, k) =>
      setTimeout(() => tone({ freq: f, type: 'sawtooth', dur: 0.22, gain: 0.09 }), k * 130));
  },
  setMuted(v) {
    muted = v;
    try {
      localStorage.setItem('rb-muted', v ? '1' : '0');
    } catch {}
  },
  isMuted() {
    return muted;
  },
};
