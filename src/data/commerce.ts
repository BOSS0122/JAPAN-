import type { LocalizedText, PlaceImage } from "./types";

/**
 * Phase A: we hold no stock. The partner that ran the experience ships the item
 * and we take a commission. Phase B: the traveller collects it during the trip,
 * which sidesteps cross-border shipping entirely — the only reason we can offer
 * it is that we already know their itinerary.
 */
export type FulfillmentMode = "ship-international" | "pickup-in-japan";

export interface Product {
  id: string;
  /** The place this comes from. Nothing is sold without a story attached. */
  placeId: string;
  name: LocalizedText;
  description: LocalizedText;
  priceJpy: number;
  image: PlaceImage;
  /** Who actually holds and dispatches the stock. Never us. */
  partnerName: string;
  /** Our cut, surfaced in the partner console. */
  commissionPct: number;
  modes: FulfillmentMode[];
  /** Days the partner needs before dispatch or collection. */
  leadTimeDays: number;
  weightG: number;
  fragile: boolean;
  taxFreeEligible: boolean;
  /** Present when international shipping is limited, and says why. */
  restriction?: LocalizedText;
}

export const products: Product[] = [
  {
    id: "aizome-stole",
    placeId: "aizome-tokushima",
    name: {
      en: "Awa Indigo Stole",
      ja: "阿波藍染めストール",
      th: "ผ้าพันคอย้อมครามอาวะ",
    },
    description: {
      en: "Dipped in the same live vat you worked with, then dried for three weeks. No two are the same shade.",
      ja: "体験で使ったのと同じ藍甕で染め、3週間乾かしたもの。同じ色は二つとありません。",
      th: "จุ่มในถังครามเดียวกับที่คุณได้ลองทำ แล้วตากแห้งสามสัปดาห์ ไม่มีผืนไหนสีเหมือนกันเลย",
    },
    priceJpy: 8800,
    image: { emoji: "🧣", from: "#3B82F6", to: "#14B8A6" },
    partnerName: "Tokushima Aizome Studio",
    commissionPct: 18,
    modes: ["ship-international", "pickup-in-japan"],
    leadTimeDays: 3,
    weightG: 180,
    fragile: false,
    taxFreeEligible: true,
  },
  {
    id: "aizome-kit",
    placeId: "aizome-tokushima",
    name: {
      en: "Indigo Dyeing Starter Kit",
      ja: "藍染めスターターキット",
      th: "ชุดเริ่มต้นย้อมคราม",
    },
    description: {
      en: "Dried indigo, a handkerchief, binding thread and instructions in three languages. Enough for four attempts.",
      ja: "すくも、ハンカチ、絞り糸、3言語の手引き。4回分入っています。",
      th: "ครามแห้ง ผ้าเช็ดหน้า ด้ายมัด และคู่มือสามภาษา ทำได้ประมาณสี่ครั้ง",
    },
    priceJpy: 4200,
    image: { emoji: "🫙", from: "#1E3A8A", to: "#0EA5E9" },
    partnerName: "Tokushima Aizome Studio",
    commissionPct: 18,
    modes: ["ship-international", "pickup-in-japan"],
    leadTimeDays: 3,
    weightG: 420,
    fragile: false,
    taxFreeEligible: true,
  },
  {
    id: "nishijin-coasters",
    placeId: "nishijin-weaving",
    name: {
      en: "Nishijin Coasters, set of four",
      ja: "西陣織コースター 4枚組",
      th: "ที่รองแก้วนิชิจิน ชุดสี่ชิ้น",
    },
    description: {
      en: "Woven on the same hand looms, in the studio's own dyed silk. Four patterns from their archive.",
      ja: "同じ手織り機で、工房の自家染め絹を使って織ったもの。所蔵の型から4柄。",
      th: "ทอบนกี่มือแบบเดียวกัน ด้วยไหมที่สตูดิโอย้อมเอง มีสี่ลายจากคลังลายของสตูดิโอ",
    },
    priceJpy: 5600,
    image: { emoji: "🧵", from: "#EC4899", to: "#8B5CF6" },
    partnerName: "Nishijin Atelier",
    commissionPct: 20,
    modes: ["ship-international", "pickup-in-japan"],
    leadTimeDays: 5,
    weightG: 140,
    fragile: false,
    taxFreeEligible: true,
  },
  {
    id: "uji-matcha",
    placeId: "uji-tea-ceremony",
    name: {
      en: "Stone-milled Uji Matcha, 40g",
      ja: "宇治抹茶 石臼挽き 40g",
      th: "มัทฉะอุจิบดหิน 40 กรัม",
    },
    description: {
      en: "From the hillside field you walked. Milled to order — matcha starts losing its edge about a month after grinding.",
      ja: "歩いたあの斜面の茶園から。注文を受けてから挽きます。抹茶は挽いて1ヶ月ほどで風味が落ち始めます。",
      th: "จากไร่บนเนินเขาที่คุณเดินชม บดตามออร์เดอร์ เพราะมัทฉะจะเริ่มเสียรสชาติราวหนึ่งเดือนหลังบด",
    },
    priceJpy: 3400,
    image: { emoji: "🍵", from: "#22C55E", to: "#A3E635" },
    partnerName: "Uji Tea Family Farm",
    commissionPct: 15,
    modes: ["ship-international", "pickup-in-japan"],
    leadTimeDays: 4,
    weightG: 160,
    fragile: false,
    taxFreeEligible: true,
    restriction: {
      en: "Food import rules vary by country. We show your destination's status at checkout.",
      ja: "食品の輸入規制は国によって異なります。決済前にお届け先の可否を表示します。",
      th: "กฎการนำเข้าอาหารต่างกันไปตามประเทศ เราจะแสดงสถานะของปลายทางก่อนชำระเงิน",
    },
  },
  {
    id: "takayama-junmai",
    placeId: "takayama-sake",
    name: {
      en: "Takayama Junmai Ginjo, 720ml",
      ja: "高山 純米吟醸 720ml",
      th: "สาเกจุนไมกินโจทาคายาม่า 720 มล.",
    },
    description: {
      en: "The one from the third brewery on the street, the one with the newest cedar ball. Bottled this season.",
      ja: "通りの3軒目、いちばん新しい杉玉が下がっていた蔵のもの。今季の瓶詰めです。",
      th: "สาเกจากโรงที่สามบนถนนนั้น โรงที่แขวนลูกบอลซีดาร์ใหม่ที่สุด บรรจุขวดฤดูกาลนี้",
    },
    priceJpy: 3900,
    image: { emoji: "🍶", from: "#A3E635", to: "#FACC15" },
    partnerName: "Takayama Brewery Guild",
    commissionPct: 22,
    modes: ["pickup-in-japan"],
    leadTimeDays: 2,
    weightG: 1250,
    fragile: true,
    taxFreeEligible: true,
    restriction: {
      en: "Collection in Japan only. Exporting alcohol requires a licence, and most countries cap what you may carry — check your allowance.",
      ja: "日本国内での受け取りのみ。酒類の輸出には免許が必要で、持ち込み量も国ごとに上限があります。免税範囲をご確認ください。",
      th: "รับสินค้าในญี่ปุ่นเท่านั้น การส่งออกสุราต้องมีใบอนุญาต และแต่ละประเทศจำกัดปริมาณที่นำเข้าได้ โปรดตรวจสอบสิทธิ์ของคุณ",
    },
  },
  {
    id: "imabari-towel",
    placeId: "shimanami-cycling",
    name: {
      en: "Imabari Towels, pair",
      ja: "今治タオル 2枚組",
      th: "ผ้าขนหนูอิมาบาริ คู่",
    },
    description: {
      en: "Made in the town at the start of the cycleway. The local water is soft, which is the entire reason these are famous.",
      ja: "サイクリングロードの起点の町で作られたもの。地元の軟水こそが、このタオルが有名な理由のすべてです。",
      th: "ผลิตในเมืองที่เป็นจุดเริ่มต้นเส้นทางจักรยาน น้ำในท้องถิ่นเป็นน้ำอ่อน ซึ่งคือเหตุผลทั้งหมดที่ผ้าขนหนูนี้มีชื่อเสียง",
    },
    priceJpy: 4800,
    image: { emoji: "🧼", from: "#06B6D4", to: "#FDE047" },
    partnerName: "Imabari Towel Co-op",
    commissionPct: 16,
    modes: ["ship-international", "pickup-in-japan"],
    leadTimeDays: 3,
    weightG: 380,
    fragile: false,
    taxFreeEligible: true,
  },
  {
    id: "kutani-mamezara",
    placeId: "kenrokuen",
    name: {
      en: "Kutani Small Plates, set of three",
      ja: "九谷焼 豆皿 3枚組",
      th: "จานเล็กคุตานิ ชุดสามใบ",
    },
    description: {
      en: "Painted in the five Kutani colours by a Kanazawa kiln. Small enough to survive a suitcase, if you pack them in socks.",
      ja: "金沢の窯が九谷五彩で絵付けしたもの。靴下に包めばスーツケースでも割れない大きさです。",
      th: "วาดด้วยห้าสีคุตานิโดยเตาเผาในคานาซาว่า ขนาดเล็กพอจะรอดจากกระเป๋าเดินทางถ้าห่อด้วยถุงเท้า",
    },
    priceJpy: 7200,
    image: { emoji: "🍽️", from: "#F59E0B", to: "#EF4444" },
    partnerName: "Kanazawa Kiln",
    commissionPct: 20,
    modes: ["ship-international", "pickup-in-japan"],
    leadTimeDays: 6,
    weightG: 640,
    fragile: true,
    taxFreeEligible: true,
  },
  {
    id: "yanaka-tenugui",
    placeId: "yanaka-ginza",
    name: {
      en: "Yanaka Cat Tenugui",
      ja: "谷中 猫の手ぬぐい",
      th: "ผ้าเทนุกุยลายแมวยานากะ",
    },
    description: {
      en: "Hand-printed with the seven cats that actually live on the shopping street. The shop will tell you all their names.",
      ja: "商店街に実際に住んでいる7匹を手捺染したもの。店で名前を全部教えてもらえます。",
      th: "พิมพ์มือเป็นลายแมวเจ็ดตัวที่อาศัยอยู่บนถนนช้อปปิ้งนั้นจริง ๆ ร้านจะบอกชื่อทุกตัวให้ฟัง",
    },
    priceJpy: 2200,
    image: { emoji: "🐈", from: "#FBBF24", to: "#F97316" },
    partnerName: "Yanaka Ginza Shotengai",
    commissionPct: 25,
    modes: ["ship-international", "pickup-in-japan"],
    leadTimeDays: 2,
    weightG: 60,
    fragile: false,
    taxFreeEligible: true,
  },
  {
    id: "kyoto-shichimi",
    placeId: "nishiki-obanzai",
    name: {
      en: "Kyoto Shichimi, ground to order",
      ja: "京都 七味 その場調合",
      th: "พริกเจ็ดรสเกียวโต บดตามสั่ง",
    },
    description: {
      en: "Seven spices blended to the heat you ask for. Say mild and they will still make it hotter than you expect.",
      ja: "辛さを指定して調合してもらう七味。控えめと言っても、思ったより辛くしてくれます。",
      th: "เครื่องเทศเจ็ดชนิดผสมตามระดับความเผ็ดที่คุณสั่ง บอกว่าเผ็ดน้อยแล้วก็ยังเผ็ดกว่าที่คิดอยู่ดี",
    },
    priceJpy: 1600,
    image: { emoji: "🌶️", from: "#DC2626", to: "#F59E0B" },
    partnerName: "Nishiki Spice Stall",
    commissionPct: 22,
    modes: ["ship-international", "pickup-in-japan"],
    leadTimeDays: 2,
    weightG: 90,
    fragile: false,
    taxFreeEligible: true,
    restriction: {
      en: "Food import rules vary by country. We show your destination's status at checkout.",
      ja: "食品の輸入規制は国によって異なります。決済前にお届け先の可否を表示します。",
      th: "กฎการนำเข้าอาหารต่างกันไปตามประเทศ เราจะแสดงสถานะของปลายทางก่อนชำระเงิน",
    },
  },
  {
    id: "hiroshima-sauce",
    placeId: "hiroshima-okonomiyaki",
    name: {
      en: "Okonomiyaki Sauce, two bottles",
      ja: "お好みソース 2本セット",
      th: "ซอสโอโคโนมิยากิ สองขวด",
    },
    description: {
      en: "The Hiroshima recipe — thinner and fruitier than the Osaka one. The griddle cook will tell you it is the only correct sauce.",
      ja: "広島の配合。大阪のものより緩く、果実味があります。鉄板の前で「これが唯一正しいソース」と言われます。",
      th: "สูตรฮิโรชิม่า เหลวและมีกลิ่นผลไม้มากกว่าสูตรโอซาก้า คนทำหน้ากระทะจะบอกว่านี่คือซอสที่ถูกต้องเพียงหนึ่งเดียว",
    },
    priceJpy: 1800,
    image: { emoji: "🥞", from: "#F97316", to: "#84CC16" },
    partnerName: "Hiroshima Griddle House",
    commissionPct: 20,
    modes: ["pickup-in-japan"],
    leadTimeDays: 2,
    weightG: 1400,
    fragile: true,
    taxFreeEligible: true,
    restriction: {
      en: "Collection in Japan only — liquid, heavy, and restricted as a food import in several countries.",
      ja: "日本国内での受け取りのみ。液体で重く、食品として輸入が制限される国があるためです。",
      th: "รับในญี่ปุ่นเท่านั้น เพราะเป็นของเหลว น้ำหนักมาก และหลายประเทศจำกัดการนำเข้าอาหารประเภทนี้",
    },
  },
];

