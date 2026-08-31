import type { MoodMatch, MoodQuery, MoodSearchProvider } from "./types";

/**
 * The offline fallback: keyword and synonym scoring, no API key, no cost.
 *
 * It exists so the feature degrades instead of disappearing — an expired key or
 * a rate limit should not take the search box off the page. It is genuinely
 * worse than the model at intent ("somewhere to think" finds nothing here), so
 * the interface says which one answered rather than passing this off as AI.
 *
 * The synonym table is the honest part: these are the concepts the catalogue can
 * actually express. "Power spot" is not one of our twelve tags, so it is mapped
 * onto the shrines and old-growth places that are what people mean by it.
 */

interface Concept {
  /** Matched against the traveller's text, any language. */
  triggers: string[];
  /** Catalogue tags that satisfy this concept. */
  tags?: string[];
  categories?: string[];
  /** Words worth finding in a description. */
  keywords?: string[];
  /** Places closing before this hour cannot satisfy the concept at all. */
  openAfter?: number;
  /** Somewhere busy is not somewhere quiet, whatever else it has going for it. */
  excludeBusy?: boolean;
  excludeFamous?: boolean;
  /** A place whose recorded crowd level is itself the answer. */
  preferCrowd?: string;
}

const CONCEPTS: Concept[] = [
  {
    triggers: ["power spot", "powerspot", "パワースポット", "パワー", "spiritual", "霊", "御利益", "ご利益", "神社", "shrine", "sacred", "พลัง", "ศักดิ์สิทธิ์"],
    tags: ["history", "nature"],
    keywords: ["shrine", "torii", "神社", "鳥居", "temple", "寺", "sacred", "cedar", "杉", "moss", "苔"],
  },
  {
    triggers: ["dance", "club", "clubbing", "nightlife", "night out", "ダンス", "クラブ", "夜遊び", "ナイトライフ", "เต้น", "คลับ", "กลางคืน"],
    tags: ["nightlife"],
    openAfter: 21,
  },
  {
    triggers: ["quiet", "calm", "peaceful", "静か", "落ち着", "ゆっくり", "เงียบ", "สงบ"],
    // Famous is not the same as crowded — a well-known garden at opening time is
    // quieter than an unknown bar at nine. The recorded crowd level is the fact
    // we actually hold, so that is what decides it.
    excludeBusy: true,
    preferCrowd: "quiet",
    keywords: ["moss", "苔", "garden", "庭", "morning", "朝", "still", "静", "empty", "backstreet", "路地"],
  },
  {
    triggers: ["hidden", "off the beaten", "local", "穴場", "地元", "ローカル", "ลับ", "ท้องถิ่น"],
    excludeFamous: true,
  },
  {
    triggers: ["onsen", "hot spring", "bath", "温泉", "風呂", "ออนเซ็น"],
    tags: ["onsen"],
  },
  {
    triggers: ["eat", "food", "hungry", "meal", "restaurant", "食べ", "ご飯", "料理", "グルメ", "อาหาร", "กิน"],
    categories: ["restaurant"],
    tags: ["foodie"],
  },
  {
    triggers: ["craft", "make", "workshop", "hands on", "工芸", "体験", "作り", "งานฝีมือ", "เวิร์กช็อป"],
    tags: ["craft"],
    categories: ["experience"],
  },
  {
    triggers: ["anime", "manga", "otaku", "アニメ", "漫画", "聖地", "อนิเมะ"],
    tags: ["anime"],
  },
  {
    triggers: ["nature", "outdoors", "walk", "hike", "自然", "散歩", "山", "ธรรมชาติ", "เดิน"],
    tags: ["nature"],
  },
  {
    triggers: ["photo", "photogenic", "instagram", "写真", "映え", "ถ่ายรูป"],
    tags: ["photogenic"],
  },
  {
    triggers: ["kids", "family", "children", "子供", "こども", "家族", "เด็ก", "ครอบครัว"],
    tags: ["family"],
  },
  {
    triggers: ["rain", "raining", "indoor", "雨", "屋内", "ฝน", "ในร่ม"],
    keywords: [],
  },
];

const norm = (s: string) => s.toLowerCase();

export const localMoodProvider: MoodSearchProvider = {
  id: "local",
  name: "Keyword matching (no AI)",
  semantic: false,

  async search({ text, candidates, limit }: MoodQuery): Promise<MoodMatch[]> {
    const q = norm(text);
    const words = q.split(/[\s、,。.!?！？]+/u).filter((w) => w.length > 2);
    const matched = CONCEPTS.filter((c) => c.triggers.some((t) => q.includes(norm(t))));
    const wantsIndoor = /rain|雨|indoor|屋内|ฝน/u.test(q);

    const scored = candidates.map((place) => {
      const haystack = norm(
        [place.name, place.description, place.area, place.prefecture, ...place.tags].join(" "),
      );

      // Concept evidence and incidental word overlap are counted apart, because
      // only the first is a reason to show somebody a place. Mixing them is how
      // "a dance club tonight" ends up answered with a hot spring: the word
      // "night" appears in a dozen descriptions.
      let concept = 0;
      let disqualified = false;

      for (const c of matched) {
        // Hard constraints. A place that shuts at six cannot be tonight's club,
        // no matter how well the rest of it reads.
        if (c.openAfter != null && place.closeHour < c.openAfter) disqualified = true;
        if (c.excludeBusy && place.crowd === "busy") disqualified = true;
        if (c.excludeFamous && place.famous) disqualified = true;

        if (c.tags?.some((tag) => place.tags.includes(tag))) concept += 6;
        if (c.categories?.includes(place.category)) concept += 3;
        if (c.keywords?.some((k) => haystack.includes(norm(k)))) concept += 5;
        if (c.preferCrowd && place.crowd === c.preferCrowd) concept += 6;
      }

      let overlap = 0;
      for (const word of words) if (haystack.includes(word)) overlap += 2;
      if (wantsIndoor && place.indoor) concept += 3;

      return { place, concept, overlap, disqualified };
    });

    // With a concept recognised, only concept evidence qualifies — returning
    // everything that shares a word is the padding this is meant to avoid. With
    // no concept recognised there is nothing to be precise about, so a strong
    // word overlap is allowed to stand in.
    const qualifies = matched.length
      ? (row: (typeof scored)[number]) => !row.disqualified && row.concept >= 5
      : (row: (typeof scored)[number]) => row.overlap >= 4;

    return scored
      .filter(qualifies)
      .sort(
        (a, b) =>
          b.concept + b.overlap - (a.concept + a.overlap) ||
          a.place.id.localeCompare(b.place.id),
      )
      .slice(0, limit)
      .map((row) => ({
        id: row.place.id,
        // No invented prose: this provider matched words, it did not read.
        reason: "",
      }));
  },
};
