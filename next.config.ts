import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Don't drop generated AGENTS.md / CLAUDE.md into a fresh clone on `next dev`.
  agentRules: false,
};

export default withNextIntl(nextConfig);
