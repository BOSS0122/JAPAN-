/**
 * Sending mail.
 *
 * Same adapter shape as the other integrations. A traveller who books and
 * receives nothing has no record of it — not a confirmation number, not a date,
 * nothing to show at the door — so this is not an optional nicety.
 */

export interface MailMessage {
  to: string;
  subject: string;
  /** Plain text. Deliberately not HTML: see mail/render.ts. */
  text: string;
  /** Our own reference, so a delivery log can be matched to an order. */
  reference: string;
}

export interface MailProvider {
  id: string;
  name: string;
  /** Whether this provider actually delivers to an inbox. */
  readonly live: boolean;
  send(message: MailMessage): Promise<void>;
}
