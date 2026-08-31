import "server-only";
import { getMailProvider } from "./providers";
import type { MailMessage } from "./types";

export * from "./types";
export { getMailProvider, mailLive } from "./providers";
export { renderBookingMail, renderOrderMail } from "./render";

/**
 * Sends, and never lets a failure lose the transaction.
 *
 * A confirmation that does not arrive is bad; a booking that fails because the
 * mail server was briefly down is worse — the traveller loses the reservation
 * and the operator loses the sale. So the send is best-effort and its failure
 * is logged with the reference, which is what a retry would need.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  try {
    await getMailProvider().send(message);
    return true;
  } catch (error) {
    console.error(
      `[mail:failed] ref=${message.reference} to=${message.to}`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
