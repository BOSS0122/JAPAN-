// 戦略モードのバランス確認。ブラウザなしでエンジンだけを動かす。
//   node tests/sim.mjs [runs] [months] [faction] [style]
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({ console, Buffer, Math, Date, JSON });
ctx.globalThis = ctx;
for (const f of ["tenka-data.js", "tenka-world.js", "tenka-engine.js", "tenka-election.js"]) vm.runInContext(fs.readFileSync(path.join(dir, "..", f), "utf8"), ctx, { filename: f });
const T = ctx.Tenka, E = T.E;
const runs = Number(process.argv[2] || 3), months = Number(process.argv[3] || 120), faction = process.argv[4] || "p", style = process.argv[5] || "clean";

function handle(ev) {
  const G = T.G;
  switch (ev.kind) {
    case "event": { const e = T.D.events.find(x => x.id === ev.id); const i = style === "dirty" ? 0 : e.choices.length - 1; E.applyEventChoice(ev, e.choices[Math.min(i, e.choices.length - 1)]); break; }
    case "crisis": E.applyCrisis(ev.id, 0); break;
    case "campaignStart": {
      E.campaignStart();
      for (let r = 0; r < 3; r++) {
        // 接戦区に資源を集める
        const prefs = T.D.prefs.map(p => ({ id: p.id, s: E.prefStatus(p.id) })).filter(x => x.s && x.s.label === "接戦").sort((a, b) => b.s.n - a.s.n);
        for (const p of prefs) { if (!E.campaignAlloc(p.id, "visit")) break; }
        for (const p of prefs.slice(0, 2)) E.campaignAlloc(p.id, "leader");
        if (E.campaignNext()) break;
      }
      break;
    }
    case "upper": E.upperElection(); break;
    case "leaderAsk": {
      const n = E.seats(G.pf); const run = n >= 20;
      if (run) for (const f of E.leaderPrep()) { if (f.owed) E.leaderOffer(f.f, "favor"); else E.leaderOffer(f.f, "post"); }
      E.leaderVote(run); break;
    }
    case "cabinet": E.formCabinet("balance", true); break;
    case "budget": E.applyBudget({ keiki: 3, kosodate: 3, bouei: 1, chihou: 2, zaisei: 1 }); break;
    case "coalitionAsk": E.coalitionAnswer(ev.partner, true); break;
  }
}
const summary = [];
for (let run = 0; run < runs; run++) {
  E.newGame({ scenario: "gendai", faction, surname: "汐見", given: "健", gender: "m", type: "fixer", home: "hiroshima", difficulty: "normal", seed: 1000 + run });
  const G = T.G;
  let m = 0, over = null;
  try {
    for (; m < months; m++) {
      while (G.queue.length) { const ev = G.queue.shift(); handle(ev); if (T.G.over) { over = T.G.over; break; } }
      if (over) break;
      if (T.G.phase !== "normal") { console.log("stuck in phase", T.G.phase); break; }
      if (style === "dirty" && T.G.player.ap > 0) { E.tipsSeen = 1; T.G.tipsSeen.urakane = true; E.useCmd("urakane", T.G.player.home); }
      E.autoMonth();
      E.endMonth();
      if (T.G.over) { over = T.G.over; while (T.G.queue.length) handle(T.G.queue.shift()); break; }
    }
  } catch (e) { console.log("ERROR at month", m, e.stack); break; }
  const g = T.G, s = e => E.seats(e);
  const ev = E.evaluate();
  summary.push(`${faction}/${style} seed${1000 + run}: ${m}か月 ${over ? over.kind : "継続"} | 仲間${s(g.pf)} 与党${E.rulingSeats()} PM=${g.cabinet.pm} 在任${g.monthsAsPM} | 資金${Math.round(g.player.money)} 知名度${Math.round(g.player.fame)} リスク${Math.round(g.player.risk)} 役職${g.player.post} 法案${g.passed.length} 事業${g.worksDone} | 評価 ${ev.title} 清${ev.integrity}/実${ev.achievement}/民${ev.popularity}`);
}
console.log(summary.join("\n"));
