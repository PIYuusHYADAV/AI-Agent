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
        systemInstruction: `You are an expert validator. Your job is to validate the input whether it is related to tech fields or upcoming tech fields
      or not and return answer accordingly.!IMPORTANT inside the schema isTechRelated nested field should either be true or false. Never return an object.
      State Your answer in this JSON schema.${JSON.stringify(validationSchema, null, 2)}`,
      },
    }),
  );

  const result = res.text;
  const cleaned = result
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const isTechRelated =
    parsed?.properties?.isTechRelated ?? parsed?.isTechRelated ?? false;
  console.log("Is it validated=====", isTechRelated);
  return isTechRelated;
}
