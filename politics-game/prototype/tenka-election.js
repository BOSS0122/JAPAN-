// 『永田町への道 天下取り』 選挙・総裁選・連立・参議院
(() => {
  const T = globalThis.Tenka, D = T.D, W = T.W, E = T.E;
  const { rnd, rand, pick, clamp, PREF, NAMED, ISSUE } = E;
  const G = () => T.G;
  const weighted = (items, w) => { const total = items.reduce((t, it) => t + Math.max(0, w(it)), 0); let r = rnd() * total; for (const it of items) { r -= Math.max(0, w(it)); if (r <= 0) return it; } return items[items.length - 1]; };

  /* ---------- 選挙戦 ---------- */
  function candidateStrength(pref, d, party, fac, char) {
    const g = G(), st = g.prefs[pref], P = g.player;
    let s = st.sup[party];
    if (d && d.fac === fac && char) s += 6;                      // 現職
    if (party === E.pmParty()) s += (g.cabinet.support - 40) / 4; // 政権への評価
    if (fac === g.pf) {
      s += st.jiban / 4 + P.fame / 12 + E.issueMatch(P.stances, st.lean) * 10 + (P.consistency - 70) / 10;
      for (const gr of W.groups) if (g.groups[gr.id].rel >= 60) s += gr.votes * (pref === P.home ? 1 : 0.3);
      if (char === "player") s += st.jiban / 5 + P.fame / 10;
    } else s += E.issueMatch(E.facStances(fac), st.lean) * 6 + ((g.facs[fac]?.fame || 50) - 50) / 10;
    return Math.max(1, s);
  }
  function buildDistricts() {
    const g = G(), out = [];
    const myCands = {};
    for (const c of g.candidates) (myCands[c.pref] = myCands[c.pref] || []).push(c.char);
    for (const p of D.prefs) {
      const st = g.prefs[p.id];
      st.districts.forEach((d, idx) => {
        const cands = [];
        for (const party of g.parties) {
          const fs = E.facsOf(party);
          if (!fs.length) continue;
          let fac, char = null;
          if (E.partyOf(d.fac) === party) { fac = d.fac; char = d.char; }
          else if (party === E.playerParty() && myCands[p.id]?.length) { fac = g.pf; char = myCands[p.id].shift(); }
          else if (party === E.playerParty() && g.player.freeCandidate > 0 && rnd() < 0.3) { g.player.freeCandidate--; fac = g.pf; }
          else fac = weighted(fs, f => (D.factions[f].weight || 0.3) * 10 + E.seats(f) / 10);
          cands.push({ party, fac, char, strength: candidateStrength(p.id, d, party, fac, char), boost: 0 });
        }
        // 野党の候補者一本化
        if (g.oppUnited) {
          const opp = cands.filter(c => !E.rulingParties().includes(c.party) && c.fac !== g.pf);
          if (opp.length >= 2) { opp.sort((a, b) => b.strength - a.strength); opp[0].strength += opp[1].strength * 0.6; opp[1].strength = 0.5; opp[1].withdrawn = true; }
        }
        out.push({ pref: p.id, idx, cands, you: d.char === "player" || cands.some(c => c.char === "player") });
      });
    }
    return out;
  }
  function probs(dist) {
    const w = dist.cands.map(c => Math.pow(c.strength + c.boost, 3));
    const t = w.reduce((a, b) => a + b, 0);
    return w.map(x => x / t);
  }
  E.districtStatus = function (dist) {
    const g = G(), i = dist.cands.findIndex(c => c.fac === g.pf);
    if (i < 0) return null;
    const p = probs(dist)[i];
    return { p, label: p >= 0.62 ? "優勢" : p >= 0.4 ? "接戦" : p >= 0.15 ? "劣勢" : "厳しい" };
  };
  E.prefStatus = function (pid) {
    const g = G(); if (!g.campaign) return null;
    const ds = g.campaign.districts.filter(d => d.pref === pid);
    const mine = ds.map(E.districtStatus).filter(Boolean);
    if (!mine.length) return null;
    const avg = mine.reduce((t, s) => t + s.p, 0) / mine.length;
    return { n: mine.length, p: avg, label: avg >= 0.62 ? "優勢" : avg >= 0.4 ? "接戦" : "劣勢" };
  };
  E.campaignStart = function () {
    const g = G();
    g.retrySnap = JSON.stringify({ ...g, retrySnap: null, queue: [], campaign: null, phase: "normal" });
    g.phase = "campaign";
    const pts = 4 + Math.floor(g.player.fame / 25) + Math.floor(E.seats(g.pf) / 8);
    const leaderOk = E.partyOf(g.partyLeader[E.playerParty()]) === E.playerParty() && (g.partyLeader[E.playerParty()] === g.pf || (g.facs[g.partyLeader[E.playerParty()]]?.rel || 0) >= 55 || g.facs[g.partyLeader[E.playerParty()]]?.ally);
    g.campaign = { round: 1, rounds: 3, pts, ptsLeft: pts, leaderVisits: leaderOk ? 2 : 0, districts: buildDistricts(), spent: {} };
    E.learn("公職選挙法 第129条（選挙運動の期間）", "選挙戦");
    E.log("衆議院が解散され、12日間の選挙戦が始まった。", "big");
    return g.campaign;
  };
  E.campaignAlloc = function (pid, kind) {
    const g = G(), c = g.campaign; if (!c) return null;
    const mine = c.districts.filter(d => d.pref === pid && d.cands.some(x => x.fac === g.pf));
    if (!mine.length) return null;
    let boost = 0;
    if (kind === "visit") { if (c.ptsLeft < 1) return null; c.ptsLeft -= 1; boost = 8 + g.player.stats.ben / 10; }
    if (kind === "money") { if (g.player.money < 300) return null; g.player.money -= 300; boost = 7; }
    if (kind === "leader") { if (c.leaderVisits < 1) return null; c.leaderVisits -= 1; boost = 14; }
    if (kind === "group") { const gr = W.groups.filter(x => g.groups[x.id].rel >= 60); if (!gr.length || c.ptsLeft < 1) return null; c.ptsLeft -= 1; boost = 4 + gr.length * 3; }
    for (const d of mine) { const x = d.cands.find(x => x.fac === g.pf); x.boost += boost / Math.sqrt(mine.length); }
    c.spent[pid] = (c.spent[pid] || 0) + 1;
    return boost;
  };
  E.campaignNext = function () {
    const g = G(), c = g.campaign;
    c.round += 1;
    if (c.round > c.rounds) return E.count();
    c.ptsLeft = c.pts;
    // 他勢力の選挙運動：接戦区に資源を集める
    for (const d of c.districts) for (const x of d.cands) if (x.fac !== g.pf) { const p = probs(d)[d.cands.indexOf(x)]; if (p > 0.25 && p < 0.6) x.boost += rand(2, 6); }
    return null;
  };

  /* ---------- 開票 ---------- */
  E.count = function () {
    const g = G(), c = g.campaign, P = g.player;
    const before = Object.fromEntries(E.activeFacs().map(f => [f, E.seats(f)]));
    const results = [];
    let own = null;
    for (const d of c.districts) {
      const pr = probs(d);
      const i = weighted(d.cands.map((_, k) => k), k => pr[k]);
      const w = d.cands[i];
      const st = g.prefs[d.pref], dd = st.districts[d.idx];
      const prevFac = dd.fac;
      const youIdx = d.cands.findIndex(x => x.char === "player");
      if (youIdx >= 0) own = { win: i === youIdx, p: pr[youIdx], ratio: (d.cands[youIdx].strength + d.cands[youIdx].boost) / (w.strength + w.boost), pref: d.pref };
      let charId = w.char;
      if (!charId || E.partyOf(dd.fac) !== w.party) { charId = w.char && g.chars[w.char] ? w.char : E.newChar(w.fac, d.pref, { terms: 0 }); }
      if (charId !== "player") { const ch = g.chars[charId]; ch.terms += 1; ch.candidate = false; ch.fac = w.fac; }
      const winner = { party: w.party, fac: w.fac, char: charId, name: charId === "player" ? E.playerName() : g.chars[charId].name, flipped: E.partyOf(dd.fac) !== w.party || dd.fac !== w.fac };
      dd.fac = w.fac; dd.char = charId;
      results.push({ pref: d.pref, idx: d.idx, prev: prevFac, winner, you: youIdx >= 0, youWon: youIdx >= 0 && i === youIdx, p: pr[i], close: pr[i] < 0.5 });
    }
    g.candidates = [];
    E.allocatePR();
    // 惜敗率による比例復活
    let revived = false;
    if (own && !own.win) {
      const party = E.playerParty();
      if (own.ratio >= 0.85 && g.pr[g.pf] + E.facsOf(party).reduce((t, f) => t + g.pr[f], 0) > 0) {
        revived = true; const donor = E.facsOf(party).filter(f => g.pr[f] > 0).sort((a, b) => g.pr[b] - g.pr[a])[0]; if (donor && donor !== g.pf) { g.pr[donor]--; g.pr[g.pf]++; }
        E.learn("公職選挙法 第95条の2（比例代表の当選人・惜敗率）", "比例復活");
      } else {
        g.over = { kind: "lose", title: "落選", text: `${PREF[own.pref].name}の選挙区で敗れ、惜敗率${Math.round(own.ratio * 100)}%では比例でも復活できなかった。「猿は木から落ちても猿だが、代議士は選挙に落ちればただの人」。`, retry: true };
        g.electionsLost++;
      }
    }
    if (!g.over) P.terms += 1;
    // 順番をシャッフルして開票の演出に
    const order = results.map((r, i) => i).sort(() => rnd() - 0.5);
    const after = Object.fromEntries(E.activeFacs().map(f => [f, E.seats(f)]));
    const partyBefore = {}, partyAfter = {};
    for (const party of g.parties) { partyBefore[party] = E.facsOf(party).reduce((t, f) => t + before[f], 0); partyAfter[party] = E.partySeats(party); }
    const gov = formGovernment();
    g.lastElection = g.turn; g.nextElection = g.turn + 36 + Math.floor(rand(0, 12)); g.campaign = null; g.phase = "normal";
    if (!g.over) assignPost();
    const res = { results, order, before, after, partyBefore, partyAfter, pr: { ...g.pr }, own, revived, gov, turn: g.turn };
    g.lastResult = res;
    const lead = g.parties.slice().sort((a, b) => partyAfter[b] - partyAfter[a])[0];
    E.log(`総選挙。${g.parties.map(p => `${D.parties[p].name} ${partyAfter[p]}`).join("、")}。${E.facName(g.pf)}は ${after[g.pf]}人（${after[g.pf] - before[g.pf] >= 0 ? "+" : ""}${after[g.pf] - before[g.pf]}）。`, "big");
    if (gov.change) E.log(gov.change, "big");
    E.queue({ kind: "extra", headline: gov.change ? "政権交代" : `${D.parties[lead].name} ${partyAfter[lead] >= E.MAJORITY ? "単独過半数" : "第一党"}`, sub: `${E.facName(g.pf)}は${after[g.pf]}議席${revived ? "。" + E.playerName() + "は比例で復活" : ""}` });
    if (own && !own.win && P.debt > 0 && !g.over) E.queue({ kind: "event", id: "bankcall", pref: P.home });
    if (g.over) E.queue({ kind: "over" });
    else if (gov.ask) E.queue({ kind: "coalitionAsk", partner: gov.ask });
    else afterGovernment();
    return res;
  };

  function formGovernment() {
    const g = G();
    const ps = g.parties.slice().sort((a, b) => E.partySeats(b) - E.partySeats(a));
    const largest = ps[0];
    const oldPM = g.cabinet.pm;
    let coalition = [largest], ask = null;
    if (E.partySeats(largest) < E.MAJORITY) {
      const partner = ps.slice(1).find(p => E.partySeats(largest) + E.partySeats(p) >= E.MAJORITY && compatible(largest, p));
      if (partner) {
        if (partner === E.playerParty() && g.partyLeader[partner] === g.pf) ask = { largest, partner };
        else coalition = [largest, partner];
      }
    }
    g.coalition = coalition;
    g.cabinet.pm = g.partyLeader[largest];
    const change = oldPM !== g.cabinet.pm && E.partyOf(oldPM) !== largest ? `${D.parties[largest].name}が政権を握った。${coalition.length > 1 ? D.parties[coalition[1]].name + "との連立。" : ""}` : (coalition.length === 1 && E.partySeats(largest) < E.MAJORITY ? `${D.parties[largest].name}は過半数に届かず、少数与党として政権を続ける。` : "");
    if (E.isPM() && E.partySeats(largest) >= E.MAJORITY - 20) g.wonAsPM = true;
    return { coalition, change, ask };
  }
  function compatible(a, b) {
    const pairs = { "kyowa-kaikaku": true, "minsei-kaikaku": true, "minsei-shinto": true, "kyowa-shinto": true, "kaikaku-shinto": true };
    return !!pairs[`${a}-${b}`] || !!pairs[`${b}-${a}`];
  }
  E.coalitionAnswer = function (partner, yes) {
    const g = G();
    if (yes) {
      g.coalition = [partner.largest, partner.partner];
      g.player.post = 3; g.player.consistency = clamp(g.player.consistency - 10, 0, 100);
      for (const p of D.prefs) { g.prefs[p.id].sup[partner.partner] -= 1.5; E.normalizeSup && E.normalizeSup(g.prefs[p.id].sup); }
      E.log(`${D.parties[partner.largest].name}との連立に加わった。あなたは国務大臣として入閣した。`, "big");
      E.learn("日本国憲法 第67条・第68条（首相指名と大臣の任命）", "連立");
    } else { g.coalition = [partner.largest]; E.log(`連立の誘いを断った。${D.parties[partner.largest].name}は少数与党になる。`, "big"); assignPost(); }
    afterGovernment();
  };
  function afterGovernment() {
    const g = G();
    if (E.isPM()) { if (!g.victoryShown) { g.victoryShown = true; E.queue({ kind: "tenka" }); } g.pendingCabinet = true; E.queue({ kind: "cabinet" }); }
    else if (E.isRuling() && g.cabinet.pm !== g.pf) { /* 閣僚人事は党首が行う */ E.makeCabinetAI && E.makeCabinetAI(); }
    E.queue({ kind: "electionResult" });
  }
  function assignPost() {
    const g = G(), P = g.player, n = E.seats(g.pf);
    if (E.isPM()) P.post = 4;
    else if (!E.isRuling()) P.post = g.partyLeader[E.playerParty()] === g.pf ? 5 : 0;
    else {
      let lv = n >= 15 ? 3 : n >= 8 ? 2 : n >= 4 ? 1 : 0;
      const pmf = g.cabinet.pm; if (g.facs[pmf] && (g.facs[pmf].rel >= 60 || g.facs[pmf].ally)) lv += 1;
      if (lv >= 3 && P.terms < 3) lv = 2;
      if (g.facs[pmf] && g.facs[pmf].mood === "hostile") lv = Math.max(0, lv - 1);
      P.post = clamp(lv, 0, 3);
    }
    if (P.budget < E.post().budget) P.budget = E.post().budget;
    E.log(`あなたの役職：${E.post().name}。`, "mine");
  }
  E.assignPost = assignPost;
  E.retryElection = function () {
    const g = G(); if (!g.retrySnap) return null;
    const snap = JSON.parse(g.retrySnap); snap.retrySnap = g.retrySnap; snap.nextElection = snap.turn; snap.electionsLost = g.electionsLost;
    T.G = snap; return snap;
  };

  /* ---------- 参議院選挙 ---------- */
  E.upperElection = function () {
    const g = G(); const ns = E.nationalSupport();
    const before = { ...g.upper };
    const kept = {}; for (const p of g.parties) kept[p] = Math.round((g.upper[p] || 0) / 2);
    const adj = {}; let t = 0;
    for (const p of g.parties) { adj[p] = ns[p] * (p === E.pmParty() ? 1 + (g.cabinet.support - 40) / 120 : 1); t += adj[p]; }
    let given = 0;
    for (const p of g.parties) { g.upper[p] = kept[p] + Math.round(E.UPPER / 2 * adj[p] / t); given += g.upper[p]; }
    g.upper[g.parties[0]] += E.UPPER - given;
    g.lastUpper = g.turn; g.nextUpper = g.turn + 36;
    const nej = E.nejire();
    if (nej) { g.cabinet.support = clamp(g.cabinet.support - 6, 5, 80); E.learn(D.tips.upper.law, "ねじれ国会"); }
    E.log(`参議院選挙。${g.parties.map(p => `${D.parties[p].name} ${g.upper[p]}`).join("、")}。${nej ? "与党は参議院の過半数を失い、ねじれ国会に。" : "与党が参議院の過半数を維持。"}`, "big");
    E.queue({ kind: "extra", headline: nej ? "ねじれ国会に" : "与党、参院過半数を維持", sub: `参院選 ${g.parties.map(p => D.parties[p].short + g.upper[p]).join(" ")}` });
    return { before, after: { ...g.upper }, nejire: nej };
  };

  /* ---------- 総裁選 ---------- */
  E.leaderPrep = function () {
    const g = G(), party = E.playerParty();
    return E.facsOf(party).filter(f => f !== g.pf).map(f => ({ f, seats: E.seats(f), rel: g.facs[f].rel, ally: g.facs[f].ally, promise: g.facs[f].promise, mood: g.facs[f].mood, leader: D.factions[f].leader, owed: g.named[D.factions[f].leader]?.owed || 0 }));
  };
  E.leaderOffer = function (f, kind) {
    const g = G(), fs = g.facs[f], P = g.player;
    if (kind === "post") { if (fs.promise) return null; fs.promise = "幹事長か主要閣僚"; fs.rel = clamp(fs.rel + 12, 0, 100); if (rnd() < 0.5 + fs.rel / 200) fs.ally = true; E.log(`${E.facName(f)}に、勝ったらポストを約束した。${fs.ally ? "協力を取り付けた。" : "返事は濁された。"}`, "mine"); return fs.ally; }
    if (kind === "favor") { const n = g.named[D.factions[f].leader]; if (!n || n.owed < 1) return null; n.owed -= 1; fs.ally = true; E.log(`${E.leaderName(f)}に貸しを返してもらい、総裁選での協力を得た。`, "mine"); return true; }
    if (kind === "cash") { if (P.money < 2000) return null; P.money -= 2000; E.addRisk(20); P.integrity = clamp(P.integrity - 12, 0, 100); const ok = rnd() < 0.7; if (ok) fs.ally = true; E.log(`${E.facName(f)}の議員たちに「陣中見舞い」を配った。${ok ? "票はまとまった。" : "受け取っておいて、票は来なかった。"}`, "shady"); E.learn("政治資金規正法 第25条・刑法（総裁選の買収は公選法の対象外だが、不記載は違法）", "総裁選の実弾"); return ok; }
    return null;
  };
  E.leaderVote = function (playerRuns) {
    const g = G(), party = E.playerParty(), P = g.player;
    const fs = E.facsOf(party);
    const seatsOf = Object.fromEntries(fs.map(f => [f, E.seats(f)]));
    let cands = fs.filter(f => f !== g.pf && seatsOf[f] >= 20 && !(playerRuns && g.facs[f].ally) && (f === g.partyLeader[party] || rnd() < 0.65));
    if (playerRuns) cands.push(g.pf);
    if (!cands.length) cands = [g.partyLeader[party] === g.pf ? fs.find(f => f !== g.pf) || g.pf : g.partyLeader[party]];
    if (cands.length === 1) { const w = cands[0]; E.log(`${party === "kyowa" ? "総裁選" : "代表選"}は${E.leaderName(w)}の無投票再選となった。`, "big"); finishLeader(w); return { cands, rounds: [], winner: w, uncontested: true }; }
    const fameOf = c => c === g.pf ? P.fame : g.facs[c].fame;
    const backs = {};
    for (const f of fs) {
      if (cands.includes(f)) backs[f] = f;
      else if (f !== g.pf && g.facs[f].ally && cands.includes(g.pf)) backs[f] = g.pf;
      else backs[f] = cands.filter(c => c !== g.pf).sort((a, b) => seatsOf[b] - seatsOf[a])[0] || cands[0];
    }
    const giin = Object.fromEntries(cands.map(c => [c, 0]));
    for (const f of fs) {
      if (f === g.pf) { let loyal = 1; for (const c of E.members()) { if (c.loyalty >= 35 || rnd() < 0.5) loyal++; else giin[pick(cands)] += 1; } giin[backs[f]] += loyal + (g.pr[f] || 0); }
      else giin[backs[f]] += seatsOf[f];
    }
    if (cands.includes(g.pf) && P.elderVotes) { giin[g.pf] += P.elderVotes; P.elderVotes = 0; }
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
      for (const c of cands) { const v = giin[c]; if (top.includes(c)) g2[c] += v; else g2[(c !== g.pf && g.facs[c]?.ally && top.includes(g.pf)) ? g.pf : top.slice().sort((a, b) => giin[b] - giin[a])[0]] += v; }
      const pref2 = Object.fromEntries(top.map(c => [c, 0]));
      for (let i = 0; i < 47; i++) pref2[rnd() < fameOf(top[0]) / (fameOf(top[0]) + fameOf(top[1])) ? top[0] : top[1]] += 1;
      const r2 = top.map(c => ({ c, giin: g2[c], tou: pref2[c], total: g2[c] + pref2[c] })).sort((a, b) => b.total - a.total);
      rounds.push(r2); winner = r2[0].c;
    }
    E.log(`${party === "kyowa" ? "協和党総裁選" : "代表選"}。${E.leaderName(winner)}（${E.facName(winner)}）が選ばれた。`, "big");
    E.queue({ kind: "extra", headline: `新総裁に${E.leaderName(winner)}`, sub: rounds.length > 1 ? "決選投票の末に" : "1回目の投票で過半数" });
    finishLeader(winner);
    return { cands, rounds, winner };
  };
  function finishLeader(w) {
    const g = G(), party = E.playerParty();
    g.partyLeader[party] = w;
    if (E.rulingParties()[0] === party) g.cabinet.pm = w;
    g.cabinet.support = clamp(g.cabinet.support + 10, 5, 80);
    g.nextLeader = g.turn + 36;
    for (const f of E.activeFacs()) { if (f !== g.pf && g.facs[f].promise) { if (w === g.pf) { g.facs[f].rel = clamp(g.facs[f].rel + 10, 0, 100); g.facs[f].promised = true; } g.facs[f].promise = null; } g.facs[f].ally = false; }
    if (E.isPM()) { g.player.post = 4; g.player.budget = Math.max(g.player.budget, E.post().budget); if (!g.victoryShown) { g.victoryShown = true; E.queue({ kind: "tenka" }); } g.pendingCabinet = true; E.queue({ kind: "cabinet" }); }
    else if (w === g.pf) g.player.post = 5;
    else assignPost();
  }
  E.skipLeader = function () { const g = G(); const r = E.leaderVote(false); return r; };
})();
