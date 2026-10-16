// 『永田町への道 天下取り』 画面
(() => {
  const T = globalThis.Tenka, D = T.D, W = T.W, E = T.E, FX = T.FX;
  const { PREF, NAMED, ISSUE } = E;
  const G = () => T.G;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const man = E.man;
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => matchMedia("(max-width: 959px)").matches;
  const GLOSS = () => Object.assign({}, (globalThis.STORY && globalThis.STORY.glossary) || {}, EXTRA_GLOSS);
  const EXTRA_GLOSS = {
    "派閥": { omote: "党内の議員グループ。", ura: "カネ、ポスト、総裁選の数を握る。解散を表明しても人のつながりは残る。" },
    "餅代・氷代": { omote: "派閥が所属議員に配る活動資金。年末が餅代、夏が氷代。", ura: "記載すれば合法。配れないボスに人はついてこない。" },
    "箇所付け": { omote: "予算をどの地域のどの事業に配るか決めること。", ura: "地元に持ち帰れば票になる。業者からの献金もついてくる。" },
    "ねじれ国会": { omote: "衆議院と参議院で多数派が違う状態。", ura: "予算は通るが予算関連法案が通らず、政権は行き詰まる。" },
    "総裁選": { omote: "与党の党首を選ぶ選挙。議員票と党員票で争う。", ura: "勝負は告示前の多数派工作で決まる。決選投票の朝に寝返るのも作法。" },
    "身体検査": { omote: "入閣前に、スキャンダルの種がないか調べること。", ura: "怠ると数か月後に辞任ドミノが来る。" },
    "国対": { omote: "国会対策委員会。国会運営を担う。", ura: "与野党の国対委員長が裏で日程を「握る」。" },
    "天下り": { omote: "退職した官僚が関連団体や企業に再就職すること。", ura: "断った議員の陳情は、不思議と後回しになる。" },
    "番記者": { omote: "特定の政治家に張り付く記者。", ura: "夜討ち朝駆けで本音を探る。オフレコは「書かない」約束で「忘れる」約束ではない。" },
    "政党交付金": { omote: "国が政党に配る政治資金。議員5人以上などが要件。", ura: "5人集めれば新党に交付金が出る。" },
    "惜敗率": { omote: "小選挙区の当選者の得票に対する自分の得票の割合。", ura: "比例復活の命綱。" },
    "連立": { omote: "複数の政党で政権をつくること。", ura: "小政党がキャスティングボートを握る。" },
  };

  const ui = { tab: "pref", mode: "party", sel: null, modal: null, toast: null, counting: null, flashExtra: null,
    setup: { scenario: "gendai", faction: "p", surname: "汐見", given: "健", gender: "m", type: "orator", home: null, difficulty: "normal", carry: true } };
  const SLOT = n => `tenka-slot-${n}`;
  const AUTO = "tenka-auto";

  /* ---------- セーブ ---------- */
  function save(slot = AUTO) { try { localStorage.setItem(slot, E.serialize()); } catch (e) {} }
  function loadSlot(slot) { try { const r = localStorage.getItem(slot); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function slotMeta(slot) { const g = loadSlot(slot); if (!g || g.v !== E.SAVE_VERSION) return null; return { name: `${g.player.surname} ${g.player.given}`, date: `${g.startYear + Math.floor((g.turn) / 12)}年${(g.turn % 12) + 1}月`, fac: g.facs[g.pf]?.name, over: !!g.over }; }
  function storyCarry() { try { const r = localStorage.getItem("nagatacho-save-v3"); if (!r) return null; const s = JSON.parse(r); if (!s.route) return null; return { route: s.route, knowledge: s.stats?.knowledge || 0 }; } catch (e) { return null; } }

  /* ---------- 共通部品 ---------- */
  const portrait = (seed, o) => FX.portrait(seed, o);
  function playerPortrait(size = 64) { const g = G(); return portrait(g.player.seed, { gender: g.player.gender, age: 41 + Math.floor(g.turn / 12), color: E.facColor(g.pf), size, mood: g.player.mood }); }
  function namedPortrait(id, size = 48, mood) { const n = NAMED[id]; const r = G().named[id]; const m = mood || (r.rel >= 70 ? "happy" : r.rel <= 30 ? "angry" : "neutral"); return portrait(id, { gender: n.gender, age: n.age, color: n.color, size, badge: !!n.faction, mood: m }); }
  function speakerBox(id, text, label) {
    const n = NAMED[id] || NAMED.hayase;
    return `<div class="speaker">${namedPortrait(n.id, 56)}<div><b>${esc(label || n.name)}</b><small>${esc(n.role)}</small><p>${esc(text)}</p></div></div>`;
  }
  const mentor = text => speakerBox("hayase", text);
  function deltaChips(obj) {
    const L = { sup: "支持", jiban: "地盤", fame: "知名度", money: "資金", risk: "発覚リスク", loyalty: "忠誠" };
    return Object.entries(obj || {}).filter(([, v]) => v).map(([k, v]) => `<span class="delta ${v > 0 ? (k === "risk" ? "down" : "up") : (k === "risk" ? "up" : "down")}">${L[k] || k} ${v > 0 ? "+" : ""}${v}${k === "money" ? "万円" : ""}</span>`).join("");
  }
  function bar(v, color, max = 100) { return `<span class="bar"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%;background:${color}"></i></span>`; }
  const partyPattern = p => D.parties[p].pattern;

  /* ---------- 開始画面 ---------- */
  function renderSetup() {
    const s = ui.setup, carry = storyCarry();
    const scen = W.scenarios.map(x => `<button type="button" class="card${s.scenario === x.id ? " on" : ""}" data-scenario="${x.id}"><b>${esc(x.name)}</b><small>${esc(x.desc)}</small></button>`).join("");
    const facs = Object.entries(D.factions).filter(([, f]) => f.playable).map(([id, f]) => {
      const lead = NAMED[f.leader];
      const pic = id === "p" ? portrait(s.surname + s.given + s.gender, { gender: s.gender, age: 41, color: f.color, size: 56 }) : portrait(id, { gender: lead.gender, age: lead.age, color: f.color, size: 56 });
      return `<button type="button" class="card fac${s.faction === id ? " on" : ""}" data-faction="${id}">${pic}<span><b>${esc(id === "p" ? "新人の勉強会" : f.name)}</b><small>${esc(D.parties[f.party].name)}${id !== "p" ? "・領袖として" : ""}</small><small>${esc(f.startDesc)}</small></span></button>`;
    }).join("");
    const types = D.playerTypes.map(t => `<button type="button" class="card${s.type === t.id ? " on" : ""}" data-type="${t.id}"><b>${t.name}</b><small>${t.desc}</small><span class="num">弁舌${t.stats.ben}・政策${t.stats.sei}・交渉${t.stats.kou}</span></button>`).join("");
    const slots = [1, 2, 3].map(n => { const m = slotMeta(SLOT(n)); return `<div class="slot"><span>枠${n}</span>${m ? `<b>${esc(m.name)}（${esc(m.fac)}）${esc(m.date)}${m.over ? "・終了" : ""}</b><button type="button" class="ghost" data-load="${SLOT(n)}">読み込む</button>` : `<b class="muted">空き</b>`}</div>`; }).join("");
    const auto = slotMeta(AUTO);
    return `${FX.defs}<div class="setup">
      <header class="title"><span class="eyebrow">永田町への道</span><h1>天下取り</h1>
        <p>現代日本を舞台にした政治戦略ゲーム。派閥を育て、総裁選を勝ち、総理大臣として総選挙に勝つ。表のルールと裏のルールを、秘書の早瀬があなたに教える。</p>
        <div class="row">${auto && !auto.over ? `<button class="primary" type="button" data-load="${AUTO}">つづきから（${esc(auto.name)}・${esc(auto.date)}）</button>` : ""}<a class="ghost" href="monogatari.html">物語モード（18歳からの前日譚）</a></div>
      </header>
      <section class="setup-grid">
        <div class="setup-col">
          <h2>時代</h2><div class="cards">${scen}</div>
          <h2>どの勢力で始めるか</h2><div class="cards">${facs}</div>
          <h2>あなた</h2>
          <div class="who">${portrait(s.surname + s.given + s.gender, { gender: s.gender, age: 41, color: D.factions[s.faction].color, size: 96 })}
            <div class="who-fields"><label for="sn">姓</label><input id="sn" value="${esc(s.surname)}" maxlength="6" data-field="surname"><label for="gn">名</label><input id="gn" value="${esc(s.given)}" maxlength="6" data-field="given">
            <div class="segs"><button type="button" class="seg${s.gender === "m" ? " on" : ""}" data-gender="m">男性</button><button type="button" class="seg${s.gender === "f" ? " on" : ""}" data-gender="f">女性</button></div></div></div>
          <div class="cards">${types}</div>
          <h2>難易度</h2><div class="segs">${[["easy", "やさしい"], ["normal", "ふつう"], ["hard", "難しい"]].map(([k, l]) => `<button type="button" class="seg${s.difficulty === k ? " on" : ""}" data-diff="${k}">${l}</button>`).join("")}</div>
          ${carry ? `<label class="check"><input type="checkbox" id="carry" ${s.carry ? "checked" : ""} data-carry="1"> 物語モードの結末（${{ clean: "清廉の秘書", insider: "金庫番", outsider: "外からの挑戦者" }[carry.route]}）を引き継ぐ</label>` : ""}
        </div>
        <div class="setup-col">
          <h2>地元の選挙区 <small>${s.home ? esc(PREF[s.home].name) : "地図から選ぶ"}</small></h2>
          <div class="map-box">${mapSVG({ choose: true })}</div>
          <button class="primary big" type="button" data-act="start" ${s.home ? "" : "disabled"}>${s.home ? `${esc(PREF[s.home].name)}から始める` : "地元を選んでください"}</button>
          <h2>セーブ</h2><div class="slots">${slots}</div>
          <details><summary>セーブコードを読み込む</summary><textarea id="importCode" rows="3" placeholder="別の端末で書き出したコードを貼り付け"></textarea><button type="button" class="ghost" data-act="import">読み込む</button></details>
        </div>
      </section></div>`;
  }

  /* ---------- 地図 ---------- */
  const TILE = 44, GAP = 4;
  function tileColor(p) {
    const g = G(), st = g.prefs[p.id];
    if (ui.mode === "jiban") return { fill: E.facColor(g.pf), op: 0.12 + st.jiban / 100 * 0.88 };
    if (ui.mode === "josei" && g.campaign) { const s = E.prefStatus(p.id); if (!s) return { fill: "#2a3242", op: 1 }; return { fill: s.p >= 0.62 ? "#5aa17a" : s.p >= 0.4 ? "#d4b04c" : "#c4524a", op: 0.9 }; }
    if (ui.mode === "issue" && ui.issue) { const l = st.lean[ui.issue] || 0; return { fill: l < 0 ? "#4a78c8" : l > 0 ? "#c4524a" : "#3a4252", op: 0.3 + Math.min(1, Math.abs(l)) * 0.7 }; }
    const count = {};
    for (const d of st.districts) { const f = districtFac(p.id, d); const k = ui.mode === "party" ? E.partyOf(f) : f; count[k] = (count[k] || 0) + 1; }
    const keys = Object.keys(count).sort((a, b) => count[b] - count[a]);
    const k = keys[0];
    if (!k) return { fill: "#3a4252", op: .6 };
    return { fill: ui.mode === "party" ? D.parties[k].color : E.facColor(k), op: 0.4 + 0.6 * count[k] / st.districts.length, pattern: ui.mode === "party" ? partyPattern(k) : partyPattern(E.partyOf(k)) };
  }
  function districtFac(pid, d) {
    if (!ui.counting) return d.fac;
    const r = ui.counting.res.results.find(x => x.pref === pid && x.idx === G().prefs[pid].districts.indexOf(d));
    if (!r) return d.fac;
    return ui.counting.revealed.has(r.pref + ":" + r.idx) ? r.winner.fac : r.prev;
  }
  function mapSVG({ choose = false } = {}) {
    const W_ = 13 * (TILE + GAP), H = 12 * (TILE + GAP);
    const g = G();
    const tiles = D.prefs.map(p => {
      const x = p.c * (TILE + GAP), y = p.r * (TILE + GAP);
      const sel = (choose ? ui.setup.home : ui.sel) === p.id;
      let fill = "#2a3242", op = 1, extra = "", pattern = null;
      if (!choose) {
        const c = tileColor(p); fill = c.fill; op = c.op; pattern = c.pattern;
        const st = g.prefs[p.id], n = st.districts.length;
        let bx = x + 4; const bw = TILE - 8;
        const order = ui.mode === "party" ? g.parties : E.activeFacs();
        for (const k of order) {
          const cnt = st.districts.filter(d => (ui.mode === "party" ? E.partyOf(districtFac(p.id, d)) : districtFac(p.id, d)) === k).length;
          if (!cnt) continue; const w = bw * cnt / n;
          extra += `<rect x="${bx}" y="${y + TILE - 7}" width="${w}" height="3" fill="${ui.mode === "party" ? D.parties[k].color : E.facColor(k)}"/>`; bx += w;
        }
        const icons = st.built.slice(-2).map(id => D.works.find(w => w.id === id)?.icon).filter(Boolean);
        icons.forEach((ic, i) => extra += FX.icon(ic, x + 3 + i * 11, y + 3, 9));
        if (st.works.length) extra += FX.icon("works", x + TILE - 11, y + 3);
        if (ui.mode === "josei" && g.campaign) { const s = E.prefStatus(p.id); if (s) extra += `<text x="${x + TILE / 2}" y="${y + TILE - 10}" font-size="8" text-anchor="middle" class="tile-sub">${s.label}</text>`; }
      }
      const home = !choose && g && g.player.home === p.id;
      const fs = p.short.length >= 3 ? 10 : 12;
      return `<g class="tile${sel ? " sel" : ""}" data-pref="${p.id}" tabindex="0" role="button" aria-label="${p.name}">
        <rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="6" fill="${fill}" fill-opacity="${op}"/>
        ${pattern && pattern !== "solid" ? `<rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="6" fill="url(#pat-${pattern})"/>` : ""}
        <rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="6" fill="none" class="tile-edge"/>
        ${extra}${home ? `<circle cx="${x + TILE - 7}" cy="${y + 7}" r="3.5" fill="#d4b04c" stroke="#1a1f29" stroke-width="1"/>` : ""}
        <text x="${x + TILE / 2}" y="${y + TILE / 2 + 2}" font-size="${fs}" text-anchor="middle" class="tile-label">${p.short}</text></g>`;
    }).join("");
    return `<svg viewBox="-4 -4 ${W_ + 4} ${H + 4}" class="map" role="group" aria-label="日本地図">${tiles}</svg>`;
  }

  /* ---------- HUD ---------- */
  function hud() {
    const g = G(), P = g.player;
    const dots = Array.from({ length: Math.max(P.ap, E.post().ap) }, (_, i) => `<span class="ap${i < P.ap ? " on" : ""}"></span>`).join("");
    const nl = E.dateOf(g.nextLeader);
    const next = g.nextElection - g.turn <= 1 ? "来月 総選挙" : g.nextUpper - g.turn <= 1 ? "来月 参院選" : g.playerPartyHasRace !== false && E.playerParty() === "kyowa" ? `総裁選 ${nl.y}.${nl.m}` : `参院選 ${E.dateOf(g.nextUpper).y}.${E.dateOf(g.nextUpper).m}`;
    const N = g.nation;
    return `<header class="hud">
      <div class="hud-row">
        <button type="button" class="me" data-act="me">${playerPortrait(40)}</button>
        <div class="hud-date"><b>${E.dateStr(g.turn)}</b><span>${esc(E.post().name)}・当選${P.terms}回・${esc(E.facName(g.pf))}</span></div>
        <div class="hud-ap" aria-label="行動力 ${P.ap}">${dots}<small>行動力</small></div>
        ${g.phase === "normal" ? `<button class="end" type="button" data-act="end">月を終える</button><button class="ghost small" type="button" data-act="auto3" title="早瀬のおすすめで3か月進める">3か月</button>` : `<span class="chip gold">選挙戦</span>`}
        <button class="ghost small" type="button" data-act="menu" aria-label="メニュー">☰</button>
      </div>
      <div class="hud-stats">
        <div><span>資金</span><b class="${P.money < 0 ? "neg" : ""}">${Math.round(P.money).toLocaleString()}<small>万円</small></b></div>
        <div><span>借入</span><b>${P.debt.toLocaleString()}<small>万円</small></b></div>
        <div><span>予算枠</span><b>${P.budget}<small>億円</small></b></div>
        <div><span>知名度</span><b>${Math.round(P.fame)}</b></div>
        <div><span>仲間</span><b>${E.seats(g.pf)}<small>人</small></b></div>
        <div><span>発覚リスク</span><b class="${P.risk >= 50 ? "neg" : ""}">${Math.round(P.risk)}</b></div>
        <div><span>内閣支持率</span><b>${Math.round(g.cabinet.support)}<small>%</small></b></div>
        <div><span>次の山場</span><b class="small">${esc(next)}</b></div>
      </div>
      ${ui.toast ? `<div class="toast" role="status">${esc(ui.toast)}</div>` : ""}
    </header>`;
  }

  /* ---------- 左：地図と勢力 ---------- */
  function powerBars() {
    const g = G();
    const facs = E.activeFacs().map(f => ({ f, n: E.seats(f) }));
    const seg = facs.map(({ f, n }) => `<span style="flex:${n};background:${E.facColor(f)}" title="${esc(E.facName(f))} ${n}"></span>`).join("");
    const legend = facs.map(({ f, n }) => `<li><i style="background:${E.facColor(f)}"></i>${esc(E.facName(f))}<b>${n}</b>${g.facs[f].ally ? "<em>同盟</em>" : ""}</li>`).join("");
    const up = g.parties.map(p => `<span style="flex:${g.upper[p] || 0};background:${D.parties[p].color}" title="${D.parties[p].name} ${g.upper[p]}"></span>`).join("");
    return `<section class="power">
      <div class="power-head"><h2>衆議院</h2><span>定数${E.TOTAL}・過半数${E.MAJORITY}　与党 <b>${E.rulingSeats()}</b></span></div>
      <div class="power-bar">${seg}<em style="left:${E.MAJORITY / E.TOTAL * 100}%"></em></div>
      <ul class="legend">${legend}</ul>
      <div class="power-head"><h2>参議院</h2><span>定数${E.UPPER}　与党 <b>${g.parties.filter(p => g.coalition.includes(p)).reduce((t, p) => t + g.upper[p], 0)}</b>${E.nejire() ? `<em class="neg">ねじれ</em>` : ""}</span></div>
      <div class="power-bar thin">${up}<em style="left:${E.UPPER_MAJ / E.UPPER * 100}%"></em></div>
    </section>`;
  }
  function logPanel(n = 14) {
    return `<section class="log"><h2>情勢</h2><ul>${G().log.slice(0, n).map(l => `<li class="${l.kind}"><time>${E.dateStr(l.t)}</time>${esc(l.text)}</li>`).join("")}</ul></section>`;
  }
  function mapPanel() {
    const g = G();
    const modes = [["party", "政党"], ["faction", "派閥"], ["jiban", "地盤"], ["issue", "争点"]];
    if (g.campaign) modes.unshift(["josei", "情勢"]);
    const segs = modes.map(([m, l]) => `<button type="button" class="seg${ui.mode === m ? " on" : ""}" data-mode="${m}">${l}</button>`).join("");
    const issueSel = ui.mode === "issue" ? `<select data-issue aria-label="争点">${W.issues.map(i => `<option value="${i.id}" ${ui.issue === i.id ? "selected" : ""}>${i.name}</option>`).join("")}</select><p class="muted small">青＝${esc(ISSUE[ui.issue || "keiki"].a)}、赤＝${esc(ISSUE[ui.issue || "keiki"].b)} を好む地域</p>` : "";
    return `<div class="map-head"><h2>日本</h2><div class="segs" role="group" aria-label="地図の色分け">${segs}</div></div>${issueSel}<div class="map-box">${mapSVG()}</div>`;
  }

  /* ---------- 県のパネル ---------- */
  function prefPanel() {
    const g = G(), pid = ui.sel, p = PREF[pid], st = g.prefs[pid], reg = D.regions[p.region], gov = g.chars[st.governor];
    const comps = D.companies.filter(c => c.pref === pid || (c.pref === "home" && pid === g.player.home));
    const sup = g.parties.map(k => `<div class="sup"><span>${D.parties[k].short}</span>${bar(st.sup[k], D.parties[k].color)}<b>${Math.round(st.sup[k])}%</b></div>`).join("");
    const people = st.districts.map((d, i) => { const c = g.chars[d.char], you = d.char === "player"; return `<button type="button" class="person${you ? " you" : ""}" data-char="${d.char}">${you ? playerPortrait(40) : portrait(c.id, { gender: c.gender, age: c.age, color: E.facColor(d.fac), size: 40 })}<span class="person-text"><b>${p.seats > 1 ? `${i + 1}区 ` : ""}${esc(you ? c.name + "（あなた）" : c.name)}</b><small><i style="background:${E.facColor(d.fac)}"></i>${esc(E.facName(d.fac))}${d.fac === g.pf && !you ? `・忠誠${Math.round(c.loyalty)}` : ""}</small></span></button>`; }).join("");
    const works = st.works.map(w => { const def = D.works.find(x => x.id === w.id); return `<li>${esc(def.name)}<span>あと${w.left}か月${w.dango ? "・談合" : ""}</span></li>`; }).join("");
    const built = st.built.map(id => D.works.find(x => x.id === id)?.name).filter(Boolean).join("、");
    const lean = Object.entries(st.lean).filter(([, v]) => Math.abs(v) >= 0.5).map(([k, v]) => `<span class="chip">${ISSUE[k].name}：${esc(v < 0 ? ISSUE[k].a : ISSUE[k].b)}</span>`).join("");
    const cands = g.candidates.filter(c => c.pref === pid).map(c => esc(g.chars[c.char].name)).join("、");
    const status = g.campaign ? E.prefStatus(pid) : null;
    return `<section class="pref">
      <div class="pref-head"><div><span class="eyebrow">${esc(reg.name)}地方</span><h2>${esc(p.name)}</h2></div><div class="row">${status ? `<span class="chip ${status.label === "優勢" ? "good" : status.label === "接戦" ? "gold" : "bad"}">${status.label}</span>` : ""}${pid === g.player.home ? `<span class="chip gold">地元</span>` : ""}</div></div>
      <dl class="facts"><div><dt>人口</dt><dd>${p.pop}<small>万人</small></dd></div><div><dt>小選挙区</dt><dd>${p.seats}</dd></div><div><dt>経済力</dt><dd>${Math.round(st.econ)}</dd></div><div><dt>あなたの地盤</dt><dd>${Math.round(st.jiban)}</dd></div></dl>
      <div class="sups">${sup}</div>
      <div class="governor">${portrait(gov.id, { gender: gov.gender, age: gov.age, color: D.parties[gov.fac].color, badge: false, size: 44 })}<div><small>知事</small><b>${esc(gov.name)}</b><small>${esc(D.parties[gov.fac].name)}系</small></div><div class="assets"><small>地銀</small><b>${esc(reg.bank)}</b><small>主な産業：${esc(p.industry)}</small></div></div>
      ${comps.length ? `<p class="comps"><small>主な企業</small> ${comps.map(c => `${esc(c.name)}<span>（${esc(c.sector)}）</span>`).join("、")}</p>` : ""}
      ${lean ? `<div class="chips"><small>有権者の関心</small>${lean}</div>` : ""}
      ${works ? `<ul class="works"><li class="h">公共事業</li>${works}</ul>` : ""}${built ? `<p class="muted small">完成：${esc(built)}</p>` : ""}
      ${cands ? `<p class="cands">擁立予定：${cands}</p>` : ""}
      <h3>選挙区の議員</h3><div class="people">${people}</div>
    </section>`;
  }
  function commands() {
    const g = G(), pid = ui.sel;
    const rec = E.recommend(pid);
    return `<section class="cmds">
      ${rec ? `<div class="rec">${namedPortrait("hayase", 36, "neutral")}<div><b>早瀬のおすすめ：${esc(E.CMDS[rec.cmd].name)}</b><small>${esc(rec.why)}</small></div></div>` : ""}
      ${E.GROUPS.map(gr => { const list = Object.entries(E.CMDS).filter(([, c]) => c.group === gr && !(c.name === "離党して新党" && g.pf === "shinto")); return `<div class="cmd-group"><h3>${gr}${gr === "地域" ? `<small>${esc(PREF[pid].name)}</small>` : ""}</h3><div class="cmd-grid">${list.map(([id, c]) => {
        const why = E.cmdBlock(id, pid);
        const pv = c.preview && !why ? deltaChips(c.preview(pid)) : "";
        const cost = [c.ap === 0 ? "行動力0" : "", c.cost ? man(c.cost) : ""].filter(Boolean).join("・");
        return `<button type="button" class="cmd${c.shady ? " shady" : ""}${rec && rec.cmd === id ? " is-rec" : ""}" data-cmd="${id}" ${why ? "disabled" : ""}><b>${esc(c.name)}${c.shady ? "<em>裏</em>" : ""}</b><small>${esc(why || c.desc)}</small>${pv ? `<span class="deltas">${pv}</span>` : ""}${cost ? `<span class="num">${cost}</span>` : ""}</button>`;
      }).join("")}</div></div>`; }).join("")}
    </section>`;
  }
  function campaignPanel() {
    const g = G(), c = g.campaign, pid = ui.sel, st = E.prefStatus(pid);
    const mine = c.districts.filter(d => d.pref === pid && d.cands.some(x => x.fac === g.pf));
    const rows = mine.map(d => { const s = E.districtStatus(d); const x = d.cands.find(x => x.fac === g.pf); const name = x.char === "player" ? "あなた" : x.char ? g.chars[x.char].name : "党の新人"; return `<li><span>${PREF[pid].seats > 1 ? d.idx + 1 + "区 " : ""}${esc(name)}</span><b class="${s.label === "優勢" ? "good" : s.label === "接戦" ? "gold" : "bad"}">${s.label} ${Math.round(s.p * 100)}%</b></li>`; }).join("");
    const groups = W.groups.filter(x => g.groups[x.id].rel >= 60).map(x => x.short).join("・");
    return `<section class="campaign">
      <div class="pref-head"><div><span class="eyebrow">選挙戦 ${c.round}/${c.rounds}（${["序盤", "中盤", "終盤"][c.round - 1]}）</span><h2>${esc(PREF[pid].name)}${st ? `　<span class="chip ${st.label === "優勢" ? "good" : st.label === "接戦" ? "gold" : "bad"}">${st.label}</span>` : ""}</h2></div></div>
      <p class="muted">持ち点 <b>${c.ptsLeft}</b>／党首の応援 残り <b>${c.leaderVisits}</b>回／資金 ${man(g.player.money)}。接戦区に集中させるのが定石。</p>
      ${mine.length ? `<ul class="status-list">${rows}</ul><div class="cmd-grid">
        <button type="button" class="cmd" data-camp="visit" ${c.ptsLeft < 1 ? "disabled" : ""}><b>自分が入る</b><small>持ち点1。街頭演説と個人演説会</small></button>
        <button type="button" class="cmd" data-camp="money" ${g.player.money < 300 ? "disabled" : ""}><b>資金を投入</b><small>300万円。選挙カーとビラ</small></button>
        <button type="button" class="cmd" data-camp="leader" ${c.leaderVisits < 1 ? "disabled" : ""}><b>党首の応援演説</b><small>残り${c.leaderVisits}回。テレビカメラが来る</small></button>
        <button type="button" class="cmd" data-camp="group" ${c.ptsLeft < 1 || !groups ? "disabled" : ""}><b>団体を動かす</b><small>${groups ? groups + "の組織票" : "支援団体がない"}</small></button></div>` : `<p class="muted">この県にあなたの勢力の候補はいない。地図で「情勢」を見て、候補のいる県を選んで。</p>`}
      <button class="primary" type="button" data-act="campNext">${c.round < c.rounds ? "次の日程へ" : "投票日へ"}</button>
    </section>`;
  }

  /* ---------- 人物パネル ---------- */
  const CATS = [["faction", "派閥・政党"], ["bureaucrat", "官僚"], ["reporter", "メディア"], ["boss", "団体・企業"], ["other", "地元・その他"]];
  function catOf(n) { if (n.faction) return "faction"; if (n.persona === "bureaucrat") return "bureaucrat"; if (n.persona === "reporter") return "reporter"; if (n.group || n.persona === "boss" || n.persona === "banker") return "boss"; return "other"; }
  function peoplePanel() {
    const g = G();
    const ms = E.members();
    const memberList = ms.slice(0, 40).map(c => `<button type="button" class="person" data-char="${c.id}">${portrait(c.id, { gender: c.gender, age: c.age, color: E.facColor(g.pf), size: 36 })}<span class="person-text"><b>${esc(c.name)}</b><small>${esc(PREF[c.pref].name)}・忠誠${Math.round(c.loyalty)}</small></span></button>`).join("");
    const secs = g.player.secretaries.map(s => `<li><b>${esc(s.name)}</b><small>${s.traits.map(t => W.secretaryTraits.find(x => x.id === t)?.name).join("・")}${s.fixed ? "・政策秘書" : `・忠誠${Math.round(s.loyalty)}・月${s.salary}万円`}</small>${s.fixed ? "" : `<button type="button" class="ghost tiny" data-fire="${s.id}">解雇</button>`}</li>`).join("");
    const named = CATS.map(([cat, label]) => { const list = W.named.filter(n => catOf(n) === cat && !g.named[n.id].isPlayer); if (!list.length) return ""; return `<h3>${label}</h3><div class="people">${list.map(n => { const r = g.named[n.id]; return `<button type="button" class="person" data-named="${n.id}">${namedPortrait(n.id, 40)}<span class="person-text"><b>${esc(n.name)}</b><small>${esc(n.role)}</small><small>関係${Math.round(r.rel)}${r.owed ? ` 貸し${r.owed}` : ""}${r.iowe ? ` 借り${r.iowe}` : ""}</small></span></button>`; }).join("")}</div>`; }).join("");
    const bills = g.bills.filter(b => !b.done).map(b => `<li class="bill"><b>${esc(b.name)}</b><div class="stages">${b.stages.map((s, i) => `<span class="${i < b.stage ? "done" : i === b.stage ? "now" : ""}">${E.STAGE_NAME[s]}</span>`).join("")}</div><small>次の段階の通過率 ${Math.round(E.billProb(b) * 100)}%</small><div class="row"><button type="button" class="ghost tiny" data-bill="${b.id}" data-kind="nemawashi" ${g.player.ap < 1 || g.player.money < 100 ? "disabled" : ""}>根回し（100万円）</button><button type="button" class="ghost tiny" data-bill="${b.id}" data-kind="kokutai" ${g.player.ap < 1 ? "disabled" : ""}>国対で取引（借り1）</button>${E.isRuling() ? `<button type="button" class="ghost tiny" data-bill="${b.id}" data-kind="kyoukou" ${g.player.ap < 1 ? "disabled" : ""}>強行採決</button>` : ""}</div></li>`).join("");
    const passed = g.passed.slice(-5).map(b => `<li class="muted">${esc(b.name)}（成立）</li>`).join("");
    const stances = W.issues.map(i => { const v = g.player.stances[i.id] || 0; return `<li><span>${i.name}</span><b>${v === 0 ? "未表明" : v < 0 ? i.a : i.b}${Math.abs(v) === 2 ? "（強く）" : ""}</b></li>`; }).join("");
    const cab = E.isPM() ? `<h3>内閣</h3><ul class="plain">${g.cabinet.ministers.map(m => `<li><span>${esc(m.post)}</span><b>${esc(m.name)}</b><small>${esc(E.facName(m.fac))}${m.checked ? "・身体検査済み" : m.risk > 55 ? "・<em class='neg'>火種</em>" : ""}</small></li>`).join("")}</ul>` : "";
    return `<section class="stack">
      <div class="me-card">${playerPortrait(72)}<div><h2>${esc(E.playerName())}</h2><small>${esc(E.post().name)}・当選${g.player.terms}回・${g.player.typeName}</small><div class="facts three"><div><dt>弁舌</dt><dd>${g.player.stats.ben}</dd></div><div><dt>政策</dt><dd>${g.player.stats.sei}</dd></div><div><dt>交渉</dt><dd>${g.player.stats.kou}</dd></div></div><div class="facts three"><div><dt>清廉</dt><dd>${Math.round(g.player.integrity)}</dd></div><div><dt>実績</dt><dd>${Math.round(g.player.achievement)}</dd></div><div><dt>一貫性</dt><dd>${Math.round(g.player.consistency)}</dd></div></div></div></div>
      ${cab}
      <h3>公約 <button type="button" class="ghost tiny" data-cmd="stance">変える</button></h3><ul class="plain stances">${stances}</ul>
      <h3>法案 <button type="button" class="ghost tiny" data-cmd="bill" ${E.cmdBlock("bill", ui.sel) ? "disabled" : ""}>出す</button></h3>${bills || passed ? `<ul class="plain">${bills}${passed}</ul>` : `<p class="muted small">進行中の法案はない。</p>`}
      <h3>秘書 <button type="button" class="ghost tiny" data-cmd="secretary">雇う</button></h3><ul class="plain">${secs}</ul>
      <h3>${esc(E.facName(g.pf))}の仲間 <small>${ms.length}人</small></h3><div class="people">${memberList || "<p class='muted small'>まだ仲間はいない。</p>"}</div>
      ${named}
    </section>`;
  }

  /* ---------- 情勢パネル ---------- */
  function worldPanel() {
    const g = G(), N = g.nation;
    const spark = (() => { const h = g.supportHist.slice(-36); if (h.length < 2) return ""; const w = 160, hh = 40; const pts = h.map((v, i) => `${i / (h.length - 1) * w},${hh - v / 80 * hh}`).join(" "); return `<svg viewBox="0 0 ${w} ${hh}" class="spark" aria-label="支持率の推移"><line x1="0" y1="${hh - 20 / 80 * hh}" x2="${w}" y2="${hh - 20 / 80 * hh}" stroke="#ef7d6d" stroke-dasharray="3 3" stroke-width=".7"/><polyline points="${pts}" fill="none" stroke="#d4b04c" stroke-width="1.5"/><circle cx="${w}" cy="${hh - h[h.length - 1] / 80 * hh}" r="2" fill="#d4b04c"/></svg>`; })();
    const nation = [["econ", "景気", "#7cc79a"], ["price", "物価", "#ef7d6d"], ["debt", "国の借金", "#ef7d6d"], ["birth", "出生", "#7cc79a"]].map(([k, l, c]) => `<div class="sup"><span>${l}</span>${bar(N[k], c)}<b>${Math.round(N[k])}</b></div>`).join("");
    const rivals = E.activeFacs().filter(f => f !== g.pf).map(f => { const fs = g.facs[f], L = NAMED[D.factions[f].leader]; const moodL = { friendly: "友好", neutral: "中立", hostile: "敵対" }[fs.mood]; return `<div class="rival"><button type="button" class="plainbtn" data-named="${L.id}">${portrait(f, { gender: L.gender, age: L.age, color: E.facColor(f), size: 48, mood: fs.mood === "hostile" ? "angry" : fs.mood === "friendly" ? "happy" : "neutral" })}</button><div><b>${esc(E.facName(f))}</b><small>${esc(L.name)}・${E.seats(f)}人・${{ elder: "重鎮", schemer: "策士", popular: "人気者", fixer: "実務" }[D.factions[f].persona]}</small><small>関係 ${Math.round(fs.rel)}・${moodL}${fs.ally ? "・同盟" : ""}${fs.known ? `・発覚リスク${Math.round(fs.risk)}` : ""}${fs.neta ? "・<em>弱み</em>" : ""}</small>${fs.known && fs.plan ? `<small class="plan">次の動き：${esc(E.planLabel(fs.plan))}</small>` : ""}</div></div>`; }).join("");
    const rel = (title, list, get) => `<h3>${title}</h3><div class="rels">${list.map(x => `<div class="sup"><span>${esc(x.short || x.name)}</span>${bar(get(x), "#9ba5b7")}<b>${Math.round(get(x))}</b></div>`).join("")}</div>`;
    return `<section class="stack">
      <h3>内閣</h3><div class="cab"><div><b>${esc(E.leaderName(g.cabinet.pm))}首相</b><small>${esc(D.parties[E.pmParty()].name)}${g.coalition.length > 1 ? "・" + g.coalition.slice(1).map(p => D.parties[p].name).join("、") + "と連立" : ""}</small><small>支持率 ${Math.round(g.cabinet.support)}%${g.cabinet.support < 30 ? "（危険水域）" : ""}</small></div>${spark}</div>
      <h3>国の指標</h3><div class="rels">${nation}</div>
      <h3>ライバル</h3><div class="rivals">${rivals}</div>
      ${rel("団体", W.groups, x => g.groups[x.id].rel)}
      ${rel("官庁", W.ministries, x => g.ministries[x.id].rel)}
      ${rel("メディア", W.media, x => g.media[x.id].rel)}
      ${logPanel(30)}
    </section>`;
  }

  /* ---------- 手帳パネル ---------- */
  function techoPanel() {
    const g = G(), gl = GLOSS();
    const terms = Object.keys(gl).map(t => `<details class="entry"><summary>${esc(t)}</summary><p class="o">${esc(gl[t].omote)}</p><p class="u">${esc(gl[t].ura)}</p></details>`).join("");
    const laws = g.laws.map(l => `<li><b>${esc(l.law)}</b><small>${esc(l.title)}・${E.dateStr(l.t)}</small></li>`).join("");
    const slots = [1, 2, 3].map(n => { const m = slotMeta(SLOT(n)); return `<div class="slot"><span>枠${n}</span><b>${m ? `${esc(m.name)} ${esc(m.date)}` : "空き"}</b><button type="button" class="ghost tiny" data-save="${SLOT(n)}">保存</button>${m ? `<button type="button" class="ghost tiny" data-load="${SLOT(n)}">読込</button>` : ""}</div>`; }).join("");
    return `<section class="stack">
      <h3>設定</h3><div class="row">
        <label class="check"><input type="checkbox" data-opt="sound" ${g.options.sound ? "checked" : ""}> 効果音</label>
        <label class="check"><input type="checkbox" data-opt="bgm" ${g.options.bgm ? "checked" : ""}> BGM</label>
        <span class="muted small">難易度：${{ easy: "やさしい", normal: "ふつう", hard: "難しい" }[g.options.difficulty]}・シナリオ：${esc(W.scenarios.find(s => s.id === g.scenario).name)}</span></div>
      <h3>セーブ</h3><div class="slots">${slots}</div>
      <div class="row"><button type="button" class="ghost tiny" data-act="export">セーブコードを書き出す</button><button type="button" class="ghost tiny" data-act="title">タイトルへ</button></div>
      ${ui.exportCode ? `<textarea rows="3" readonly id="exportCode">${esc(ui.exportCode)}</textarea><button type="button" class="ghost tiny" data-act="copy">コピー</button>` : ""}
      <h3>触れた法律 <small>${g.laws.length}</small></h3><ul class="plain laws">${laws || "<li class='muted'>まだない</li>"}</ul>
      <h3>永田町手帳 <small>${Object.keys(gl).length}語</small></h3><div class="gloss">${terms}</div>
    </section>`;
  }

  /* ---------- 画面の組み立て ---------- */
  function renderGame() {
    const g = G();
    if (!ui.sel) ui.sel = g.player.home;
    const tabs = [["map", "地図"], ["pref", "県"], ["people", "人物"], ["world", "情勢"], ["techo", "手帳"]];
    const tabBar = `<nav class="tabs" role="tablist">${tabs.map(([t, l]) => `<button type="button" role="tab" class="${ui.tab === t ? "on" : ""}" data-tab="${t}" aria-selected="${ui.tab === t}">${l}</button>`).join("")}</nav>`;
    const right = ui.tab === "pref" || ui.tab === "map" ? `${prefPanel()}${g.phase === "campaign" ? campaignPanel() : commands()}` : ui.tab === "people" ? peoplePanel() : ui.tab === "world" ? worldPanel() : techoPanel();
    const mobile = isMobile();
    const left = `${mapPanel()}${powerBars()}${mobile ? "" : logPanel()}`;
    return `${FX.defs}${hud()}
      <main class="board${mobile ? " mobile tab-" + ui.tab : ""}">
        <div class="col-map">${left}</div>
        <div class="col-side">${mobile ? "" : tabBar}${right}</div>
      </main>
      ${mobile ? tabBar.replace('class="tabs"', 'class="tabs bottom"') : ""}
      ${ui.modal ? renderModal() : ""}${ui.flashExtra ? FX.newspaper(esc(ui.flashExtra.headline), esc(ui.flashExtra.sub), E.dateStr(ui.flashExtra.t ?? G().turn)) : ""}`;
  }
  function render() {
    const app = document.getElementById("app");
    const y = window.scrollY;
    app.innerHTML = T.G ? renderGame() : renderSetup();
    if (T.G) window.scrollTo({ top: y });
    if (ui.modal) document.querySelector(".modal-card")?.focus({ preventScroll: true });
  }

  /* ---------- モーダル ---------- */
  function openModal(m) { ui.modal = m; render(); }
  function closeModal() { ui.modal = null; ui.counting = null; render(); setTimeout(nextModal, 0); }
  function nextModal() {
    if (ui.modal || !T.G) return;
    const g = G(); const ev = g.queue.shift(); if (!ev) { save(); return; }
    if (ev.kind === "extra") { ui.flashExtra = ev; FX.sound("gougai"); render(); setTimeout(() => { ui.flashExtra = null; render(); nextModal(); }, reduceMotion() ? 1200 : 2600); return; }
    if (ev.kind === "campaignStart") { E.campaignStart(); ui.mode = "josei"; ui.tab = "pref"; openModal({ kind: "campaignIntro" }); return; }
    if (ev.kind === "upper") { const r = E.upperElection(); openModal({ kind: "upperResult", r }); return; }
    if (ev.kind === "over") { FX.sound(g.over.kind === "win" ? "tenka" : "bad"); openModal({ kind: "over" }); return; }
    if (ev.kind === "tenka") FX.sound("tenka");
    if (ev.kind === "crisis" || ev.kind === "event") FX.sound("month");
    openModal(ev);
  }
  const omoteUra = (omote, ura, law) => `<div class="omote"><span>表　制度では</span><p>${esc(omote)}</p></div><div class="ura"><span>裏　早瀬の耳打ち</span><p>${esc(String(ura).replace(/^「|」$/g, ""))}</p></div>${law && law !== "―" ? `<p class="law"><b>根拠</b>${esc(law)}</p>` : ""}`;

  function renderModal() {
    const g = G(), m = ui.modal, P = g.player;
    let body = "", wide = false;
    switch (m.kind) {
      case "intro": {
        body = `<span class="eyebrow">${E.dateStr(g.turn)}　衆議院第一議員会館</span><h2>ようこそ永田町へ</h2>
          ${mentor(g.pf === "p" ? "先生、当選おめでとう。でも、1年生議員はただの「陣笠」。採決の数のひとつでしかないの。この国を動かしたいなら、総理になるしかない。" : `${E.facName(g.pf)}の領袖として、よろしくお願いします。数は力、力はカネ。でも、カネの出どころを間違えると、全部なくなるわ。`)}
          ${mentor(E.goalText())}
          ${mentor("毎月の行動力には限りがある。地図で都道府県を選んで、遊説や公共事業で地盤を固めて。「人物」で官僚や記者と貸し借りを作り、「公約」で立場を決めると団体が動く。裏のやり方は早いけど、帳簿を知っている人の数だけ爆弾が増える。")}
          <button class="primary" type="button" data-act="close">始める</button>`; break;
      }
      case "tip": { const t = D.tips[m.tip]; body = `<h2>${esc(m.title)}</h2>${mentor(t.ura.replace(/^「|」$/g, ""))}<div class="omote"><span>表　制度では</span><p>${esc(t.omote)}</p></div><p class="law"><b>根拠</b>${esc(t.law)}</p><button class="primary" type="button" data-act="tip-ok">わかった</button>`; break; }
      case "confirm": body = `<h2>${esc(m.title)}</h2><p>${esc(m.text)}</p><div class="row"><button class="primary" type="button" data-act="confirm-ok">${esc(m.ok || "実行する")}</button><button class="ghost" type="button" data-act="close">やめる</button></div>`; break;
      case "works": {
        const rows = D.works.map(w => { const ok = P.budget >= w.cost || P.freeWorks > 0; return `<div class="work${ok ? "" : " off"}"><div><b>${esc(w.name)}</b><small>国費${w.cost}億円・${w.months}か月　経済+${w.econ}・支持+${w.support}・地盤+${w.jiban}</small></div><div class="row"><button type="button" class="ghost tiny" data-works="${w.id}" data-dango="0" ${ok ? "" : "disabled"}>公正な入札で発注</button><button type="button" class="ghost tiny shady" data-works="${w.id}" data-dango="1" ${ok ? "" : "disabled"}>業者に落札させる<em>裏</em></button></div></div>`; }).join("");
        body = `<h2>${esc(PREF[m.pref].name)}に公共事業を誘致</h2><p class="muted">予算枠 残り${P.budget}億円${P.freeWorks ? `（国交省の負担 ${P.freeWorks}件）` : ""}。業者に落札させると事業費の2%が入るが、発覚リスクと清廉さに響く。</p><div class="works-list">${rows}</div><button class="ghost" type="button" data-act="close">やめる</button>`; break;
      }
      case "bank": { const reg = D.regions[PREF[m.pref].region], limit = E.maxDebt(); body = `<h2>銀行</h2><p class="muted">${esc(reg.bank)}（${esc(PREF[m.pref].name)}）または${esc(D.megabanks[0])}。上限は知名度と仲間の数、頭取との関係で決まる。利息は月0.4%。</p><dl class="facts three"><div><dt>借入残高</dt><dd>${P.debt.toLocaleString()}</dd></div><div><dt>上限</dt><dd>${limit.toLocaleString()}</dd></div><div><dt>資金</dt><dd>${Math.round(P.money).toLocaleString()}</dd></div></dl><div class="row">${[1000, 3000].map(a => `<button class="ghost" type="button" data-bank="borrow" data-amt="${a}" ${P.debt + a > limit ? "disabled" : ""}>${a.toLocaleString()}万円借りる</button>`).join("")}<button class="ghost" type="button" data-bank="repay" data-amt="1000" ${P.debt <= 0 || P.money <= 0 ? "disabled" : ""}>1,000万円返す</button></div><button class="primary" type="button" data-act="close">閉じる</button>`; break; }
      case "faction": {
        const c = E.CMDS[m.cmd];
        const rows = E.activeFacs().filter(f => f !== g.pf && (m.cmd !== "doumei" || true)).map(f => { const fs = g.facs[f], L = NAMED[D.factions[f].leader]; const disabled = (m.cmd === "leak" && !fs.neta) || (m.cmd === "doumei" && fs.ally); const info = [`${E.seats(f)}人`, `関係 ${Math.round(fs.rel)}`, { friendly: "友好", neutral: "中立", hostile: "敵対" }[fs.mood], fs.known ? `発覚リスク ${Math.round(fs.risk)}` : "", fs.neta ? "弱みあり" : "", fs.ally ? "同盟中" : ""].filter(Boolean).join("・"); return `<button type="button" class="fac-row" data-fac="${f}" ${disabled ? "disabled" : ""}>${portrait(f, { gender: L.gender, age: L.age, color: E.facColor(f), size: 48 })}<span><b>${esc(E.facName(f))}</b><small>${esc(L.name)}　${info}</small></span></button>`; }).join("");
        body = `<h2>${esc(c.name)}</h2><p class="muted">${esc(c.desc)}${c.cost ? `　費用 ${man(c.cost)}` : ""}</p><div class="fac-list">${rows}</div><button class="ghost" type="button" data-act="close">やめる</button>`; break;
      }
      case "char": {
        const ch = g.chars[m.char], isMe = m.char === "player", st = isMe ? P.stats : ch.stats;
        const canPoach = !isMe && ch.fac !== g.pf && P.ap >= 1 && !ch.role;
        body = `<div class="char-card">${isMe ? playerPortrait(112) : portrait(ch.id, { gender: ch.gender, age: ch.age, color: ch.role ? D.parties[ch.fac].color : E.facColor(ch.fac), size: 112 })}<div><span class="eyebrow">${esc(ch.role === "governor" ? "知事" : E.facName(ch.fac))}・${esc(PREF[ch.pref].name)}</span><h2>${esc(ch.name)}</h2><p class="muted">${ch.age}歳・当選${isMe ? P.terms : ch.terms}回${ch.fac === g.pf && !isMe ? `・忠誠 ${Math.round(ch.loyalty)}` : ""}</p><dl class="facts three"><div><dt>弁舌</dt><dd>${st.ben}</dd></div><div><dt>政策</dt><dd>${st.sei}</dd></div><div><dt>交渉</dt><dd>${st.kou}</dd></div></dl></div></div>
          ${canPoach ? `<h3>引き抜き</h3><p class="muted">${E.partyOf(ch.fac) !== E.playerParty() ? "他党の議員を離党させるのは難しい。" : "忠誠の低い議員ほど誘いに乗りやすい。"}行動力1。</p><div class="row">${[300, 1000, 2000].map(o => `<button class="ghost" type="button" data-poach="${o}" ${P.money >= o ? "" : "disabled"}>${man(o)}で誘う</button>`).join("")}</div>` : ""}
          <button class="primary" type="button" data-act="close">閉じる</button>`; break;
      }
      case "meet": {
        const list = CATS.map(([cat, label]) => { const l = W.named.filter(n => catOf(n) === cat && !g.named[n.id].isPlayer); return l.length ? `<h3>${label}</h3><div class="fac-list">${l.map(n => { const r = g.named[n.id]; return `<button type="button" class="fac-row" data-named="${n.id}">${namedPortrait(n.id, 44)}<span><b>${esc(n.name)}</b><small>${esc(n.role)}　関係${Math.round(r.rel)}${r.owed ? ` 貸し${r.owed}` : ""}${r.iowe ? ` 借り${r.iowe}` : ""}</small></span></button>`; }).join("")}</div>` : ""; }).join("");
        body = `<h2>誰に会うか</h2>${list}<button class="ghost" type="button" data-act="close">やめる</button>`; break;
      }
      case "named": {
        const n = NAMED[m.id], r = g.named[m.id];
        const mem = r.memory.slice(0, 4).map(x => `<li><time>${E.dateStr(x.t)}</time>${esc(x.text)}</li>`).join("");
        const extraInfo = n.faction ? `関係する派閥：${esc(E.facName(n.faction))}（${E.seats(n.faction)}人）` : n.group ? `団体との関係 ${Math.round(g.groups[n.group].rel)}` : n.ministry ? `${esc(W.ministries.find(x => x.id === n.ministry).name)}との関係 ${Math.round(g.ministries[n.ministry].rel)}` : n.media ? `${esc(W.media.find(x => x.id === n.media).name)}との関係 ${Math.round(g.media[n.media].rel)}` : "";
        body = `<div class="char-card">${namedPortrait(m.id, 112)}<div><span class="eyebrow">${esc(n.role)}</span><h2>${esc(n.name)}</h2><p class="muted">${n.age}歳・${{ mentor: "師", elder: "重鎮", rival: "ライバル", boss: "顔役", schemer: "策士", popular: "人気者", fixer: "実務家", bureaucrat: "官僚", reporter: "記者", banker: "銀行家", ally: "盟友" }[n.persona]}</p><p>${esc(n.intro)}</p><div class="sup"><span>関係</span>${bar(r.rel, "#d4b04c")}<b>${Math.round(r.rel)}</b></div><p class="muted small">貸し ${r.owed}・借り ${r.iowe}${extraInfo ? "・" + extraInfo : ""}</p></div></div>
          ${mem ? `<ul class="memo">${mem}</ul>` : ""}
          <div class="actions3">
            <button type="button" class="cmd" data-meet="talk" ${P.ap < 1 || P.money < 30 ? "disabled" : ""}><b>会食する</b><small>行動力1・30万円。関係を深める</small></button>
            ${n.give ? `<button type="button" class="cmd${["risk", "amakudari", "leak_info"].includes(n.give.kind) ? " shady" : ""}" data-meet="give" ${P.ap < 1 ? "disabled" : ""}><b>貸しを作る</b><small>${esc(n.give.text)}${n.give.kind === "money" ? `（${man(n.give.amount)}）` : n.give.kind === "stance" ? "（公約が動く）" : ""}</small></button>` : ""}
            ${n.ask ? `<button type="button" class="cmd" data-meet="ask" ${r.owed < 1 ? "disabled" : ""}><b>貸しを使う</b><small>${esc(n.ask.text)}</small></button>` : ""}
          </div>
          <button class="ghost" type="button" data-act="close">閉じる</button>`; break;
      }
      case "secretary": {
        const cands = g.secCandidates || E.secretaryCandidates();
        body = `<h2>秘書を雇う</h2><p class="muted">今の秘書 ${P.secretaries.length}人。給与は毎月かかる。「やり手」は成果が大きいが、勝手に違反をすることがある。</p><div class="fac-list">${cands.map(c => `<button type="button" class="fac-row" data-hire="${c.id}" ${P.secretaries.length >= 4 ? "disabled" : ""}>${portrait(c.id, { gender: c.gender, age: c.age, color: "#5b6270", badge: false, size: 44 })}<span><b>${esc(c.name)}</b><small>${c.age}歳・${c.traits.map(t => { const tr = W.secretaryTraits.find(x => x.id === t); return `${tr.name}（${tr.desc}）`; }).join("、")}・月${c.salary}万円</small></span></button>`).join("")}</div><button class="ghost" type="button" data-act="close">やめる</button>`; break;
      }
      case "stance": {
        body = `<h2>公約</h2><p class="muted">争点ごとに立場を決める。団体と有権者の反応が変わる。一度決めた立場を反対に変えると一貫性が下がる。</p><div class="stances-edit">${W.issues.map(i => { const v = P.stances[i.id] || 0; return `<div class="st-row"><b>${i.name}</b><div class="segs">${[-2, -1, 0, 1, 2].map(x => `<button type="button" class="seg${v === x ? " on" : ""}" data-stance="${i.id}" data-v="${x}">${x === 0 ? "未表明" : x < 0 ? (x === -2 ? "強く" : "") + "A" : (x === 2 ? "強く" : "") + "B"}</button>`).join("")}</div><small>A：${esc(i.a)}　B：${esc(i.b)}</small></div>`; }).join("")}</div><button class="primary" type="button" data-act="close">閉じる</button>`; wide = true; break;
      }
      case "bill": {
        body = `<h2>法案を出す</h2><p class="muted">争点を選ぶ。あなたの公約と同じ向きの法案を出す。${E.isRuling() ? "与党の法案は、部会と総務会を通ってから国会へ。" : "野党の法案は提出できるが、委員会で審議されにくい。"}行動力1・50万円。</p><div class="fac-list">${W.issues.map(i => { const v = P.stances[i.id] || 0; return `<div class="work"><div><b>${i.name}</b><small>A：${esc(i.a)}／B：${esc(i.b)}</small></div><div class="row"><button type="button" class="ghost tiny" data-propose="${i.id}" data-dir="-1" ${v > 0 ? "disabled" : ""}>Aの法案</button><button type="button" class="ghost tiny" data-propose="${i.id}" data-dir="1" ${v < 0 ? "disabled" : ""}>Bの法案</button></div></div>`; }).join("")}</div><button class="ghost" type="button" data-act="close">やめる</button>`; wide = true; break;
      }
      case "town": { const st = g.prefs[P.home]; body = `<span class="eyebrow">${esc(PREF[P.home].name)}</span><h2>汐見市</h2>${FX.town(st.built, st.works, "汐見市")}<p class="muted small">公共事業が完成すると、街の姿が変わる。進行中：${st.works.length}件、完成：${st.built.length}件。</p>${mentor(st.built.length ? "街が変わるのは、政治家の仕事がいちばん目に見えるとき。ただ、箱物を作っただけで終わる政治家も多いわ。" : "まだ何も建っていない。公共事業は予算枠を使って誘致する。地元に持ち帰れば、票にも献金にもなる。")}<button class="primary" type="button" data-act="close">閉じる</button>`; break; }
      case "report": body = `<h2>${E.dateStr(m.turn)}の情勢</h2><ul class="report">${(m.lines || []).map(l => `<li>${esc(l)}</li>`).join("") || "<li class='muted'>静かな月だった。</li>"}</ul><button class="primary" type="button" data-act="close">${E.dateStr(g.turn)}へ</button>`; break;
      case "event": {
        const e = D.events.find(x => x.id === m.id), text = E.eventText(m);
        const sp = e.speaker === "mentor" || e.speaker === "hayase" ? "hayase" : e.speaker === "group" ? W.groups.find(x => x.id === m.group).leader : e.speaker === "boss" ? "iwaki" : e.speaker;
        if (m.done === undefined) body = `<span class="eyebrow">出来事</span><h2>${esc(e.title)}</h2>${speakerBox(sp, text)}<div class="choices">${e.choices.map((c, i) => `<button type="button" class="choice" data-choice="${i}" ${c.needsNamed && g.named[c.needsNamed].rel < 55 ? "disabled" : ""}>${esc(c.label)}${c.effects.risk ? "<em>裏</em>" : ""}</button>`).join("")}</div>`;
        else body = `<span class="eyebrow">出来事</span><h2>${esc(e.title)}</h2><p>${esc(e.choices[m.done].result)}</p>${omoteUra(e.omote, e.ura, e.law)}<button class="primary" type="button" data-act="close">次へ</button>`;
        break;
      }
      case "crisis": {
        const c = W.crises.find(x => x.id === m.id);
        if (m.done === undefined) body = `<span class="eyebrow">総理の決断</span><h2>${esc(c.title)}</h2>${mentor(c.text)}<div class="choices">${c.choices.map((ch, i) => `<button type="button" class="choice" data-crisis="${i}">${esc(ch.label)}</button>`).join("")}</div>`;
        else body = `<span class="eyebrow">総理の決断</span><h2>${esc(c.title)}</h2><p>${esc(c.choices[m.done].result)}</p>${omoteUra(c.omote, c.ura, c.law)}<button class="primary" type="button" data-act="close">次へ</button>`;
        break;
      }
      case "scandal": body = `<span class="eyebrow">発覚</span><h2>週刊誌の報道</h2>${mentor("ほら、言ったでしょう。帳簿を知っている人の数だけ爆弾がある。今回は記事で済んだ。次は、特捜部かもしれないわよ。")}<button class="primary" type="button" data-act="close">次へ</button>`; break;
      case "campaignIntro": body = `<span class="eyebrow">衆議院解散</span><h2>12日間の選挙戦</h2>${mentor("解散よ。ここからは3つの日程で、どの県に力を入れるかを決める。地図を「情勢」にすると、優勢・接戦・劣勢が見える。接戦区に自分が入り、党首を呼び、団体を動かす。優勢な県に力を注ぐのは、もったいない。")}<p class="law"><b>根拠</b>公職選挙法 第129条（選挙運動の期間は公示日から投票日の前日まで）</p><button class="primary" type="button" data-act="close">選挙戦へ</button>`; break;
      case "count": return renderCount(m);
      case "electionResult": {
        const r = g.lastResult;
        const rows = E.activeFacs().map(f => `<tr><td><i class="dot" style="background:${E.facColor(f)}"></i>${esc(E.facName(f))}</td><td class="n">${r.before[f] ?? 0}</td><td class="n"><b>${r.after[f]}</b></td><td class="n ${r.after[f] - (r.before[f] ?? 0) >= 0 ? "up" : "down"}">${r.after[f] - (r.before[f] ?? 0) >= 0 ? "+" : ""}${r.after[f] - (r.before[f] ?? 0)}</td></tr>`).join("");
        const own = r.own ? (r.own.win ? "あなたは地元の選挙区で当選した。" : r.revived ? `あなたは選挙区で敗れたが、惜敗率${Math.round(r.own.ratio * 100)}%で比例代表に復活した。` : "") : "";
        body = `<span class="eyebrow">衆議院議員総選挙</span><h2>${g.parties.map(p => `${D.parties[p].short} ${r.partyAfter[p]}`).join("　")}</h2><p>${esc(own)} ${esc(r.gov.change || "")}</p><div class="table-box"><table><thead><tr><th>勢力</th><th>前</th><th>今回</th><th>増減</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted small">小選挙区289＋比例代表176。地図の色が新しい勢力図。</p><button class="primary" type="button" data-act="close">次へ</button>`; break;
      }
      case "upperResult": body = `<span class="eyebrow">参議院議員選挙</span><h2>${m.r.nejire ? "ねじれ国会に" : "与党が参院の過半数を維持"}</h2><div class="table-box"><table><thead><tr><th>政党</th><th>前</th><th>今回</th></tr></thead><tbody>${g.parties.map(p => `<tr><td><i class="dot" style="background:${D.parties[p].color}"></i>${D.parties[p].name}</td><td class="n">${m.r.before[p] ?? 0}</td><td class="n"><b>${m.r.after[p]}</b></td></tr>`).join("")}</tbody></table></div>${omoteUra(D.tips.upper.omote, D.tips.upper.ura, D.tips.upper.law)}<button class="primary" type="button" data-act="close">次へ</button>`; break;
      case "leaderAsk": { const n = E.seats(g.pf), can = n >= 20; body = `<span class="eyebrow">協和党総裁選</span><h2>総裁選が告示された</h2>${mentor(can ? `推薦人20人はそろってる。${E.facName(g.pf)}は${n}人。出るなら、告示前の多数派工作が勝負。ポストの約束、貸しの回収、それと……実弾。` : `立候補には推薦人20人がいる。${E.facName(g.pf)}はまだ${n}人。今回は見送って、次に備えましょう。`)}<div class="row">${can ? `<button class="primary" type="button" data-act="leaderPrep">立候補する</button><button class="ghost" type="button" data-leader="0">見送る</button>` : `<button class="primary" type="button" data-leader="0">見送る</button>`}</div>`; break; }
      case "leaderPrep": {
        const rows = E.leaderPrep().map(f => { const L = NAMED[f.leader]; return `<div class="work"><div class="row">${portrait(f.f, { gender: L.gender, age: L.age, color: E.facColor(f.f), size: 44 })}<div><b>${esc(E.facName(f.f))}</b><small>${esc(L.name)}・${f.seats}人・関係${Math.round(f.rel)}・${{ friendly: "友好", neutral: "中立", hostile: "敵対" }[f.mood]}${f.ally ? "・<em>協力</em>" : ""}</small></div></div><div class="row"><button type="button" class="ghost tiny" data-offer="post" data-f="${f.f}" ${f.promise || f.ally ? "disabled" : ""}>ポストを約束</button><button type="button" class="ghost tiny" data-offer="favor" data-f="${f.f}" ${f.owed < 1 || f.ally ? "disabled" : ""}>貸しを使う（${f.owed}）</button><button type="button" class="ghost tiny shady" data-offer="cash" data-f="${f.f}" ${P.money < 2000 || f.ally ? "disabled" : ""}>実弾 2,000万円<em>裏</em></button></div></div>`; }).join("");
        body = `<span class="eyebrow">多数派工作</span><h2>告示前夜</h2><p class="muted">各派閥の協力を取り付ける。議員票は派閥ごとにまとまり、党員票は知名度（${Math.round(P.fame)}）で決まる。${P.elderVotes ? `長老の票 +${P.elderVotes}。` : ""}</p><div class="works-list">${rows}</div><button class="primary" type="button" data-leader="1">投票へ</button>`; wide = true; break;
      }
      case "leader": {
        const r = m.result;
        if (r.uncontested) body = `<span class="eyebrow">協和党総裁選</span><h2>${esc(E.leaderName(r.winner))}が無投票で再選</h2><p>ほかに推薦人20人を集められる候補がいなかった。</p><button class="primary" type="button" data-act="close">次へ</button>`;
        else body = `<span class="eyebrow">協和党総裁選</span><h2>新総裁 ${esc(E.leaderName(r.winner))}</h2>${r.rounds.map((rows, i) => `<h3>${i === 0 ? "1回目の投票" : "決選投票"}<small>${i === 0 ? "議員票＋党員票" : "議員票＋都道府県票"}</small></h3><div class="cand-list">${rows.map(x => { const L = x.c === g.pf ? null : NAMED[D.factions[x.c].leader]; return `<div class="cand${x.c === r.winner && i === r.rounds.length - 1 ? " win" : ""}">${x.c === g.pf ? playerPortrait(48) : portrait(x.c, { gender: L.gender, age: L.age, color: E.facColor(x.c), size: 48 })}<span><b>${esc(E.leaderName(x.c))}</b><small>${esc(E.facName(x.c))}</small></span><span class="votes"><b>${x.total}</b><small>議員${x.giin}・${i === 0 ? "党員" : "地方"}${x.tou}</small></span></div>`; }).join("")}</div>`).join("")}<p class="muted">${r.winner === g.pf ? (E.isPM() ? "あなたは総裁となり、国会で内閣総理大臣に指名された。" : "あなたは総裁になった。協和党は野党。総選挙で過半数を取り戻せば総理になれる。") : `あなたの役職：${E.post().name}`}</p>${omoteUra("総裁選は1回目の投票で議員票と党員票を同数ずつ数え、過半数がなければ上位2人で決選投票（議員票＋都道府県票）。", "勝負は告示前の多数派工作で決まる。決選投票の朝に寝返るのも永田町の作法。", "協和党 総裁公選規程（架空）")}<button class="primary" type="button" data-act="close">次へ</button>`;
        break;
      }
      case "cabinet": {
        body = `<span class="eyebrow">組閣</span><h2>内閣をつくる</h2>${mentor("組閣は派閥のバランスと論功行賞。「適材適所」は説明のための言葉。それと身体検査。これを怠った政権は、数か月後に辞任ドミノが来るわ。")}<div class="choices">${[["balance", "派閥均衡", "各派閥に議席数に応じてポストを配る。党内が安定する"], ["reward", "論功行賞", "協力した派閥を厚遇する。敵は増える"], ["merit", "適材適所", "能力重視。支持率は上がるが派閥は不満"], ["inner", "身内固め", "自分の派閥で固める。党内に敵を作る"]].map(([k, l, d]) => `<button type="button" class="choice" data-cabinet="${k}"><b>${l}</b><small>${d}</small></button>`).join("")}</div><label class="check"><input type="checkbox" id="bodycheck" checked> 全閣僚の身体検査をする（火種のある人物を差し替える）</label>`; break;
      }
      case "cabinetDone": body = `<span class="eyebrow">組閣</span><h2>${esc(E.playerName())}内閣 発足</h2><ul class="plain">${g.cabinet.ministers.map(mm => `<li><span>${esc(mm.post)}</span><b>${esc(mm.name)}</b><small>${esc(E.facName(mm.fac))}</small></li>`).join("")}</ul>${omoteUra(D.tips.cabinet.omote, D.tips.cabinet.ura, D.tips.cabinet.law)}<button class="primary" type="button" data-act="close">次へ</button>`; break;
      case "budget": {
        const a = m.alloc || (m.alloc = { keiki: 2, kosodate: 2, bouei: 1, chihou: 2, zaisei: 1 }); const used = Object.values(a).reduce((x, y) => x + y, 0);
        body = `<span class="eyebrow">予算編成</span><h2>来年度予算の配分</h2><p class="muted">10点を配る。残り <b>${10 - used}</b>。配った分だけ国の借金は増え、財政再建に回せば減る。</p><div class="stances-edit">${[["keiki", "景気対策", "景気と支持率が上がる"], ["kosodate", "子育て", "出生率と都市部の支持"], ["bouei", "防衛", "防衛を重視する地域の支持"], ["chihou", "地方・公共事業", "地方の支持と、あなたの予算枠"], ["zaisei", "財政再建", "借金を減らす。支持は下がる。財務省は喜ぶ"]].map(([k, l, d]) => `<div class="st-row"><b>${l} <span class="num">${a[k]}</span></b><div class="row"><button type="button" class="ghost tiny" data-budget="${k}" data-d="-1" ${a[k] <= 0 ? "disabled" : ""}>−</button><button type="button" class="ghost tiny" data-budget="${k}" data-d="1" ${used >= 10 ? "disabled" : ""}>＋</button></div><small>${d}</small></div>`).join("")}</div><button class="primary" type="button" data-act="budgetOk" ${used !== 10 ? "disabled" : ""}>予算案を閣議決定する</button>`; break;
      }
      case "coalitionAsk": body = `<span class="eyebrow">連立交渉</span><h2>${esc(D.parties[m.partner.largest].name)}からの誘い</h2>${mentor(`${D.parties[m.partner.largest].name}は過半数に届かず、あなたの党に連立を持ちかけてきた。入れば閣僚ポストと政策の一部が手に入る。代わりに、公約の一部を飲み込むことになる。`)}<div class="row"><button class="primary" type="button" data-coalition="1">連立に加わる</button><button class="ghost" type="button" data-coalition="0">野党にとどまる</button></div>`; break;
      case "tenka": body = `<div class="tenka">${portrait(P.seed, { gender: P.gender, age: 41 + Math.floor(g.turn / 12), color: "#d4b04c", size: 128, mood: "happy" })}<span class="eyebrow">${E.dateStr(g.turn)}　衆議院本会議場</span><h2>内閣総理大臣 ${esc(E.playerName())}</h2><p>首相指名選挙で過半数の票を得て、あなたは内閣総理大臣に指名された。</p></div>${mentor("おめでとう、総理。でも、ここからが本番よ。支持率が20%を切れば党内から引きずり下ろされる。総選挙に勝って、政権を2年保ってみせて。解散のタイミングは、あなたが決めるの。")}<button class="primary" type="button" data-act="close">組閣に向かう</button>`; break;
      case "over": {
        const o = g.over, ev = E.evaluate();
        body = `<span class="eyebrow">${o.kind === "win" ? "勝利" : "終幕"}</span><h2>${esc(o.title)}</h2><p>${esc(o.text)}</p>
          <div class="textbook"><span class="eyebrow">後世の教科書より</span><h3>${esc(ev.title)}</h3><p>${esc(ev.text)}</p><dl class="facts three"><div><dt>清廉</dt><dd>${ev.integrity}</dd></div><div><dt>実行力</dt><dd>${ev.achievement}</dd></div><div><dt>民意</dt><dd>${ev.popularity}</dd></div></dl></div>
          <h3>あなたの政治人生で触れた法律 <small>${g.laws.length}</small></h3><ul class="plain laws small">${g.laws.slice(0, 12).map(l => `<li><b>${esc(l.law)}</b><small>${esc(l.title)}</small></li>`).join("")}</ul>
          <div class="row">${o.retry ? `<button class="primary" type="button" data-act="retry">選挙戦の前からやり直す</button>` : ""}<button class="${o.retry ? "ghost" : "primary"}" type="button" data-act="title">タイトルへ</button></div>`; break;
      }
      case "me": body = `<div class="char-card">${playerPortrait(112)}<div><span class="eyebrow">${esc(E.facName(g.pf))}・${esc(PREF[P.home].name)}</span><h2>${esc(E.playerName())}</h2><p class="muted">${esc(E.post().name)}・当選${P.terms}回・${P.typeName}</p><dl class="facts three"><div><dt>清廉</dt><dd>${Math.round(P.integrity)}</dd></div><div><dt>実績</dt><dd>${Math.round(P.achievement)}</dd></div><div><dt>一貫性</dt><dd>${Math.round(P.consistency)}</dd></div></dl></div></div>${mentor(E.goalText())}<button class="primary" type="button" data-act="close">閉じる</button>`; break;
      case "menu": body = `<h2>メニュー</h2><div class="choices"><button type="button" class="choice" data-save="${SLOT(1)}">枠1に保存</button><button type="button" class="choice" data-save="${SLOT(2)}">枠2に保存</button><button type="button" class="choice" data-save="${SLOT(3)}">枠3に保存</button><button type="button" class="choice" data-act="gotoTecho">設定・セーブコード・手帳</button><button type="button" class="choice" data-act="title">タイトルへ（自動保存あり）</button></div><button class="ghost" type="button" data-act="close">閉じる</button>`; break;
    }
    return `<div class="modal" role="dialog" aria-modal="true"><div class="modal-card${wide ? " wide" : ""}" tabindex="-1">${body}</div></div>`;
  }

  /* ---------- 開票速報 ---------- */
  function renderCount(m) {
    const g = G(), c = ui.counting, r = c.res;
    const tally = {}; for (const f of E.activeFacs()) tally[f] = 0;
    const done0 = c.revealed.size >= r.results.length;
    const partyTally = {}; for (const p of g.parties) partyTally[p] = done0 ? E.facsOf(p).reduce((t, f) => t + (r.pr[f] || 0), 0) : 0;
    for (const key of c.revealed) { const [pref, idx] = key.split(":"); const rr = r.results.find(x => x.pref === pref && x.idx === Number(idx)); tally[rr.winner.fac] = (tally[rr.winner.fac] || 0) + 1; partyTally[rr.winner.party] += 1; }
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    const done = c.revealed.size >= r.results.length;
    const partyRows = g.parties.map(p => `<div class="count-row"><span><i class="dot" style="background:${D.parties[p].color}"></i>${D.parties[p].name}</span><b class="num">${partyTally[p]}</b><small>${done ? `比例を含む最終` : "小選挙区"}</small></div>`).join("");
    const facRows = E.activeFacs().map(f => `<div class="count-row small"><span><i class="dot" style="background:${E.facColor(f)}"></i>${esc(E.facName(f))}</span><b class="num">${tally[f]}</b></div>`).join("");
    const ticker = c.ticker.slice(-1)[0] || "開票が始まりました";
    return `<div class="modal count" role="dialog" aria-modal="true"><div class="modal-card wide" tabindex="-1">
      <div class="tv"><span class="live">LIVE</span><b>開票速報</b><span class="num">小選挙区 ${total}/${r.results.length}</span></div>
      <div class="count-grid"><div class="map-box small">${mapSVG()}</div><div class="count-side">${partyRows}<hr>${facRows}</div></div>
      <div class="ticker"><span>${esc(ticker)}</span></div>
      ${done ? `<button class="primary" type="button" data-act="countDone">結果を見る</button>` : `<button class="ghost tiny" type="button" data-act="countSkip">最後まで飛ばす</button>`}
    </div></div>`;
  }
  function startCount(res) {
    ui.counting = { res, revealed: new Set(), ticker: [], i: 0 };
    ui.modal = { kind: "count" }; render();
    const step = () => {
      const c = ui.counting; if (!c) return;
      const batch = reduceMotion() ? 40 : 6;
      for (let k = 0; k < batch && c.i < res.order.length; k++, c.i++) {
        const rr = res.results[res.order[c.i]]; c.revealed.add(rr.pref + ":" + rr.idx);
        if (rr.you || rr.winner.flipped || rr.close) { c.ticker.push(`【当確】${PREF[rr.pref].name}${PREF[rr.pref].seats > 1 ? rr.idx + 1 + "区" : ""}　${rr.winner.name}（${E.facName(rr.winner.fac)}）${rr.you ? (rr.youWon ? "　あなたが当選" : "　あなたは敗れた") : rr.winner.flipped ? "　議席を奪取" : ""}`); if (rr.you || rr.winner.fac === g().pf) FX.sound("kakutei"); }
      }
      render();
      if (c.i < res.order.length) setTimeout(step, reduceMotion() ? 50 : 420);
    };
    const g = G;
    setTimeout(step, 400);
  }

  /* ---------- 月送り ---------- */
  function endMonth(auto) {
    const g = G(); if (g.phase !== "normal" || g.over) return;
    if (auto) E.autoMonth();
    E.endMonth(); FX.sound("month"); save(); render(); nextModal();
  }
  function advanceMonths(n) {
    const g = G(); const lines = [];
    for (let i = 0; i < n; i++) {
      if (g.phase !== "normal" || g.over) break;
      E.autoMonth(); const rep = E.endMonth(); lines.push(`【${E.dateStr(g.turn - 1)}】`, ...(rep || []));
      const idx = g.queue.findIndex(q => q.kind === "report"); if (idx >= 0) g.queue.splice(idx, 1);
      if (g.queue.some(q => ["event", "crisis", "campaignStart", "leaderAsk", "cabinet", "budget", "coalitionAsk", "over", "upper"].includes(q.kind))) break;
    }
    g.queue.unshift({ kind: "report", turn: g.turn - 1, lines });
    save(); render(); nextModal();
  }

  /* ---------- 入力 ---------- */
  function toast(t) { ui.toast = t; render(); clearTimeout(ui.toastT); ui.toastT = setTimeout(() => { ui.toast = null; render(); }, 2200); }
  function runCmd(id, pid) {
    const c = E.CMDS[id];
    if (c.shady && !ui.modal?.confirmed) { openModal({ kind: "confirm", title: c.name, text: `${c.desc}。発覚リスクと清廉さに響く。それでも？`, cmd: id, pref: pid, ok: "やる" }); return; }
    const r = E.useCmd(id, pid); if (!r) return;
    FX.sound("click");
    if (r.tip) { openModal({ kind: "tip", tip: r.tip, title: r.name, then: { cmd: id, pref: pid } }); return; }
    if (r.modal) { openModal({ kind: r.modal, cmd: id, pref: pid }); return; }
    save(); render(); if (r.msg) toast(r.msg);
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-pref],[data-act],[data-cmd],[data-mode],[data-tab],[data-type],[data-gender],[data-scenario],[data-faction],[data-diff],[data-char],[data-named],[data-works],[data-bank],[data-fac],[data-poach],[data-choice],[data-crisis],[data-leader],[data-offer],[data-cabinet],[data-budget],[data-coalition],[data-meet],[data-hire],[data-fire],[data-stance],[data-propose],[data-bill],[data-camp],[data-load],[data-save]");
    if (!t || t.disabled) return;
    const ds = t.dataset;
    if (!T.G) {
      const s = ui.setup;
      if (ds.pref) { s.home = ds.pref; render(); }
      else if (ds.type) { s.type = ds.type; render(); }
      else if (ds.gender) { s.gender = ds.gender; render(); }
      else if (ds.scenario) { s.scenario = ds.scenario; render(); }
      else if (ds.faction) { s.faction = ds.faction; render(); }
      else if (ds.diff) { s.difficulty = ds.diff; render(); }
      else if (ds.load) { const g = loadSlot(ds.load); if (g && E.restore(g)) { ui.sel = T.G.player.home; FX.enabled = !!T.G.options.sound; render(); nextModal(); } }
      else if (ds.act === "import") { const code = document.getElementById("importCode").value; if (E.importCode(code)) { ui.sel = T.G.player.home; render(); } else toastSetup("コードを読めませんでした"); }
      else if (ds.act === "start") { const carry = s.carry ? storyCarry() : null; E.newGame({ ...s, carry }); ui.sel = T.G.player.home; ui.tab = "pref"; render(); openModal({ kind: "intro" }); save(); }
      return;
    }
    const g = T.G, m = ui.modal;
    if (m) {
      if (ds.act === "close") return closeModal();
      if (ds.act === "tip-ok") { const then = m.then; ui.modal = null; if (then) runCmd(then.cmd, then.pref); else { render(); nextModal(); } return; }
      if (ds.act === "confirm-ok") { const { cmd, pref } = m; ui.modal = { confirmed: true }; const r = E.useCmd(cmd, pref); ui.modal = null; if (r?.modal) openModal({ kind: r.modal, cmd, pref }); else { save(); render(); if (r?.msg) toast(r.msg); } return; }
      if (ds.works) { if (E.startWorks(m.pref, ds.works, ds.dango === "1")) { FX.sound("ok"); closeModal(); } return; }
      if (ds.bank) { E.bankAction(ds.bank, Number(ds.amt)); save(); render(); return; }
      if (ds.fac) { E.factionAction(m.cmd, ds.fac); FX.sound("ok"); closeModal(); return; }
      if (ds.poach) { const r = E.poach(m.char, Number(ds.poach)); FX.sound(r?.ok ? "ok" : "bad"); closeModal(); return; }
      if (ds.named && m.kind === "meet") { openModal({ kind: "named", id: ds.named, fromMeet: true }); return; }
      if (ds.meet) { const fn = { talk: E.meetTalk, give: E.meetGive, ask: E.meetAsk }[ds.meet]; const r = fn(m.id); if (r) { FX.sound("ok"); toast(r); } save(); render(); return; }
      if (ds.hire) { E.hireSecretary(ds.hire); closeModal(); return; }
      if (ds.stance) { E.setStance(ds.stance, Number(ds.v)); save(); render(); return; }
      if (ds.propose) { if (E.proposeBill(ds.propose, Number(ds.dir))) { FX.sound("ok"); closeModal(); } return; }
      if (ds.choice !== undefined && m.kind === "event") { const e = D.events.find(x => x.id === m.id); E.applyEventChoice(m, e.choices[Number(ds.choice)]); m.done = Number(ds.choice); save(); render(); return; }
      if (ds.crisis !== undefined) { E.applyCrisis(m.id, Number(ds.crisis)); m.done = Number(ds.crisis); save(); render(); return; }
      if (ds.act === "leaderPrep") { openModal({ kind: "leaderPrep" }); return; }
      if (ds.offer) { E.leaderOffer(ds.f, ds.offer); FX.sound("click"); save(); render(); return; }
      if (ds.leader !== undefined) { const r = E.leaderVote(ds.leader === "1"); save(); ui.modal = { kind: "leader", result: r }; render(); return; }
      if (ds.cabinet) { const check = document.getElementById("bodycheck")?.checked; E.formCabinet(ds.cabinet, check); save(); ui.modal = { kind: "cabinetDone" }; render(); return; }
      if (ds.budget) { m.alloc[ds.budget] += Number(ds.d); render(); return; }
      if (ds.act === "budgetOk") { E.applyBudget(m.alloc); FX.sound("ok"); closeModal(); return; }
      if (ds.coalition !== undefined) { E.coalitionAnswer(m.partner, ds.coalition === "1"); closeModal(); return; }
      if (ds.act === "countSkip") { ui.counting.i = ui.counting.res.order.length; ui.counting.res.results.forEach(rr => ui.counting.revealed.add(rr.pref + ":" + rr.idx)); render(); return; }
      if (ds.act === "countDone") { ui.counting = null; ui.modal = null; ui.mode = "party"; save(); render(); nextModal(); return; }
      if (ds.act === "retry") { E.retryElection(); ui.modal = null; ui.counting = null; T.G.queue = []; ui.mode = "party"; save(); render(); return; }
      if (ds.act === "title") { save(); ui.modal = null; T.G = null; render(); return; }
      if (ds.act === "gotoTecho") { ui.modal = null; ui.tab = "techo"; render(); return; }
      if (ds.save) { save(ds.save); toast("保存しました"); ui.modal = null; render(); return; }
      if (ds.named) { openModal({ kind: "named", id: ds.named }); return; }
      if (ds.char) { openModal({ kind: "char", char: ds.char }); return; }
      return;
    }
    if (ds.pref) { ui.sel = ds.pref; if (isMobile() && ui.tab === "map") ui.tab = "pref"; render(); return; }
    if (ds.mode) { ui.mode = ds.mode; if (ds.mode === "issue" && !ui.issue) ui.issue = "keiki"; render(); return; }
    if (ds.tab) { ui.tab = ds.tab; render(); window.scrollTo({ top: 0 }); return; }
    if (ds.cmd) { runCmd(ds.cmd, ui.sel); return; }
    if (ds.char) { openModal({ kind: "char", char: ds.char }); return; }
    if (ds.named) { openModal({ kind: "named", id: ds.named }); return; }
    if (ds.fire) { E.fireSecretary(ds.fire); save(); render(); return; }
    if (ds.bill) { const b = g.bills.find(x => x.id === ds.bill); if (E.nemawashi(b, ds.kind)) FX.sound("ok"); save(); render(); return; }
    if (ds.camp) { const b = E.campaignAlloc(ui.sel, ds.camp); if (b) { FX.sound("ok"); toast(`${PREF[ui.sel].name}の情勢が動いた（+${Math.round(b)}）`); } save(); render(); return; }
    if (ds.act === "campNext") { const res = E.campaignNext(); save(); if (res) startCount(res); else { render(); toast(`${["序盤", "中盤", "終盤"][g.campaign.round - 1]}の日程へ。持ち点が回復した`); } return; }
    if (ds.act === "end") { endMonth(false); return; }
    if (ds.act === "auto3") { advanceMonths(3); return; }
    if (ds.act === "me") { openModal({ kind: "me" }); return; }
    if (ds.act === "menu") { openModal({ kind: "menu" }); return; }
    if (ds.save) { save(ds.save); toast("保存しました"); return; }
    if (ds.load) { const gg = loadSlot(ds.load); if (gg && E.restore(gg)) { ui.sel = T.G.player.home; render(); nextModal(); } return; }
    if (ds.act === "export") { ui.exportCode = E.exportCode(); render(); return; }
    if (ds.act === "copy") { const ta = document.getElementById("exportCode"); navigator.clipboard?.writeText(ta.value).then(() => toast("コピーしました")).catch(() => { ta.select(); }); return; }
    if (ds.act === "title") { save(); T.G = null; render(); return; }
  });
  function toastSetup(t) { alert; ui.toast = t; render(); }
  document.addEventListener("change", e => {
    const t = e.target;
    if (!T.G) { if (t.dataset.field) ui.setup[t.dataset.field] = t.value.trim() || (t.dataset.field === "surname" ? "汐見" : "健"); if (t.dataset.carry) ui.setup.carry = t.checked; render(); return; }
    if (t.dataset.issue !== undefined) { ui.issue = t.value; render(); }
    if (t.dataset.opt === "sound") { T.G.options.sound = t.checked; FX.enabled = t.checked; if (t.checked) FX.sound("ok"); save(); }
    if (t.dataset.opt === "bgm") { T.G.options.bgm = t.checked; FX.enabled = FX.enabled || t.checked; FX.bgm(t.checked); save(); }
  });
  document.addEventListener("input", e => { if (!T.G && e.target.dataset.field) ui.setup[e.target.dataset.field] = e.target.value.trim() || (e.target.dataset.field === "surname" ? "汐見" : "健"); });
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(".tile")) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
  window.addEventListener("resize", () => { clearTimeout(ui.rz); ui.rz = setTimeout(render, 150); });

  window.__tenka = { get G() { return T.G; }, E, ui, render };
  function start(data) {
    if (data && data.G && data.G.v === E.SAVE_VERSION) { T.G = data.G; ui.sel = T.G.player.home; }
    render();
    if (T.G) nextModal();
  }
  window.claude?.hot?.snapshot?.(() => ({ G: T.G }));
  window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
