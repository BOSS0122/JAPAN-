import type { LocalizedText } from "./types";

/**
 * Legal pages.
 *
 * The copy describes what this software actually does — which cookies it sets,
 * what each is for, what leaves the site and to whom — rather than reciting a
 * generic template. That accuracy is the part worth having; it is still not
 * legal advice, and an operator should have a lawyer review it against their
 * own circumstances before launch. Anything only the operator knows is a field
 * in src/config/operator.ts, not invented here.
 */

export interface LegalSection {
  heading: LocalizedText;
  /** Paragraphs. Rendered in order, plain text only. */
  body: LocalizedText[];
}

export interface LegalDocument {
  slug: "privacy" | "terms" | "commerce";
  title: LocalizedText;
  intro: LocalizedText;
  sections: LegalSection[];
}

const t = (en: string, ja: string, th: string): LocalizedText => ({ en, ja, th });

export const privacy: LegalDocument = {
  slug: "privacy",
  title: t("Privacy", "プライバシーポリシー", "นโยบายความเป็นส่วนตัว"),
  intro: t(
    "What this site stores about you, why, and how to have it removed. It is written to match what the software actually does.",
    "このサイトが保存する情報と、その理由・削除の方法です。実際のソフトウェアの動作に合わせて記述しています。",
    "ข้อมูลที่เว็บไซต์นี้เก็บเกี่ยวกับคุณ เหตุผล และวิธีขอให้ลบ เขียนให้ตรงกับสิ่งที่ซอฟต์แวร์ทำจริง",
  ),
  sections: [
    {
      heading: t("What we store", "保存する情報", "ข้อมูลที่เราเก็บ"),
      body: [
        t(
          "A random device identifier in a cookie, so that your shortlist, bookings and visited stamps are yours across pages. It is not linked to your name or email unless you give them to us.",
          "ランダムな端末識別子をCookieに保存します。ショートリスト・予約・チェックインをあなたのものとして扱うためです。氏名やメールアドレスを入力しない限り、それらと紐づきません。",
          "ตัวระบุอุปกรณ์แบบสุ่มในคุกกี้ เพื่อให้รายการโปรด การจอง และแสตมป์เป็นของคุณ ไม่ผูกกับชื่อหรืออีเมลจนกว่าคุณจะให้ข้อมูลนั้น",
        ),
        t(
          "A display name, only if you set one. It is shown beside your notes on itineraries you share.",
          "表示名（設定した場合のみ）。共有した旅程で、あなたのメモの横に表示されます。",
          "ชื่อที่แสดง เฉพาะเมื่อคุณตั้งไว้ จะปรากฏข้างบันทึกของคุณในแผนเที่ยวที่คุณแชร์",
        ),
        t(
          "The name, email address and details you enter when you make a booking or place an order, because the partner fulfilling it needs them.",
          "予約・注文時に入力された氏名・メールアドレス・その他の内容。手配する提携先に必要なためです。",
          "ชื่อ อีเมล และรายละเอียดที่คุณกรอกเมื่อจองหรือสั่งซื้อ เพราะพาร์ตเนอร์ที่ดำเนินการต้องใช้",
        ),
        t(
          "Which places you viewed and which partner links you followed, if you allow measurement. Declining keeps the aggregate count — we still need to know a referral happened to be paid for it — but stops it being linked to your device.",
          "計測に同意いただいた場合、閲覧したスポットと辿った提携先リンクを記録します。同意しない場合も件数の集計は残りますが（送客の報酬請求に必要なため）、あなたの端末とは結びつけません。",
          "หน้าที่คุณดูและลิงก์พาร์ตเนอร์ที่คุณคลิก หากคุณอนุญาตให้วัดผล หากปฏิเสธ เรายังนับรวมยอด (จำเป็นต่อการเรียกเก็บค่าส่งต่อ) แต่จะไม่ผูกกับอุปกรณ์ของคุณ",
        ),
      ],
    },
    {
      heading: t("What we do not store", "保存しない情報", "ข้อมูลที่เราไม่เก็บ"),
      body: [
        t(
          "There are no traveller accounts and no passwords. Card details are handled by the payment provider and never reach this site's database.",
          "旅行者向けのアカウントもパスワードもありません。カード情報は決済事業者が扱い、当サイトのデータベースには入りません。",
          "ไม่มีบัญชีผู้ใช้และไม่มีรหัสผ่าน ข้อมูลบัตรจัดการโดยผู้ให้บริการชำระเงิน ไม่เข้าสู่ฐานข้อมูลของเว็บไซต์นี้",
        ),
        t(
          "We do not sell personal data, and we do not run third-party advertising trackers.",
          "個人データを販売することはありません。第三者の広告トラッカーも設置していません。",
          "เราไม่ขายข้อมูลส่วนบุคคล และไม่มีตัวติดตามโฆษณาของบุคคลที่สาม",
        ),
      ],
    },
    {
      heading: t("Who else sees it", "第三者への提供", "ใครเห็นข้อมูลบ้าง"),
      body: [
        t(
          "Booking and order details go to the partner who fulfils them, and to nobody else. When you follow a link to an airline, hotel or local service, you leave this site and their own policy applies from that point; we pass them no personal data, only the fact that the click came from us.",
          "予約・注文の内容は、それを手配する提携先にのみ提供します。航空会社・宿泊・現地サービスのリンクを開いた時点で当サイトを離れ、以後は提携先のポリシーが適用されます。当サイトから個人情報は渡さず、当サイト経由であるという事実のみを伝えます。",
          "รายละเอียดการจองและคำสั่งซื้อส่งให้พาร์ตเนอร์ที่ดำเนินการเท่านั้น เมื่อคุณคลิกลิงก์ไปสายการบิน โรงแรม หรือบริการท้องถิ่น คุณออกจากเว็บไซต์นี้และนโยบายของพวกเขาจะมีผล เราไม่ส่งข้อมูลส่วนบุคคล ส่งเพียงข้อเท็จจริงว่าคลิกมาจากเรา",
        ),
      ],
    },
    {
      heading: t("How long", "保存期間", "เก็บนานเท่าใด"),
      body: [
        t(
          "The device cookie lasts a year. Bookings and orders are kept as long as tax and consumer-protection law requires. Shared itineraries stay until deleted on request — anyone with the link can read one, so treat the link as the key it is.",
          "端末Cookieの有効期間は1年です。予約・注文は税法および消費者保護法が求める期間保存します。共有された旅程は削除依頼があるまで残ります。リンクを持つ人は誰でも閲覧できるため、リンクは鍵として扱ってください。",
          "คุกกี้อุปกรณ์มีอายุหนึ่งปี การจองและคำสั่งซื้อเก็บตามที่กฎหมายภาษีและคุ้มครองผู้บริโภคกำหนด แผนเที่ยวที่แชร์จะอยู่จนกว่าจะขอให้ลบ ใครที่มีลิงก์ก็อ่านได้ ดังนั้นโปรดถือว่าลิงก์คือกุญแจ",
        ),
      ],
    },
    {
      heading: t("Your rights", "あなたの権利", "สิทธิของคุณ"),
      body: [
        t(
          "You can ask what we hold about you, ask for it corrected, or ask for it deleted, and we will answer. If you are in the EU or UK you also have the right to object to processing and to complain to your data protection authority. Write to the address on the operator page.",
          "保有情報の開示・訂正・削除を請求できます。EUまたは英国にお住まいの場合、処理への異議申立ておよび監督当局への苦情申立ての権利もあります。事業者情報ページ記載の連絡先までご請求ください。",
          "คุณสามารถขอดู แก้ไข หรือลบข้อมูลของคุณได้ และเราจะตอบกลับ หากคุณอยู่ใน EU หรือสหราชอาณาจักร คุณมีสิทธิคัดค้านการประมวลผลและร้องเรียนต่อหน่วยงานคุ้มครองข้อมูลด้วย ติดต่อตามที่อยู่ในหน้าข้อมูลผู้ประกอบการ",
        ),
      ],
    },
  ],
};

