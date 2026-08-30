import type { InterestTag, LocalizedText, PlaceCategory, Place } from "./types";

/**
 * Etiquette is attached to the moment it is needed, not collected into a guide
 * nobody opens. A rule declares where it applies; `getEtiquetteFor` resolves the
 * set for a given place, most specific first.
 */
export type EtiquetteScope =
  | { kind: "nationwide" }
  | { kind: "category"; categories: PlaceCategory[] }
  | { kind: "tag"; tags: InterestTag[] }
  | { kind: "place"; placeIds: string[] };

/** must = causes real offence · should = expected · fyi = saves confusion */
export type EtiquetteSeverity = "must" | "should" | "fyi";

export interface EtiquetteRule {
  id: string;
  scope: EtiquetteScope;
  severity: EtiquetteSeverity;
  emoji: string;
  title: LocalizedText;
  /** What to do. */
  body: LocalizedText;
  /** Why it exists — the part that makes it stick, and our differentiator. */
  why: LocalizedText;
}

export const etiquetteRules: EtiquetteRule[] = [
  // ------------------------------------------------------------ nationwide
  {
    id: "shoes-off",
    scope: { kind: "nationwide" },
    severity: "must",
    emoji: "👞",
    title: {
      en: "Shoes come off at the step",
      ja: "段差で靴を脱ぐ",
      th: "ถอดรองเท้าตรงขั้นบันได",
    },
    body: {
      en: "If you see a raised floor and a row of slippers, shoes come off there. Point your shoes back toward the door when you step up.",
      ja: "床が一段上がっていてスリッパが並んでいたら、そこで靴を脱ぎます。上がるときに靴のつま先を出口へ向けておくと丁寧です。",
      th: "ถ้าเห็นพื้นยกสูงและมีรองเท้าแตะวางเรียงอยู่ ให้ถอดรองเท้าตรงนั้น และหันปลายรองเท้ากลับไปทางประตูเมื่อก้าวขึ้นไป",
    },
    why: {
      en: "Indoor floors are surfaces people sit and sleep on, not just walk on. Tatami especially — it is furniture, not flooring.",
      ja: "屋内の床は歩くだけの場所ではなく、座り、寝る面だからです。とくに畳は床材ではなく家具に近いものと考えられています。",
      th: "พื้นในบ้านไม่ใช่แค่ที่เดิน แต่เป็นที่นั่งและที่นอนด้วย โดยเฉพาะเสื่อทาทามิที่ถือเป็นเฟอร์นิเจอร์มากกว่าพื้น",
    },
  },
  {
    id: "no-tipping",
    scope: { kind: "nationwide" },
    severity: "fyi",
    emoji: "💴",
    title: {
      en: "No tipping, anywhere",
      ja: "チップは不要です",
      th: "ไม่ต้องให้ทิป ที่ไหนก็ตาม",
    },
    body: {
      en: "Restaurants, taxis, hotels, guides — none of them. Leaving money will usually get you chased down the street to return it.",
      ja: "飲食店、タクシー、ホテル、ガイド、どこでも不要です。置いていくと、たいてい返しに追いかけてきます。",
      th: "ทั้งร้านอาหาร แท็กซี่ โรงแรม และไกด์ ไม่ต้องให้ทิปเลย ถ้าวางเงินทิ้งไว้ มักจะมีคนวิ่งตามมาคืนให้",
    },
    why: {
      en: "Service is priced in, and doing the job well is the baseline rather than something bought. Extra cash reads as confusing, not generous.",
      ja: "サービスは価格に含まれており、良い仕事は買うものではなく前提だと考えられているためです。追加の現金は寛大さではなく、戸惑いとして受け取られます。",
      th: "ค่าบริการรวมอยู่ในราคาแล้ว และการทำงานให้ดีถือเป็นมาตรฐานไม่ใช่สิ่งที่ต้องซื้อ เงินเพิ่มจึงทำให้งงมากกว่าจะดูใจกว้าง",
    },
  },
  {
    id: "money-tray",
    scope: { kind: "nationwide" },
    severity: "fyi",
    emoji: "🧾",
    title: {
      en: "Money goes on the little tray",
      ja: "お金はトレーに置く",
      th: "วางเงินบนถาดเล็ก",
    },
    body: {
      en: "There is a small tray at almost every register. Put cash and cards there rather than into the cashier's hand.",
      ja: "ほとんどのレジに小さなトレーがあります。現金やカードは手渡しではなく、そこに置きます。",
      th: "เกือบทุกเคาน์เตอร์จะมีถาดเล็ก ให้วางเงินสดหรือบัตรลงบนถาดแทนการยื่นให้มือต่อมือ",
    },
    why: {
      en: "It lets both sides count without touching, and gives the staff a clear surface to lay out your change.",
      ja: "触れずに双方が金額を確認でき、釣り銭を並べて渡す面にもなるためです。",
      th: "ช่วยให้ทั้งสองฝ่ายนับเงินได้โดยไม่ต้องสัมผัสกัน และเป็นพื้นที่ให้พนักงานวางเงินทอนอย่างชัดเจน",
    },
  },
  {
    id: "phone-on-trains",
    scope: { kind: "nationwide" },
    severity: "should",
    emoji: "🤫",
    title: {
      en: "Don't take calls on the train",
      ja: "電車内では通話しない",
      th: "ไม่คุยโทรศัพท์บนรถไฟ",
    },
    body: {
      en: "Texting and headphones are fine. Voice calls are not — put the phone on silent and step off if you need to talk.",
      ja: "メッセージやイヤホンでの視聴は問題ありません。通話は避け、話す必要があれば降りてからにします。",
      th: "พิมพ์ข้อความหรือใส่หูฟังได้ตามปกติ แต่ไม่ควรคุยสาย ให้ตั้งเป็นระบบสั่นและลงจากรถไฟก่อนถ้าจำเป็นต้องคุย",
    },
    why: {
      en: "A packed carriage is treated as shared quiet — a one-sided conversation is the one sound nobody can tune out.",
      ja: "混んだ車内は共有の静けさとして扱われており、片側だけの会話はもっとも意識から外しにくい音だからです。",
      th: "ตู้รถไฟที่แน่นถือเป็นพื้นที่เงียบร่วมกัน และบทสนทนาที่ได้ยินแค่ฝั่งเดียวคือเสียงที่คนตัดออกจากความสนใจได้ยากที่สุด",
    },
  },
  {
    id: "carry-your-rubbish",
    scope: { kind: "nationwide" },
    severity: "fyi",
    emoji: "🎒",
    title: {
      en: "There are almost no bins",
      ja: "ゴミ箱はほとんどありません",
      th: "แทบไม่มีถังขยะ",
    },
    body: {
      en: "Carry a small bag and take your rubbish back to your hotel. Convenience stores have bins, but they are for things bought there.",
      ja: "小さな袋を持ち歩き、ゴミはホテルまで持ち帰ります。コンビニにもありますが、そこで買ったもの用です。",
      th: "พกถุงเล็ก ๆ ไว้แล้วเอาขยะกลับไปทิ้งที่โรงแรม ร้านสะดวกซื้อมีถังขยะ แต่มีไว้สำหรับของที่ซื้อจากร้านนั้น",
    },
    why: {
      en: "Public bins were largely removed in the 1990s for security reasons and never came back. Everyone here is carrying their rubbish too.",
      ja: "1990年代に治安上の理由で公共のゴミ箱が撤去され、そのままになっているためです。地元の人も同じように持ち帰っています。",
      th: "ถังขยะสาธารณะถูกรื้อออกไปในยุค 1990 ด้วยเหตุผลด้านความปลอดภัยและไม่ได้กลับมาอีก คนที่นี่ก็ถือขยะกลับบ้านเหมือนกัน",
    },
  },

  // -------------------------------------------------------------- category
  {
    id: "chopsticks-upright",
    scope: { kind: "category", categories: ["restaurant"] },
    severity: "must",
    emoji: "🥢",
    title: {
      en: "Never stand chopsticks in rice",
      ja: "箸をご飯に立てない",
      th: "ห้ามปักตะเกียบลงในข้าว",
    },
    body: {
      en: "Lay them across the rest, or across the bowl's edge. Also avoid passing food chopstick-to-chopstick.",
      ja: "箸置きか、器の縁に横に置きます。箸から箸へ食べ物を渡すのも避けます。",
      th: "วางพาดบนที่วางตะเกียบหรือขอบชาม และหลีกเลี่ยงการส่งอาหารจากตะเกียบสู่ตะเกียบ",
    },
    why: {
      en: "Both gestures come from Buddhist funeral rites — rice offered to the dead, and bones passed between mourners. It reads as a death omen at the table.",
      ja: "どちらも仏式の葬送に由来します。立てた箸は枕飯、箸渡しは骨上げの所作です。食卓では死を連想させます。",
      th: "ทั้งสองท่ามาจากพิธีศพแบบพุทธ คือข้าวถวายผู้ตายและการส่งกระดูกระหว่างญาติ จึงสื่อถึงความตายเมื่อทำบนโต๊ะอาหาร",
    },
  },
  {
    id: "counter-turnover",
    scope: { kind: "category", categories: ["restaurant"] },
    severity: "should",
    emoji: "⏱️",
    title: {
      en: "At a counter, eat and go",
      ja: "カウンターでは食べたら出る",
      th: "ที่เคาน์เตอร์ กินเสร็จแล้วลุก",
    },
    body: {
      en: "At nine-seat ramen and sushi counters, finish and leave. Lingering over an empty bowl is the one thing that annoys everyone.",
      ja: "9席のラーメン屋や寿司カウンターでは、食べ終えたら席を立ちます。空の器の前で長居することが、いちばん嫌がられます。",
      th: "ที่ร้านราเมนหรือซูชิเคาน์เตอร์เก้าที่นั่ง กินเสร็จแล้วควรลุกเลย การนั่งแช่หน้าชามเปล่าคือสิ่งที่คนไม่ชอบที่สุด",
    },
    why: {
      en: "The shop's whole economics rest on turning those few seats over. There is usually a queue outside you can't see from your stool.",
      ja: "その数席を回転させることで成り立っている商売だからです。座席からは見えなくても、たいてい外に列があります。",
      th: "ร้านอยู่ได้ด้วยการหมุนเวียนที่นั่งไม่กี่ที่นั้น และมักมีคนต่อแถวอยู่ข้างนอกที่คุณมองไม่เห็นจากที่นั่ง",
    },
  },
  {
    id: "shrine-path",
    scope: { kind: "place", placeIds: ["fushimi-inari", "nezu-shrine", "motonosumi"] },
    severity: "fyi",
    emoji: "⛩️",
    title: {
      en: "Walk to the side of the approach",
      ja: "参道は端を歩く",
      th: "เดินชิดข้างทางเดินเข้าศาลเจ้า",
    },
    body: {
      en: "At a shrine, keep to the left or right of the centre line of the path, and give a small bow as you pass under the first gate.",
      ja: "神社では参道の中央を避けて左右どちらかを歩き、最初の鳥居をくぐるときに軽く一礼します。",
      th: "ที่ศาลเจ้า ให้เดินชิดซ้ายหรือขวาของทางเดิน หลีกเลี่ยงตรงกลาง และโค้งคำนับเล็กน้อยตอนลอดเสาโทริอิแรก",
    },
    why: {
      en: "The centre is treated as the path the deity uses. Nobody will stop you, but locals will be walking to the side and now you'll notice.",
      ja: "中央は神様の通り道とされているためです。咎められることはありませんが、地元の人が端を歩いていることに気づくはずです。",
      th: "ตรงกลางถือเป็นทางเดินของเทพเจ้า ไม่มีใครห้ามคุณหรอก แต่คุณจะสังเกตเห็นว่าคนท้องถิ่นเดินชิดข้างกันหมด",
    },
  },
  {
    id: "temizu",
    scope: { kind: "category", categories: ["spot"] },
    severity: "fyi",
    emoji: "💧",
    title: {
      en: "The water basin, if there is a ladle",
      ja: "手水は柄杓があれば",
      th: "อ่างล้างมือ ถ้ามีกระบวย",
    },
    body: {
      en: "Left hand, right hand, then rinse your mouth from your cupped hand — never from the ladle. Many places have removed ladles and just run the water; then simply rinse your hands.",
      ja: "左手、右手の順に清め、口は手に受けてすすぎます。柄杓に直接口をつけません。柄杓を撤去して流水にしている社寺も多く、その場合は手を清めるだけで構いません。",
      th: "ล้างมือซ้าย มือขวา แล้วบ้วนปากจากมือที่รองน้ำ ไม่ใช่จากกระบวยโดยตรง หลายแห่งเอากระบวยออกและปล่อยน้ำไหลแทน กรณีนั้นแค่ล้างมือก็พอ",
    },
    why: {
      en: "It is a shortened version of a full-body purification that once meant bathing in a river before approaching.",
      ja: "かつて川で全身を清めてから参拝した禊を、簡略化したものだからです。",
      th: "เป็นรูปแบบย่อของการชำระร่างกายทั้งตัว ซึ่งแต่เดิมคือการลงอาบน้ำในแม่น้ำก่อนเข้าไปสักการะ",
    },
  },
  {
    id: "ask-before-photos",
    scope: { kind: "category", categories: ["experience"] },
    severity: "should",
    emoji: "📷",
    title: {
      en: "Ask before photographing people",
      ja: "人を撮る前に一声かける",
      th: "ขออนุญาตก่อนถ่ายรูปคน",
    },
    body: {
      en: "Artisans, staff, other guests. \"Shashin, ii desu ka?\" is enough. Assume no for workshops in progress unless told otherwise.",
      ja: "職人、スタッフ、他の参加者を撮るときは「写真、いいですか？」と一言。作業中は、断りがない限り不可と考えます。",
      th: "ทั้งช่างฝีมือ พนักงาน และผู้ร่วมกิจกรรม พูดว่า \"ชาชิน อี เดส กะ?\" ก็พอ ถ้าเป็นช่วงกำลังทำงาน ให้ถือว่าไม่ได้จนกว่าจะได้รับอนุญาต",
    },
    why: {
      en: "In a small workshop the person is at work, not on display. Asking almost always gets a yes, and often a better shot.",
      ja: "小さな工房では、その人は展示物ではなく仕事中だからです。声をかければほぼ許可されますし、たいていより良い写真になります。",
      th: "ในเวิร์กช็อปเล็ก ๆ คนเหล่านั้นกำลังทำงาน ไม่ใช่ของจัดแสดง การขออนุญาตมักได้คำตอบว่าได้ และมักได้ภาพที่ดีกว่าด้วย",
    },
  },

  // ------------------------------------------------------------------ tags
  {
    id: "onsen-wash-first",
    scope: { kind: "tag", tags: ["onsen"] },
    severity: "must",
    emoji: "🚿",
    title: {
      en: "Wash completely before the bath",
      ja: "湯船の前に体を洗いきる",
      th: "อาบน้ำให้สะอาดก่อนลงบ่อ",
    },
    body: {
      en: "Sit at a shower station, wash and rinse every trace of soap, then get in. No soap ever goes into the bath itself.",
      ja: "洗い場に座り、石鹸をすべて流しきってから湯船に入ります。浴槽に石鹸を持ち込むことはありません。",
      th: "นั่งที่จุดอาบน้ำ ฟอกและล้างสบู่ออกให้หมดจด แล้วค่อยลงบ่อ ห้ามนำสบู่ลงในบ่อเด็ดขาด",
    },
    why: {
      en: "The bath is not for washing — it is shared, unchanged, hot water that the next twenty people will also sit in.",
      ja: "湯船は体を洗う場所ではなく、次に入る20人が同じまま浸かる共有の湯だからです。",
      th: "บ่อน้ำร้อนไม่ใช่ที่ทำความสะอาดตัว แต่เป็นน้ำร้อนที่ใช้ร่วมกันโดยไม่เปลี่ยน และอีกยี่สิบคนถัดไปก็จะลงแช่ในน้ำเดียวกัน",
    },
  },
  {
    id: "onsen-towel",
    scope: { kind: "tag", tags: ["onsen"] },
    severity: "must",
    emoji: "🧖",
    title: {
      en: "The towel stays out of the water",
      ja: "タオルは湯に入れない",
      th: "ผ้าเช็ดตัวห้ามลงน้ำ",
    },
    body: {
      en: "Fold the small towel and rest it on your head or on the rock at the edge. The big towel stays in the changing room.",
      ja: "小さいタオルはたたんで頭の上か縁の岩に置きます。大きいタオルは脱衣所に置いたままにします。",
      th: "พับผ้าผืนเล็กวางไว้บนหัวหรือบนขอบหิน ส่วนผ้าผืนใหญ่ให้ทิ้งไว้ในห้องเปลี่ยนเสื้อผ้า",
    },
    why: {
      en: "Same reason as washing first: nothing that has touched a body goes into water twenty other people will share.",
      ja: "先に体を洗うのと同じ理由で、体に触れたものを20人が共有する湯に入れないためです。",
      th: "เหตุผลเดียวกับการอาบน้ำก่อนลงบ่อ คือไม่นำสิ่งที่สัมผัสร่างกายลงไปในน้ำที่อีกยี่สิบคนต้องใช้ร่วมกัน",
    },
  },
  {
    id: "onsen-tattoo",
    scope: { kind: "tag", tags: ["onsen"] },
    severity: "fyi",
    emoji: "🩹",
    title: {
      en: "Tattoos: check the specific bath",
      ja: "タトゥーは施設ごとに確認を",
      th: "รอยสัก ต้องเช็กเป็นแห่ง ๆ ไป",
    },
    body: {
      en: "Rules vary by establishment and are loosening. Small tattoos can often be covered with a patch; some baths now allow them outright; private family baths always work.",
      ja: "施設ごとに異なり、近年は緩和が進んでいます。小さいものはシールで隠せば入れる場合が多く、全面的に受け入れる施設も増えています。貸切風呂なら確実です。",
      th: "กฎแตกต่างกันไปตามแต่ละแห่งและกำลังผ่อนคลายลง รอยสักเล็ก ๆ มักปิดด้วยแผ่นแปะได้ บางแห่งอนุญาตแล้ว และบ่อส่วนตัวใช้ได้เสมอ",
    },
    why: {
      en: "The rule was aimed at organised crime, not at visitors — which is exactly why individual owners are free to relax it, and increasingly do.",
      ja: "もともと反社会的勢力を想定した規則で、旅行者を対象としたものではありません。だからこそ各施設の判断で緩和でき、実際に増えています。",
      th: "กฎนี้ตั้งใจกันกลุ่มอาชญากรรม ไม่ได้เล็งที่นักท่องเที่ยว จึงเป็นเหตุผลว่าทำไมเจ้าของแต่ละแห่งจึงผ่อนปรนได้เอง และก็ผ่อนปรนกันมากขึ้น",
    },
  },
  {
    id: "anime-pilgrimage",
    scope: { kind: "tag", tags: ["anime"] },
    severity: "should",
    emoji: "🏠",
    title: {
      en: "Pilgrimage spots are people's streets",
      ja: "聖地は誰かの生活圏です",
      th: "จุดตามรอยคือถนนที่มีคนอาศัยอยู่",
    },
    body: {
      en: "Many locations are ordinary residential blocks. Shoot from public ground, keep your voice down, don't block the pavement, and never step onto private property.",
      ja: "多くのロケ地はふつうの住宅街です。公道から撮り、声を落とし、歩道を塞がず、私有地には立ち入りません。",
      th: "หลายจุดเป็นย่านที่อยู่อาศัยธรรมดา ให้ถ่ายจากพื้นที่สาธารณะ พูดเบา ๆ ไม่ยืนขวางทางเท้า และห้ามเข้าไปในพื้นที่ส่วนบุคคล",
    },
    why: {
      en: "Several famous locations have had fences and no-photo signs installed because of crowds. Behaving well is what keeps them open.",
      ja: "混雑が原因で柵や撮影禁止の看板が設置された有名ロケ地が実際にあります。開かれたままにできるかは、訪れる側の振る舞い次第です。",
      th: "มีหลายจุดชื่อดังที่ต้องติดรั้วและป้ายห้ามถ่ายรูปเพราะคนแน่นเกินไป การประพฤติตัวดีคือสิ่งที่ทำให้จุดเหล่านั้นยังเปิดอยู่",
    },
  },
  {
    id: "craft-tools",
    scope: { kind: "tag", tags: ["craft"] },
    severity: "should",
    emoji: "🛠️",
    title: {
      en: "Ask before touching the tools",
      ja: "道具に触れる前に確認する",
      th: "ขอก่อนจับเครื่องมือ",
    },
    body: {
      en: "Looms, indigo vats, knives, brushes — wait to be handed them. Follow the order of steps you are shown, even if it seems slow.",
      ja: "織機、藍甕、刃物、筆などは、渡されるまで待ちます。手順は、遠回りに見えても教わった順に進めます。",
      th: "ทั้งกี่ทอผ้า ถังคราม มีด และพู่กัน ให้รอจนกว่าเขาจะส่งให้ และทำตามลำดับขั้นตอนที่สอน แม้จะดูช้าก็ตาม",
    },
    why: {
      en: "A live indigo vat is a fermenting culture that can be killed by the wrong hand at the wrong time; a loom holds weeks of set-up thread.",
      ja: "生きた藍甕は発酵中の菌で、扱いを誤ると死んでしまいます。織機には数週間かけた経糸が張られています。",
      th: "ถังครามที่ใช้งานอยู่คือจุลินทรีย์ที่กำลังหมัก ซึ่งอาจตายได้ถ้าจับผิดจังหวะ ส่วนกี่ทอผ้ามีเส้นด้ายที่ตั้งไว้เป็นสัปดาห์",
    },
  },

  // ------------------------------------------------------------ place-level
  {
    id: "nishiki-eat-at-shop",
    scope: { kind: "place", placeIds: ["nishiki-obanzai"] },
    severity: "should",
    emoji: "🍢",
    title: {
      en: "Eat in front of the stall you bought from",
      ja: "買った店の前で食べる",
      th: "กินตรงหน้าร้านที่ซื้อ",
    },
    body: {
      en: "Nishiki asks visitors not to walk and eat. Buy, eat standing at that shop, and hand the stick or cup back to them.",
      ja: "錦市場は食べ歩きをしないよう求めています。買ったらその店先で立って食べ、串や容器はその店に返します。",
      th: "ตลาดนิชิกิขอให้ไม่เดินไปกินไป ให้ซื้อแล้วยืนกินตรงหน้าร้านนั้น แล้วคืนไม้หรือถ้วยให้ร้าน",
    },
    why: {
      en: "It is a working grocery market on a narrow lane. Dripping food and dropped sticks were becoming a real problem for the shops.",
      ja: "狭い通りにある現役の生鮮市場だからです。汁だれや串の放置が、店にとって実害になっていました。",
      th: "ที่นี่เป็นตลาดสดที่ยังค้าขายจริงบนตรอกแคบ ๆ อาหารหยดเลอะและไม้เสียบที่ถูกทิ้งกลายเป็นปัญหาจริงของร้านค้า",
    },
  },
  {
    id: "tsukiji-buy-first",
    scope: { kind: "place", placeIds: ["tsukiji-food-tour"] },
    severity: "should",
    emoji: "🐟",
    title: {
      en: "Buy something before you photograph",
      ja: "撮る前にまず買う",
      th: "ซื้อก่อนแล้วค่อยถ่ายรูป",
    },
    body: {
      en: "Don't photograph a stall you have no intention of buying from, and don't block the aisle while you frame the shot.",
      ja: "買う気のない店を撮らないこと。構図を決めている間、通路を塞がないこと。",
      th: "อย่าถ่ายรูปร้านที่ไม่ได้ตั้งใจจะซื้อ และอย่ายืนขวางทางเดินขณะจัดองค์ประกอบภาพ",
    },
    why: {
      en: "The outer market opens early for chefs and shopkeepers doing their actual buying. Tourists are welcome customers, not an audience.",
      ja: "場外市場は、料理人や店主が実際に仕入れるために早朝から開いています。旅行者は歓迎される客であり、観客ではありません。",
      th: "ตลาดนอกเปิดแต่เช้าสำหรับเชฟและเจ้าของร้านที่มาซื้อของจริง นักท่องเที่ยวคือลูกค้าที่ยินดีต้อนรับ ไม่ใช่ผู้ชม",
    },
  },
  {
    id: "yukata-fold",
    scope: { kind: "place", placeIds: ["kinosaki-yukata"] },
    severity: "must",
    emoji: "👘",
    title: {
      en: "Left side over right, always",
      ja: "浴衣は必ず右前",
      th: "ห่อชายซ้ายทับขวาเสมอ",
    },
    body: {
      en: "When you wrap the yukata, your left panel goes on top of the right one. Check in a mirror before you leave the room.",
      ja: "自分から見て右側の身頃を先に体へ当て、左側を上に重ねます（右前）。部屋を出る前に鏡で確認を。",
      th: "เวลาห่อชุดยูกาตะ ให้ชายด้านซ้ายทับด้านขวา ตรวจกับกระจกก่อนออกจากห้อง",
    },
    why: {
      en: "The other way round is how the dead are dressed for burial. It is the one yukata mistake that will make a local quietly fix your collar.",
      ja: "逆に合わせるのは、亡くなった方に着せる着方（左前）だからです。地元の人が黙って襟を直してくれる唯一の間違いです。",
      th: "การห่อสลับด้านคือวิธีแต่งกายให้ผู้เสียชีวิต เป็นข้อผิดพลาดเดียวที่คนท้องถิ่นจะเข้ามาช่วยจัดปกเสื้อให้เงียบ ๆ",
    },
  },
];

const SEVERITY_ORDER: Record<EtiquetteSeverity, number> = { must: 0, should: 1, fyi: 2 };
const SPECIFICITY: Record<EtiquetteScope["kind"], number> = {
  place: 0, tag: 1, category: 2, nationwide: 3,
};

function matches(rule: EtiquetteRule, place: Place): boolean {
  const s = rule.scope;
  if (s.kind === "nationwide") return true;
  if (s.kind === "category") return s.categories.includes(place.category);
  if (s.kind === "tag") return s.tags.some((tag) => place.tags.includes(tag));
  return s.placeIds.includes(place.id);
}

/** Most specific first, then by severity. `limit` keeps a detail page readable. */
export function getEtiquetteFor(place: Place, limit = 5): EtiquetteRule[] {
  return etiquetteRules
    .filter((rule) => matches(rule, place))
    .sort(
      (a, b) =>
        SPECIFICITY[a.scope.kind] - SPECIFICITY[b.scope.kind] ||
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    )
    .slice(0, limit);
}

export const nationwideEtiquette = etiquetteRules.filter(
  (rule) => rule.scope.kind === "nationwide",
);