export const productById = new Map(products.map((p) => [p.id, p]));

// ------------------------------------------------------------ pickup points

export interface PickupPoint {
  id: string;
  kind: "airport" | "hotel" | "konbini";
  name: LocalizedText;
  /** Matches Place.areaKey so we can offer the points on the traveller's route. */
  areaKeys: string[];
  note: LocalizedText;
}

export const pickupPoints: PickupPoint[] = [
  {
    id: "nrt",
    kind: "airport",
    name: { en: "Narita Airport — collection desk", ja: "成田空港 受取カウンター", th: "สนามบินนาริตะ เคาน์เตอร์รับสินค้า" },
    areaKeys: ["tokyo"],
    note: {
      en: "Landside, before security. Open 07:00–21:00.",
      ja: "保安検査前のエリア。7:00〜21:00。",
      th: "อยู่ก่อนจุดตรวจความปลอดภัย เปิด 07:00–21:00 น.",
    },
  },
  {
    id: "hnd",
    kind: "airport",
    name: { en: "Haneda International — collection desk", ja: "羽田空港 国際線 受取カウンター", th: "ฮาเนดะ อาคารระหว่างประเทศ เคาน์เตอร์รับสินค้า" },
    areaKeys: ["tokyo"],
    note: {
      en: "Third floor, near the departure hall. Open 06:00–23:00.",
      ja: "3階・出発ロビー付近。6:00〜23:00。",
      th: "ชั้นสาม ใกล้โถงผู้โดยสารขาออก เปิด 06:00–23:00 น.",
    },
  },
  {
    id: "kix",
    kind: "airport",
    name: { en: "Kansai Airport — collection desk", ja: "関西空港 受取カウンター", th: "สนามบินคันไซ เคาน์เตอร์รับสินค้า" },
    areaKeys: ["osaka", "kyoto", "hyogo"],
    note: {
      en: "Terminal 1, second floor. Open 07:00–22:00.",
      ja: "第1ターミナル2階。7:00〜22:00。",
      th: "อาคาร 1 ชั้นสอง เปิด 07:00–22:00 น.",
    },
  },
  {
    id: "hotel-tokyo",
    kind: "hotel",
    name: { en: "Delivery to your Tokyo hotel", ja: "都内ホテルへ配送", th: "ส่งถึงโรงแรมในโตเกียว" },
    areaKeys: ["tokyo"],
    note: {
      en: "Held at the front desk. Give us the hotel name at checkout.",
      ja: "フロントでお預かりします。ホテル名は購入時にご指定ください。",
      th: "ฝากไว้ที่เคาน์เตอร์ต้อนรับ แจ้งชื่อโรงแรมตอนสั่งซื้อ",
    },
  },
  {
    id: "hotel-kyoto",
    kind: "hotel",
    name: { en: "Delivery to your Kyoto hotel", ja: "京都市内ホテルへ配送", th: "ส่งถึงโรงแรมในเกียวโต" },
    areaKeys: ["kyoto"],
    note: {
      en: "Held at the front desk. Give us the hotel name at checkout.",
      ja: "フロントでお預かりします。ホテル名は購入時にご指定ください。",
      th: "ฝากไว้ที่เคาน์เตอร์ต้อนรับ แจ้งชื่อโรงแรมตอนสั่งซื้อ",
    },
  },
  {
    id: "konbini",
    kind: "konbini",
    name: { en: "Any convenience store", ja: "全国のコンビニ受取", th: "ร้านสะดวกซื้อทั่วประเทศ" },
    areaKeys: ["*"],
    note: {
      en: "Pick the store when you get the ready-for-collection message. Held for three days.",
      ja: "受取可能の通知が届いてから店舗を指定できます。3日間お預かりします。",
      th: "เลือกสาขาได้เมื่อได้รับข้อความแจ้งว่าพร้อมรับ เก็บไว้ให้สามวัน",
    },
  },
];

export const pickupPointById = new Map(pickupPoints.map((p) => [p.id, p]));

/** Points on the traveller's route come first — that is the whole Phase B pitch. */
export function pickupPointsForAreas(areaKeys: string[]): PickupPoint[] {
  const onRoute = new Set(areaKeys);
  return [...pickupPoints].sort((a, b) => {
    const score = (p: PickupPoint) =>
      p.areaKeys.some((k) => onRoute.has(k)) ? 0 : p.areaKeys.includes("*") ? 1 : 2;
    return score(a) - score(b);
  });
}

export function isOnRoute(point: PickupPoint, areaKeys: string[]): boolean {
  return point.areaKeys.some((k) => areaKeys.includes(k));
}
