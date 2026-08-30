/**
 * Single source of truth for the (provisional) service name and brand copy.
 * Renaming the service = editing SERVICE_NAME here only.
 */
export const SERVICE_NAME = "JapanQuest";

export const site = {
  name: SERVICE_NAME,
  shortName: SERVICE_NAME,
  tagline: {
    en: "Find the Japan nobody told you about.",
    ja: "まだ誰も教えてくれない日本へ。",
    th: "ค้นพบญี่ปุ่นในแบบที่ยังไม่มีใครบอกคุณ",
  },
  supportEmail: `hello@${SERVICE_NAME.toLowerCase()}.example`,
} as const;
