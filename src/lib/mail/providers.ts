import "server-only";
import type { MailProvider } from "./types";

/**
 * The default: writes to the server log instead of sending.
 *
 * Useful in development, and honest in production — the message is composed and
 * recorded, so it is obvious from the logs what would have gone out and to
 * whom. `live: false` is what the preflight check reads.
 */
export const logMailProvider: MailProvider = {
  id: "log",
  name: "Server log (no delivery)",
  live: false,
  async send(message) {
    console.info(
      `[mail:not-sent] to=${message.to} ref=${message.reference} subject=${message.subject}`,
    );
  },
};

/**
 * A real adapter is a dozen lines. With Resend:
 *
 *   export const resendMailProvider: MailProvider = {
 *     id: "resend",
 *     name: "Resend",
 *     live: Boolean(process.env.RESEND_API_KEY),
 *     async send({ to, subject, text }) {
 *       const res = await fetch("https://api.resend.com/emails", {
 *         method: "POST",
 *         headers: {
 *           Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
 *           "Content-Type": "application/json",
 *         },
 *         body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }),
 *       });
 *       if (!res.ok) throw new Error(`Mail failed: ${res.status}`);
 *     },
 *   };
 *
 * Whatever the provider, the sending domain needs SPF and DKIM before any of
 * this reaches an inbox rather than a spam folder.
 */

const providers: Record<string, MailProvider> = {
  log: logMailProvider,
};

export function getMailProvider(): MailProvider {
  const key = process.env.MAIL_PROVIDER ?? "log";
  return providers[key] ?? logMailProvider;
}

export function mailLive(): boolean {
  return getMailProvider().live;
}
