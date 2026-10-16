// 『永田町への道 天下取り』 ゲームエンジン（画面に依存しない。Node でも動く）
(() => {
  const T = (globalThis.Tenka = globalThis.Tenka || {});
  const D = T.D, W = T.W;
  const E = (T.E = {});
  let G = null;
  Object.defineProperty(T, "G", { get: () => G, set: v => { G = v; } });

  /* ---------- 定数 ---------- */
  const PR_SEATS = 176, TOTAL = 465, MAJORITY = 233, UPPER = 248, UPPER_MAJ = 125, UPPER_HALF = 124;
  const WEST = ["kinki", "chugoku", "shikoku", "kyushu", "okinawa"], EAST = ["hokkaido", "tohoku", "kanto", "chubu"];
  const PREF = Object.fromEntries(D.prefs.map(p => [p.id, p]));
  const NAMED = Object.fromEntries(W.named.map(n => [n.id, n]));
  const ISSUE = Object.fromEntries(W.issues.map(i => [i.id, i]));
  const SAVE_VERSION = 2;
  Object.assign(E, { PR_SEATS, TOTAL, MAJORITY, UPPER, UPPER_MAJ, PREF, NAMED, ISSUE, SAVE_VERSION });

  /* ---------- 乱数（セーブに状態を持つ） ---------- */
  function rnd() {
    G.rngState = (G.rngState + 0x6D2B79F5) | 0;
    let t = Math.imul(G.rngState ^ (G.rngState >>> 15), 1 | G.rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const rand = (a, b) => a + rnd() * (b - a);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sigmoid = x => 1 / (1 + Math.exp(-x));
  const weighted = (items, w) => {
    const total = items.reduce((t, it) => t + Math.max(0, w(it)), 0);
    let r = rnd() * total;
    for (const it of items) { r -= Math.max(0, w(it)); if (r <= 0) return it; }
    return items[items.length - 1];
  };
  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  Object.assign(E, { rnd, rand, pick, clamp, hash });

  /* ---------- 日付・名前 ---------- */
  const dateOf = turn => { const m0 = G.startMonth - 1 + turn; return { y: G.startYear + Math.floor(m0 / 12), m: (m0 % 12) + 1 }; };
  const dateStr = turn => { const d = dateOf(turn); return `${d.y}年${d.m}月`; };
  const man = v => `${Math.round(v).toLocaleString()}万円`;
  const diff = () => ({ easy: { money: 1.4, ai: 0.6, risk: 0.8 }, normal: { money: 1, ai: 1, risk: 1 }, hard: { money: 0.7, ai: 1.5, risk: 1.3 } }[G.options.difficulty] || { money: 1, ai: 1, risk: 1 });
  Object.assign(E, { dateOf, dateStr, man });

  /* ---------- 勢力の集計 ---------- */
  const activeFacs = () => Object.keys(G.facs).filter(f => G.facs[f].active);
  const partyOf = f => D.factions[f].party;
  const facsOf = party => activeFacs().filter(f => partyOf(f) === party);
  const playerParty = () => partyOf(G.pf);
  const facName = f => G.facs[f]?.name || D.factions[f].name;
  const facColor = f => D.factions[f].color;
  const leaderName = f => f === G.pf ? playerName() : (NAMED[D.factions[f].leader]?.name || "―");
  const playerName = () => `${G.player.surname} ${G.player.given}`;
  function districtCount(fac) { let n = 0; for (const p of D.prefs) for (const d of G.prefs[p.id].districts) if (d.fac === fac) n++; return n; }
  const seats = fac => districtCount(fac) + (G.pr[fac] || 0);
  const partySeats = party => facsOf(party).reduce((t, f) => t + seats(f), 0);
  const rulingParties = () => G.coalition;
  const rulingSeats = () => rulingParties().reduce((t, p) => t + partySeats(p), 0);
  const isRuling = () => rulingParties().includes(playerParty());
  const isPM = () => G.cabinet.pm === G.pf;
  const pmParty = () => partyOf(G.cabinet.pm);
  const upperSeats = party => G.upper[party] || 0;
  const upperRuling = () => rulingParties().reduce((t, p) => t + upperSeats(p), 0);
  const nejire = () => upperRuling() < UPPER_MAJ;
  const post = () => D.posts[G.player.post];
  function members() { const out = []; for (const p of D.prefs) for (const d of G.prefs[p.id].districts) if (d.fac === G.pf && d.char !== "player") out.push(G.chars[d.char]); return out; }
  function nationalSupport() {
    const tot = {}; let pop = 0;
    for (const p of D.prefs) { const s = G.prefs[p.id].sup; for (const k of G.parties) tot[k] = (tot[k] || 0) + s[k] * p.pop; pop += p.pop; }
    for (const k of G.parties) tot[k] /= pop;
    return tot;
  }
  function normalize(sup) {
    let t = 0; for (const k of G.parties) t += Math.max(0, sup[k] || 0);
    for (const k of G.parties) sup[k] = clamp((sup[k] || 0) * 100 / (t || 1), 2, 94);
  }
  E.normalizeSup = normalize;
  Object.assign(E, { activeFacs, partyOf, facsOf, playerParty, facName, facColor, leaderName, playerName, seats, partySeats, rulingParties, rulingSeats, isRuling, isPM, pmParty, upperSeats, nejire, post, members, nationalSupport, districtCount });

  function log(text, kind = "") { G.log.unshift({ t: G.turn, text, kind }); G.log = G.log.slice(0, 120); }
  function queue(ev) { G.queue.push(ev); }
  function extra(headline, sub) { queue({ kind: "extra", headline, sub, t: G.turn }); }
  function learn(law, title) { if (law && law !== "―" && !G.laws.some(l => l.law === law)) G.laws.push({ law, title, t: G.turn }); }
  function term(t) { if (t && !G.terms.includes(t)) G.terms.push(t); }
  Object.assign(E, { log, queue, learn, term });

  /* ---------- 人物 ---------- */
  function newChar(fac, pref, extra = {}) {
    const id = "c" + (G.nextId++);
    const gender = rnd() < 0.2 ? "f" : "m";
    const name = `${pick(D.surnames)} ${pick(gender === "f" ? D.givenF : D.givenM)}`;
    G.chars[id] = { id, name, gender, age: Math.round(rand(36, 74)), fac, pref,
      stats: { ben: Math.round(rand(30, 85)), sei: Math.round(rand(30, 85)), kou: Math.round(rand(30, 85)) },
      loyalty: Math.round(rand(45, 85)), terms: Math.max(1, Math.round(rand(1, 9))), ...extra };
    return id;
  }
  const named = id => G.named[id];
  function namedRel(id, d, why) { const n = G.named[id]; if (!n) return; n.rel = clamp(n.rel + d, 0, 100); if (why) remember(id, why); }
  function remember(id, text) { const n = G.named[id]; if (!n) return; n.memory.unshift({ t: G.turn, text }); n.memory = n.memory.slice(0, 8); }
  Object.assign(E, { newChar, named, namedRel, remember });

  /* ---------- 争点 ---------- */
  function prefLean(p) {
    const lean = {};
    const add = o => { for (const k in o) lean[k] = (lean[k] || 0) + o[k]; };
    if (p.pop < 130) add(W.regionalLean.rural); else if (p.pop >= 500) add(W.regionalLean.urban); else add(W.regionalLean.mid);
    if (p.id === "okinawa") add(W.regionalLean.okinawa);
    if (W.energyPrefs.includes(p.id)) add(W.regionalLean.energy);
    return lean;
  }
  // 立場が有権者の好みに合っているか（-1〜+1）
  function issueMatch(stances, lean) {
    let s = 0, n = 0;
    for (const k in lean) { if (!stances[k]) continue; s += Math.sign(stances[k]) === Math.sign(lean[k]) ? Math.min(Math.abs(stances[k]), 2) * Math.abs(lean[k]) : -Math.min(Math.abs(stances[k]), 2) * Math.abs(lean[k]); n += Math.abs(lean[k]) * 2; }
    return n ? s / n : 0;
  }
  function facStances(f) { return f === G.pf ? G.player.stances : (G.facs[f].stances || W.factionStances[f] || {}); }
  Object.assign(E, { prefLean, issueMatch, facStances });

  /* ---------- 新しいゲーム ---------- */
  E.newGame = function (o) {
    const sc = W.scenarios.find(s => s.id === o.scenario) || W.scenarios[0];
    const type = D.playerTypes.find(t => t.id === o.type) || D.playerTypes[0];
    const seed = o.seed ?? (Date.now() % 2147483647);
    G = {
      v: SAVE_VERSION, seed, rngState: seed | 0, scenario: sc.id, startYear: sc.year, startMonth: 1, turn: 0, nextId: 1,
      options: { difficulty: o.difficulty || "normal", pace: 1, sound: false },
      phase: "normal", parties: ["kyowa", "minsei", "kaikaku"], pf: o.faction || "p",
      chars: {}, prefs: {}, pr: {}, upper: {}, facs: {}, named: {}, groups: {}, ministries: {}, media: {},
      log: [], queue: [], tipsSeen: {}, laws: [], terms: [], candidates: [], bills: [], passed: [],
      coalition: [sc.ruling], cabinet: { pm: null, support: sc.cabinetSupport, ministers: [], strategy: null },
      partyLeader: {}, nation: { ...sc.nation }, nationStart: { ...sc.nation }, supportHist: [],
      nextElection: 15 + Math.floor((seed % 7)), nextLeader: 9, nextUpper: 18, lastElection: 0, lastUpper: -18, lowSupport: 0, monthsAsPM: 0, wonAsPM: false, startedAsPM: false, electionsLost: 0,
      campaign: null, pendingCabinet: false, pendingBudget: false, partyCooldown: 0, shadyCount: 0, worksDone: 0, over: null, carry: o.carry || null,
      player: { surname: o.surname || "汐見", given: o.given || "健", gender: o.gender || "m", type: type.id, typeName: type.name, stats: { ...type.stats },
        money: Math.round(type.money * diffMoney(o.difficulty)), fame: type.fame, risk: 0, home: o.home || "hiroshima", post: 0, terms: 1, ap: 3, budget: 30, debt: 0,
        stances: {}, stanceSet: false, consistency: 100, integrity: 100, achievement: 0, mood: "neutral", secretaries: [], seed: `${o.surname}${o.given}${seed}`, creditBonus: 0, freeWorks: 0, freeCandidate: 0, killStory: 0 },
    };
    function diffMoney(d) { return d === "easy" ? 1.4 : d === "hard" ? 0.7 : 1; }
    for (const id of Object.keys(D.factions)) {
      const f = D.factions[id];
      G.facs[id] = { active: !f.dynamic && id !== "p", name: f.name, fame: f.fame || 0, risk: f.risk || 0, rel: 50, ally: false, known: false, neta: false, mood: "neutral", plan: null, stances: { ...(W.factionStances[id] || {}) }, promise: null };
    }
    if (G.pf === "p") { G.facs.p.active = true; G.facs.p.name = `${G.player.surname}会`; G.facs.p.fame = type.fame; }
    for (const n of W.named) G.named[n.id] = { rel: n.persona === "mentor" ? 85 : n.persona === "ally" ? 80 : 45, owed: 0, iowe: 0, grudge: 0, memory: [] };
    for (const g of W.groups) G.groups[g.id] = { rel: 40 };
    for (const m of W.ministries) G.ministries[m.id] = { rel: 45 };
    for (const m of W.media) G.media[m.id] = { rel: 50 };
    if (sc.chaos) for (const f of activeFacs()) G.facs[f].risk += 20;

    // 都道府県
    for (const p of D.prefs) {
      const sup = { kyowa: sc.support.kyowa + rand(-4, 4), minsei: sc.support.minsei + rand(-4, 4), kaikaku: sc.support.kaikaku + rand(-3, 3) };
      if (p.pop > 500) { sup.kyowa -= 7; sup.minsei += 3; sup.kaikaku += 4; }
      if (p.pop < 130) { sup.kyowa += 8; sup.minsei -= 4; }
      if (["osaka", "hyogo", "kyoto"].includes(p.id)) { sup.kaikaku += 14; sup.kyowa -= 6; sup.minsei -= 8; }
      if (p.id === "okinawa") { sup.minsei += 12; sup.kyowa -= 10; }
      normalize(sup);
      const st = { sup, base: { ...sup }, econ: Math.round(clamp(28 + p.pop / 18 + rand(-4, 4), 25, 95)), jiban: 0, works: [], built: [], districts: [], governor: null, lean: prefLean(p), status: null };
      G.prefs[p.id] = st;
      for (let i = 0; i < p.seats; i++) {
        const party = weighted(G.parties, k => Math.pow(sup[k], 2.4));
        const fac = party === "kyowa" ? weighted(["ookouchi", "kiryu", "isurugi"], f => {
          const lean = D.factions[f].lean; let w = D.factions[f].weight;
          if (lean === "west" && WEST.includes(p.region)) w *= 1.6;
          if (lean === "east" && EAST.includes(p.region)) w *= 1.5;
          if (lean === "urban" && p.pop > 500) w *= 1.7;
          return w;
        }) : party;
        st.districts.push({ fac, char: newChar(fac, p.id) });
      }
      st.governor = newChar(sup.kyowa > 45 ? "kyowa" : pick(G.parties), p.id, { role: "governor", age: Math.round(rand(50, 76)), rel: 50 });
    }

    // プレイヤー
    const home = G.prefs[G.player.home];
    G.chars.player = { id: "player", name: playerName(), gender: G.player.gender, age: 41, fac: G.pf, pref: G.player.home, stats: G.player.stats, loyalty: 100, terms: 1, isPlayer: true };
    if (G.pf === "p") {
      home.jiban = 25 + (type.jiban || 0);
      let own = home.districts.findIndex(d => partyOf(d.fac) === "kyowa"); if (own < 0) own = 0;
      home.districts[own] = { fac: "p", char: "player" };
      const near = D.prefs.filter(p => Math.abs(p.c - PREF[G.player.home].c) + Math.abs(p.r - PREF[G.player.home].r) <= 2);
      let added = 0, first = true;
      for (const p of near) for (const d of G.prefs[p.id].districts) {
        if (added >= 2) break;
        if (partyOf(d.fac) === "kyowa" && d.fac !== "p") {
          d.fac = "p"; const c = G.chars[d.char]; c.fac = "p"; c.loyalty = 75; c.terms = 1; added++;
          if (first) { c.name = NAMED.kudo.name; c.gender = "m"; c.age = 44; c.namedId = "kudo"; first = false; }
        }
      }
    } else {
      // 既存の派閥・政党の領袖として始める
      const f = D.factions[G.pf];
      const lead = NAMED[f.leader];
      if (lead) G.named[f.leader].isPlayer = true;
      G.facs[G.pf].name = f.name;
      G.player.terms = 7; G.player.fame = f.fame; G.player.risk = f.risk; G.player.money = Math.round((3000 + (f.weight || 0.3) * 6000) * diffMoney(o.difficulty));
      G.chars.player.age = 58; G.chars.player.terms = 7;
      home.jiban = 60;
      let own = home.districts.findIndex(d => d.fac === G.pf);
      if (own < 0) { own = 0; const d = home.districts[0]; d.fac = G.pf; }
      home.districts[own] = { fac: G.pf, char: "player" };
      for (const p of D.prefs) if (G.prefs[p.id].districts.some(d => d.fac === G.pf)) G.prefs[p.id].jiban = Math.max(G.prefs[p.id].jiban, 15);
      G.player.stances = { ...(W.factionStances[G.pf] || {}) }; G.player.stanceSet = true;
    }

    // 比例・参院・政権
    allocatePR();
    const ns = nationalSupport();
    for (const p of G.parties) G.upper[p] = Math.round(UPPER * ns[p] / 100);
    G.upper[sc.ruling] += UPPER - G.parties.reduce((t, p) => t + G.upper[p], 0);
    for (const party of G.parties) G.partyLeader[party] = party === "kyowa" ? "ookouchi" : party;
    if (G.pf !== "p") G.partyLeader[playerParty()] = playerParty() === "kyowa" && G.pf !== "ookouchi" ? "ookouchi" : G.pf;
    G.cabinet.pm = G.partyLeader[sc.ruling];
    if (isPM()) { G.startedAsPM = true; G.player.post = 4; }
    else if (!isRuling() && G.partyLeader[playerParty()] === G.pf) G.player.post = 5;
    else G.player.post = G.pf === "p" ? 0 : 3;
    G.player.ap = post().ap; G.player.budget = post().budget;
    makeCabinet("balance");

    // 物語モードからの引き継ぎ
    if (o.carry) applyCarry(o.carry);
    // 秘書：早瀬は固定
    G.player.secretaries.push({ id: "hayase", name: NAMED.hayase.name, traits: ["able"], loyalty: 100, salary: 0, fixed: true });

    log(`${dateStr(0)}、${playerName()}は${G.pf === "p" ? `衆議院議員として永田町に入った。政策勉強会「${G.facs.p.name}」の仲間は3人。` : `${facName(G.pf)}を率いて、新しい年を迎えた。`}`, "big");
    log(goalText(), "big");
    return G;
  };
  function goalText() {
    if (isPM()) return "目標は、総選挙に勝って政権を3年保つこと。支持率が20%を切れば党内から引きずり下ろされる。";
    if (!isRuling()) return "目標は、総選挙で政権交代を起こして総理大臣になり、総理として総選挙に勝って政権を2年保つこと。";
    return "目標は、仲間を20人に増やして総裁選に出ること。総理になったら、総選挙に勝って政権を2年保つこと。";
  }
  function applyCarry(c) {
    const P = G.player;
    if (c.route === "clean") { P.integrity = 100; P.fame += 5; namedRel("hayase", 10); namedRel("sawatari", 20); }
    if (c.route === "insider") { P.money += 1500; P.risk += 25; G.named.iwaki.iowe = 1; namedRel("iwaki", 20); namedRel("sawatari", 10); }
    if (c.route === "outsider") { P.fame += 10; P.money -= 200; G.groups.roso.rel += 15; namedRel("sawatari", -20); namedRel("aizawa", 15); }
    if (c.knowledge) P.stats.sei = clamp(P.stats.sei + Math.round(c.knowledge / 10), 0, 100);
  }
  E.goalText = goalText;

  function allocatePR() {
    const ns = nationalSupport();
    const pr = {}; let given = 0;
    for (const party of G.parties) { pr[party] = Math.floor(PR_SEATS * ns[party] / 100); given += pr[party]; }
    pr[G.parties[0]] += PR_SEATS - given;
    for (const party of G.parties) {
      const fs = facsOf(party);
      const dist = Object.fromEntries(fs.map(f => [f, districtCount(f) + (f === G.pf ? 2 : 0)]));
      const dsum = fs.reduce((t, f) => t + dist[f], 0) || 1;
      let g = 0;
      for (const f of fs) { G.pr[f] = Math.floor(pr[party] * dist[f] / dsum); g += G.pr[f]; }
      if (fs.length) G.pr[fs[0]] += pr[party] - g;
    }
    for (const f of Object.keys(G.facs)) if (!G.facs[f].active) G.pr[f] = 0;
  }
  E.allocatePR = allocatePR;

  /* ---------- セーブ ---------- */
  E.serialize = () => JSON.stringify(G);
  E.restore = json => { const g = typeof json === "string" ? JSON.parse(json) : json; if (!g || g.v !== SAVE_VERSION) return null; G = g; return G; };
  E.exportCode = () => { const s = E.serialize(); try { return btoa(unescape(encodeURIComponent(s))); } catch (e) { return Buffer.from(s, "utf8").toString("base64"); } };
  E.importCode = code => { let s; try { s = decodeURIComponent(escape(atob(code.trim()))); } catch (e) { try { s = Buffer.from(code.trim(), "base64").toString("utf8"); } catch (e2) { return null; } } return E.restore(s); };

  /* ---------- コマンド ---------- */
  const CMDS = {
    yuzei: { name: "遊説", group: "地域", pref: true, cost: 20, tip: "yuzei", desc: "党の支持と知名度を上げる",
      preview(pid) { const b = G.player.stats.ben / 60; return { sup: +(1.4 * b).toFixed(1), jiban: pid === G.player.home ? 4 : 3, fame: PREF[pid].pop > 300 ? 2 : 1 }; },
      run(pid) { const st = G.prefs[pid], b = G.player.stats.ben / 60 * mediaBoost(); st.sup[playerParty()] += 1.4 * b; normalize(st.sup); st.jiban = clamp(st.jiban + (pid === G.player.home ? 4 : 3), 0, 100); G.player.fame = clamp(G.player.fame + (PREF[pid].pop > 300 ? 1.4 : 0.7) * b, 0, 100); return `${PREF[pid].name}で遊説。${D.parties[playerParty()].name}の支持と地盤が上がった。`; } },
    kouenkai: { name: "後援会づくり", group: "地域", pref: true, cost: 80, tip: "kouenkai", desc: "地盤を大きく育てる", preview() { return { jiban: 9 + secBonus("jiban") }; },
      run(pid) { G.prefs[pid].jiban = clamp(G.prefs[pid].jiban + 9 + secBonus("jiban"), 0, 100); return `${PREF[pid].name}に後援会の支部をつくった。`; } },
    works: { name: "公共事業", group: "地域", pref: true, tip: "works", desc: "予算枠を使って事業を誘致する", modal: "works",
      check() { return G.player.budget > 0 || G.player.freeWorks ? null : "予算枠がない（4月に補充）"; } },
    youritsu: { name: "新人を擁立", group: "地域", pref: true, cost: 500, tip: "youritsu", desc: "他党の選挙区に仲間の新人を立てる",
      check(pid) { const open = G.prefs[pid].districts.filter(d => partyOf(d.fac) !== playerParty()).length; const mine = G.candidates.filter(c => c.pref === pid).length; return open - mine > 0 ? null : "他党が持つ選挙区がない"; },
      run(pid) { const id = newChar(G.pf, pid, { candidate: true, terms: 0, age: Math.round(rand(32, 50)), loyalty: 85 }); G.candidates.push({ pref: pid, char: id }); G.prefs[pid].jiban = clamp(G.prefs[pid].jiban + 2, 0, 100); return `${PREF[pid].name}で新人の${G.chars[id].name}を擁立した。次の総選挙で議席を狙う。`; } },
    town: { name: "地元の街を見る", group: "地域", ap: 0, desc: "汐見市の今の姿", modal: "town" },
    kigyou: { name: "企業回り", group: "資金", pref: true, tip: "kigyou", desc: "地元企業から政党支部へ献金を募る",
      preview(pid) { return { money: kigyouAmt(pid) }; },
      run(pid) { const amt = kigyouAmt(pid); G.player.money += amt; return `${PREF[pid].name}の企業を回り、政党支部への献金 ${man(amt)} を集めた。`; } },
    party: { name: "資金パーティー", group: "資金", tip: "party", desc: "3か月に1回。知名度と仲間の数で稼げる",
      check() { return G.partyCooldown > 0 ? `あと${G.partyCooldown}か月は開けない` : null; }, preview() { return { money: partyAmt() }; },
      run() { const amt = partyAmt(); G.player.money += amt; G.partyCooldown = 4; return `東京のホテルで政治資金パーティーを開き、${man(amt)} を集めた。`; } },
    bank: { name: "銀行", group: "資金", ap: 0, tip: "bank", desc: "選挙資金を借りる・返す", modal: "bank" },
    urakane: { name: "裏金づくり", group: "謀略", shady: true, tip: "urakane", desc: "帳簿に載らない資金。発覚リスク大", preview() { return { money: 800, risk: 14 }; },
      run() { G.player.money += 800; addRisk(14); G.player.integrity = clamp(G.player.integrity - 6, 0, 100); return "パーティー収入の一部を帳簿から外し、800万円の裏金をつくった。"; } },
    stance: { name: "公約を決める", group: "政策", ap: 0, tip: "stance", desc: "8つの争点への立場。団体と有権者の反応が変わる", modal: "stance" },
    bill: { name: "法案を出す", group: "政策", cost: 50, tip: "bill", desc: "争点を一つ選び、法律にする。成立すれば実績になる", modal: "bill",
      check() { return G.bills.filter(b => !b.done).length >= 2 ? "同時に進められる法案は2本まで" : inSession() ? null : "国会は閉会中（1〜6月、10〜12月に）"; } },
    tsuikyuu: { name: "予算委員会で追及", group: "政策", tip: "tsuikyuu", desc: "野党だけ。政権の弱みを突く。テレビ中継あり",
      check() { return isRuling() ? "野党のときだけ使える" : inSession() ? null : "国会は閉会中"; },
      run() { const pmf = G.cabinet.pm; const neta = G.facs[pmf]?.neta || G.facs[pmf]?.risk >= 45; if (neta) { G.cabinet.support = clamp(G.cabinet.support - 6, 5, 80); G.player.fame = clamp(G.player.fame + 4, 0, 100); G.facs[pmf].neta = false; G.facs[pmf].risk = clamp(G.facs[pmf].risk - 15, 0, 100); return `予算委員会で${leaderName(pmf)}首相の資金問題を追及。答弁は二転三転し、内閣支持率が下がった。`; } G.player.fame = clamp(G.player.fame - 2, 0, 100); return "予算委員会で追及したが、決め手を欠いた。「パフォーマンスだ」と評された。"; } },
    mochidai: { name: "餅代を配る", group: "党内", tip: "mochidai", desc: "仲間1人50万円。忠誠を高める",
      check() { return members().length ? (G.player.money < members().length * 50 ? "資金が足りない" : null) : "仲間がいない"; }, preview() { return { money: -members().length * 50, loyalty: 15 }; },
      run() { const ms = members(); G.player.money -= ms.length * 50; ms.forEach(c => c.loyalty = clamp(c.loyalty + 15, 0, 100)); return `仲間${ms.length}人に餅代を配った（収支報告書に記載）。`; } },
    benkyoukai: { name: "勉強会", group: "党内", cost: 50, tip: "benkyoukai", desc: "知名度と仲間の忠誠を少し上げる", preview() { return { fame: 1, loyalty: 5 }; },
      run() { G.player.fame = clamp(G.player.fame + 1, 0, 100); members().forEach(c => c.loyalty = clamp(c.loyalty + 5, 0, 100)); return `${facName(G.pf)}の勉強会を開いた。`; } },
    doumei: { name: "派閥と同盟", group: "党内", cost: 300, tip: "doumei", desc: "次の総裁選や選挙で協力する", modal: "faction",
      check() { return activeFacs().some(f => f !== G.pf && !G.facs[f].ally) ? null : "すべてと同盟済み"; } },
    secretary: { name: "秘書を雇う", group: "党内", ap: 0, tip: "secretary", desc: "最大3人。それぞれ得意と癖がある", modal: "secretary" },
    meet: { name: "人物に会う", group: "人物", tip: "meet", desc: "官僚、記者、団体、派閥。貸し借りを作る", modal: "meet" },
    shinto: { name: "離党して新党", group: "党内", tip: "shinto", desc: "仲間4人以上で。政党交付金が出る", check() { return G.pf === "shinto" ? "すでに新党" : G.partyLeader[playerParty()] === G.pf ? "党首は離党できない" : members().length >= 4 ? null : "仲間が4人以上必要"; }, run: () => foundParty() },
    kaisan: { name: "衆議院を解散", group: "党内", tip: "kaisan", desc: "総理だけが使える", check() { return isPM() ? (G.nextElection === G.turn + 1 ? "解散済み" : null) : "総理大臣でないと使えない"; },
      run() { G.nextElection = G.turn + 1; extra("衆議院解散", "首相「国民に信を問う」。総選挙は来月"); return "衆議院を解散した。来月、総選挙が行われる。"; } },
    chousa: { name: "身辺調査", group: "謀略", cost: 100, tip: "chousa", desc: "他派閥の弱みと次の動きを探る", modal: "faction" },
    leak: { name: "週刊誌にリーク", group: "謀略", shady: true, tip: "leak", desc: "弱みを握った派閥に打撃", modal: "faction", check() { return activeFacs().some(f => f !== G.pf && G.facs[f].neta) ? null : "身辺調査で弱みを握ってから"; } },
  };
  const GROUPS = ["地域", "資金", "政策", "党内", "人物", "謀略"];
  const kigyouAmt = pid => Math.round((15 + G.prefs[pid].econ + G.prefs[pid].jiban * 0.6 + secBonus("money")) * G.player.stats.kou / 60 * diff().money);
  const partyAmt = () => Math.round((200 + G.player.fame * 6 + seats(G.pf) * 20) * diff().money);
  const inSession = () => { const m = dateOf(G.turn).m; return (m >= 1 && m <= 6) || m >= 10; };
  const mediaBoost = () => 0.8 + G.media.tv.rel / 250;
  function secBonus(kind) { let b = 0; for (const s of G.player.secretaries) for (const t of s.traits) { const tr = W.secretaryTraits.find(x => x.id === t); if (tr && tr[kind]) b += tr[kind]; } return b; }
  function addRisk(d) { G.player.risk = clamp(G.player.risk + d * diff().risk, 0, 100); if (d > 0) G.shadyCount++; }
  Object.assign(E, { CMDS, GROUPS, inSession, secBonus, addRisk });

  E.cmdBlock = function (id, pid) {
    const c = CMDS[id]; const ap = c.ap ?? 1;
    if (G.phase !== "normal") return "選挙中";
    if (G.player.ap < ap) return "行動力がない";
    if (c.cost && G.player.money < c.cost) return "資金が足りない";
    if (c.check) return c.check(pid);
    return null;
  };
  // 返り値: { tip } 解説を先に出す / { modal } 画面を開く / { msg } 実行した
  E.useCmd = function (id, pid) {
    const c = CMDS[id];
    if (E.cmdBlock(id, pid)) return null;
    if (c.tip && !G.tipsSeen[c.tip]) { G.tipsSeen[c.tip] = true; learn(D.tips[c.tip].law, c.name); return { tip: c.tip, name: c.name }; }
    if (c.modal) return { modal: c.modal, cmd: id, pref: pid };
    G.player.ap -= c.ap ?? 1;
    if (c.cost) G.player.money -= c.cost;
    const msg = c.run(pid);
    if (msg) log(msg, c.shady ? "shady" : "mine");
    return { msg };
  };

  E.startWorks = function (pid, wid, dango) {
    const w = D.works.find(x => x.id === wid);
    const free = G.player.freeWorks > 0;
    if (G.player.ap < 1 || (!free && G.player.budget < w.cost)) return null;
    G.player.ap -= 1; if (free) G.player.freeWorks--; else G.player.budget -= w.cost;
    G.prefs[pid].works.push({ id: wid, left: w.months, dango });
    G.prefs[pid].jiban = clamp(G.prefs[pid].jiban + 2, 0, 100);
    G.ministries.mlit.rel = clamp(G.ministries.mlit.rel + 2, 0, 100);
    if (dango) { const kick = w.cost * 20; G.player.money += kick; addRisk(Math.round(w.cost / 8)); G.player.integrity = clamp(G.player.integrity - 8, 0, 100); namedRel("inukai", 8); log(`${PREF[pid].name}の${w.name}（${w.cost}億円）を、決めた業者に落札させた。見返りに${man(kick)}。`, "shady"); }
    else log(`${PREF[pid].name}に${w.name}（国費${w.cost}億円）を誘致した。完成まで${w.months}か月。`, "mine");
    return true;
  };
  E.maxDebt = () => 3000 + Math.round(G.player.fame * 100) + seats(G.pf) * 200 + G.player.creditBonus;
  E.bankAction = function (kind, amount) {
    if (kind === "borrow") { if (G.player.debt + amount > E.maxDebt()) return false; G.player.debt += amount; G.player.money += amount; log(`銀行から${man(amount)}を借り入れた（収支報告書に記載）。`, "mine"); namedRel("oda", 2); }
    else { const a = Math.min(amount, G.player.debt, G.player.money); if (a <= 0) return false; G.player.debt -= a; G.player.money -= a; log(`銀行に${man(a)}を返済した。`, "mine"); }
    return true;
  };
  E.factionAction = function (cmd, f) {
    const c = CMDS[cmd]; const fs = G.facs[f];
    if (G.player.ap < 1 || (c.cost && G.player.money < c.cost)) return null;
    if (cmd === "leak" && !fs.neta) return null;
    G.player.ap -= 1; if (c.cost) G.player.money -= c.cost;
    if (cmd === "chousa") {
      fs.known = true; G.player.ap += 0;
      const planText = fs.plan ? `次の動き：${planLabel(fs.plan)}` : "次の動き：様子見";
      if (fs.risk >= 30) { fs.neta = true; log(`${facName(f)}を調べた。会計に不審な点が見つかった（発覚リスク ${Math.round(fs.risk)}）。${planText}`, "shady"); }
      else log(`${facName(f)}を調べたが、目立った弱みはなかった（発覚リスク ${Math.round(fs.risk)}）。${planText}`, "mine");
    } else if (cmd === "leak") {
      fs.neta = false; fs.fame = clamp(fs.fame - 12, 5, 100); fs.risk = clamp(fs.risk - 15, 0, 100); fs.rel = clamp(fs.rel - 20, 0, 100); fs.mood = "hostile";
      addRisk(5); G.player.integrity = clamp(G.player.integrity - 3, 0, 100); namedRel("hiruta", 6);
      if (G.cabinet.pm === f) G.cabinet.support = clamp(G.cabinet.support - 6, 5, 80);
      log(`週刊真相が${facName(f)}の資金問題を報じた。情報源は明かされていない。`, "shady");
      extra(`${facName(f)}に資金疑惑`, "週刊真相が報道。党内に波紋");
    } else if (cmd === "doumei") {
      const chance = clamp(25 + G.player.stats.kou / 2 + (fs.rel - 50) / 2 + (seats(G.pf) - 10) - (fs.mood === "hostile" ? 25 : 0), 5, 85);
      if (rnd() * 100 < chance) { fs.ally = true; fs.rel = clamp(fs.rel + 10, 0, 100); fs.mood = "friendly"; log(`${facName(f)}と協力を約束した。`, "mine"); }
      else { fs.rel = clamp(fs.rel - 5, 0, 100); log(`${facName(f)}に同盟を持ちかけたが、断られた（成功率 ${Math.round(chance)}%）。`, "mine"); }
    }
    return true;
  };
  E.poach = function (charId, offer) {
    const ch = G.chars[charId];
    if (G.player.ap < 1 || G.player.money < offer) return null;
    G.player.ap -= 1; G.player.money -= offer;
    const opp = partyOf(ch.fac) !== playerParty();
    const chance = clamp(12 + G.player.stats.kou * 0.3 + offer / 40 + (60 - ch.loyalty) * 0.5 + seats(G.pf) * 0.4 - (opp ? 20 : 0), 3, 85);
    const old = ch.fac;
    if (rnd() * 100 < chance) {
      moveChar(ch, G.pf); ch.loyalty = 55;
      G.facs[old].rel = clamp(G.facs[old].rel - 10, 0, 100); if (G.facs[old].mood !== "hostile" && rnd() < 0.5) G.facs[old].mood = "hostile";
      log(`${facName(old)}の${ch.name}（${PREF[ch.pref].name}）が${facName(G.pf)}に加わった。${opp ? "離党して入党した。" : ""}`, "mine");
      return { ok: true };
    }
    G.facs[old].rel = clamp(G.facs[old].rel - 4, 0, 100);
    log(`${ch.name}を誘ったが、断られた（成功率 ${Math.round(chance)}%）。`, "mine");
    return { ok: false, chance };
  };
  function moveChar(ch, to) { const d = G.prefs[ch.pref].districts.find(x => x.char === ch.id); if (d) d.fac = to; ch.fac = to; }

  /* ---------- 公約・法案 ---------- */
  E.setStance = function (issue, v) {
    const P = G.player; const old = P.stances[issue] || 0;
    if (P.stanceSet && old !== 0 && Math.sign(old) !== Math.sign(v) && v !== 0) { P.consistency = clamp(P.consistency - 12, 0, 100); log(`${ISSUE[issue].name}への立場を変えた。「ぶれた」と見られ、一貫性が下がった。`, "mine"); }
    P.stances[issue] = v; P.stanceSet = true;
  };
  E.proposeBill = function (issue, dir) {
    if (G.player.ap < 1 || G.player.money < 50) return null;
    G.player.ap -= 1; G.player.money -= 50;
    const i = ISSUE[issue];
    const name = `${i.name}法案（${dir < 0 ? i.a : i.b}）`;
    const stages = isRuling() ? ["bukai", "soumukai", "iin", "honkaigi", "sangiin"] : ["teishutsu", "iin", "honkaigi", "sangiin"];
    const b = { id: "b" + (G.nextId++), issue, dir, name, stages, stage: 0, bonus: 0, done: false, result: null, started: G.turn };
    G.bills.push(b);
    if (!G.player.stances[issue]) E.setStance(issue, dir);
    log(`${name}を提出した。`, "mine");
    return b;
  };
  const STAGE_NAME = { bukai: "党の部会", soumukai: "総務会", teishutsu: "提出・付託", iin: "衆院委員会", honkaigi: "衆院本会議", sangiin: "参議院" };
  E.STAGE_NAME = STAGE_NAME;
  function billProb(b) {
    const stage = b.stages[b.stage];
    const P = G.player;
    let p = 0.40 + P.stats.sei / 250 + seats(G.pf) / 400 + b.bonus;
    const min = W.issueMinistry[b.issue]; if (min) p += (G.ministries[min].rel - 50) / 250;
    if (stage === "bukai" || stage === "soumukai") {
      const lead = G.partyLeader[playerParty()];
      const ls = facStances(lead)[b.issue] || 0;
      p += (G.facs[lead]?.rel - 50) / 200 || 0;
      if (ls && Math.sign(ls) !== Math.sign(b.dir)) p -= 0.3;
      if (lead === G.pf) p += 0.35;
    }
    if (stage === "teishutsu" || (stage === "iin" && !isRuling())) p -= 0.25;
    if (stage === "sangiin" && nejire()) p -= 0.35;
    if (stage === "sangiin" && G.player.upperVote) p += 0.3;
    if (isPM()) p += 0.2;
    return clamp(p, 0.05, 0.95);
  }
  E.billProb = billProb;
  E.nemawashi = function (b, kind) {
    if (b.done) return null;
    if (kind === "nemawashi") { if (G.player.ap < 1 || G.player.money < 100) return null; G.player.ap -= 1; G.player.money -= 100; b.bonus += 0.2; log(`${b.name}の根回しをした。`, "mine"); }
    if (kind === "kokutai") { if (G.player.ap < 1) return null; G.player.ap -= 1; const who = isRuling() ? "muroi" : "kuroda"; G.named[who].iowe += 1; namedRel(who, 4); b.bonus += 0.3; log(`${NAMED[who].name}と日程を握った。借りが一つできた。`, "mine"); }
    if (kind === "kyoukou") { if (!isRuling() || G.player.ap < 1) return null; G.player.ap -= 1; b.bonus += 0.5; G.cabinet.support = clamp(G.cabinet.support - 4, 5, 80); G.player.integrity = clamp(G.player.integrity - 2, 0, 100); log(`${b.name}を強行採決で進めた。世論の反発が出た。`, "mine"); }
    return true;
  };
  function advanceBills(report) {
    if (!inSession()) return;
    for (const b of G.bills) {
      if (b.done) continue;
      const stage = b.stages[b.stage];
      const p = billProb(b);
      if (rnd() < p) {
        b.stage += 1; b.bonus = Math.max(0, b.bonus - 0.15);
        if (b.stage >= b.stages.length) {
          b.done = true; b.result = "passed"; G.passed.push(b);
          G.player.achievement += 10; G.player.fame = clamp(G.player.fame + 3, 0, 100);
          applyBillEffects(b);
          report.push(`${b.name}が成立した。`); extra(`${b.name} 成立`, `${playerName()}が主導。参議院で可決`);
        } else report.push(`${b.name}が${STAGE_NAME[stage]}を通過。次は${STAGE_NAME[b.stages[b.stage]]}。`);
      } else {
        report.push(`${b.name}は${STAGE_NAME[stage]}で足踏み（通過率 ${Math.round(p * 100)}%）。`);
        if (stage === "sangiin" && nejire() && isRuling() && rulingSeats() >= 310 && rnd() < 0.5) { b.done = true; b.result = "passed"; G.passed.push(b); G.player.achievement += 10; applyBillEffects(b); report.push(`参議院で否決されたが、衆議院の3分の2で再可決し、${b.name}が成立した。`); }
      }
    }
    G.player.upperVote = false;
  }
  function applyBillEffects(b) {
    const i = ISSUE[b.issue];
    for (const k in i.nation) G.nation[k] = clamp(G.nation[k] + i.nation[k] * b.dir * 2 * (k === "debt" ? 1 : 1), 0, 100);
    for (const p of D.prefs) { const st = G.prefs[p.id]; const lean = st.lean[b.issue] || 0; if (lean) { st.sup[playerParty()] += Math.sign(lean) === Math.sign(b.dir) ? 1.5 : -1.5; normalize(st.sup); } }
    for (const g of W.groups) if (g.issue === b.issue) G.groups[g.id].rel = clamp(G.groups[g.id].rel + (Math.sign(g.want) === Math.sign(b.dir) ? 15 : -15), 0, 100);
  }
  function sessionEnd(report) {
    const live = G.bills.filter(b => !b.done);
    if (!live.length) return;
    for (const b of live) {
      if (b.stage >= 2 && G.player.ap >= 1) { G.player.ap -= 1; report.push(`${b.name}は会期末に継続審査となった（行動力1）。`); }
      else { b.done = true; b.result = "dropped"; report.push(`${b.name}は会期切れで廃案になった。`); learn("国会法 第68条（会期不継続の原則）", "会期切れ"); }
    }
  }

  /* ---------- 人物との付き合い ---------- */
  E.meetTalk = function (id) {
    if (G.player.ap < 1 || G.player.money < 30) return null;
    G.player.ap -= 1; G.player.money -= 30;
    const d = 6 + Math.round(G.player.stats.kou / 25);
    namedRel(id, d, "会食した");
    if (NAMED[id].faction && G.facs[NAMED[id].faction]) G.facs[NAMED[id].faction].rel = clamp(G.facs[NAMED[id].faction].rel + 3, 0, 100);
    if (NAMED[id].group) G.groups[NAMED[id].group].rel = clamp(G.groups[NAMED[id].group].rel + 4, 0, 100);
    if (NAMED[id].ministry) G.ministries[NAMED[id].ministry].rel = clamp(G.ministries[NAMED[id].ministry].rel + 4, 0, 100);
    if (NAMED[id].media) G.media[NAMED[id].media].rel = clamp(G.media[NAMED[id].media].rel + 4, 0, 100);
    log(`${NAMED[id].name}と会食した。`, "mine");
    return `${NAMED[id].name}と会食した。関係 +${d}。`;
  };
  E.meetGive = function (id) {
    const n = NAMED[id], g = n.give, P = G.player;
    if (!g || G.player.ap < 1) return null;
    if (g.kind === "money" && P.money < g.amount) return null;
    if (g.kind === "ap" && P.ap < 2) return null;
    P.ap -= 1;
    if (g.kind === "money") P.money -= g.amount;
    if (g.kind === "ap") P.ap -= 1;
    if (g.kind === "risk") { addRisk(g.amount); P.integrity = clamp(P.integrity - 5, 0, 100); }
    if (g.kind === "amakudari") { P.integrity = clamp(P.integrity - 4, 0, 100); addRisk(3); }
    if (g.kind === "leak_info") { addRisk(g.amount); }
    if (g.kind === "stance") { E.setStance(g.issue, (P.stances[g.issue] || 0) === 0 ? g.dir : P.stances[g.issue] + g.dir * (Math.sign(P.stances[g.issue]) === g.dir ? 0 : 2)); P.stances[g.issue] = clamp(P.stances[g.issue], -2, 2); }
    if (g.kind === "works_req") { P.budget = Math.max(0, P.budget - 30); }
    if (g.kind === "concede") { G.cabinet.support = clamp(G.cabinet.support - 1, 5, 80); }
    G.named[id].owed += 1; namedRel(id, 8, g.text);
    log(`${g.text}（${n.name}への貸し）`, g.kind === "risk" || g.kind === "amakudari" ? "shady" : "mine");
    return g.text;
  };
  E.meetAsk = function (id) {
    const n = NAMED[id], a = n.ask, P = G.player, st = G.named[id];
    if (!a || st.owed < 1) return null;
    st.owed -= 1;
    switch (a.kind) {
      case "money": P.money += a.amount; break;
      case "faction_rel": for (const f of activeFacs()) if (f !== G.pf && partyOf(f) === playerParty()) G.facs[f].rel = clamp(G.facs[f].rel + a.amount, 0, 100); break;
      case "members": { const c = Object.values(G.chars).find(c => c.fac === "ookouchi" && !c.role && !c.isPlayer); if (c) { moveChar(c, G.pf); c.loyalty = 60; } break; }
      case "bill_stage": { const b = G.bills.find(b => !b.done); if (b) b.bonus += 0.6; break; }
      case "budget": P.budget += a.amount; break;
      case "works_free": P.freeWorks += 1; break;
      case "kill_story": P.killStory += 1; break;
      case "leak_rival": { const f = activeFacs().filter(f => f !== G.pf).sort((x, y) => G.facs[y].risk - G.facs[x].risk)[0]; if (f) { G.facs[f].fame = clamp(G.facs[f].fame - 10, 5, 100); G.facs[f].risk = clamp(G.facs[f].risk - 10, 0, 100); if (G.cabinet.pm === f) G.cabinet.support = clamp(G.cabinet.support - 5, 5, 80); } break; }
      case "fame": P.fame = clamp(P.fame + a.amount, 0, 100); break;
      case "credit": P.creditBonus += a.amount; break;
      case "votes": G.prefs[P.home].jiban = clamp(G.prefs[P.home].jiban + a.amount * 2, 0, 100); for (const p of D.prefs) { G.prefs[p.id].sup[playerParty()] += a.amount * 0.3; normalize(G.prefs[p.id].sup); } break;
      case "jiban": G.prefs[P.home].jiban = clamp(G.prefs[P.home].jiban + a.amount, 0, 100); break;
      case "candidate_free": P.freeCandidate += 1; break;
      case "post": if (P.post < 3 && isRuling() && !isPM()) P.post += 1; break;
      case "upper_vote": P.upperVote = true; break;
      case "leader_votes": P.elderVotes = (P.elderVotes || 0) + a.amount; break;
    }
    remember(id, "貸しを返した");
    log(a.text, "mine");
    return a.text;
  };

  /* ---------- 秘書 ---------- */
  E.secretaryCandidates = function () {
    const out = [];
    for (let i = 0; i < 3; i++) {
      const gender = rnd() < 0.4 ? "f" : "m";
      const traits = [pick(W.secretaryTraits).id]; if (rnd() < 0.4) { const t2 = pick(W.secretaryTraits).id; if (!traits.includes(t2)) traits.push(t2); }
      out.push({ id: "s" + (G.nextId++), name: `${pick(D.surnames)} ${pick(gender === "f" ? D.givenF : D.givenM)}`, gender, age: Math.round(rand(28, 58)), traits, loyalty: 60, salary: 30 + (traits.includes("lazy") ? -10 : 0) + (traits.includes("able") ? 15 : 0) });
    }
    G.secCandidates = out; return out;
  };
  E.hireSecretary = function (id) {
    const c = (G.secCandidates || []).find(s => s.id === id); if (!c || G.player.secretaries.length >= 4) return null;
    G.player.secretaries.push(c); G.secCandidates = null; log(`${c.name}を秘書に雇った。`, "mine"); return c;
  };
  E.fireSecretary = function (id) {
    const i = G.player.secretaries.findIndex(s => s.id === id && !s.fixed); if (i < 0) return null;
    const s = G.player.secretaries.splice(i, 1)[0];
    if (s.loyalty < 45 && !s.traits.includes("loyal") && G.player.risk > 20) { G.exSecretary = { name: s.name, t: G.turn }; log(`${s.name}を解雇した。恨みを残したかもしれない。`, "mine"); }
    else log(`${s.name}を解雇した。`, "mine");
    return s;
  };

  /* ---------- 新党 ---------- */
  function foundParty() {
    const ms = members(); const going = ms.filter(c => c.loyalty >= 50);
    if (going.length < 4) return "忠誠の高い仲間が4人に足りず、新党結成は見送った。";
    const oldParty = playerParty();
    G.parties.push("shinto"); G.facs.shinto.active = true; G.facs.shinto.name = `${G.player.surname}新党`; G.facs.shinto.fame = G.player.fame;
    for (const c of going) moveChar(c, "shinto");
    for (const c of ms.filter(c => c.loyalty < 50)) moveChar(c, G.partyLeader[oldParty]);
    moveChar(G.chars.player, "shinto");
    G.facs[G.pf].active = G.pf === "p" ? false : true;
    for (const p of D.prefs) { const st = G.prefs[p.id]; const take = Math.min(st.sup[oldParty] * 0.35, 8 + G.player.fame / 10); st.sup.shinto = take; st.sup[oldParty] -= take; st.base.shinto = take * 0.6; st.base[oldParty] -= take * 0.6; normalize(st.sup); normalize(st.base); }
    G.pf = "shinto"; G.partyLeader.shinto = "shinto"; G.upper.shinto = 0; G.player.post = 5; G.player.ap = post().ap;
    const kouhu = (going.length + 1) * 300; G.player.money += kouhu;
    allocatePR();
    for (const f of activeFacs()) if (partyOf(f) === oldParty) { G.facs[f].mood = "hostile"; G.facs[f].rel = clamp(G.facs[f].rel - 25, 0, 100); G.facs[f].ally = false; }
    extra(`${G.facs.shinto.name} 結成`, `${playerName()}ら${going.length + 1}人が離党。政党交付金の対象に`);
    learn("政党助成法 第2条", "新党結成");
    return `${going.length + 1}人で${G.facs.shinto.name}を結成した。政党交付金${man(kouhu)}が入った。`;
  }

  /* ---------- おすすめと自動 ---------- */
  E.recommend = function (pid) {
    const P = G.player, n = seats(G.pf);
    const can = id => !E.cmdBlock(id, pid);
    if (P.budget >= 50 && can("works")) return { cmd: "works", why: "予算枠が残っている。公共事業を地元に。" };
    if (P.risk >= 60 && can("benkyoukai")) return { cmd: "benkyoukai", why: "発覚リスクが高い。しばらく表の活動に徹して。" };
    if (P.money < 150 && can("kigyou")) return { cmd: "kigyou", why: "資金が心細い。まず企業回りを。" };
    if (can("party")) return { cmd: "party", why: "パーティーが開ける。いちばん効率のいい資金集め。" };
    if (n < 20 && P.money >= 500 && can("youritsu")) return { cmd: "youritsu", why: "仲間を増やす。他党の選挙区に新人を立てましょう。" };
    if (members().some(c => c.loyalty < 40) && can("mochidai")) return { cmd: "mochidai", why: "忠誠の低い仲間がいる。餅代の季節。" };
    if (!P.stanceSet && can("stance")) return { cmd: "stance", why: "公約が決まっていない。団体も有権者も、立場が見えない人は支えない。" };
    if (!G.bills.some(b => !b.done) && can("bill")) return { cmd: "bill", why: "法案を出して実績を作りましょう。" };
    if (can("yuzei")) return { cmd: "yuzei", why: "地盤と支持を固める。" };
    return null;
  };
  E.autoMonth = function () {
    let guard = 0;
    while (G.player.ap > 0 && guard++ < 8) {
      const pid = pick(D.prefs).id;
      const r = E.recommend(rnd() < 0.5 ? G.player.home : pid);
      if (!r) break;
      const c = CMDS[r.cmd];
      if (c.modal) { if (r.cmd === "works") { const w = D.works.filter(x => x.cost <= G.player.budget).sort((a, b) => b.cost - a.cost)[0]; if (w) { E.startWorks(G.player.home, w.id, false); continue; } break; } if (r.cmd === "stance" || r.cmd === "bill") { if (!G.player.stanceSet) { for (const i of W.issues) E.setStance(i.id, facStances(G.partyLeader[playerParty()])[i.id] || (rnd() < 0.5 ? -1 : 1)); } else { const i = pick(W.issues); E.proposeBill(i.id, Math.sign(G.player.stances[i.id] || 1)); } continue; } break; }
      const pidUse = r.cmd === "youritsu" ? (D.prefs.find(p => !E.cmdBlock("youritsu", p.id))?.id || pid) : (r.cmd === "yuzei" || r.cmd === "kigyou") && rnd() < 0.5 ? G.player.home : pid;
      if (E.cmdBlock(r.cmd, pidUse)) break;
      G.tipsSeen[c.tip] = true;
      E.useCmd(r.cmd, pidUse);
    }
  };

  /* ---------- ライバル派閥の思考 ---------- */
  function planLabel(plan) { return { poach: `${facName(G.pf)}から引き抜き`, leak: "あなたの資金問題を週刊誌に", alliance: `${facName(plan.target)}と反主流連合`, block: "あなたの法案を潰す", rest: "様子見", campaign: "地方で遊説" }[plan.type] || "様子見"; }
  E.planLabel = planLabel;
  function aiPlan(f) {
    const fs = G.facs[f], me = seats(G.pf), them = seats(f);
    const threat = (me / Math.max(8, them)) + (G.player.fame - fs.fame) / 100 + (G.player.risk > 40 ? 0.2 : 0);
    const persona = D.factions[f].persona;
    const hostile = fs.mood === "hostile" || threat > 0.7;
    const r = rnd() * diff().ai;
    if (!hostile) return { type: r < 0.3 ? "campaign" : "rest" };
    const options = [];
    if (persona === "schemer") { options.push(["poach", 0.4], ["leak", G.player.risk >= 35 ? 0.4 : 0.05], ["block", 0.2]); }
    else if (persona === "elder") { options.push(["alliance", 0.4], ["block", 0.3], ["poach", 0.2]); }
    else if (persona === "popular") { options.push(["campaign", 0.5], ["poach", 0.2], ["leak", G.player.risk >= 50 ? 0.3 : 0.05]); }
    else options.push(["block", 0.4], ["poach", 0.3]);
    const type = weighted(options, o => o[1])[0];
    const target = activeFacs().find(x => x !== f && x !== G.pf && partyOf(x) === partyOf(f)) || null;
    return { type, target };
  }
  function aiAct(f, report) {
    const fs = G.facs[f]; const plan = fs.plan; fs.plan = aiPlan(f);
    if (!plan) return;
    const ai = diff().ai;
    if (plan.type === "campaign") { for (let i = 0; i < 2; i++) { const p = weighted(D.prefs, x => x.pop); G.prefs[p.id].sup[partyOf(f)] += 0.6 * ai; normalize(G.prefs[p.id].sup); } if (rnd() < 0.3) report.push(`${leaderName(f)}（${facName(f)}）が${pick(D.prefs).name}で講演した。`); }
    if (plan.type === "poach") { const weak = members().filter(c => c.loyalty < 55); if (weak.length) { const c = pick(weak); if (rnd() * 100 < (65 - c.loyalty) * ai) { moveChar(c, f); c.loyalty = 60; report.push(`仲間の${c.name}（${PREF[c.pref].name}）が${facName(f)}に引き抜かれた。${leaderName(f)}は、あなたの動きを警戒している。`); } else report.push(`${facName(f)}があなたの仲間に手を伸ばしたが、${c.name}は断った。`); } }
    if (plan.type === "leak" && G.player.risk >= 30) { if (G.player.killStory > 0) { G.player.killStory--; report.push(`${facName(f)}があなたの資金の話を流したが、相沢が社内で止めた。`); } else { G.player.fame = clamp(G.player.fame - 6, 0, 100); G.player.risk = clamp(G.player.risk - 15, 0, 100); G.prefs[G.player.home].jiban = clamp(G.prefs[G.player.home].jiban - 6, 0, 100); report.push(`週刊真相があなたの政治資金の問題を報じた。情報源は${facName(f)}周辺とみられる。`); extra(`${playerName()}に資金疑惑`, "週刊真相が報道"); } }
    if (plan.type === "alliance" && plan.target) { G.facs[plan.target].ally = false; fs.ally = false; G.facs[plan.target].rel = clamp(G.facs[plan.target].rel - 8, 0, 100); report.push(`${facName(f)}と${facName(plan.target)}が、あなたに対抗する連合を組んだ。`); }
    if (plan.type === "block") { const b = G.bills.find(b => !b.done); if (b) { b.bonus -= 0.25; report.push(`${facName(f)}が${b.name}に反対する構えを見せた。`); } }
  }

  /* ---------- 月を終える ---------- */
  E.endMonth = function () {
    if (G.over || G.phase !== "normal") return null;
    const P = G.player, report = [];
    const d0 = dateOf(G.turn);

    // 公共事業
    for (const p of D.prefs) {
      const st = G.prefs[p.id];
      for (const w of st.works) {
        w.left -= 1;
        if (w.left === 0) {
          const def = D.works.find(x => x.id === w.id), m = P.stats.sei / 60;
          st.econ = clamp(st.econ + def.econ, 0, 100); st.sup[playerParty()] += def.support * m; normalize(st.sup);
          st.jiban = clamp(st.jiban + def.jiban * m, 0, 100); P.fame = clamp(P.fame + 1, 0, 100); P.achievement += 3; G.worksDone++;
          if (!st.built.includes(w.id)) st.built.push(w.id);
          report.push(`${p.name}の${def.name}が完成した。地元は沸いた。`);
          if (def.id === "shinkansen" || def.id === "airport") extra(`${p.name}に${def.name}`, `${playerName()}の肝いり。開業式典に地元が沸く`);
        }
      }
      st.works = st.works.filter(w => w.left > 0);
    }

    // 法案
    advanceBills(report);
    if (d0.m === 6) sessionEnd(report);

    // 収入と支出
    const income = Math.round((20 + P.fame * 0.6 + secBonus("money")) * diff().money);
    P.fame = clamp(P.fame - (P.fame > 50 ? 1 : 0.3), 0, 100);
    const groupMoney = W.groups.reduce((t, g) => t + (G.groups[g.id].rel >= 70 ? g.money / 4 : 0), 0);
    const salary = P.secretaries.reduce((t, s) => t + s.salary, 0);
    const interest = Math.round(P.debt * 0.004);
    P.money += income + groupMoney - salary - interest;
    report.push(`収入 ${man(income + groupMoney)}（献金・交付金${groupMoney ? "・団体" : ""}）、支出 ${man(salary + interest)}（秘書の給与${interest ? "・利息" : ""}）。`);

    // 仲間の忠誠と秘書
    for (const c of members()) { c.loyalty = clamp(c.loyalty - 1.5 - (P.money < 0 ? 5 : 0) + (P.fame > 60 ? 0.5 : 0), 0, 100); if (c.loyalty < 22 && rnd() < 0.25) { const to = activeFacs().find(f => f !== G.pf && partyOf(f) === playerParty()) || activeFacs().find(f => f !== G.pf); moveChar(c, to); c.loyalty = 60; report.push(`仲間の${c.name}が見切りをつけて${facName(to)}へ移った。`); } }
    for (const s of P.secretaries) { if (s.fixed) continue; s.loyalty = clamp(s.loyalty + (P.money < 0 ? -6 : 1), 0, 100); if (s.traits.includes("risky") && rnd() < 0.04) addRisk(3); }
    if (G.exSecretary && rnd() < 0.15 && P.risk > 25) { P.fame = clamp(P.fame - 8, 0, 100); P.risk = clamp(P.risk - 20, 0, 100); report.push(`元秘書の${G.exSecretary.name}が週刊誌に「帳簿の実態」を告発した。`); extra("元秘書が告発", `${playerName()}事務所の資金処理を証言`); G.exSecretary = null; }

    // 団体・官庁・メディア
    for (const g of W.groups) { const s = P.stances[g.issue] || 0; const gs = G.groups[g.id]; gs.rel = clamp(gs.rel + (s === 0 ? -0.3 : Math.sign(s) === Math.sign(g.want) ? 1.5 : -2), 0, 100); }
    for (const m of W.ministries) G.ministries[m.id].rel = clamp(G.ministries[m.id].rel + (50 - G.ministries[m.id].rel) * 0.03 + (isPM() ? 0.5 : 0), 0, 100);
    for (const m of W.media) G.media[m.id].rel = clamp(G.media[m.id].rel + (50 - G.media[m.id].rel) * 0.03, 0, 100);
    P.consistency = clamp(P.consistency + 0.5, 0, 100);

    // ライバル
    for (const f of activeFacs()) if (f !== G.pf) { aiAct(f, report); G.facs[f].risk = clamp(G.facs[f].risk + rand(0, 1.0), 0, 100); if (G.facs[f].mood === "hostile" && rnd() < 0.05) G.facs[f].mood = "neutral"; }
    for (const party of G.parties) if (!rulingParties().includes(party)) { const boost = G.cabinet.support < 35 ? 1.2 : 0.6; for (let i = 0; i < 2; i++) { const p = weighted(D.prefs, x => x.pop); G.prefs[p.id].sup[party] += boost; normalize(G.prefs[p.id].sup); } }

    // 国の指標と支持率
    const N = G.nation;
    N.econ = clamp(N.econ + (50 - N.econ) * 0.02 + rand(-1, 1), 0, 100);
    N.price = clamp(N.price + rand(-0.8, 0.8) + (N.econ > 60 ? 0.2 : 0), 0, 100);
    N.debt = clamp(N.debt + 0.15, 0, 100);
    N.birth = clamp(N.birth - 0.05 + rand(-0.3, 0.3), 0, 100);
    const cs = G.cabinet;
    const target = 41 + (N.econ - 50) * 0.3 - (N.price - 55) * 0.3 + (isPM() ? (P.fame - 50) * 0.1 : 0);
    cs.support = clamp(cs.support + (target - cs.support) * 0.06 + rand(-1.6, 1.6), 5, 80);
    G.supportHist.push(Math.round(cs.support)); G.supportHist = G.supportHist.slice(-60);
    for (const p of D.prefs) { const st = G.prefs[p.id]; for (const k of G.parties) st.sup[k] += ((st.base[k] || 0) - st.sup[k]) * 0.05; st.sup[pmParty()] += (cs.support - 40) * 0.03; normalize(st.sup); }

    // スキャンダル
    const mediaShield = 1 - (G.media.shinso.rel - 50) / 150;
    if (rnd() < P.risk / 400 * mediaShield * diff().risk) {
      if (P.risk >= 75) G.over = { kind: "arrest", title: "逮捕", text: "東京地検特捜部が事務所に入った。帳簿に載らないお金の流れは、すべて押さえられていた。国会会期中のため逮捕許諾請求が出され、可決された。" };
      else if (P.killStory > 0) { P.killStory--; report.push("あなたの資金問題を追っていた記事は、土壇場で見送られた。番記者の相沢に借りを返してもらった。"); }
      else { P.fame = clamp(P.fame - 8, 0, 100); P.risk = clamp(P.risk - 25, 0, 100); G.prefs[P.home].jiban = clamp(G.prefs[P.home].jiban - 8, 0, 100); members().forEach(c => c.loyalty = clamp(c.loyalty - 10, 0, 100)); if (isPM()) cs.support = clamp(cs.support - 8, 5, 80); report.push("週刊真相があなたの政治資金の問題を報じた。知名度と仲間の忠誠が下がった。"); extra(`${playerName()}に資金疑惑`, "週刊真相が報道。事務所は「適正に処理している」"); queue({ kind: "scandal" }); }
    }
    E.ministerScandalCheck(report);
    for (const f of activeFacs()) if (f !== G.pf && rnd() < G.facs[f].risk / 700) { G.facs[f].fame = clamp(G.facs[f].fame - 8, 5, 100); G.facs[f].risk = clamp(G.facs[f].risk - 20, 0, 100); if (cs.pm === f) cs.support = clamp(cs.support - 5, 5, 80); report.push(`${facName(f)}の議員に政治資金の不記載が発覚した。`); }

    // 月を進める
    G.turn += 1;
    const d = dateOf(G.turn);
    if (G.partyCooldown > 0) G.partyCooldown -= 1;
    if (d.m === 4) { P.budget = post().budget + (P.type === "policy" ? 50 : 0) + Math.round((G.ministries.mlit.rel - 50) / 2); report.push(`新年度予算が成立。公共事業の予算枠 ${P.budget}億円。`); if (isPM()) { G.pendingBudget = true; } }
    P.ap = post().ap + secBonus("ap");
    if (isPM()) G.monthsAsPM += 1;
    if (P.mood !== "neutral" && rnd() < 0.5) P.mood = "neutral";

    // 解散（AIの首相）
    if (!isPM() && G.turn < G.nextElection - 1) {
      const since = G.turn - G.lastElection;
      if ((since >= 20 && cs.support >= 45 && rnd() < 0.12) || since >= 46) { G.nextElection = G.turn + 1; report.push("首相が衆議院を解散した。数日前まで「解散は考えていない」と語っていた。総選挙は来月。"); extra("衆議院解散", `${leaderName(cs.pm)}首相、「考えていない」の翌週に`); }
    }
    if (isPM() && G.turn - G.lastElection >= 47 && G.nextElection > G.turn + 1) { G.nextElection = G.turn + 1; report.push("衆議院の任期が満了する。来月、総選挙。"); }

    // 退陣
    if (cs.support < 22) G.lowSupport += 1; else G.lowSupport = 0;
    if (G.lowSupport >= 2) {
      if (isPM()) G.over = { kind: "resign", title: "退陣", text: `内閣支持率は${Math.round(cs.support)}%まで落ちた。党内から退陣を求める声が噴き出し、あなたは総理の座を降りた。在任${G.monthsAsPM}か月。` };
      else if (G.nextLeader > G.turn && pmParty() === "kyowa") { report.push(`支持率の低迷を受けて、${leaderName(cs.pm)}首相が退陣を表明した。総裁選が行われる。`); G.nextLeader = G.turn; G.lowSupport = 0; extra(`${leaderName(cs.pm)}首相 退陣表明`, "支持率低迷。後継を選ぶ総裁選へ"); }
      else G.lowSupport = 0;
    }

    // 勝利
    const need = G.pf === "p" ? 24 : 36;
    if (isPM() && G.monthsAsPM >= need && G.wonAsPM && !G.over) G.over = { kind: "win", title: "長期政権", text: `あなたは総理大臣として${G.monthsAsPM}か月を務め上げた。それが良い政治だったかどうかは、歴史が決める。` };

    report.forEach(t => log(t));
    queue({ kind: "report", turn: G.turn - 1, lines: report });
    if (!G.over) {
      if (G.pendingBudget) { G.pendingBudget = false; queue({ kind: "budget" }); }
      if (G.turn >= G.nextElection) queue({ kind: "campaignStart" });
      else if (G.turn >= G.nextUpper) queue({ kind: "upper" });
      else if (G.turn >= G.nextLeader && playerParty() === "kyowa" && facsOf("kyowa").length > 1) queue({ kind: "leaderAsk" });
      else if (G.turn >= G.nextLeader) G.nextLeader = G.turn + 36;
      else { if (isPM() && rnd() < 0.10) queue({ kind: "crisis", id: pick(W.crises).id }); else maybeRandomEvent(); }
    }
    if (G.over) queue({ kind: "over" });
    return report;
  };

  function maybeRandomEvent() {
    const hasWorks = D.prefs.some(p => G.prefs[p.id].works.length);
    const pool = D.events.filter(e => {
      const n = e.needs || {};
      if (n.works && !hasWorks) return false;
      if (n.fame && G.player.fame < n.fame) return false;
      if (n.secretaryRisky && !G.player.secretaries.some(s => s.traits.includes("risky"))) return false;
      if (n.lostElection) return false;
      if (e.id === "norma" && playerParty() !== "kyowa") return false;
      return rnd() < e.chance;
    });
    if (!pool.length) return;
    const e = pick(pool);
    let pref = e.needs?.works ? pick(D.prefs.filter(p => G.prefs[p.id].works.length)) : weighted(D.prefs, x => x.pop);
    if (e.id === "gouu" && rnd() < 0.4) pref = PREF[G.player.home];
    const ev = { kind: "event", id: e.id, pref: pref.id };
    if (e.id === "demand") { const g = pick(W.groups); ev.group = g.id; }
    queue(ev);
  }
  E.eventText = function (ev) {
    const e = D.events.find(x => x.id === ev.id);
    let text = e.text.replace("{pref}", PREF[ev.pref].name);
    if (ev.group) { const g = W.groups.find(x => x.id === ev.group); text = text.replace("{group}", g.name).replace("{leader}", NAMED[g.leader].name).replace("{issue}", ISSUE[g.issue].name); }
    return text;
  };
  E.applyEventChoice = function (ev, choice) {
    const P = G.player, st = G.prefs[ev.pref], e = choice.effects || {}, def = D.events.find(x => x.id === ev.id);
    if (e.money) P.money += e.money;
    if (e.fame) P.fame = clamp(P.fame + e.fame, 0, 100);
    if (e.risk) addRisk(e.risk);
    if (e.integrity) P.integrity = clamp(P.integrity + e.integrity, 0, 100);
    if (e.budget) P.budget += e.budget;
    if (e.cabinet) G.cabinet.support = clamp(G.cabinet.support + e.cabinet, 5, 80);
    if (e.prefKyowa) { st.sup[playerParty()] += e.prefKyowa; normalize(st.sup); }
    if (e.prefJiban) st.jiban = clamp(st.jiban + e.prefJiban, 0, 100);
    if (e.factionRel) { const f = G.cabinet.pm === G.pf ? activeFacs().find(x => x !== G.pf) : G.cabinet.pm; if (G.facs[f]) G.facs[f].rel = clamp(G.facs[f].rel + e.factionRel, 0, 100); }
    if (e.namedRel) for (const k in e.namedRel) namedRel(k, e.namedRel[k]);
    if (e.ministryRel) for (const k in e.ministryRel) G.ministries[k].rel = clamp(G.ministries[k].rel + e.ministryRel[k], 0, 100);
    if (e.rivalRisk) { const f = activeFacs().find(x => x !== G.pf); if (f) G.facs[f].risk = clamp(G.facs[f].risk + e.rivalRisk, 0, 100); }
    if (e.fire) { const i = P.secretaries.findIndex(s => s.traits.includes("risky")); if (i >= 0) P.secretaries.splice(i, 1); }
    if (e.groupAccept && ev.group) { const g = W.groups.find(x => x.id === ev.group); E.setStance(g.issue, g.want); G.groups[g.id].rel = clamp(G.groups[g.id].rel + 25, 0, 100); namedRel(g.leader, 15); }
    if (e.groupRefuse && ev.group) { const g = W.groups.find(x => x.id === ev.group); G.groups[g.id].rel = clamp(G.groups[g.id].rel - 15, 0, 100); namedRel(g.leader, -10); P.consistency = clamp(P.consistency + 3, 0, 100); }
    if (e.repayAll) { P.money -= P.debt; P.debt = 0; }
    if (e.repayHalf) { P.debt = Math.round(P.debt / 2); G.named.iwaki.iowe += 1; }
    if (e.risk && e.risk > 0) P.integrity = clamp(P.integrity - Math.round(e.risk / 3), 0, 100);
    P.mood = e.risk ? "worried" : e.fame > 0 ? "happy" : "neutral";
    learn(def.law, def.title);
    log(choice.result, e.risk ? "shady" : "mine");
  };
  E.applyCrisis = function (id, idx) {
    const c = W.crises.find(x => x.id === id), ch = c.choices[idx], e = ch.effects;
    if (e.support) G.cabinet.support = clamp(G.cabinet.support + e.support, 5, 80);
    for (const k of ["econ", "debt", "price", "birth"]) if (e[k]) G.nation[k] = clamp(G.nation[k] + e[k], 0, 100);
    if (e.achievement) G.player.achievement += e.achievement;
    if (e.cabinetRel) for (const f of activeFacs()) if (f !== G.pf) G.facs[f].rel = clamp(G.facs[f].rel + e.cabinetRel, 0, 100);
    if (e.issueShift) for (const k in e.issueShift) for (const p of D.prefs) G.prefs[p.id].lean[k] = (G.prefs[p.id].lean[k] || 0) + e.issueShift[k] * 0.3;
    learn(c.law, c.title);
    log(`${c.title}：${ch.result}`, "big");
  };

  /* ---------- 内閣・予算（総理） ---------- */
  function makeCabinet(strategy) {
    const ministers = [];
    const fs = activeFacs().filter(f => rulingParties().includes(partyOf(f)));
    const names = ["官房長官", "財務大臣", "外務大臣", "経済産業大臣", "厚生労働大臣", "国土交通大臣", "防衛大臣", "総務大臣", "文部科学大臣", "農林水産大臣"];
    for (const n of names) {
      let f;
      if (strategy === "balance") f = weighted(fs, x => seats(x) + 1);
      else if (strategy === "reward") f = weighted(fs, x => (G.facs[x].ally ? 40 : 5) + seats(x) / 4);
      else if (strategy === "merit") f = weighted(fs, x => seats(x) / 2 + 10);
      else f = weighted(fs, x => x === G.cabinet.pm ? 60 : 5);
      const c = Object.values(G.chars).find(c => c.fac === f && !c.role && !c.isPlayer && !ministers.some(m => m.char === c.id)) || null;
      ministers.push({ post: n, fac: f, char: c ? c.id : null, name: c ? c.name : leaderName(f), risk: Math.round(rand(0, 60) + (G.facs[f].risk || 0) / 3), checked: false });
    }
    G.cabinet.ministers = ministers; G.cabinet.strategy = strategy;
  }
  E.formCabinet = function (strategy, check) {
    makeCabinet(strategy);
    G.pendingCabinet = false;
    if (check) { for (const m of G.cabinet.ministers) { m.checked = true; if (m.risk > 55) { m.risk = 10; m.name += "（差し替え）"; } } }
    for (const f of activeFacs()) if (f !== G.pf) { const n = G.cabinet.ministers.filter(m => m.fac === f).length; G.facs[f].rel = clamp(G.facs[f].rel + (n >= 2 ? 8 : n === 1 ? 2 : -10), 0, 100); if (n === 0 && rulingParties().includes(partyOf(f))) G.facs[f].mood = "hostile"; }
    if (strategy === "inner") G.cabinet.support = clamp(G.cabinet.support - 4, 5, 80);
    if (strategy === "merit") G.cabinet.support = clamp(G.cabinet.support + 4, 5, 80);
    log(`組閣。${{ balance: "派閥均衡", reward: "論功行賞", merit: "適材適所", inner: "身内固め" }[strategy]}の布陣${check ? "。全員の身体検査を済ませた" : ""}。`, "big");
    learn(D.tips.cabinet.law, "組閣");
    return G.cabinet.ministers;
  };
  E.ministerScandalCheck = function (report) {
    if (!isPM()) return;
    const m = G.cabinet.ministers.find(m => !m.checked && m.risk > 55 && rnd() < 0.15);
    if (m) { m.checked = true; m.risk = 0; G.cabinet.support = clamp(G.cabinet.support - 6, 5, 80); report.push(`${m.post}の${m.name}に政治資金疑惑が発覚し、辞任した。身体検査を怠ったツケ。`); extra(`${m.post}が辞任`, "政治資金の不記載。野党「任命責任」"); }
  };
  E.applyBudget = function (alloc) {
    const N = G.nation, P = G.player; const pts = alloc;
    N.econ = clamp(N.econ + pts.keiki * 1.2 - pts.zaisei * 0.5, 0, 100);
    N.birth = clamp(N.birth + pts.kosodate * 1.0, 0, 100);
    N.debt = clamp(N.debt + (pts.keiki + pts.kosodate + pts.bouei + pts.chihou) * 0.5 - pts.zaisei * 2, 0, 100);
    P.budget += pts.chihou * 60;
    for (const p of D.prefs) { const st = G.prefs[p.id]; st.sup[pmParty()] += (st.lean.chihou > 0 ? pts.chihou : 0) * 0.4 + (st.lean.kosodate < 0 ? pts.kosodate : 0) * 0.4 + (st.lean.bouei > 0 ? pts.bouei : 0) * 0.3 - pts.zaisei * 0.2; normalize(st.sup); }
    G.cabinet.support = clamp(G.cabinet.support + pts.keiki * 0.6 + pts.kosodate * 0.5 - pts.zaisei * 0.8, 5, 80);
    G.ministries.mof.rel = clamp(G.ministries.mof.rel + pts.zaisei * 4 - 6, 0, 100);
    P.achievement += 3;
    log(`予算編成：景気${pts.keiki}・子育て${pts.kosodate}・防衛${pts.bouei}・地方${pts.chihou}・財政再建${pts.zaisei}。`, "big");
    learn(D.tips.budget.law, "予算編成");
  };

  /* ---------- 評価 ---------- */
  E.evaluate = function () {
    const P = G.player, N = G.nation, N0 = G.nationStart;
    const integrity = Math.round(P.integrity);
    const achievement = Math.round(clamp(P.achievement + G.monthsAsPM * 0.8, 0, 100));
    const avgSup = G.supportHist.length ? G.supportHist.reduce((a, b) => a + b, 0) / G.supportHist.length : G.cabinet.support;
    const nationDelta = (N.econ - N0.econ) - (N.price - N0.price) * 0.5 - (N.debt - N0.debt) * 0.5 + (N.birth - N0.birth);
    const popularity = Math.round(clamp(avgSup + nationDelta + P.fame / 4, 0, 100));
    const pickText = (arr, v) => arr.find(([min]) => v >= min)[1];
    const title = G.over?.kind === "win" ? (integrity >= 70 && achievement >= 60 ? "名宰相" : integrity < 40 ? "闇将軍" : achievement >= 60 ? "改革の宰相" : "長期政権の主") : G.over?.kind === "arrest" ? "獄中の政治家" : G.over?.kind === "resign" ? "短命政権" : G.over?.kind === "lose" ? "ただの人" : "道半ば";
    const text = `${playerName()}（${G.startYear}年に${G.pf === "p" ? "初当選" : facName(G.pf) + "を率いて登場"}）。${pickText(W.evaluation.integrity, integrity)}${pickText(W.evaluation.achievement, achievement)}${pickText(W.evaluation.popularity, popularity)}${G.monthsAsPM ? `総理在任は${G.monthsAsPM}か月。` : ""}成立させた法律は${G.passed.length}本、完成させた公共事業は${G.worksDone}件。`;
    return { integrity, achievement, popularity, title, text };
  };
})();
