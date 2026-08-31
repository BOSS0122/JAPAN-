import "server-only";
import type { Booking, Order } from "@/lib/store";
import type { Place } from "@/data/types";
import type { Product } from "@/data/commerce";
import { t as localized } from "@/lib/localized";
import { SERVICE_NAME } from "@/config/site";
import { operator } from "@/config/operator";
import { absoluteUrl } from "@/lib/seo";
import type { MailMessage } from "./types";

/**
 * Confirmation emails, in the traveller's own language.
 *
 * Plain text on purpose. A confirmation is read on a phone, often on hotel
 * wifi, sometimes offline from a mail app's cache, and occasionally printed and
 * handed to someone who does not speak the traveller's language. Text survives
 * all of that; a styled HTML mail survives none of it reliably, and every mail
 * client renders it differently anyway.
 *
 * Every line is a fact the traveller may need at the door: the reference, the
 * date and time, the party size, and who to contact. Marketing does not belong
 * in a transactional mail — it is also what gets a sending domain filtered.
 */

type Locale = "en" | "ja" | "th";

const asLocale = (locale: string): Locale =>
  locale === "ja" || locale === "th" ? locale : "en";

const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;

const COPY = {
  en: {
    bookingSubject: (ref: string) => `${SERVICE_NAME} booking ${ref}`,
    orderSubject: (ref: string) => `${SERVICE_NAME} order ${ref}`,
    hello: (name: string) => `Hello ${name},`,
    bookingIntro: "Your booking is confirmed. Show this reference on arrival.",
    orderIntro: "Your order is confirmed.",
    reference: "Reference",
    place: "Place",
    when: "When",
    party: "Party",
    people: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
    total: "Total",
    item: "Item",
    quantity: "Quantity",
    delivery: "Delivery",
    ship: "International shipping",
    pickup: "Collection in Japan",
    eta: (d: number) => `about ${d} days`,
    notCharged: "No payment has been taken — this service is not open yet.",
    changes: "To change or cancel, reply to this email.",
    viewOnline: "View online",
    signoff: `— ${SERVICE_NAME}`,
  },
  ja: {
    bookingSubject: (ref: string) => `${SERVICE_NAME} ご予約 ${ref}`,
    orderSubject: (ref: string) => `${SERVICE_NAME} ご注文 ${ref}`,
    hello: (name: string) => `${name} 様`,
    bookingIntro: "ご予約を承りました。当日はこの予約番号をご提示ください。",
    orderIntro: "ご注文を承りました。",
    reference: "予約番号",
    place: "場所",
    when: "日時",
    party: "人数",
    people: (n: number) => `${n}名`,
    total: "合計",
    item: "商品",
    quantity: "数量",
    delivery: "お届け方法",
    ship: "海外配送",
    pickup: "日本国内で受け取り",
    eta: (d: number) => `約${d}日`,
    notCharged: "決済は行われていません。本サービスはまだ公開前です。",
    changes: "変更・キャンセルはこのメールへの返信でご連絡ください。",
    viewOnline: "オンラインで確認",
    signoff: `— ${SERVICE_NAME}`,
  },
  th: {
    bookingSubject: (ref: string) => `${SERVICE_NAME} การจอง ${ref}`,
    orderSubject: (ref: string) => `${SERVICE_NAME} คำสั่งซื้อ ${ref}`,
    hello: (name: string) => `เรียน คุณ${name}`,
    bookingIntro: "ยืนยันการจองของคุณแล้ว กรุณาแสดงหมายเลขอ้างอิงนี้เมื่อไปถึง",
    orderIntro: "ยืนยันคำสั่งซื้อของคุณแล้ว",
    reference: "หมายเลขอ้างอิง",
    place: "สถานที่",
    when: "วันและเวลา",
    party: "จำนวนคน",
    people: (n: number) => `${n} คน`,
    total: "รวม",
    item: "สินค้า",
    quantity: "จำนวน",
    delivery: "การจัดส่ง",
    ship: "จัดส่งระหว่างประเทศ",
    pickup: "รับสินค้าในญี่ปุ่น",
    eta: (d: number) => `ประมาณ ${d} วัน`,
    notCharged: "ยังไม่มีการเรียกเก็บเงิน บริการนี้ยังไม่เปิดให้บริการ",
    changes: "หากต้องการเปลี่ยนแปลงหรือยกเลิก กรุณาตอบกลับอีเมลนี้",
    viewOnline: "ดูออนไลน์",
    signoff: `— ${SERVICE_NAME}`,
  },
} satisfies Record<Locale, Record<string, unknown>>;

/**
 * Blank lines between blocks, so it stays readable in a narrow mail window.
 * Only false/null/undefined drop out — an empty string is a deliberate blank
 * line, and filtering on truthiness would silently remove every one of them.
 */
const block = (lines: (string | false | null | undefined)[]) =>
  lines.filter((line) => line !== false && line != null).join("\n");

export function renderBookingMail(
  booking: Booking,
  place: Place,
  locale: string,
): MailMessage {
  const code = asLocale(locale);
  const c = COPY[code];

  const text = block([
    c.hello(booking.name),
    "",
    c.bookingIntro,
    "",
    `${c.reference}: ${booking.reference}`,
    `${c.place}: ${localized(place.name, code)} — ${localized(place.area, code)}`,
    `${c.when}: ${booking.date} ${booking.time}`,
    `${c.party}: ${c.people(booking.partySize)}`,
    booking.totalJpy > 0 && `${c.total}: ${yen(booking.totalJpy)}`,
    booking.paymentStatus === "uncollected" && `\n${c.notCharged}`,
    "",
    `${c.viewOnline}: ${absoluteUrl(`/${code}/bookings/${booking.reference}`)}`,
    "",
    c.changes,
    operator.email || null,
    "",
    c.signoff,
  ]);

  return {
    to: booking.email,
    subject: c.bookingSubject(booking.reference),
    text,
    reference: booking.reference,
  };
}

export function renderOrderMail(order: Order, product: Product, locale: string): MailMessage {
  const code = asLocale(locale);
  const c = COPY[code];

  const text = block([
    c.hello(order.name),
    "",
    c.orderIntro,
    "",
    `${c.reference}: ${order.reference}`,
    `${c.item}: ${localized(product.name, code)}`,
    `${c.quantity}: ${order.quantity}`,
    `${c.delivery}: ${order.mode === "ship-international" ? c.ship : c.pickup} (${c.eta(order.etaDays)})`,
    `${c.total}: ${yen(order.totalJpy)}`,
    order.paymentStatus === "uncollected" && `\n${c.notCharged}`,
    "",
    `${c.viewOnline}: ${absoluteUrl(`/${code}/orders/${order.reference}`)}`,
    "",
    c.changes,
    operator.email || null,
    "",
    c.signoff,
  ]);

  return {
    to: order.email,
    subject: c.orderSubject(order.reference),
    text,
    reference: order.reference,
  };
}
