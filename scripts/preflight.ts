/**
 * Command-line launch check: `npm run preflight`.
 *
 * Exits non-zero when anything would harm a traveller or break the law, so it
 * can sit in a deploy pipeline as the gate it is.
 */
import path from "node:path";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // Ambient environment is fine.
}

const MARK = { blocker: "✗", warning: "!", ok: "✓" } as const;

async function main() {
  const { preflight } = await import("../src/lib/preflight");
  const report = await preflight();

  console.log("");
  for (const check of report.checks) {
    console.log(`  ${MARK[check.severity]}  ${check.label.padEnd(12)} ${check.detail}`);
    if (check.fix && check.severity !== "ok") console.log(`     ${check.fix}`);
  }

  console.log("");
  if (report.readyToLaunch) {
    console.log(
      report.launched
        ? "  Live. Nothing blocking.\n"
        : '  Ready. Set LAUNCHED="true" and redeploy to open the site.\n',
    );
  } else {
    console.log(`  ${report.blockers} blocking, ${report.warnings} to review. Not ready.\n`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
