// 『永田町への道 天下取り』 演出：似顔絵（表情つき）、効果音、号外、街の絵、地図のアイコン
(() => {
  const T = (globalThis.Tenka = globalThis.Tenka || {});
  const FX = (T.FX = {});
  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- 似顔絵 ---------- */
  const SKIN = ["#f2d4b8", "#e9c29f", "#ddb08a", "#d09c76"];
  const HAIR_YOUNG = ["#1c1917", "#2a211c", "#3b2a20"];
  // mood: neutral / happy / worried / angry
  FX.portrait = function (seedStr, { gender = "m", age = 50, color = "#555", badge = true, size = 64, mood = "neutral" } = {}) {
    const r = seeded(hash(seedStr));
    const skin = SKIN[Math.floor(r() * SKIN.length)];
    const gray = age >= 66 ? "#c9c6c0" : age >= 56 ? (r() < 0.6 ? "#8d8a85" : "#3a332d") : HAIR_YOUNG[Math.floor(r() * 3)];
    const suit = ["#232a38", "#2b2f36", "#1f2a3d", "#3a3f4a"][Math.floor(r() * 4)];
    const tie = ["#8c2346", "#2f5d8c", "#6b6f2a", "#7a3b1d", "#3f6b5a"][Math.floor(r() * 5)];
    const glasses = r() < (age > 55 ? 0.45 : 0.25);
    const faceW = 12 + r() * 2.5, faceH = 14 + r() * 2;
    const style = Math.floor(r() * 3);
    let hairBack = "", hairTop = "";
    if (gender === "f") {
      hairBack = style === 0 ? `<path d="M17 28 Q16 9 32 8 Q48 9 47 28 L47 40 Q44 44 40 41 L40 26 L24 26 L24 41 Q20 44 17 40 Z" fill="${gray}"/>` : `<path d="M18 26 Q17 8 32 8 Q47 8 46 26 L48 50 L16 50 Z" fill="${gray}"/>`;
      hairTop = `<path d="M19 24 Q21 10 32 10 Q44 10 45 24 Q38 16 30 17 Q24 18 19 24 Z" fill="${gray}"/>`;
    } else {
      const bald = age >= 64 && r() < 0.5;
      if (bald) hairTop = `<path d="M19 26 Q19 20 21 18 L21 26 Z M45 26 Q45 20 43 18 L43 26 Z" fill="${gray}"/>`;
      else if (style === 0) hairTop = `<path d="M19 25 Q18 10 32 10 Q46 10 45 25 Q42 16 32 16 Q22 16 19 25 Z" fill="${gray}"/>`;
      else if (style === 1) hairTop = `<path d="M19 26 Q18 9 33 10 Q47 11 45 26 Q44 17 36 15 Q30 18 22 18 Q20 21 19 26 Z" fill="${gray}"/>`;
      else hairTop = `<path d="M19 24 Q20 11 32 11 Q44 11 45 24 L43 19 Q32 13 21 19 Z" fill="${gray}"/>`;
    }
    const eyeY = 27 + r() * 1.5;
    const browW = gender === "f" ? 0.8 : 1.4;
    // 表情
    const browTilt = mood === "angry" ? 1.8 : mood === "worried" ? -1.2 : 0;
    const mouth = mood === "happy" ? `M28 ${eyeY + 9} Q32 ${eyeY + 13} 36 ${eyeY + 9}` : mood === "worried" ? `M28.5 ${eyeY + 10.5} Q32 ${eyeY + 8.5} 35.5 ${eyeY + 10.5}` : mood === "angry" ? `M28.5 ${eyeY + 10.5} L35.5 ${eyeY + 10.5}` : `M28.5 ${eyeY + 9.5} Q32 ${eyeY + (age > 60 ? 9.5 : 11)} 35.5 ${eyeY + 9.5}`;
    const sweat = mood === "worried" ? `<path d="M43 ${eyeY - 6} q2 3 0 5 q-2 -2 0 -5" fill="#7fb6e6"/>` : "";
    const blush = mood === "happy" ? `<ellipse cx="24" cy="${eyeY + 5}" rx="2.5" ry="1.2" fill="#e8a0a0" opacity=".6"/><ellipse cx="40" cy="${eyeY + 5}" rx="2.5" ry="1.2" fill="#e8a0a0" opacity=".6"/>` : "";
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" class="portrait">
      <rect width="64" height="64" rx="8" fill="${color}" opacity=".35"/>
      <rect width="64" height="64" rx="8" fill="url(#pgrad)" opacity=".5"/>
      ${hairBack}
      <path d="M8 64 Q10 47 26 45 L38 45 Q54 47 56 64 Z" fill="${suit}"/>
      <path d="M27 45 L32 54 L37 45 Z" fill="#f4f1ea"/>
      ${gender === "m" ? `<path d="M31 47 L33 47 L34 58 L32 61 L30 58 Z" fill="${tie}"/>` : ""}
      <rect x="28" y="38" width="8" height="8" fill="${skin}"/>
      <ellipse cx="32" cy="${27 + faceH / 8}" rx="${faceW}" ry="${faceH}" fill="${skin}"/>
      ${hairTop}${blush}
      <path d="M${25 - browW} ${eyeY - 4 + browTilt} L29 ${eyeY - 4.5 - browTilt * 0.5} M35 ${eyeY - 4.5 - browTilt * 0.5} L${39 + browW} ${eyeY - 4 + browTilt}" stroke="#2a211c" stroke-width="${browW}" stroke-linecap="round"/>
      <ellipse cx="27" cy="${eyeY}" rx="1.4" ry="1.6" fill="#1c1917"/><ellipse cx="37" cy="${eyeY}" rx="1.4" ry="1.6" fill="#1c1917"/>
      ${glasses ? `<g fill="none" stroke="#1c1917" stroke-width=".9"><rect x="23" y="${eyeY - 3}" width="8" height="6" rx="2"/><rect x="33" y="${eyeY - 3}" width="8" height="6" rx="2"/><path d="M31 ${eyeY} L33 ${eyeY}"/></g>` : ""}
      <path d="M32 ${eyeY + 2} L31 ${eyeY + 6} L33 ${eyeY + 6}" stroke="#b07d5c" stroke-width=".8" fill="none"/>
      <path d="${mouth}" stroke="#8a4b3a" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      ${sweat}
      ${badge ? `<circle cx="22" cy="52" r="2.2" fill="#d4b04c" stroke="#7a5c18" stroke-width=".6"/>` : ""}
    </svg>`;
  };
  FX.defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    <pattern id="pat-stripe" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="transparent"/><rect width="2.5" height="6" fill="rgba(255,255,255,.22)"/></pattern>
    <pattern id="pat-dot" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" fill="rgba(255,255,255,.3)"/></pattern>
    <pattern id="pat-cross" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 3.5 H7 M3.5 0 V7" stroke="rgba(255,255,255,.28)" stroke-width="1"/></pattern>
  </defs></svg>`;

  /* ---------- 地図上の小さなアイコン ---------- */
  FX.icon = function (kind, x, y, s = 10) {
    const f = "#f3dc8c";
    switch (kind) {
      case "train": return `<g transform="translate(${x},${y})"><rect x="0" y="2" width="${s}" height="${s * 0.6}" rx="2" fill="${f}"/><rect x="1.5" y="3.5" width="2.5" height="2" fill="#1a1f29"/><rect x="${s - 4}" y="3.5" width="2.5" height="2" fill="#1a1f29"/><circle cx="2.5" cy="${s * 0.6 + 2.5}" r="1" fill="#1a1f29"/><circle cx="${s - 2.5}" cy="${s * 0.6 + 2.5}" r="1" fill="#1a1f29"/></g>`;
      case "airport": return `<g transform="translate(${x},${y})"><path d="M${s / 2} 0 L${s / 2 + 1.5} ${s * 0.4} L${s} ${s * 0.65} L${s} ${s * 0.75} L${s / 2 + 1.2} ${s * 0.6} L${s / 2 + 1} ${s * 0.85} L${s * 0.7} ${s} L${s * 0.3} ${s} L${s / 2 - 1} ${s * 0.85} L${s / 2 - 1.2} ${s * 0.6} L0 ${s * 0.75} L0 ${s * 0.65} L${s / 2 - 1.5} ${s * 0.4} Z" fill="${f}"/></g>`;
      case "port": return `<g transform="translate(${x},${y})"><path d="M${s / 2} 1 V${s} M2 ${s * 0.55} Q${s / 2} ${s + 2} ${s - 2} ${s * 0.55}" stroke="${f}" stroke-width="1.6" fill="none"/><circle cx="${s / 2}" cy="1.5" r="1.4" fill="${f}"/></g>`;
      case "tower": return `<g transform="translate(${x},${y})"><rect x="${s * 0.3}" y="0" width="${s * 0.4}" height="${s}" fill="${f}"/><rect x="${s * 0.1}" y="${s * 0.5}" width="${s * 0.2}" height="${s * 0.5}" fill="${f}"/><rect x="${s * 0.7}" y="${s * 0.35}" width="${s * 0.2}" height="${s * 0.65}" fill="${f}"/></g>`;
      case "hospital": return `<g transform="translate(${x},${y})"><rect width="${s}" height="${s}" rx="1.5" fill="${f}"/><path d="M${s / 2} 2 V${s - 2} M2 ${s / 2} H${s - 2}" stroke="#1a1f29" stroke-width="1.8"/></g>`;
      case "road": return `<g transform="translate(${x},${y})"><path d="M0 ${s * 0.7} Q${s / 2} ${s * 0.1} ${s} ${s * 0.7}" stroke="${f}" stroke-width="2" fill="none"/><path d="M1 ${s} V${s * 0.65} M${s - 1} ${s} V${s * 0.65}" stroke="${f}" stroke-width="1.5"/></g>`;
      case "school": return `<g transform="translate(${x},${y})"><path d="M0 ${s * 0.45} L${s / 2} 0 L${s} ${s * 0.45} Z" fill="${f}"/><rect x="1" y="${s * 0.45}" width="${s - 2}" height="${s * 0.55}" fill="${f}"/></g>`;
      case "levee": return `<g transform="translate(${x},${y})"><path d="M0 ${s} L${s * 0.3} ${s * 0.3} H${s * 0.7} L${s} ${s} Z" fill="${f}"/><path d="M0 ${s * 0.75} q2 -2 4 0 t4 0 t4 0" stroke="#7fb6e6" stroke-width="1" fill="none"/></g>`;
      case "works": return `<rect x="${x}" y="${y}" width="7" height="7" rx="1" fill="${f}"/>`;
    }
    return "";
  };

  /* ---------- 地元の街 ---------- */
  // built: 完成した事業の id の配列、works: 進行中
  FX.town = function (built, works, name) {
    const has = id => built.includes(id);
    const b = [];
    // 空・海・山
    b.push(`<rect width="480" height="270" fill="url(#sky)"/>`);
    b.push(`<path d="M0 120 Q80 70 160 110 T320 100 T480 120 V200 H0 Z" fill="#2b3a4a"/>`);
    b.push(`<path d="M0 150 Q120 110 240 150 T480 140 V200 H0 Z" fill="#344a5a"/>`);
    b.push(`<rect y="200" width="480" height="70" fill="#1d3550"/>`);
    b.push(`<path d="M0 205 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#2f5a80" stroke-width="1.2" fill="none"/>`);
    // 地面
    b.push(`<rect y="150" width="480" height="55" fill="#3a4a3a"/>`);
    // 商店街（最初からある）
    for (let i = 0; i < 6; i++) b.push(`<rect x="${40 + i * 34}" y="${150 - 22 - (i % 2) * 6}" width="28" height="${22 + (i % 2) * 6}" fill="${["#8a6a3a", "#9a7a4a", "#7a5a3a"][i % 3]}"/><rect x="${44 + i * 34}" y="${150 - 14 - (i % 2) * 6}" width="6" height="6" fill="#f3dc8c" opacity=".7"/>`);
    b.push(`<text x="130" y="165" font-size="9" fill="#cfd6d0">港町商店街</text>`);
    // 駅
    b.push(`<rect x="250" y="118" width="60" height="32" fill="#5a6a7a"/><rect x="246" y="112" width="68" height="8" fill="#8a97a5"/><text x="258" y="140" font-size="9" fill="#fff">汐見駅</text>`);
    // 市役所
    b.push(`<rect x="340" y="108" width="50" height="42" fill="#6a6a7a"/><rect x="345" y="113" width="40" height="30" fill="#8d8d9d" opacity=".4"/><text x="344" y="165" font-size="9" fill="#cfd6d0">市役所</text>`);
    // 事業
    if (has("school")) b.push(`<path d="M400 128 L422 112 L444 128 Z" fill="#c9b27a"/><rect x="403" y="128" width="38" height="22" fill="#d9c79a"/><text x="398" y="165" font-size="9" fill="#cfd6d0">耐震校舎</text>`);
    if (has("hospital")) b.push(`<rect x="170" y="100" width="46" height="50" fill="#d8dde3"/><rect x="186" y="106" width="14" height="14" fill="#c4524a"/><path d="M193 108 V118 M188 113 H198" stroke="#fff" stroke-width="3"/><text x="166" y="165" font-size="9" fill="#cfd6d0">医療センター</text>`);
    if (has("road")) b.push(`<path d="M0 215 Q60 190 130 215" stroke="#c9c6c0" stroke-width="5" fill="none"/><path d="M20 215 V205 M60 198 V215 M100 200 V215" stroke="#c9c6c0" stroke-width="2"/><text x="30" y="235" font-size="9" fill="#cfd6d0">汐見大橋</text>`);
    if (has("levee")) b.push(`<path d="M0 200 H480" stroke="#8a97a5" stroke-width="6"/><text x="400" y="230" font-size="9" fill="#cfd6d0">防潮堤</text>`);
    if (has("port")) b.push(`<rect x="300" y="196" width="120" height="12" fill="#6a7a8a"/><rect x="330" y="176" width="10" height="22" fill="#c4524a"/><path d="M335 176 H390" stroke="#c4524a" stroke-width="3"/><rect x="360" y="185" width="30" height="10" fill="#f3dc8c"/><text x="300" y="240" font-size="9" fill="#cfd6d0">汐見港</text>`);
    if (has("redevelop")) b.push(`<rect x="214" y="60" width="30" height="90" fill="#9aa8c0"/><rect x="218" y="66" width="22" height="80" fill="#c7d2e8" opacity=".35"/><text x="206" y="56" font-size="9" fill="#f3dc8c">駅前タワー</text>`);
    if (has("airport")) b.push(`<rect x="420" y="90" width="60" height="6" fill="#b0b8c0"/>${FX.icon("airport", 450, 66, 16)}<text x="420" y="86" font-size="9" fill="#cfd6d0">汐見空港</text>`);
    if (has("shinkansen")) b.push(`<path d="M0 100 H480" stroke="#8a97a5" stroke-width="3"/><rect x="60" y="90" width="90" height="12" rx="6" fill="#f0f0f0"/><rect x="62" y="92" width="40" height="8" rx="4" fill="#4a78c8"/><text x="60" y="84" font-size="9" fill="#f3dc8c">新幹線 汐見駅開業</text>`);
    // 進行中
    works.forEach((w, i) => b.push(`<g transform="translate(${30 + i * 50},${60})"><rect width="14" height="26" fill="#d4b04c" opacity=".8"/><path d="M14 4 H34" stroke="#d4b04c" stroke-width="2"/><text y="38" font-size="8" fill="#d4b04c">工事中</text></g>`));
    return `<svg viewBox="0 0 480 270" class="town" role="img" aria-label="${name}の街"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a44"/><stop offset="1" stop-color="#3b4f6a"/></linearGradient></defs>${b.join("")}</svg>`;
  };

  /* ---------- 号外 ---------- */
  FX.newspaper = function (headline, sub, date) {
    return `<div class="gougai" role="status">
      <div class="gougai-paper">
        <div class="gougai-head"><span>号外</span><b>日報新聞</b><span>${date}</span></div>
        <h2>${headline}</h2>
        <p>${sub || ""}</p>
        <div class="gougai-lines"><i></i><i></i><i></i><i></i></div>
      </div>
    </div>`;
  };

  /* ---------- 音 ---------- */
  let ctx = null;
  function ac() { if (!ctx) { const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return null; ctx = new AC(); } if (ctx.state === "suspended") ctx.resume(); return ctx; }
  function tone(freq, dur, type = "sine", gain = 0.08, when = 0) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + when); g.gain.linearRampToValueAtTime(gain, c.currentTime + when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + dur);
    o.connect(g); g.connect(c.destination); o.start(c.currentTime + when); o.stop(c.currentTime + when + dur + 0.05);
  }
  FX.sound = function (kind) {
    if (!FX.enabled) return;
    try {
      switch (kind) {
        case "click": tone(880, 0.05, "square", 0.03); break;
        case "ok": tone(660, 0.08, "triangle", 0.06); tone(990, 0.12, "triangle", 0.06, 0.08); break;
        case "bad": tone(220, 0.25, "sawtooth", 0.05); break;
        case "kakutei": tone(1046, 0.1, "square", 0.05); tone(1318, 0.1, "square", 0.05, 0.1); tone(1568, 0.25, "square", 0.05, 0.2); break;
        case "gougai": for (let i = 0; i < 6; i++) tone(1400 + (i % 2) * 300, 0.06, "square", 0.04, i * 0.08); break;
        case "tenka": [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, "triangle", 0.07, i * 0.18)); break;
        case "month": tone(440, 0.08, "sine", 0.04); tone(554, 0.12, "sine", 0.04, 0.09); break;
      }
    } catch (e) {}
  };
  let bgm = null;
  FX.bgm = function (on) {
    const c = ac(); if (!c) return;
    if (!on) { if (bgm) { bgm.g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.5); setTimeout(() => { try { bgm.o.forEach(o => o.stop()); } catch (e) {} bgm = null; }, 600); } return; }
    if (bgm) return;
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(0.035, c.currentTime + 2); g.connect(c.destination);
    const o = [110, 164.8, 220, 329.6].map((f, i) => { const osc = c.createOscillator(); osc.type = i % 2 ? "triangle" : "sine"; osc.frequency.value = f; const lfo = c.createOscillator(); const lg = c.createGain(); lfo.frequency.value = 0.05 + i * 0.02; lg.gain.value = 1.5; lfo.connect(lg); lg.connect(osc.frequency); lfo.start(); osc.connect(g); osc.start(); return osc; });
    bgm = { o, g };
  };
  FX.enabled = false;
})();
