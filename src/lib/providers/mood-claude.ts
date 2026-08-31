import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { MoodMatch, MoodQuery, MoodSearchProvider } from "./types";

/**
 * Mood search backed by Claude.
 *
 * The model is given the catalogue rows and asked to pick from them. It is
 * never asked what places exist in Japan — it does not need to know, and asking
 * would be asking it to invent. Every id it returns is checked against the
 * candidate list by the caller before anything reaches a page.
 *
 * Structured output guarantees the shape, so there is no JSON to parse out of
 * prose and no half-formed response to guess at.
 */

const LANGUAGE: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  th: "Thai",
};

const MatchSchema = z.object({
  matches: z.array(
    z.object({
      id: z.string().describe("The exact id of a place from the provided list"),
      reason: z
        .string()
        .describe("One sentence on why this place suits the traveller's mood"),
    }),
  ),
});

const SYSTEM = `You help a traveller in Japan find places that suit a mood they describe.

You will be given a numbered list of places from a catalogue, and the traveller's own words.

Rules, in order of importance:
1. Only ever return ids that appear in the provided list. Never invent a place, never name one that is not listed, and never return an id you were not given. If the catalogue has nothing that genuinely fits, return an empty list — that is a correct and useful answer.
2. Judge by what the entries actually say. A place is a power spot because its description is about a shrine, ancient cedars or a sacred site — not because it would be nice if it were.
3. Order by how well each fits, best first. Prefer fewer good matches over padding the list.
4. Write each reason in the traveller's language, in one sentence, saying what about that specific place answers what they asked for. No marketing language, no exclamation marks, no repeating the place's name back.

You are choosing from a small curated catalogue, not from everything in Japan. Saying "nothing here matches" is honest; inventing something is not.`;

function renderCandidates(query: MoodQuery): string {
  return query.candidates
    .map((place) => {
      const hours = `${place.openHour}:00-${place.closeHour}:00`;
      const price = place.priceFrom ? ` price_from=¥${place.priceFrom}` : "";
      return [
        `id: ${place.id}`,
        `name: ${place.name}`,
        `where: ${place.area}, ${place.prefecture}`,
        `type: ${place.category}${place.famous ? " (well-known)" : " (lesser-known)"}`,
        `tags: ${place.tags.join(", ") || "none"}`,
        `hours: ${hours}${price}${place.indoor ? " indoor" : " outdoor"} crowd=${place.crowd}`,
        `about: ${place.description}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

export const claudeMoodProvider: MoodSearchProvider = {
  id: "claude",
  name: "Claude",
  get semantic() {
    return true;
  },

  async search(query: MoodQuery): Promise<MoodMatch[]> {
    const client = new Anthropic();

    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4000,
      // Ranking a short list is not hard work; low effort keeps a search box
      // feeling like a search box.
      output_config: {
        effort: "low",
        format: zodOutputFormat(MatchSchema),
      },
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM,
          // Stable across every search — the catalogue and the query follow.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Catalogue (${query.candidates.length} places):

${renderCandidates(query)}

---

The traveller wrote, in ${LANGUAGE[query.locale] ?? "English"}: "${query.text}"

Return at most ${query.limit} places from the catalogue above, best fit first, each with a one-sentence reason written in ${LANGUAGE[query.locale] ?? "English"}.`,
        },
      ],
    });

    // parsed_output is null when the model's output failed the schema.
    return response.parsed_output?.matches ?? [];
  },
};
