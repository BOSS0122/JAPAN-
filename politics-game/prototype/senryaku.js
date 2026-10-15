// 『永田町への道 天下取り』戦略モードのゲーム本体
(() => {
  const D = window.SENRYAKU;
  const SAVE_KEY = "nagatacho-tenka-v1";
  const PREF = Object.fromEntries(D.prefs.map(p => [p.id, p]));
  const KYOWA = ["p", "ookouchi", "kiryu", "isurugi"];
  const AI_KYOWA = ["ookouchi", "kiryu", "isurugi"];
  const OPP = ["minsei", "kaikaku"];
  const ALL = [...KYOWA, ...OPP];
  const PR_SEATS = 176, TOTAL = 465, MAJORITY = 233;
  const WEST = ["kinki", "chugoku", "shikoku", "kyushu", "okinawa"];
  const EAST = ["hokkaido", "tohoku", "kanto", "chubu"];

  /* ---------- 小道具 ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sigmoid = x => 1 / (1 + Math.exp(-x));
  const weighted = (items, w) => {
    const total = items.reduce((t, it) => t + w(it), 0);
    let r = Math.random() * total;
    for (const it of items) { r -= w(it); if (r <= 0) return it; }
    return items[items.length - 1];
  };
  function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const man = v => `${Math.round(v).toLocaleString()}万円`;
  const dateOf = turn => { const m0 = D.start.month - 1 + turn; return { y: D.start.year + Math.floor(m0 / 12), m: (m0 % 12) + 1 }; };
  const dateStr = turn => { const d = dateOf(turn); return `${d.y}年${d.m}月`; };

  /* ---------- 似顔絵 ---------- */
  const SKIN = ["#f2d4b8", "#e9c29f", "#ddb08a", "#d09c76"];
  const HAIR_YOUNG = ["#1c1917", "#2a211c", "#3b2a20"];
  function portrait(seedStr, { gender = "m", age = 50, color = "#555", badge = true, size = 64 } = {}) {
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
      if (style === 0) hairBack = `<path d="M17 28 Q16 9 32 8 Q48 9 47 28 L47 40 Q44 44 40 41 L40 26 L24 26 L24 41 Q20 44 17 40 Z" fill="${gray}"/>`;
      else hairBack = `<path d="M18 26 Q17 8 32 8 Q47 8 46 26 L48 50 L16 50 Z" fill="${gray}"/>`;
      hairTop = `<path d="M19 24 Q21 10 32 10 Q44 10 45 24 Q38 16 30 17 Q24 18 19 24 Z" fill="${gray}"/>`;
    } else {
      const bald = age >= 64 && r() < 0.5;
      if (bald) hairTop = `<path d="M19 26 Q19 20 21 18 L21 26 Z M45 26 Q45 20 43 18 L43 26 Z" fill="${gray}"/>`;
      else if (style === 0) hairTop = `<path d="M19 25 Q18 10 32 10 Q46 10 45 25 Q42 16 32 16 Q22 16 19 25 Z" fill="${gray}"/>`;
      else if (style === 1) hairTop = `<path d="M19 26 Q18 9 33 10 Q47 11 45 26 Q44 17 36 15 Q30 18 22 18 Q20 21 19 26 Z" fill="${gray}"/>`;
      else hairTop = `<path d="M19 24 Q20 11 32 11 Q44 11 45 24 L43 19 Q32 13 21 19 Z" fill="${gray}"/>`;
    }
    const eyeY = 27 + r() * 1.5;
    const brow = gender === "f" ? 0.8 : 1.4;
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" class="portrait">
      <rect width="64" height="64" rx="8" fill="${color}" opacity=".35"/>
      <rect width="64" height="64" rx="8" fill="url(#pgrad)" opacity=".5"/>
      ${hairBack}
      <path d="M8 64 Q10 47 26 45 L38 45 Q54 47 56 64 Z" fill="${suit}"/>
      <path d="M27 45 L32 54 L37 45 Z" fill="#f4f1ea"/>
      ${gender === "m" ? `<path d="M31 47 L33 47 L34 58 L32 61 L30 58 Z" fill="${tie}"/>` : ""}
      <rect x="28" y="38" width="8" height="8" fill="${skin}"/>
      <ellipse cx="32" cy="${27 + faceH / 8}" rx="${faceW}" ry="${faceH}" fill="${skin}"/>
      ${hairTop}
      <path d="M${25 - brow} ${eyeY - 4} L${29} ${eyeY - 4.5} M${35} ${eyeY - 4.5} L${39 + brow} ${eyeY - 4}" stroke="#2a211c" stroke-width="${brow}" stroke-linecap="round"/>
      <ellipse cx="27" cy="${eyeY}" rx="1.4" ry="1.6" fill="#1c1917"/><ellipse cx="37" cy="${eyeY}" rx="1.4" ry="1.6" fill="#1c1917"/>
      ${glasses ? `<g fill="none" stroke="#1c1917" stroke-width=".9"><rect x="23" y="${eyeY - 3}" width="8" height="6" rx="2"/><rect x="33" y="${eyeY - 3}" width="8" height="6" rx="2"/><path d="M31 ${eyeY} L33 ${eyeY}"/></g>` : ""}
      <path d="M32 ${eyeY + 2} L31 ${eyeY + 6} L33 ${eyeY + 6}" stroke="#b07d5c" stroke-width=".8" fill="none"/>
      <path d="M28.5 ${eyeY + 9.5} Q32 ${eyeY + (age > 60 ? 9.5 : 11)} 35.5 ${eyeY + 9.5}" stroke="#8a4b3a" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      ${badge ? `<circle cx="22" cy="52" r="2.2" fill="#d4b04c" stroke="#7a5c18" stroke-width=".6"/>` : ""}
    </svg>`;
  }

  /* ---------- 状態 ---------- */
  let G = null;
  const ui = { sel: null, mode: "party", modal: null, queue: [], setup: { surname: "汐見", given: "健", gender: "m", type: "orator", home: null } };

  function newChar(fac, pref, extra = {}) {
    const id = "c" + (G.nextId++);
    const gender = Math.random() < 0.2 ? "f" : "m";
    const name = `${pick(D.surnames)} ${pick(gender === "f" ? D.givenF : D.givenM)}`;
    G.chars[id] = {
      id, name, gender, age: Math.round(rand(36, 74)), fac, pref,
      stats: { ben: Math.round(rand(30, 85)), sei: Math.round(rand(30, 85)), kou: Math.round(rand(30, 85)) },
      loyalty: Math.round(rand(45, 85)), terms: Math.max(1, Math.round(rand(1, 9))), ...extra,
    };
    return id;
  }

  function normalize(sup) {
    const t = sup.kyowa + sup.minsei + sup.kaikaku;
    for (const k of ["kyowa", "minsei", "kaikaku"]) sup[k] = clamp(sup[k] * 100 / t, 3, 94);
  }

  function newGame(setup) {
    const type = D.playerTypes.find(t => t.id === setup.type);
    G = {
      v: 1, turn: 0, nextId: 1, chars: {}, prefs: {}, pr: {}, log: [], tipsSeen: {},
      facs: {}, candidates: [], partyCooldown: 0, lowSupport: 0, monthsAsPM: 0, victoryShown: false,
      cabinet: { pm: "ookouchi", support: 44 }, kyowaLeader: "ookouchi",
      lastElection: 0, nextElection: 15 + Math.floor(rand(0, 10)), nextLeader: 8,
      player: {
        surname: setup.surname, given: setup.given, gender: setup.gender, type: type.id, typeName: type.name,
        stats: { ...type.stats }, money: type.money, fame: type.fame, risk: 0, home: setup.home,
        post: 0, terms: 1, ap: D.posts[0].ap, budget: D.posts[0].budget, debt: 0, seed: setup.surname + setup.given + Date.now(),
      },
      over: null,
    };
    for (const id of ALL) {
      const f = D.factions[id];
      G.facs[id] = { fame: f.fame || 0, risk: f.risk || 0, rel: 50, ally: false, known: false, neta: false };
    }
    G.facs.p.name = `${setup.surname}会`;

    for (const p of D.prefs) {
      const sup = { kyowa: 50 + rand(-4, 4), minsei: 29 + rand(-4, 4), kaikaku: 13 + rand(-3, 3) };
      if (p.pop > 500) { sup.kyowa -= 7; sup.minsei += 3; sup.kaikaku += 4; }
      if (p.pop < 130) { sup.kyowa += 8; sup.minsei -= 4; }
      if (["osaka", "hyogo", "kyoto"].includes(p.id)) { sup.kaikaku += 14; sup.kyowa -= 6; sup.minsei -= 8; }
      if (p.id === "okinawa") { sup.minsei += 12; sup.kyowa -= 10; }
      normalize(sup);
      const base = { ...sup };
      const governorFac = sup.kyowa > 45 ? "kyowa" : pick(["kyowa", "minsei", "kaikaku"]);
      const st = { sup, base, econ: Math.round(clamp(28 + p.pop / 18 + rand(-4, 4), 25, 95)), jiban: 0, works: [], districts: [], governor: null };
      G.prefs[p.id] = st;
      for (let i = 0; i < p.seats; i++) {
        const party = weighted(["kyowa", "minsei", "kaikaku"], k => Math.pow(sup[k], 2.4));
        const fac = party === "kyowa" ? weighted(AI_KYOWA, f => {
          const lean = D.factions[f].lean; let w = D.factions[f].weight;
          if (lean === "west" && WEST.includes(p.region)) w *= 1.6;
          if (lean === "east" && EAST.includes(p.region)) w *= 1.5;
          if (lean === "urban" && p.pop > 500) w *= 1.7;
          return w;
        }) : party;
        st.districts.push({ fac, char: newChar(fac, p.id) });
      }
      st.governor = newChar(governorFac, p.id, { role: "governor", age: Math.round(rand(50, 76)), rel: 50 });
    }

    // プレイヤーの選挙区と、最初の2人の仲間
    const home = G.prefs[setup.home];
    home.jiban = 25 + (type.jiban || 0);
    let own = home.districts.findIndex(d => KYOWA.includes(d.fac));
    if (own < 0) own = 0;
    G.chars.player = { id: "player", name: `${setup.surname} ${setup.given}`, gender: setup.gender, age: 41, fac: "p", pref: setup.home, stats: type.stats, loyalty: 100, terms: 1, isPlayer: true };
    home.districts[own] = { fac: "p", char: "player" };
    const near = D.prefs.filter(p => Math.abs(p.c - PREF[setup.home].c) + Math.abs(p.r - PREF[setup.home].r) <= 2)
      .sort((a, b) => (a.id === setup.home ? -1 : 0) - (b.id === setup.home ? -1 : 0));
    let added = 0;
    for (const p of near) {
      for (const d of G.prefs[p.id].districts) {
        if (added >= 2) break;
        if (AI_KYOWA.includes(d.fac)) { d.fac = "p"; G.chars[d.char].fac = "p"; G.chars[d.char].loyalty = 72; G.chars[d.char].terms = 1; added++; }
      }
    }
    allocatePR();
    G.pr.p = 0;
    log(`${dateStr(0)}、${G.player.surname}${G.player.given}は衆議院議員として永田町に入った。政策勉強会「${G.facs.p.name}」の仲間は3人。`, "big");
    log("目標は、仲間を20人に増やして総裁選に出ること。そして総理大臣になること。", "big");
    ui.sel = setup.home;
    save();
  }

  /* ---------- 集計 ---------- */
  function nationalSupport() {
    const tot = { kyowa: 0, minsei: 0, kaikaku: 0 }; let pop = 0;
    for (const p of D.prefs) { const s = G.prefs[p.id].sup; for (const k in tot) tot[k] += s[k] * p.pop; pop += p.pop; }
    for (const k in tot) tot[k] /= pop;
    return tot;
  }
  function districtCount(fac) { let n = 0; for (const p of D.prefs) for (const d of G.prefs[p.id].districts) if (d.fac === fac) n++; return n; }
  function seats(fac) { return districtCount(fac) + (G.pr[fac] || 0); }
  function partySeats(party) { return party === "kyowa" ? KYOWA.reduce((t, f) => t + seats(f), 0) : seats(party); }
  function allocatePR() {
    const ns = nationalSupport();
    const kyowaPR = Math.round(PR_SEATS * ns.kyowa / 100);
    const minseiPR = Math.round(PR_SEATS * ns.minsei / 100);
    G.pr.minsei = minseiPR; G.pr.kaikaku = PR_SEATS - kyowaPR - minseiPR;
    const dist = Object.fromEntries(KYOWA.map(f => [f, districtCount(f)]));
    const dsum = KYOWA.reduce((t, f) => t + dist[f], 0) || 1;
    let given = 0;
    for (const f of AI_KYOWA) { G.pr[f] = Math.floor(kyowaPR * dist[f] / dsum); given += G.pr[f]; }
    G.pr.p = Math.floor(kyowaPR * dist.p / dsum); given += G.pr.p;
    G.pr.ookouchi += kyowaPR - given;
  }
  function members() { const out = []; for (const p of D.prefs) for (const d of G.prefs[p.id].districts) if (d.fac === "p" && d.char !== "player") out.push(G.chars[d.char]); return out; }
  const post = () => D.posts[G.player.post];
  const facName = f => f === "p" ? G.facs.p.name : D.factions[f].name;
  const facColor = f => D.factions[f].color;
  const partyOf = f => D.factions[f].party;
  const leaderName = f => f === "p" ? `${G.player.surname} ${G.player.given}` : D.leaders[D.factions[f].leader].name;
  const isPM = () => G.cabinet.pm === "p";

  function log(text, kind = "") { G.log.unshift({ t: G.turn, text, kind }); G.log = G.log.slice(0, 80); }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) {} }
  function load() { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }

  /* ---------- コマンド ---------- */
  const CMDS = {
    yuzei: { name: "遊説", group: "地域", pref: true, cost: 20, tip: "yuzei", desc: "党の支持と知名度を上げる",
      run(pid) {
        const st = G.prefs[pid], b = G.player.stats.ben / 60;
        st.sup.kyowa += 1.4 * b; normalize(st.sup);
        st.jiban = clamp(st.jiban + (pid === G.player.home ? 4 : 3), 0, 100);
        G.player.fame = clamp(G.player.fame + (PREF[pid].pop > 300 ? 2 : 1) * b, 0, 100);
        return `${PREF[pid].name}で遊説。協和党の支持と地盤が上がった。`;
      } },
    kouenkai: { name: "後援会づくり", group: "地域", pref: true, cost: 80, tip: "kouenkai", desc: "地盤を大きく育てる",
      run(pid) { G.prefs[pid].jiban = clamp(G.prefs[pid].jiban + 9, 0, 100); return `${PREF[pid].name}に後援会の支部をつくった。地盤 +9。`; } },
    works: { name: "公共事業", group: "地域", pref: true, tip: "works", desc: "予算枠を使って事業を誘致する", modal: "works" },
    kigyou: { name: "企業回り", group: "資金", pref: true, tip: "kigyou", desc: "地元企業から政党支部へ献金を募る",
      run(pid) {
        const st = G.prefs[pid];
        const amt = Math.round((20 + st.econ * 1.5 + st.jiban) * G.player.stats.kou / 60);
        G.player.money += amt;
        return `${PREF[pid].name}の企業を回り、政党支部への献金 ${man(amt)} を集めた。`;
      } },
    youritsu: { name: "新人を擁立", group: "地域", pref: true, cost: 500, tip: "youritsu", desc: "野党の選挙区に仲間の新人を立てる",
      check(pid) {
        const open = G.prefs[pid].districts.filter(d => OPP.includes(d.fac)).length;
        const mine = G.candidates.filter(c => c.pref === pid).length;
        return open - mine > 0 ? null : "野党が持つ選挙区がない（すでに擁立済み）";
      },
      run(pid) {
        const id = newChar("p", pid, { candidate: true, terms: 0, age: Math.round(rand(32, 50)), loyalty: 85 });
        G.candidates.push({ pref: pid, char: id });
        G.prefs[pid].jiban = clamp(G.prefs[pid].jiban + 2, 0, 100);
        return `${PREF[pid].name}で新人の${G.chars[id].name}を擁立した。次の総選挙で野党の議席を狙う。`;
      } },
    party: { name: "資金パーティー", group: "資金", tip: "party", desc: "3か月に1回。知名度と仲間の数で稼げる",
      check() { return G.partyCooldown > 0 ? `あと${G.partyCooldown}か月は開けない` : null; },
      run() {
        const amt = Math.round(300 + G.player.fame * 10 + seats("p") * 30);
        G.player.money += amt; G.partyCooldown = 3;
        return `東京のホテルで政治資金パーティーを開き、${man(amt)} を集めた。`;
      } },
    bank: { name: "銀行", group: "資金", ap: 0, tip: "bank", desc: "選挙資金を借りる・返す", modal: "bank" },
    urakane: { name: "裏金づくり", group: "謀略", shady: true, tip: "urakane", desc: "帳簿に載らない資金。発覚リスク大",
      run() { G.player.money += 800; G.player.risk = clamp(G.player.risk + 14, 0, 100); return "パーティー収入の一部を帳簿から外し、800万円の裏金をつくった。"; } },
    mochidai: { name: "餅代を配る", group: "党内", tip: "mochidai", desc: "仲間1人50万円。忠誠を高める",
      check() { return members().length ? (G.player.money < members().length * 50 ? "資金が足りない" : null) : "仲間がいない"; },
      run() { const ms = members(); G.player.money -= ms.length * 50; ms.forEach(c => c.loyalty = clamp(c.loyalty + 15, 0, 100)); return `仲間${ms.length}人に餅代を配った（収支報告書に記載）。忠誠 +15。`; } },
    benkyoukai: { name: "勉強会", group: "党内", cost: 50, tip: "benkyoukai", desc: "知名度と仲間の忠誠を少し上げる",
      run() { G.player.fame = clamp(G.player.fame + 1, 0, 100); members().forEach(c => c.loyalty = clamp(c.loyalty + 5, 0, 100)); return `${G.facs.p.name}の勉強会を開いた。仲間の忠誠 +5、知名度 +1。`; } },
    doumei: { name: "派閥と同盟", group: "党内", cost: 300, tip: "doumei", desc: "次の総裁選で味方につける", modal: "faction",
      check() { return AI_KYOWA.some(f => !G.facs[f].ally) ? null : "すべての派閥と同盟済み"; } },
    chousa: { name: "身辺調査", group: "謀略", cost: 100, tip: "chousa", desc: "他派閥の弱みを探る", modal: "faction" },
    leak: { name: "週刊誌にリーク", group: "謀略", shady: true, tip: "leak", desc: "弱みを握った派閥に打撃", modal: "faction",
      check() { return ALL.some(f => f !== "p" && G.facs[f].neta) ? null : "身辺調査で弱みを握ってから"; } },
    kaisan: { name: "衆議院を解散", group: "党内", tip: "kaisan", desc: "総理だけが使える",
      check() { return isPM() ? (G.nextElection === G.turn + 1 ? "解散済み" : null) : "総理大臣でないと使えない"; },
      run() { G.nextElection = G.turn + 1; return "衆議院を解散した。来月、総選挙が行われる。"; } },
  };
  const GROUPS = ["地域", "資金", "党内", "謀略"];

  function cmdBlock(id, pid) {
    const c = CMDS[id];
    const ap = c.ap ?? 1;
    if (G.player.ap < ap) return "行動力がない";
    if (c.cost && G.player.money < c.cost) return "資金が足りない";
    if (c.check) return c.check(pid);
    return null;
  }

  function useCmd(id, pid, arg) {
    const c = CMDS[id];
    if (cmdBlock(id, pid)) return;
    if (c.tip && !G.tipsSeen[c.tip]) { G.tipsSeen[c.tip] = true; save(); openModal({ kind: "tip", tip: c.tip, title: c.name, then: () => useCmd(id, pid, arg) }); return; }
    if (c.modal && arg === undefined) { openModal({ kind: c.modal, cmd: id, pref: pid }); return; }
    if (!c.run) return;
    G.player.ap -= c.ap ?? 1;
    if (c.cost) G.player.money -= c.cost;
    const msg = c.run(pid, arg);
    if (msg) log(msg, c.shady ? "shady" : "mine");
    save(); render();
  }

  function startWorks(pid, wid, dango) {
    const w = D.works.find(x => x.id === wid);
    if (G.player.ap < 1 || G.player.budget < w.cost) return;
    G.player.ap -= 1; G.player.budget -= w.cost;
    G.prefs[pid].works.push({ id: wid, left: w.months, dango });
    G.prefs[pid].jiban = clamp(G.prefs[pid].jiban + 2, 0, 100);
    if (dango) {
      const kick = w.cost * 20;
      G.player.money += kick; G.player.risk = clamp(G.player.risk + Math.round(w.cost / 8), 0, 100);
      log(`${PREF[pid].name}の${w.name}（${w.cost}億円）を、決めた業者に落札させた。見返りに${man(kick)}。`, "shady");
    } else log(`${PREF[pid].name}に${w.name}（国費${w.cost}億円）を誘致した。完成まで${w.months}か月。`, "mine");
    closeModal(); save(); render();
  }

  function bankAction(kind, amount) {
    const limit = maxDebt();
    if (kind === "borrow") { if (G.player.debt + amount > limit) return; G.player.debt += amount; G.player.money += amount; log(`銀行から${man(amount)}を借り入れた（収支報告書に記載）。`, "mine"); }
    else { const a = Math.min(amount, G.player.debt, G.player.money); if (a <= 0) return; G.player.debt -= a; G.player.money -= a; log(`銀行に${man(a)}を返済した。`, "mine"); }
    save(); render();
  }
  const maxDebt = () => 3000 + Math.round(G.player.fame * 100) + seats("p") * 200;

  function factionAction(cmd, f) {
    const c = CMDS[cmd];
    if (G.player.ap < 1 || (c.cost && G.player.money < c.cost)) return;
    const fs = G.facs[f];
    if (cmd === "leak" && !fs.neta) return;
    G.player.ap -= 1; if (c.cost) G.player.money -= c.cost;
    if (cmd === "chousa") {
      fs.known = true;
      if (fs.risk >= 30) { fs.neta = true; log(`${facName(f)}の身辺を調べた。会計に不審な点が見つかった（発覚リスク ${Math.round(fs.risk)}）。`, "shady"); }
      else log(`${facName(f)}の身辺を調べたが、目立った弱みはなかった（発覚リスク ${Math.round(fs.risk)}）。`, "mine");
    } else if (cmd === "leak") {
      fs.neta = false; fs.fame = clamp(fs.fame - 12, 5, 100); fs.risk = clamp(fs.risk - 15, 0, 100); fs.rel = clamp(fs.rel - 20, 0, 100);
      G.player.risk = clamp(G.player.risk + 5, 0, 100);
      if (G.cabinet.pm === f) G.cabinet.support = clamp(G.cabinet.support - 6, 5, 80);
      log(`週刊真相が${facName(f)}の資金問題を報じた。情報源は明かされていない。`, "shady");
    } else if (cmd === "doumei") {
      const chance = clamp(25 + G.player.stats.kou / 2 + (fs.rel - 50) / 2 + (seats("p") - 10), 10, 85);
      if (Math.random() * 100 < chance) { fs.ally = true; fs.rel = clamp(fs.rel + 10, 0, 100); log(`${facName(f)}と、次の総裁選での協力を約束した。`, "mine"); }
      else { fs.rel = clamp(fs.rel - 5, 0, 100); log(`${facName(f)}に同盟を持ちかけたが、断られた。`, "mine"); }
    }
    closeModal(); save(); render();
  }

  function poach(charId, offer) {
    const ch = G.chars[charId];
    if (G.player.ap < 1 || G.player.money < offer) return;
    G.player.ap -= 1; G.player.money -= offer;
    const opp = OPP.includes(ch.fac);
    const chance = clamp(12 + G.player.stats.kou * 0.3 + offer / 40 + (60 - ch.loyalty) * 0.5 + seats("p") * 0.4 - (opp ? 20 : 0), 3, 85);
    const old = ch.fac;
    if (Math.random() * 100 < chance) {
      const d = G.prefs[ch.pref].districts.find(x => x.char === charId);
      if (d) d.fac = "p";
      ch.fac = "p"; ch.loyalty = 55;
      if (G.facs[old]) G.facs[old].rel = clamp(G.facs[old].rel - 10, 0, 100);
      log(`${facName(old)}の${ch.name}（${PREF[ch.pref].name}）が${G.facs.p.name}に加わった。${opp ? "離党して協和党に入党した。" : ""}`, "mine");
    } else {
      if (G.facs[old]) G.facs[old].rel = clamp(G.facs[old].rel - 4, 0, 100);
      log(`${ch.name}を誘ったが、断られた（成功率 ${Math.round(chance)}%）。`, "mine");
    }
    closeModal(); save(); render();
  }

  /* ---------- 月を終える ---------- */
  function endMonth() {
    if (G.over) return;
    const P = G.player;
    const report = [];

    // 公共事業の進行
    for (const p of D.prefs) {
      const st = G.prefs[p.id];
      for (const w of st.works) {
        w.left -= 1;
        if (w.left === 0) {
          const def = D.works.find(x => x.id === w.id), m = P.stats.sei / 60;
          st.econ = clamp(st.econ + def.econ, 0, 100); st.sup.kyowa += def.support * m; normalize(st.sup);
          st.jiban = clamp(st.jiban + def.jiban * m, 0, 100); P.fame = clamp(P.fame + 1, 0, 100);
          report.push(`${p.name}の${def.name}が完成した。地元は沸いた。`);
        }
      }
      st.works = st.works.filter(w => w.left > 0);
    }

    // 収入・利息
    const income = Math.round(20 + P.fame);
    const interest = Math.round(P.debt * 0.004);
    P.money += income - interest;
    report.push(`個人献金と党からの交付金で ${man(income)} の収入${interest ? `、借入金の利息 ${man(interest)}` : ""}。`);

    // 仲間の忠誠
    for (const c of members()) {
      c.loyalty = clamp(c.loyalty - 1.5 - (P.money < 0 ? 5 : 0), 0, 100);
      if (c.loyalty < 25 && Math.random() < 0.25) moveMember(c, pick(AI_KYOWA), report, "見切りをつけて");
    }

    // 他の勢力の動き
    for (const f of AI_KYOWA) {
      for (let i = 0; i < 2; i++) {
        const p = weighted(D.prefs, x => x.pop);
        G.prefs[p.id].sup.kyowa += 0.5; normalize(G.prefs[p.id].sup);
      }
      G.facs[f].risk = clamp(G.facs[f].risk + rand(0, 1.2), 0, 100);
      const weak = members().filter(c => c.loyalty < 45);
      if (weak.length && Math.random() < 0.3 * D.factions[f].weight * 2) {
        const c = pick(weak);
        if (Math.random() * 100 < 60 - c.loyalty) moveMember(c, f, report, "引き抜かれて");
      }
      if (Math.random() < 0.08) report.push(`${facName(f)}の${leaderName(f)}が${pick(D.prefs).name}で講演した。`);
    }
    for (const f of OPP) {
      const boost = G.cabinet.support < 35 ? 1.3 : 0.7;
      for (let i = 0; i < 2; i++) { const p = weighted(D.prefs, x => x.pop); G.prefs[p.id].sup[f] += boost; normalize(G.prefs[p.id].sup); }
      if (Math.random() < 0.1) report.push(`${D.factions[f].name}の${leaderName(f)}が政権を批判する街頭演説を行った。`);
    }

    // 内閣支持率と世論
    const cs = G.cabinet;
    cs.support = clamp(cs.support + (41 - cs.support) * 0.06 + rand(-1.6, 1.6), 5, 80);
    for (const p of D.prefs) {
      const st = G.prefs[p.id];
      for (const k of ["kyowa", "minsei", "kaikaku"]) st.sup[k] += (st.base[k] - st.sup[k]) * 0.05;
      st.sup.kyowa += (cs.support - 40) * 0.03; normalize(st.sup);
    }

    // スキャンダルの発覚
    if (Math.random() < P.risk / 400) {
      const before = P.risk;
      if (before >= 75) {
        G.over = { kind: "arrest", title: "逮捕", text: "東京地検特捜部が事務所に入った。帳簿に載らないお金の流れは、すべて押さえられていた。国会会期中のため逮捕許諾請求が出され、可決された。" };
      } else {
        P.fame = clamp(P.fame - 8, 0, 100); P.risk = clamp(P.risk - 25, 0, 100);
        G.prefs[P.home].jiban = clamp(G.prefs[P.home].jiban - 8, 0, 100);
        members().forEach(c => c.loyalty = clamp(c.loyalty - 10, 0, 100));
        if (isPM()) cs.support = clamp(cs.support - 8, 5, 80);
        report.push("週刊真相があなたの政治資金の問題を報じた。知名度と仲間の忠誠が下がった。");
        queueEvent({ kind: "scandal" });
      }
    }
    for (const f of [...AI_KYOWA, ...OPP]) {
      if (Math.random() < G.facs[f].risk / 700) {
        G.facs[f].fame = clamp(G.facs[f].fame - 8, 5, 100); G.facs[f].risk = clamp(G.facs[f].risk - 20, 0, 100);
        if (cs.pm === f) cs.support = clamp(cs.support - 5, 5, 80);
        report.push(`${facName(f)}の議員に政治資金の不記載が発覚した。`);
      }
    }

    // 月を進める
    G.turn += 1;
    const d = dateOf(G.turn);
    if (G.partyCooldown > 0) G.partyCooldown -= 1;
    if (d.m === 4) { P.budget = post().budget + (P.type === "policy" ? 50 : 0); report.push(`新年度の予算が成立した。公共事業の予算枠が ${P.budget}億円 になった。`); }
    P.ap = post().ap;
    if (isPM()) G.monthsAsPM += 1;

    // AIの首相による解散
    if (!isPM() && G.turn < G.nextElection - 1) {
      const since = G.turn - G.lastElection;
      if ((since >= 20 && cs.support >= 45 && Math.random() < 0.12) || since >= 46) {
        G.nextElection = G.turn + 1;
        report.push(`首相が衆議院を解散した。数日前まで「解散は考えていない」と語っていた。総選挙は来月。`);
      }
    }
    if (isPM() && G.turn - G.lastElection >= 47 && G.nextElection > G.turn + 1) {
      G.nextElection = G.turn + 1; report.push("衆議院の任期が満了する。来月、総選挙が行われる。");
    }

    // 退陣
    if (cs.support < 22) G.lowSupport += 1; else G.lowSupport = 0;
    if (G.lowSupport >= 2 && cs.pm === G.kyowaLeader) {
      if (isPM()) {
        G.over = { kind: "resign", title: "退陣", text: `内閣支持率は${Math.round(cs.support)}%まで落ちた。党内から退陣を求める声が噴き出し、あなたは総理の座を降りた。在任${G.monthsAsPM}か月。` };
      } else if (G.nextLeader > G.turn) {
        report.push(`支持率の低迷を受けて、${leaderName(cs.pm)}首相が退陣を表明した。総裁選が行われる。`);
        G.nextLeader = G.turn; G.lowSupport = 0;
      }
    }

    // 勝利
    if (isPM() && G.monthsAsPM >= 24 && !G.over) {
      G.over = { kind: "win", title: "長期政権", text: `あなたは総理大臣として${G.monthsAsPM}か月を務め上げた。18歳の夏に投票所の入場券をなくした若者は、この国の舵を握った。それが良い政治だったかどうかは、歴史が決める。` };
    }

    report.forEach(t => log(t));
    queueEvent({ kind: "report", turn: G.turn - 1, lines: report });
    if (!G.over) {
      if (G.turn >= G.nextElection) queueEvent({ kind: "election" });
      else if (G.turn >= G.nextLeader) queueEvent({ kind: "leaderAsk" });
      else maybeRandomEvent();
    }
    if (G.over) queueEvent({ kind: "over" });
    save(); render(); nextModal();
  }

  function moveMember(c, to, report, why) {
    const d = G.prefs[c.pref].districts.find(x => x.char === c.id);
    if (d) d.fac = to;
    c.fac = to; c.loyalty = 60;
    report.push(`仲間の${c.name}（${PREF[c.pref].name}）が${why}${facName(to)}へ移った。`);
  }

  function maybeRandomEvent() {
    const hasWorks = D.prefs.some(p => G.prefs[p.id].works.length);
    const pool = D.events.filter(e => (!e.needs.works || hasWorks) && Math.random() < e.chance);
    if (!pool.length) return;
    const e = pick(pool);
    let pref = e.needs.works ? pick(D.prefs.filter(p => G.prefs[p.id].works.length)) : weighted(D.prefs, x => x.pop);
    if (e.id === "gouu" && Math.random() < 0.4) pref = PREF[G.player.home];
    queueEvent({ kind: "event", id: e.id, pref: pref.id });
  }

  function applyEventChoice(ev, choice) {
    const P = G.player, st = G.prefs[ev.pref];
    const e = choice.effects;
    if (e.money) P.money += e.money;
    if (e.fame) P.fame = clamp(P.fame + e.fame, 0, 100);
    if (e.risk) P.risk = clamp(P.risk + e.risk, 0, 100);
    if (e.budget) P.budget += e.budget;
    if (e.cabinet) G.cabinet.support = clamp(G.cabinet.support + e.cabinet, 5, 80);
    if (e.prefKyowa) { st.sup.kyowa += e.prefKyowa; normalize(st.sup); }
    if (e.prefJiban) st.jiban = clamp(st.jiban + e.prefJiban, 0, 100);
    if (e.factionRel) G.facs[G.cabinet.pm === "p" ? "ookouchi" : G.cabinet.pm].rel = clamp(G.facs[G.cabinet.pm === "p" ? "ookouchi" : G.cabinet.pm].rel + e.factionRel, 0, 100);
    log(choice.result, e.risk ? "shady" : "mine");
    save();
  }

  /* ---------- 総選挙 ---------- */
  function runElection() {
    const snapshot = JSON.stringify(G);
    const P = G.player, cs = G.cabinet;
    const before = Object.fromEntries(ALL.map(f => [f, seats(f)]));
    let own = null;
    for (const p of D.prefs) {
      const st = G.prefs[p.id];
      const myCands = G.candidates.filter(c => c.pref === p.id);
      st.districts.forEach((d, i) => {
        const incKyowa = KYOWA.includes(d.fac);
        let kNom, kChar;
        if (incKyowa) { kNom = d.fac; kChar = d.char; }
        else if (myCands.length) { const c = myCands.shift(); kNom = "p"; kChar = c.char; }
        else { kNom = weighted(AI_KYOWA, f => D.factions[f].weight); kChar = null; }
        const oNom = OPP.includes(d.fac) ? d.fac : (st.sup.minsei >= st.sup.kaikaku ? "minsei" : "kaikaku");
        let x = (st.sup.kyowa - st.sup[oNom]) / 14 + (cs.support - 40) / 30 + (incKyowa ? 0.25 : -0.25);
        if (kNom === "p") x += st.jiban / 30 + P.fame / 80 + (P.stats.ben - 50) / 100;
        if (kChar === "player") x += st.jiban / 25 + P.fame / 50;
        const pWin = sigmoid(x);
        const win = Math.random() < pWin;
        if (kChar === "player") own = { win, pWin, pref: p.id };
        if (win) {
          d.fac = kNom; d.char = kChar || newChar(kNom, p.id, { terms: 0 });
          if (d.char !== "player") { G.chars[d.char].terms += 1; G.chars[d.char].candidate = false; }
        } else {
          if (!OPP.includes(d.fac)) d.char = newChar(oNom, p.id, { terms: 0 });
          d.fac = oNom;
        }
      });
    }
    G.candidates = [];
    allocatePR();
    let revived = false;
    if (own && !own.win) {
      if (own.pWin > 0.3) { revived = true; G.pr.p += 1; G.pr.ookouchi = Math.max(0, G.pr.ookouchi - 1); }
      else {
        const was = JSON.parse(snapshot);
        G.over = { kind: "lose", title: "落選", text: `${PREF[own.pref].name}の選挙区で敗れ、比例でも復活できなかった。「猿は木から落ちても猿だが、代議士は選挙に落ちればただの人」。`, retry: was };
      }
    }
    if (!G.over) P.terms += 1;
    const after = Object.fromEntries(ALL.map(f => [f, seats(f)]));
    const kyowa = partySeats("kyowa");
    let change = "";
    if (kyowa < MAJORITY) {
      if (G.cabinet.pm !== "minsei") change = "協和党は過半数を割り、政権を失った。民生連合と改革の会の連立政権が誕生する。";
      G.cabinet.pm = "minsei"; G.cabinet.support = 48; P.post = 0;
    } else {
      if (G.cabinet.pm === "minsei") change = "協和党が過半数を取り戻し、政権に復帰した。";
      G.cabinet.pm = G.kyowaLeader;
    }
    G.lastElection = G.turn;
    G.nextElection = G.turn + 36 + Math.floor(rand(0, 12));
    if (G.nextElection - G.turn > 48) G.nextElection = G.turn + 48;
    becamePM();
    log(`第${51 + Math.floor(G.turn / 40)}回衆議院議員総選挙。協和党 ${kyowa}議席、民生連合 ${seats("minsei")}議席、改革の会 ${seats("kaikaku")}議席。${G.facs.p.name}は ${after.p}人（${after.p - before.p >= 0 ? "+" : ""}${after.p - before.p}）。`, "big");
    if (change) log(change, "big");
    if (!G.over) assignPost();
    save();
    return { before, after, kyowa, own, revived, change };
  }

  /* ---------- 総裁選 ---------- */
  function runLeader(playerRuns) {
    const kyowaSeats = Object.fromEntries(KYOWA.map(f => [f, seats(f)]));
    let cands = AI_KYOWA.filter(f => kyowaSeats[f] >= 20 && !G.facs[f].ally && (f === G.kyowaLeader || Math.random() < 0.65));
    if (playerRuns) cands.push("p");
    if (!cands.length) cands = [G.kyowaLeader === "p" ? "ookouchi" : G.kyowaLeader];
    if (cands.length === 1 && !playerRuns) {
      const w = cands[0];
      log(`協和党総裁選は${leaderName(w)}の無投票再選となった。`, "big");
      finishLeader(w);
      return { cands, rounds: [], winner: w, uncontested: true };
    }
    const backs = {};
    for (const f of KYOWA) {
      if (cands.includes(f)) backs[f] = f;
      else if (f !== "p" && G.facs[f].ally && cands.includes("p")) backs[f] = "p";
      else backs[f] = cands.filter(c => c !== "p").sort((a, b) => kyowaSeats[b] - kyowaSeats[a])[0] || cands[0];
    }
    const giin = Object.fromEntries(cands.map(c => [c, 0]));
    for (const f of KYOWA) {
      if (f === "p") {
        const ms = members(); let loyal = 1;
        for (const c of ms) { if (c.loyalty >= 35 || Math.random() < 0.5) loyal++; else giin[pick(cands)] += 1; }
        giin[backs.p] += loyal + (G.pr.p || 0);
      } else giin[backs[f]] += kyowaSeats[f];
    }
    const fameOf = c => c === "p" ? G.player.fame : G.facs[c].fame;
    const totalGiin = Object.values(giin).reduce((a, b) => a + b, 0);
    const famePow = cands.map(c => Math.pow(fameOf(c), 1.6) * rand(0.85, 1.15));
    const fsum = famePow.reduce((a, b) => a + b, 0);
    const tou = Object.fromEntries(cands.map((c, i) => [c, Math.round(totalGiin * famePow[i] / fsum)]));
    const r1 = cands.map(c => ({ c, giin: giin[c], tou: tou[c], total: giin[c] + tou[c] })).sort((a, b) => b.total - a.total);
    const all1 = r1.reduce((t, r) => t + r.total, 0);
    let winner, rounds = [r1];
    if (r1[0].total > all1 / 2) winner = r1[0].c;
    else {
      const top = r1.slice(0, 2).map(r => r.c);
      const g2 = Object.fromEntries(top.map(c => [c, 0]));
      for (const c of cands) {
        const v = giin[c];
        if (top.includes(c)) g2[c] += v;
        else g2[(c !== "p" && G.facs[c] && G.facs[c].ally && top.includes("p")) ? "p" : top.sort((a, b) => giin[b] - giin[a])[0]] += v;
      }
      const pref2 = Object.fromEntries(top.map(c => [c, 0]));
      for (let i = 0; i < 47; i++) pref2[Math.random() < fameOf(top[0]) / (fameOf(top[0]) + fameOf(top[1])) ? top[0] : top[1]] += 1;
      const r2 = top.map(c => ({ c, giin: g2[c], tou: pref2[c], total: g2[c] + pref2[c] })).sort((a, b) => b.total - a.total);
      rounds.push(r2);
      winner = r2[0].c;
    }
    log(`協和党総裁選。${leaderName(winner)}（${facName(winner)}）が新総裁に選ばれた。`, "big");
    finishLeader(winner);
    return { cands, rounds, winner };
  }

  function becamePM() {
    if (G.cabinet.pm === "p" && !G.victoryShown) { G.victoryShown = true; queueEvent({ kind: "tenka" }); log(`${G.player.surname}${G.player.given}、内閣総理大臣に指名される。`, "big"); }
  }
  function finishLeader(w) {
    G.kyowaLeader = w;
    if (G.cabinet.pm !== "minsei") G.cabinet.pm = w;
    becamePM();
    G.cabinet.support = clamp(G.cabinet.support + 10, 5, 80);
    G.nextLeader = G.turn + 36;
    for (const f of AI_KYOWA) G.facs[f].ally = false;
    assignPost();
  }

  function assignPost() {
    const P = G.player, n = seats("p");
    if (G.cabinet.pm === "p") { P.post = 4; }
    else if (G.cabinet.pm === "minsei") { P.post = 0; }
    else {
      let lv = n >= 15 ? 3 : n >= 8 ? 2 : n >= 4 ? 1 : 0;
      if (G.facs[G.cabinet.pm] && G.facs[G.cabinet.pm].rel >= 60) lv += 1;
      if (lv >= 3 && P.terms < 3) lv = 2;
      P.post = clamp(lv, 0, 3);
    }
    const nb = post().budget;
    if (P.budget < nb) P.budget = nb;
    P.ap = Math.max(P.ap, 0);
    log(`あなたの役職：${post().name}。`, "mine");
  }

  /* ---------- モーダル ---------- */
  function queueEvent(ev) { ui.queue.push(ev); }
  function nextModal() { if (ui.modal) return; const ev = ui.queue.shift(); if (ev) openModal(ev); }
  function openModal(m) { ui.modal = m; render(); document.querySelector(".modal-card")?.focus(); }
  function closeModal() { ui.modal = null; render(); setTimeout(nextModal, 0); }

  /* ---------- 描画 ---------- */
  const TILE = 44, GAP = 4;
  function prefColor(pid) {
    const st = G.prefs[pid];
    if (ui.mode === "jiban") return { fill: facColor("p"), op: 0.12 + st.jiban / 100 * 0.88 };
    const count = {};
    for (const d of st.districts) { const k = ui.mode === "party" ? partyOf(d.fac) : d.fac; count[k] = (count[k] || 0) + 1; }
    if (ui.mode === "faction") {
      const k = Object.keys(count).filter(k => KYOWA.includes(k)).sort((a, b) => count[b] - count[a])[0];
      if (!k) return { fill: "#3a4252", op: 0.6 };
      return { fill: facColor(k), op: 0.45 + 0.55 * count[k] / st.districts.length };
    }
    const k = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    return { fill: D.parties[k].color, op: 0.4 + 0.6 * count[k] / st.districts.length };
  }

  function mapSVG({ choose = false } = {}) {
    const W = 13 * (TILE + GAP), H = 12 * (TILE + GAP);
    const tiles = D.prefs.map(p => {
      const x = p.c * (TILE + GAP), y = p.r * (TILE + GAP);
      const sel = (choose ? ui.setup.home : ui.sel) === p.id;
      let fill = "#2a3242", op = 1, bar = "";
      if (!choose) {
        const c = prefColor(p.id); fill = c.fill; op = c.op;
        const st = G.prefs[p.id], n = st.districts.length;
        let bx = x + 4;
        const bw = TILE - 8;
        const order = ui.mode === "party" ? ["kyowa", "minsei", "kaikaku"] : ALL;
        for (const k of order) {
          const cnt = st.districts.filter(d => (ui.mode === "party" ? partyOf(d.fac) : d.fac) === k).length;
          if (!cnt) continue;
          const w = bw * cnt / n;
          bar += `<rect x="${bx}" y="${y + TILE - 7}" width="${w}" height="3" fill="${ui.mode === "party" ? D.parties[k].color : facColor(k)}"/>`;
          bx += w;
        }
        if (st.works.length) bar += `<rect x="${x + 4}" y="${y + 4}" width="7" height="7" rx="1" fill="#d4b04c"/>`;
      }
      const home = !choose && G.player.home === p.id;
      const fs = p.short.length >= 3 ? 10 : 12;
      return `<g class="tile${sel ? " sel" : ""}" data-pref="${p.id}" tabindex="0" role="button" aria-label="${p.name}">
        <rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="6" fill="${fill}" fill-opacity="${op}" class="tile-bg"/>
        <rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="6" fill="none" class="tile-edge"/>
        ${bar}
        ${home ? `<circle cx="${x + TILE - 7}" cy="${y + 7}" r="3.5" fill="#d4b04c" stroke="#1a1f29" stroke-width="1"/>` : ""}
        <text x="${x + TILE / 2}" y="${y + TILE / 2 + 2}" font-size="${fs}" text-anchor="middle" class="tile-label">${p.short}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="-4 -4 ${W + 4} ${H + 4}" class="map" role="group" aria-label="日本地図">
      <defs><linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>
      <text x="${W - 4}" y="${H - 6}" text-anchor="end" class="map-note">一枚が一つの都道府県。下の帯は小選挙区の内訳</text>
      ${tiles}</svg>`;
  }

  function header() {
    const P = G.player, ns = nationalSupport();
    const dots = Array.from({ length: post().ap }, (_, i) => `<span class="ap${i < P.ap ? " on" : ""}"></span>`).join("");
    const nl = dateOf(G.nextLeader);
    const nextEv = G.nextElection - G.turn <= 1 ? "来月 総選挙" : `総裁選 ${nl.y}.${nl.m}`;
    return `<header class="hud">
      <div class="hud-row">
        <div class="hud-date"><b>${dateStr(G.turn)}</b><span>${esc(post().name)}・当選${P.terms}回</span></div>
        <div class="hud-ap" aria-label="行動力 ${P.ap}">${dots}<small>行動力</small></div>
        <button class="end" type="button" data-act="end">月を終える</button>
      </div>
      <div class="hud-stats">
        <div><span>資金</span><b class="${P.money < 0 ? "neg" : ""}">${Math.round(P.money).toLocaleString()}<small>万円</small></b></div>
        <div><span>借入</span><b>${P.debt.toLocaleString()}<small>万円</small></b></div>
        <div><span>予算枠</span><b>${P.budget}<small>億円</small></b></div>
        <div><span>知名度</span><b>${Math.round(P.fame)}</b></div>
        <div><span>${esc(G.facs.p.name)}</span><b>${seats("p")}<small>人</small></b></div>
        <div><span>発覚リスク</span><b class="${P.risk >= 50 ? "neg" : ""}">${Math.round(P.risk)}</b></div>
        <div><span>内閣支持率</span><b>${Math.round(G.cabinet.support)}<small>%</small></b></div>
        <div><span>次の山場</span><b class="small">${nextEv}</b></div>
      </div>
    </header>`;
  }

  function powerBar() {
    const parts = [...KYOWA, ...OPP].map(f => ({ f, n: seats(f) }));
    const segs = parts.map(({ f, n }) => `<span style="flex:${n};background:${facColor(f)}" title="${esc(facName(f))} ${n}"></span>`).join("");
    const legend = parts.map(({ f, n }) => `<li><i style="background:${facColor(f)}"></i>${esc(facName(f))}<b>${n}</b></li>`).join("");
    return `<section class="power">
      <div class="power-head"><h2>衆議院の勢力</h2><span>定数${TOTAL}・過半数${MAJORITY}　協和党 <b>${partySeats("kyowa")}</b></span></div>
      <div class="power-bar">${segs}<em style="left:${MAJORITY / TOTAL * 100}%"></em></div>
      <ul class="legend">${legend}</ul>
    </section>`;
  }

  function prefPanel() {
    const pid = ui.sel, p = PREF[pid], st = G.prefs[pid], reg = D.regions[p.region];
    const gov = G.chars[st.governor];
    const comps = D.companies.filter(c => c.pref === pid || (c.pref === "home" && pid === G.player.home));
    const sup = ["kyowa", "minsei", "kaikaku"].map(k => `<div class="sup"><span>${D.parties[k].short}</span><div class="sup-bar"><i style="width:${st.sup[k]}%;background:${D.parties[k].color}"></i></div><b>${Math.round(st.sup[k])}%</b></div>`).join("");
    const people = st.districts.map((d, i) => {
      const c = G.chars[d.char];
      const you = d.char === "player";
      return `<button type="button" class="person${you ? " you" : ""}" data-char="${d.char}">
        ${portrait(you ? G.player.seed : c.id, { gender: c.gender, age: c.age, color: facColor(d.fac), size: 40 })}
        <span class="person-text"><b>${p.seats > 1 ? `${i + 1}区 ` : ""}${esc(you ? c.name + "（あなた）" : c.name)}</b><small><i style="background:${facColor(d.fac)}"></i>${esc(facName(d.fac))}</small></span>
      </button>`;
    }).join("");
    const cands = G.candidates.filter(c => c.pref === pid).map(c => esc(G.chars[c.char].name)).join("、");
    const works = st.works.map(w => { const def = D.works.find(x => x.id === w.id); return `<li>${esc(def.name)}<span>あと${w.left}か月${w.dango ? "・談合" : ""}</span></li>`; }).join("");
    return `<section class="pref">
      <div class="pref-head">
        <div><span class="eyebrow">${esc(reg.name)}地方</span><h2>${esc(p.name)}</h2></div>
        ${pid === G.player.home ? `<span class="chip gold">地元</span>` : ""}
      </div>
      <dl class="facts">
        <div><dt>人口</dt><dd>${p.pop}<small>万人</small></dd></div>
        <div><dt>小選挙区</dt><dd>${p.seats}</dd></div>
        <div><dt>経済力</dt><dd>${Math.round(st.econ)}</dd></div>
        <div><dt>あなたの地盤</dt><dd>${Math.round(st.jiban)}</dd></div>
      </dl>
      <div class="sups">${sup}</div>
      <div class="governor">
        ${portrait(gov.id, { gender: gov.gender, age: gov.age, color: D.parties[gov.fac].color, badge: false, size: 44 })}
        <div><small>知事</small><b>${esc(gov.name)}</b><small>${esc(D.parties[gov.fac].name)}系</small></div>
        <div class="assets"><small>地銀</small><b>${esc(reg.bank)}</b><small>主な産業：${esc(p.industry)}</small></div>
      </div>
      ${comps.length ? `<p class="comps"><small>主な企業</small> ${comps.map(c => `${esc(c.name)}<span>（${esc(c.sector)}）</span>`).join("、")}</p>` : ""}
      ${works ? `<ul class="works"><li class="h">公共事業</li>${works}</ul>` : ""}
      ${cands ? `<p class="cands">擁立予定：${cands}</p>` : ""}
      <h3>選挙区の議員</h3>
      <div class="people">${people}</div>
    </section>`;
  }

  function commands() {
    const pid = ui.sel;
    return `<section class="cmds">
      ${GROUPS.map(g => `<div class="cmd-group"><h3>${g}${g === "地域" ? `<small>（${esc(PREF[pid].name)}）</small>` : ""}</h3><div class="cmd-grid">
        ${Object.entries(CMDS).filter(([, c]) => c.group === g).map(([id, c]) => {
          const why = cmdBlock(id, pid);
          const cost = [c.ap === 0 ? "行動力0" : "", c.cost ? man(c.cost) : ""].filter(Boolean).join("・");
          return `<button type="button" class="cmd${c.shady ? " shady" : ""}" data-cmd="${id}" ${why ? "disabled" : ""}>
            <b>${esc(c.name)}${c.shady ? `<em>裏</em>` : ""}</b><small>${esc(why || c.desc)}</small>${cost ? `<span>${cost}</span>` : ""}
          </button>`;
        }).join("")}</div></div>`).join("")}
    </section>`;
  }

  function logPanel() {
    const items = G.log.slice(0, 14).map(l => `<li class="${l.kind}"><time>${dateStr(l.t)}</time>${esc(l.text)}</li>`).join("");
    return `<section class="log"><h2>情勢</h2><ul>${items}</ul></section>`;
  }

  function renderGame() {
    const modes = [["party", "政党"], ["faction", "派閥"], ["jiban", "地盤"]].map(([m, l]) => `<button type="button" class="seg${ui.mode === m ? " on" : ""}" data-mode="${m}">${l}</button>`).join("");
    return `${header()}
      <main class="board">
        <div class="col-map">
          <div class="map-head"><h2>日本</h2><div class="segs" role="group" aria-label="地図の色分け">${modes}</div></div>
          <div class="map-box">${mapSVG()}</div>
          ${powerBar()}
          ${logPanel()}
        </div>
        <div class="col-side">
          ${prefPanel()}
          ${commands()}
        </div>
      </main>
      ${ui.modal ? renderModal() : ""}`;
  }

  /* ---------- 開始画面 ---------- */
  function renderSetup() {
    const s = ui.setup;
    const types = D.playerTypes.map(t => `<button type="button" class="type${s.type === t.id ? " on" : ""}" data-type="${t.id}" aria-pressed="${s.type === t.id}">
      <b>${t.name}</b><small>${t.desc}</small><span>弁舌${t.stats.ben}・政策${t.stats.sei}・交渉${t.stats.kou}・資金${t.money}万円</span></button>`).join("");
    const saved = load();
    return `<div class="setup">
      <header class="title">
        <span class="eyebrow">永田町への道</span>
        <h1>天下取り</h1>
        <p>1年生の衆議院議員として、仲間を集め、派閥を育て、総理大臣を目指す。日本全国を舞台にした政治戦略ゲーム。</p>
        <div class="row">
          ${saved && !saved.over ? `<button class="primary" type="button" data-act="continue">つづきから（${dateStr(saved.turn)}）</button>` : ""}
          <a class="ghost" href="monogatari.html">物語モードで政治のルールを学ぶ</a>
        </div>
      </header>
      <section class="setup-grid">
        <div class="setup-col">
          <h2>あなた</h2>
          <div class="who">
            ${portrait(s.surname + s.given + s.gender, { gender: s.gender, age: 41, color: "#e0679c", size: 96 })}
            <div class="who-fields">
              <label for="sn">姓</label><input id="sn" value="${esc(s.surname)}" maxlength="6" data-field="surname">
              <label for="gn">名</label><input id="gn" value="${esc(s.given)}" maxlength="6" data-field="given">
              <div class="segs" role="group" aria-label="似顔絵"><button type="button" class="seg${s.gender === "m" ? " on" : ""}" data-gender="m">男性</button><button type="button" class="seg${s.gender === "f" ? " on" : ""}" data-gender="f">女性</button></div>
            </div>
          </div>
          <h2>タイプ</h2>
          <div class="types">${types}</div>
        </div>
        <div class="setup-col">
          <h2>地元の選挙区 <small>${s.home ? esc(PREF[s.home].name) : "地図から選ぶ"}</small></h2>
          <div class="map-box">${mapSVG({ choose: true })}</div>
          <button class="primary" type="button" data-act="start" ${s.home ? "" : "disabled"}>${s.home ? `${esc(PREF[s.home].name)}から始める` : "地元を選んでください"}</button>
        </div>
      </section>
    </div>`;
  }

  /* ---------- モーダルの中身 ---------- */
  function mentorBox(text) {
    return `<div class="speaker">${portrait("mentor-hayase", { gender: "f", age: 63, color: "#d4b04c", badge: false, size: 56 })}<div><b>${esc(D.mentor.name)}</b><small>${esc(D.mentor.title)}</small><p>${esc(text)}</p></div></div>`;
  }

  function renderModal() {
    const m = ui.modal;
    let body = "";
    if (m.kind === "intro") {
      body = `<span class="eyebrow">${dateStr(G.turn)}　衆議院第一議員会館</span><h2>ようこそ永田町へ</h2>
        ${mentorBox(`先生、当選おめでとう。でも、1年生議員はただの「陣笠」。採決の数のひとつでしかないの。この国を動かしたいなら、総理になるしかない。`)}
        ${mentorBox(`まずは仲間を増やすこと。総裁選に出るには、国会議員の推薦人が20人いる。いまの${G.facs.p.name}は${seats("p")}人。野党の選挙区に新人を立てるか、ほかの派閥から引き抜くか。どちらにもお金がいるわ。`)}
        ${mentorBox("毎月使える行動力には限りがある。地図で都道府県を選んで、遊説や公共事業で地盤を固めて。裏のやり方は早いけど、帳簿を知っている人の数だけ爆弾が増えるのを忘れないで。")}
        <button class="primary" type="button" data-act="close">始める</button>`;
    } else if (m.kind === "tenka") {
      body = `<div class="tenka">${portrait(G.player.seed, { gender: G.player.gender, age: 41 + Math.floor(G.turn / 12), color: "#d4b04c", size: 128 })}
        <span class="eyebrow">${dateStr(G.turn)}　衆議院本会議場</span><h2>内閣総理大臣 ${esc(G.player.surname)} ${esc(G.player.given)}</h2>
        <p>首相指名選挙で過半数の票を得て、あなたは内閣総理大臣に指名された。永田町の頂点に立った。</p></div>
        ${mentorBox("おめでとう、総理。でも、ここからが本番よ。支持率が20%を切れば党内から引きずり下ろされる。2年、政権を保ってみせて。解散のタイミングは、あなたが決めるの。")}
        <button class="primary" type="button" data-act="close">組閣に向かう</button>`;
    } else if (m.kind === "tip") {
      const t = D.tips[m.tip];
      body = `<h2>${esc(m.title)}</h2>
        ${mentorBox(t.ura.replace(/^「|」$/g, ""))}
        <div class="omote"><span>表　制度では</span><p>${esc(t.omote)}</p></div>
        <p class="law"><b>根拠</b>${esc(t.law)}</p>
        <button class="primary" type="button" data-act="tip-ok">わかった</button>`;
    } else if (m.kind === "works") {
      const rows = D.works.map(w => {
        const ok = G.player.budget >= w.cost;
        return `<div class="work${ok ? "" : " off"}"><div><b>${esc(w.name)}</b><small>国費${w.cost}億円・${w.months}か月　経済+${w.econ}・支持+${w.support}・地盤+${w.jiban}</small></div>
          <div class="row"><button type="button" class="ghost" data-works="${w.id}" data-dango="0" ${ok ? "" : "disabled"}>公正な入札で発注</button><button type="button" class="ghost shady" data-works="${w.id}" data-dango="1" ${ok ? "" : "disabled"}>業者に落札させる<em>裏</em></button></div></div>`;
      }).join("");
      body = `<h2>${esc(PREF[m.pref].name)}に公共事業を誘致</h2><p class="muted">予算枠 残り${G.player.budget}億円。業者に落札させると、事業費の2%が見返りとして入るが、発覚リスクが上がる。</p><div class="works-list">${rows}</div><button class="ghost" type="button" data-act="close">やめる</button>`;
    } else if (m.kind === "bank") {
      const reg = D.regions[PREF[m.pref].region];
      const limit = maxDebt();
      body = `<h2>銀行</h2>
        <p class="muted">${esc(reg.bank)}（${esc(PREF[m.pref].name)}）または${esc(D.megabanks[0])}から借りられる。借入の上限は知名度と仲間の数で決まる。利息は月0.4%。</p>
        <dl class="facts"><div><dt>借入残高</dt><dd>${G.player.debt.toLocaleString()}<small>万円</small></dd></div><div><dt>上限</dt><dd>${limit.toLocaleString()}<small>万円</small></dd></div><div><dt>資金</dt><dd>${Math.round(G.player.money).toLocaleString()}<small>万円</small></dd></div></dl>
        <div class="row">
          <button class="ghost" type="button" data-bank="borrow" data-amt="1000" ${G.player.debt + 1000 > limit ? "disabled" : ""}>1,000万円借りる</button>
          <button class="ghost" type="button" data-bank="borrow" data-amt="3000" ${G.player.debt + 3000 > limit ? "disabled" : ""}>3,000万円借りる</button>
          <button class="ghost" type="button" data-bank="repay" data-amt="1000" ${G.player.debt <= 0 || G.player.money <= 0 ? "disabled" : ""}>1,000万円返す</button>
        </div>
        <button class="primary" type="button" data-act="close">閉じる</button>`;
    } else if (m.kind === "faction") {
      const c = CMDS[m.cmd];
      const rows = [...AI_KYOWA, ...(m.cmd === "doumei" ? [] : OPP)].map(f => {
        const fs = G.facs[f], L = D.leaders[D.factions[f].leader];
        const disabled = (m.cmd === "leak" && !fs.neta) || (m.cmd === "doumei" && fs.ally);
        const info = [`${seats(f)}人`, `関係 ${Math.round(fs.rel)}`, fs.known ? `発覚リスク ${Math.round(fs.risk)}` : "", fs.neta ? "弱みあり" : "", fs.ally ? "同盟中" : ""].filter(Boolean).join("・");
        return `<button type="button" class="fac-row" data-fac="${f}" ${disabled ? "disabled" : ""}>
          ${portrait(f, { gender: L.gender, age: L.age, color: facColor(f), size: 48 })}
          <span><b>${esc(facName(f))}</b><small>${esc(L.name)}　${info}</small></span></button>`;
      }).join("");
      body = `<h2>${esc(c.name)}</h2><p class="muted">${esc(c.desc)}${c.cost ? `　費用 ${man(c.cost)}` : ""}</p><div class="fac-list">${rows}</div><button class="ghost" type="button" data-act="close">やめる</button>`;
    } else if (m.kind === "char") {
      const ch = G.chars[m.char], isMe = m.char === "player";
      const st = isMe ? G.player.stats : ch.stats;
      const canPoach = !isMe && ch.fac !== "p" && G.player.ap >= 1;
      const offers = [300, 1000, 2000].map(o => `<button class="ghost" type="button" data-poach="${o}" ${canPoach && G.player.money >= o ? "" : "disabled"}>${man(o)}で誘う</button>`).join("");
      body = `<div class="char-card">
        ${portrait(isMe ? G.player.seed : ch.id, { gender: ch.gender, age: ch.age, color: facColor(ch.fac), size: 112 })}
        <div><span class="eyebrow">${esc(facName(ch.fac))}・${esc(PREF[ch.pref].name)}</span><h2>${esc(ch.name)}</h2>
        <p class="muted">${ch.age}歳・当選${isMe ? G.player.terms : ch.terms}回${ch.fac === "p" && !isMe ? `・忠誠 ${Math.round(ch.loyalty)}` : ""}</p>
        <dl class="facts"><div><dt>弁舌</dt><dd>${st.ben}</dd></div><div><dt>政策</dt><dd>${st.sei}</dd></div><div><dt>交渉</dt><dd>${st.kou}</dd></div></dl></div>
      </div>
      ${!isMe && ch.fac !== "p" ? `<h3>引き抜き</h3><p class="muted">${OPP.includes(ch.fac) ? "野党議員を離党させるのは難しい。" : "忠誠の低い議員ほど誘いに乗りやすい。"}行動力1を使う。</p><div class="row">${offers}</div>` : ""}
      <button class="primary" type="button" data-act="close">閉じる</button>`;
    } else if (m.kind === "report") {
      body = `<h2>${dateStr(m.turn)}の情勢</h2><ul class="report">${m.lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul><button class="primary" type="button" data-act="close">${dateStr(G.turn)}へ</button>`;
    } else if (m.kind === "event") {
      const e = D.events.find(x => x.id === m.id);
      const text = e.text.replace("{pref}", PREF[m.pref].name);
      if (m.done === undefined) {
        body = `<span class="eyebrow">出来事</span><h2>${esc(e.title)}</h2>
          ${e.speaker === "mentor" ? mentorBox(text) : `<div class="speaker">${portrait("boss-" + e.id, { gender: "m", age: 62, color: "#8a6a3a", badge: false, size: 56 })}<div><b>来客</b><p>${esc(text)}</p></div></div>`}
          <div class="choices">${e.choices.map((c, i) => `<button type="button" class="choice" data-choice="${i}">${esc(c.label)}${c.effects.risk ? `<em>裏</em>` : ""}</button>`).join("")}</div>`;
      } else {
        const c = e.choices[m.done];
        body = `<span class="eyebrow">出来事</span><h2>${esc(e.title)}</h2><p>${esc(c.result)}</p>
          <div class="omote"><span>表　制度では</span><p>${esc(e.omote)}</p></div>
          <div class="ura"><span>裏　${esc(D.mentor.name)}の耳打ち</span><p>${esc(e.ura.replace(/^「|」$/g, ""))}</p></div>
          <p class="law"><b>根拠</b>${esc(e.law)}</p>
          <button class="primary" type="button" data-act="close">次へ</button>`;
      }
    } else if (m.kind === "scandal") {
      body = `<span class="eyebrow">発覚</span><h2>週刊誌の報道</h2>${mentorBox("ほら、言ったでしょう。帳簿を知っている人の数だけ爆弾がある。今回は記事で済んだ。次は、特捜部かもしれないわよ。")}<button class="primary" type="button" data-act="close">次へ</button>`;
    } else if (m.kind === "election") {
      if (!m.result) { m.result = runElection(); if (G.over) ui.queue.unshift({ kind: "over" }); }
      const r = m.result;
      const rows = [...KYOWA, ...OPP].map(f => `<tr><td><i class="dot" style="background:${facColor(f)}"></i>${esc(facName(f))}</td><td class="n">${r.before[f]}</td><td class="n"><b>${r.after[f]}</b></td><td class="n ${r.after[f] - r.before[f] >= 0 ? "up" : "down"}">${r.after[f] - r.before[f] >= 0 ? "+" : ""}${r.after[f] - r.before[f]}</td></tr>`).join("");
      const ownLine = r.own ? (r.own.win ? "あなたは地元の選挙区で当選した。" : r.revived ? "あなたは選挙区で敗れたが、惜敗率が高く比例代表で復活当選した。" : "あなたは落選した。") : "";
      body = `<span class="eyebrow">衆議院議員総選挙</span><h2>協和党 ${r.kyowa}議席　${r.kyowa >= MAJORITY ? "過半数を確保" : "過半数割れ"}</h2>
        <p>${esc(ownLine)} ${esc(r.change)}</p>
        <div class="table-box"><table><thead><tr><th>勢力</th><th>前</th><th>今回</th><th>増減</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="law">小選挙区289＋比例代表176。地図の色が選挙区の新しい勢力図。</p>
        <button class="primary" type="button" data-act="close">次へ</button>`;
    } else if (m.kind === "leaderAsk") {
      const n = seats("p");
      const can = n >= 20;
      body = `<span class="eyebrow">協和党総裁選</span><h2>総裁選が告示された</h2>
        ${mentorBox(can ? `推薦人20人はそろってる。${G.facs.p.name}は${n}人。出るなら、今よ。ほかの派閥の協力と、党員の人気がカギになる。` : `立候補には国会議員の推薦人が20人いる。${G.facs.p.name}はまだ${n}人。今回は見送って、次に備えましょう。`)}
        <div class="row">${can ? `<button class="primary" type="button" data-leader="1">立候補する</button><button class="ghost" type="button" data-leader="0">今回は見送る</button>` : `<button class="primary" type="button" data-leader="0">見送る</button>`}</div>`;
    } else if (m.kind === "leader") {
      const r = m.result;
      if (r.uncontested) body = `<span class="eyebrow">協和党総裁選</span><h2>${esc(leaderName(r.winner))}が無投票で再選</h2><p>ほかに推薦人20人を集められる候補がいなかった。</p><button class="primary" type="button" data-act="close">次へ</button>`;
      else {
        const roundHTML = r.rounds.map((rows, i) => `<h3>${i === 0 ? "1回目の投票" : "決選投票"}<small>${i === 0 ? "議員票＋党員票" : "議員票＋都道府県票"}</small></h3><div class="cand-list">${rows.map(x => `<div class="cand${x.c === r.winner && i === r.rounds.length - 1 ? " win" : ""}">${portrait(x.c === "p" ? G.player.seed : x.c, { gender: x.c === "p" ? G.player.gender : D.leaders[D.factions[x.c].leader].gender, age: x.c === "p" ? 41 : D.leaders[D.factions[x.c].leader].age, color: facColor(x.c), size: 48 })}<span><b>${esc(leaderName(x.c))}</b><small>${esc(facName(x.c))}</small></span><span class="votes"><b>${x.total}</b><small>議員${x.giin}・${i === 0 ? "党員" : "地方"}${x.tou}</small></span></div>`).join("")}</div>`).join("");
        body = `<span class="eyebrow">協和党総裁選</span><h2>新総裁 ${esc(leaderName(r.winner))}</h2>${roundHTML}
          <p class="muted">${r.winner === "p" ? (G.cabinet.pm === "p" ? "あなたは協和党総裁となり、国会で内閣総理大臣に指名された。" : "あなたは協和党総裁になった。だが協和党は野党。総選挙で過半数を取り戻せば総理になれる。") : `あなたの役職：${post().name}`}</p>
          <button class="primary" type="button" data-act="close">次へ</button>`;
      }
    } else if (m.kind === "over") {
      const o = G.over;
      body = `<span class="eyebrow">${o.kind === "win" ? "勝利" : "終幕"}</span><h2>${esc(o.title)}</h2><p>${esc(o.text)}</p>
        <dl class="facts"><div><dt>年月</dt><dd class="small">${dateStr(G.turn)}</dd></div><div><dt>${esc(G.facs.p.name)}</dt><dd>${seats("p")}<small>人</small></dd></div><div><dt>知名度</dt><dd>${Math.round(G.player.fame)}</dd></div><div><dt>総理在任</dt><dd>${G.monthsAsPM}<small>か月</small></dd></div></dl>
        <div class="row">${o.retry ? `<button class="primary" type="button" data-act="retry">選挙の前からやり直す</button>` : ""}<button class="${o.retry ? "ghost" : "primary"}" type="button" data-act="title">タイトルへ</button></div>`;
    }
    return `<div class="modal" role="dialog" aria-modal="true"><div class="modal-card" tabindex="-1">${body}</div></div>`;
  }

  function render() {
    const app = document.getElementById("app");
    app.innerHTML = G ? renderGame() : renderSetup();
  }

  /* ---------- 入力 ---------- */
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-pref],[data-act],[data-cmd],[data-mode],[data-type],[data-gender],[data-char],[data-works],[data-bank],[data-fac],[data-poach],[data-choice],[data-leader]");
    if (!t || t.disabled) return;
    const ds = t.dataset;
    if (!G) {
      if (ds.pref) { ui.setup.home = ds.pref; render(); }
      else if (ds.type) { ui.setup.type = ds.type; render(); }
      else if (ds.gender) { ui.setup.gender = ds.gender; render(); }
      else if (ds.act === "start") { newGame(ui.setup); render(); openModal({ kind: "intro" }); }
      else if (ds.act === "continue") { G = load(); ui.sel = G.player.home; render(); }
      return;
    }
    if (ui.modal) {
      const m = ui.modal;
      if (ds.act === "close") return closeModal();
      if (ds.act === "tip-ok") { const then = m.then; ui.modal = null; if (then) then(); else { render(); nextModal(); } return; }
      if (ds.works) return startWorks(m.pref, ds.works, ds.dango === "1");
      if (ds.bank) return bankAction(ds.bank, Number(ds.amt));
      if (ds.fac) return factionAction(m.cmd, ds.fac);
      if (ds.poach) return poach(m.char, Number(ds.poach));
      if (ds.choice !== undefined && m.kind === "event") { const e = D.events.find(x => x.id === m.id); applyEventChoice(m, e.choices[Number(ds.choice)]); m.done = Number(ds.choice); render(); return; }
      if (ds.leader !== undefined) { const r = runLeader(ds.leader === "1"); save(); ui.modal = { kind: "leader", result: r }; render(); return; }
      if (ds.act === "retry") { G = G.over.retry; G.over = null; ui.modal = null; ui.queue = []; save(); render(); return; }
      if (ds.act === "title") { ui.modal = null; ui.queue = []; G = null; render(); return; }
      return;
    }
    if (ds.pref) {
      ui.sel = ds.pref; render();
      if (matchMedia("(max-width: 959px)").matches) document.querySelector(".pref")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      return;
    }
    if (ds.mode) { ui.mode = ds.mode; render(); return; }
    if (ds.cmd) { useCmd(ds.cmd, ui.sel); return; }
    if (ds.char) { openModal({ kind: "char", char: ds.char }); return; }
    if (ds.act === "end") { endMonth(); return; }
  });
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(".tile")) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  });
  document.addEventListener("input", e => {
    if (!G && e.target.dataset.field) { ui.setup[e.target.dataset.field] = e.target.value.trim() || (e.target.dataset.field === "surname" ? "汐見" : "健"); }
  });
  document.addEventListener("change", () => { if (!G) render(); });

  window.__tenka = { get G() { return G; }, endMonth, runElection, seats };
  function start(data) {
    if (data && data.G) { G = data.G; ui.sel = G.player.home; }
    render();
  }
  window.claude?.hot?.snapshot?.(() => ({ G }));
  window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