export const terms: LegalDocument = {
  slug: "terms",
  title: t("Terms", "利用規約", "ข้อกำหนดการใช้งาน"),
  intro: t(
    "The short version: we help you find places and hand you to the people who actually run them.",
    "要約すると、当サイトは行き先を見つける手助けをし、実際に運営している事業者へお繋ぎします。",
    "สรุปสั้น ๆ เราช่วยคุณค้นหาสถานที่และส่งต่อคุณไปยังผู้ที่ดำเนินกิจการนั้นจริง ๆ",
  ),
  sections: [
    {
      heading: t("What we are", "当サイトの立場", "เราคือใคร"),
      body: [
        t(
          "We are an intermediary. Experiences, meals, flights, stays and goods are provided by the partners named on each listing, under their terms. A booking made here is a booking with them.",
          "当サイトは仲介者です。体験・食事・航空券・宿泊・商品は、各掲載に記載された提携先が、その規約に基づき提供します。ここでの予約は提携先との予約です。",
          "เราเป็นตัวกลาง ประสบการณ์ อาหาร ตั๋วเครื่องบิน ที่พัก และสินค้า จัดหาโดยพาร์ตเนอร์ที่ระบุในแต่ละรายการ ภายใต้ข้อกำหนดของพวกเขา การจองที่นี่คือการจองกับพวกเขา",
        ),
      ],
    },
    {
      heading: t("Accuracy", "掲載内容の正確性", "ความถูกต้อง"),
      body: [
        t(
          "Opening hours, prices and crowd levels change, sometimes on the day. We record when each entry was last confirmed and by whom, and we correct what we are told is wrong — but check anything your day depends on with the venue.",
          "営業時間・料金・混雑状況は変わります。当日変わることもあります。各掲載の最終確認日と確認者を記録し、誤りの指摘は修正しますが、その日の予定を左右する事項は必ず現地にご確認ください。",
          "เวลาเปิดทำการ ราคา และความหนาแน่นเปลี่ยนแปลงได้ บางครั้งในวันนั้นเอง เราบันทึกว่าแต่ละรายการยืนยันล่าสุดเมื่อใดและโดยใคร และแก้ไขเมื่อได้รับแจ้ง แต่โปรดตรวจสอบสิ่งที่แผนของคุณขึ้นอยู่กับสถานที่โดยตรง",
        ),
      ],
    },
    {
      heading: t("Shared itineraries", "旅程の共有", "แผนเที่ยวที่แชร์"),
      body: [
        t(
          "An invite link grants anyone holding it the right to read and edit that itinerary. There is no separate permission and no revocation. Share it the way you would share a key.",
          "招待リンクを持つ人は誰でも、その旅程を閲覧・編集できます。個別の権限設定も失効機能もありません。鍵を渡すのと同じ感覚で共有してください。",
          "ลิงก์เชิญให้สิทธิ์ผู้ที่ถือครองในการอ่านและแก้ไขแผนเที่ยวนั้น ไม่มีการตั้งสิทธิ์แยกและไม่มีการเพิกถอน โปรดแชร์เหมือนที่คุณแชร์กุญแจ",
        ),
      ],
    },
    {
      heading: t("Fair use", "禁止事項", "การใช้งานที่เป็นธรรม"),
      body: [
        t(
          "Do not scrape the catalogue, automate bookings, or post content into shared itineraries that is unlawful or abusive. We rate-limit writes and will block clients that ignore this.",
          "カタログの機械的収集、予約の自動化、共有旅程への違法・不適切な投稿はご遠慮ください。書き込みには回数制限を設けており、無視するクライアントは遮断します。",
          "อย่าดึงข้อมูลแคตตาล็อกอัตโนมัติ อย่าทำการจองแบบอัตโนมัติ และอย่าโพสต์เนื้อหาที่ผิดกฎหมายหรือไม่เหมาะสมลงในแผนเที่ยวที่แชร์ เราจำกัดอัตราการเขียนและจะบล็อกไคลเอนต์ที่เพิกเฉย",
        ),
      ],
    },
  ],
};

