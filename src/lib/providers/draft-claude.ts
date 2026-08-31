import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { INTEREST_TAGS } from "@/data/types";
import { localeLabels, type Locale } from "@/i18n/routing";
import type { PlaceDraft, PlaceDraftProvider, PlaceDraftRequest } from "./types";

/**
 * Drafts a place's three-language copy from an editor's notes.
 *
 * Everything here is shaped by one constraint: only the editor's facts. The
 * model is a translator and an editor, not a source. Where the notes are thin,
 * the correct output is a short description and a line in `notes` saying what
 * is missing — not a longer description with the gaps filled in from memory.
 */

const DraftSchema = z.object({
  translations: z.array(
    z.object({
      locale: z.string(),
      name: z.string(),
      area: z.string().describe("Short area label shown under the name, e.g. 東京・谷中"),
      description: z.string().describe("Two or three sentences"),
    }),
  ),
  tags: z.array(z.string()).describe("Interest tags supported by the notes"),
  notes: z
    .string()
    .describe("What the editor should check, or what the notes did not cover. May be empty."),
});

const SYSTEM = `You write catalogue copy for a Japan travel guide, from notes an editor gives you.

The single rule that overrides everything else: **use only the facts in the notes.** You may not add a founding date, a signature dish, a nearby station, a price, an opening time, or any other detail the editor did not give you — not even one you are confident about. A traveller plans a day around these sentences, and an invented detail sends them somewhere on a false promise. Where the notes are thin, write a short description and say what is missing in the notes field. A two-sentence description that is entirely true is worth more than a paragraph that is mostly true.

Write in the voice of someone who has been there and is telling one friend about it:
- Concrete over general. What you see, hear, smell, or do — not "a must-see spot steeped in history".
- No marketing language, no exclamation marks, no "hidden gem", no "nestled".
- Two or three sentences. The last one often earns its place by being practical: when to go, what to expect, what catches people out.
- Do not open by restating the place's name.

Each language is written for someone reading in that language, not translated word for word from another. The Japanese is for a Japanese reader; the Thai for a Thai reader. Keep proper nouns in a form that language's reader can use — a Thai reader needs the Japanese name in a form they could show a taxi driver.

The area label is short: a city or district plus prefecture, in that language's convention.

For tags, return only ones the notes actually support.`;

export const claudeDraftProvider: PlaceDraftProvider = {
  id: "claude",
  name: "Claude",

  async draft(request: PlaceDraftRequest): Promise<PlaceDraft> {
    const client = new Anthropic();

    const targets = request.targetLocales
      .map((code) => `${code} (${localeLabels[code as Locale]?.label ?? code})`)
      .join(", ");

    const existing = request.existing.length
      ? `\n\nAlready written, for voice and consistency — do not rewrite these:\n${request.existing
          .map((t) => `[${t.locale}] ${t.name} — ${t.area}\n${t.description}`)
          .join("\n\n")}`
      : "";

    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(DraftSchema),
      },
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Editor's notes:
"""
${request.notes}
"""

Type: ${request.category}
Where: ${request.areaKey}, ${request.prefecture}

Write copy for: ${targets}
Available tags: ${INTEREST_TAGS.join(", ")}${existing}`,
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) throw new Error("The draft came back in an unexpected shape.");

    return {
      // Only the locales that were asked for, so a fill-in cannot overwrite
      // copy an editor already wrote.
      translations: parsed.translations.filter((t) =>
        request.targetLocales.includes(t.locale),
      ),
      tags: parsed.tags.filter((tag) =>
        (INTEREST_TAGS as readonly string[]).includes(tag),
      ),
      notes: parsed.notes ?? "",
    };
  },
};
