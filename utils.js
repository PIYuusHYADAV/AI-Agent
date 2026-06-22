import { ai, summarizeragent } from "./api.js";
import { GoogleGenAI } from "@google/genai";
import { validationSchema, reportSchema } from "./Schema.js";
export async function WebSearch({ Topic }) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: Topic,
      num: 10,
    }),
  });

  const data = await res.json();

  return data.organic?.slice(0, 10).map((r) => ({
    title: r.title,
    snippet: r.snippet,
    url: r.link,
  }));
}
export async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is503 =
        err.message?.includes("503") || err.message?.includes("UNAVAILABLE");
      if (!is503 || attempt === maxRetries) throw err;
      const waitMs = 2000 * attempt;
      console.log(
        `⚠️ 503 on attempt ${attempt}. Retrying in ${waitMs / 1000}s...`,
      );
      await new Promise((res) => setTimeout(res, waitMs));
    }
  }
}
export async function summarizer(text) {
  const res = await summarizeragent.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a great summarizer. Summarize whatever text you receive in 500 words.",
      },
      { role: "user", content: text },
    ],
  });
  return res.choices[0].message.content;
}
export async function fetchUrl({ url }) {
  const result = await fetch(url);
  const html = await result.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
  const newtext = await summarizer(text);
  return { url, content: newtext };
}
export async function validateInput(q) {
  const res = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: q,
      config: {
        systemInstruction: `You are an expert input validator for a Tech/AI research system.

Your job is to validate whether the input is related to a single, specific tech or AI topic.

Rules:
1. If the input is a single clear tech topic → isTechRelated: true
2. If the input is NOT tech related → isTechRelated: false
3. If the input is asking to COMPARE two topics (e.g. "MCP vs REST", "Python vs JavaScript") → isTechRelated: false, reason: "comparison"
4. If the input is asking to MERGE or COMBINE two topics → isTechRelated: false, reason: "merge"
5. If the input is vague or too broad (e.g. "AI stuff", "tech things") → isTechRelated: false, reason: "too_vague"

IMPORTANT: Return ONLY valid JSON. No markdown, no backticks, no explanation.
${JSON.stringify(validationSchema, null, 2)}`,
      },
    }),
  );

  const result = JSON.parse(res.text);
  console.log(result);
  return result;
}
