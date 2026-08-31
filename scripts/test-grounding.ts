/**
 * The one test that has to pass.
 *
 * Mood search puts a language model between a traveller and a plane ticket. If
 * a provider ever returns a place that does not exist — because it drifted from
 * its instructions, because a prompt was edited, because a future provider is
 * worse — nothing invented may reach a page. This exercises that boundary
 * directly with providers that misbehave on purpose.
 *
 * Run with: npm test
 */
import path from "node:path";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // Ambient environment is fine.
}

let failures = 0;

function check(label: string, condition: boolean, detail = "") {
  const mark = condition ? "✓" : "✗";
  console.log(`  ${mark}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!condition) failures += 1;
}

async function main() {
  const { hydrate } = await import("../src/lib/repo/mood");
  const { localMoodProvider } = await import("../src/lib/providers/mood-local");
  const { places } = await import("../src/data/places");

  // Two real catalogue entries; only these ids may ever come back.
  const real = places.filter((p) => p.id === "nezu-shrine" || p.id === "sensoji");
  const bySlug = new Map(real.map((p) => [p.id, p])) as Parameters<typeof hydrate>[1];

  console.log("\n  grounding: a provider's output is checked against the catalogue\n");

  const invented = hydrate(
    [
      { id: "nezu-shrine", reason: "Quiet backstreet shrine." },
      { id: "mount-fuji-secret-shrine", reason: "A wonderful hidden power spot." },
      { id: "sensoji", reason: "Well known." },
    ],
    bySlug,
  );
  check("an invented place is dropped", invented.places.length === 2);
  check(
    "the invented id never appears",
    !invented.places.some((p) => p.id === "mount-fuji-secret-shrine"),
  );
  check("it is counted, not swallowed", invented.rejected === 1, `rejected=${invented.rejected}`);
  check("the real places survive in order", invented.places.map((p) => p.id).join(",") === "nezu-shrine,sensoji");
  check("their reasons are kept", invented.reasons.get("nezu-shrine") === "Quiet backstreet shrine.");

  const allFake = hydrate(
    [
      { id: "atlantis-onsen", reason: "" },
      { id: "../../etc/passwd", reason: "" },
      { id: "", reason: "" },
    ],
    bySlug,
  );
  check("a wholly invented answer yields nothing", allFake.places.length === 0);
  check("all three are counted", allFake.rejected === 3, `rejected=${allFake.rejected}`);

  const duplicated = hydrate(
    [
      { id: "sensoji", reason: "First." },
      { id: "sensoji", reason: "Again." },
    ],
    bySlug,
  );
  check("a repeated id appears once", duplicated.places.length === 1);
  check("the first reason wins", duplicated.reasons.get("sensoji") === "First.");

  console.log("\n  fallback: it declines rather than pads\n");

  const candidates = [
    {
      id: "naha-izakaya", name: "Naha Awamori Izakaya", area: "Naha", prefecture: "Okinawa",
      category: "restaurant", tags: ["foodie"], description: "Awamori and grilled fish until late.",
      openHour: 17, closeHour: 23, indoor: true, famous: false, crowd: "normal",
    },
    {
      id: "morning-garden", name: "Moss Garden", area: "Kyoto", prefecture: "Kyoto",
      category: "spot", tags: ["nature"], description: "A moss garden best seen in the morning.",
      openHour: 8, closeHour: 16, indoor: false, famous: false, crowd: "quiet",
    },
  ];

  const club = await localMoodProvider.search({
    text: "夜にダンスクラブに行きたい", locale: "ja", candidates, limit: 12,
  });
  check(
    "a mood the catalogue cannot answer returns nothing",
    club.length === 0,
    `got ${club.length}`,
  );

  const quiet = await localMoodProvider.search({
    text: "somewhere quiet", locale: "en", candidates, limit: 12,
  });
  check("a mood it can answer returns the right one", quiet.map((m) => m.id).join(",") === "morning-garden");

  const nonsense = await localMoodProvider.search({
    text: "zzzz qqqq", locale: "en", candidates, limit: 12,
  });
  check("noise returns nothing", nonsense.length === 0, `got ${nonsense.length}`);

  console.log("");
  if (failures > 0) {
    console.log(`  ${failures} failing\n`);
    process.exitCode = 1;
  } else {
    console.log("  all passing\n");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
