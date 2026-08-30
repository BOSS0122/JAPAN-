import type { LocalizedText } from "./types";

export interface Alert {
  id: string;
  severity: "info" | "advisory" | "warning";
  area: string;
  issuedAt: string;
  title: LocalizedText;
  body: LocalizedText;
}

/** Stand-in for a JMA / municipal push feed. */
export const alerts: Alert[] = [
  {
    id: "typhoon-14",
    severity: "warning",
    area: "Okinawa",
    issuedAt: "2026-08-30T06:00:00+09:00",
    title: {
      en: "Typhoon No. 14 — heavy rain warning",
      ja: "台風14号 大雨警報",
      th: "ไต้ฝุ่นหมายเลข 14 คำเตือนฝนตกหนัก",
    },
    body: {
      en: "Ferries to the outer islands are suspended until tomorrow morning. Monorail services in Naha are running at reduced frequency.",
      ja: "離島行きフェリーは明朝まで欠航。那覇のゆいレールは減便運行中です。",
      th: "เรือเฟอร์รีไปเกาะรอบนอกงดให้บริการจนถึงเช้าพรุ่งนี้ โมโนเรลในนาฮะเดินรถถี่น้อยลง",
    },
  },
  {
    id: "heat-kanto",
    severity: "advisory",
    area: "Kanto",
    issuedAt: "2026-08-30T05:00:00+09:00",
    title: {
      en: "Heatstroke alert — Tokyo and neighbouring prefectures",
      ja: "熱中症警戒アラート 東京都および近県",
      th: "ประกาศเฝ้าระวังโรคลมแดด โตเกียวและจังหวัดใกล้เคียง",
    },
    body: {
      en: "Expected 37°C. Avoid outdoor walking routes between 11:00 and 15:00; free cooling shelters are open in most ward offices.",
      ja: "予想最高気温37℃。11時〜15時の屋外移動は避けてください。各区役所にクールシェア施設があります。",
      th: "คาดว่าอุณหภูมิจะสูงถึง 37°C หลีกเลี่ยงการเดินกลางแจ้งช่วง 11:00-15:00 น. มีจุดพักคลายร้อนฟรีที่สำนักงานเขตส่วนใหญ่",
    },
  },
  {
    id: "quake-drill",
    severity: "info",
    area: "Nationwide",
    issuedAt: "2026-08-29T09:00:00+09:00",
    title: {
      en: "Nationwide earthquake drill — test alerts on 1 September",
      ja: "全国防災訓練 9月1日にテスト配信",
      th: "การซ้อมรับมือแผ่นดินไหวทั่วประเทศ ทดสอบแจ้งเตือนวันที่ 1 กันยายน",
    },
    body: {
      en: "Your phone will sound an emergency alert at 10:00. It is a drill — no action is needed.",
      ja: "10時に緊急速報が鳴ります。訓練のため対応は不要です。",
      th: "โทรศัพท์ของคุณจะส่งเสียงแจ้งเตือนฉุกเฉินเวลา 10:00 น. เป็นการซ้อม ไม่ต้องดำเนินการใด ๆ",
    },
  },
];

/** Dummy camera-translation payload: a handwritten izakaya menu. */
export const translationSample = {
  source: ["本日のおすすめ", "鰤の照り焼き 1,200円", "だし巻き玉子 700円", "冷やしトマト 500円", "生ビール 600円"],
  translated: {
    en: [
      "Today's specials",
      "Yellowtail teriyaki — ¥1,200",
      "Rolled omelette in dashi — ¥700",
      "Chilled tomato — ¥500",
      "Draft beer — ¥600",
    ],
    ja: [
      "本日のおすすめ",
      "鰤の照り焼き 1,200円",
      "だし巻き玉子 700円",
      "冷やしトマト 500円",
      "生ビール 600円",
    ],
    th: [
      "เมนูแนะนำประจำวัน",
      "ปลาฮามาจิย่างซอสเทริยากิ — 1,200 เยน",
      "ไข่ม้วนน้ำซุปดาชิ — 700 เยน",
      "มะเขือเทศแช่เย็น — 500 เยน",
      "เบียร์สด — 600 เยน",
    ],
  } as Record<string, string[]>,
};