/**
 * 特定商取引法に基づく表記.
 *
 * Required by Japanese law wherever goods are sold, and the required fields
 * are prescribed — so this document is a field list bound to the operator
 * config, not free prose. `field` names the value; `note` explains it.
 */
export interface CommerceRow {
  label: LocalizedText;
  /** Key in src/config/operator.ts, or null when the answer is fixed copy. */
  field: string | null;
  fixed?: LocalizedText;
}

export const commerceRows: CommerceRow[] = [
  { label: t("Seller", "販売業者", "ผู้ขาย"), field: "legalName" },
  { label: t("Responsible officer", "運営統括責任者", "ผู้รับผิดชอบ"), field: "representative" },
  { label: t("Address", "所在地", "ที่อยู่"), field: "address" },
  { label: t("Telephone", "電話番号", "โทรศัพท์"), field: "phone" },
  { label: t("Email", "メールアドレス", "อีเมล"), field: "email" },
  { label: t("Enquiry hours", "受付時間", "เวลาทำการ"), field: "supportHours" },
  {
    label: t("Registration number", "事業者登録番号", "เลขทะเบียน"),
    field: "registrationNumber",
  },
  {
    label: t("Price", "販売価格", "ราคา"),
    field: null,
    fixed: t(
      "Shown on each listing, in Japanese yen and including consumption tax. Fulfilment fees are shown separately before you confirm.",
      "各商品ページに、消費税込みの日本円で表示します。配送・受け渡し手数料は確定前に別途表示します。",
      "แสดงในแต่ละรายการ เป็นเงินเยนรวมภาษีบริโภคแล้ว ค่าจัดส่งแสดงแยกก่อนยืนยัน",
    ),
  },
  {
    label: t("Additional charges", "商品代金以外の必要料金", "ค่าใช้จ่ายเพิ่มเติม"),
    field: null,
    fixed: t(
      "International shipping or in-Japan collection, quoted before you confirm. Any customs duty in your own country is yours to pay.",
      "海外配送料または国内受け渡し手数料（確定前に表示）。到着国での関税等はお客様のご負担です。",
      "ค่าจัดส่งระหว่างประเทศหรือค่ารับสินค้าในญี่ปุ่น แจ้งก่อนยืนยัน ภาษีศุลกากรในประเทศของคุณเป็นความรับผิดชอบของคุณ",
    ),
  },
  {
    label: t("Payment methods", "支払方法", "วิธีชำระเงิน"),
    field: null,
    fixed: t(
      "Credit and debit cards, handled by our payment provider.",
      "クレジットカード・デビットカード（決済事業者が処理します）。",
      "บัตรเครดิตและเดบิต ดำเนินการโดยผู้ให้บริการชำระเงินของเรา",
    ),
  },
  {
    label: t("When payment is taken", "支払時期", "เวลาเรียกเก็บเงิน"),
    field: null,
    fixed: t(
      "At the moment the order is confirmed.",
      "注文確定時。",
      "ณ เวลาที่ยืนยันคำสั่งซื้อ",
    ),
  },
  {
    label: t("Delivery", "引渡時期", "การจัดส่ง"),
    field: null,
    fixed: t(
      "Dispatch or collection readiness is shown on each listing as a lead time in days, counted from order confirmation.",
      "各商品ページに、注文確定日からの日数で発送または受け渡し可能時期を表示します。",
      "เวลาจัดส่งหรือพร้อมรับสินค้าแสดงในแต่ละรายการเป็นจำนวนวัน นับจากการยืนยันคำสั่งซื้อ",
    ),
  },
  {
    label: t("Returns and cancellation", "返品・キャンセル", "การคืนสินค้าและยกเลิก"),
    field: null,
    fixed: t(
      "Faulty or wrongly sent goods: tell us within seven days of delivery and we arrange return carriage and a refund. Change of mind: unopened goods within eight days, return carriage at your cost. Perishable food and made-to-order items cannot be returned once dispatched; those listings say so. Experience and restaurant bookings follow the cancellation terms shown before you confirm.",
      "不良品・誤配送の場合は、到着後7日以内にご連絡ください。返送料は当方負担で返品・返金いたします。お客様都合の場合は、未開封に限り8日以内、返送料はお客様負担です。生鮮食品および受注生産品は発送後の返品を承れません（該当商品ページに明記しています）。体験・飲食の予約は、確定前に表示されるキャンセル条件に従います。",
      "สินค้าชำรุดหรือส่งผิด: แจ้งภายในเจ็ดวันหลังได้รับ เราจัดการค่าส่งคืนและคืนเงิน เปลี่ยนใจ: สินค้าที่ยังไม่เปิดภายในแปดวัน ค่าส่งคืนเป็นของคุณ อาหารสดและสินค้าสั่งทำไม่รับคืนหลังจัดส่ง รายการเหล่านั้นระบุไว้ การจองประสบการณ์และร้านอาหารเป็นไปตามเงื่อนไขยกเลิกที่แสดงก่อนยืนยัน",
    ),
  },
];

export const commerce: LegalDocument = {
  slug: "commerce",
  title: t(
    "Business details",
    "特定商取引法に基づく表記",
    "ข้อมูลผู้ประกอบการ",
  ),
  intro: t(
    "Published as required by Japan's Act on Specified Commercial Transactions.",
    "特定商取引法に基づき表示しています。",
    "เผยแพร่ตามที่กฎหมายว่าด้วยธุรกรรมการค้าเฉพาะของญี่ปุ่นกำหนด",
  ),
  sections: [],
};

export const legalDocuments = [privacy, terms, commerce];
