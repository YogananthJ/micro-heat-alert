import { createServerFn } from "@tanstack/react-start";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type RecommendInput,
  type Recommendation,
} from "./recommend-prompt";

export const getRecommendation = createServerFn({ method: "POST" })
  .inputValidator((input: RecommendInput) => input)
  .handler(async ({ data }): Promise<Recommendation> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(data) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/^```json\s*|\s*```$/g, "").trim();
    return JSON.parse(cleaned) as Recommendation;
  });
