import { validationSchema, reportSchema } from "./Schema.js";
import { WebSearchTool, availableTools } from "./tools.js";
import { WebSearch, fetchUrl, summarizer, validateInput } from "./utils.js";
import { ai, summarizeragent } from "./api.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { withRetry } from "./utils.js";
import { langcache } from "./api.js";
import { saveToCache, checkCache } from "./cache.js";
const app = express();
app.use(cors());
app.use(express.json());
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));
async function summarizeMessages(messages) {
  const historyText = messages
    .map((m) => m.parts?.map((p) => p.text ?? "").join(" ") ?? "")
    .filter(Boolean)
    .join("\n");

  const res = await summarizeragent.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "Summarize what has been researched so far in 300 words. Keep all URLs and key facts.",
      },
      { role: "user", content: historyText },
    ],
  });

  return {
    role: "user",
    parts: [
      { text: `Research summary so far: ${res.choices[0].message.content}` },
    ],
  };
}
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.post("/research", async (req, res) => {
  const { topic } = req.body;

  const isValid = await validateInput(topic);
  if (!isValid.isTechRelated) {
    return res.status(400).json({
      error: `Error occured due to ${isValid.reason} and suggestion ${isValid.suggestion}`,
    });
  }
  const cached = await checkCache(topic);
  if (cached) return res.json({ ...cached, cached: true });
  const messages = [
    { role: "user", parts: [{ text: `Do proper research on ${topic}` }] },
  ];
  let iterations = 0;
  let lastText = "";
  while (iterations < 10) {
    iterations++;
    if (messages.length > 6 && messages.length % 4 === 0) {
      console.log("🗜️ Compressing message history...");
      const originalQuery = messages[0];
      const summary = await summarizeMessages(messages.slice(1));
      messages.length = 0;
      messages.push(originalQuery);
      messages.push(summary);
    }

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: messages,
        config: {
          tools: [WebSearchTool],
          systemInstruction: `You are a deep AI/Tech research agent.
Step 1: Use WebSearch to find relevant sources.
Step 2: Use fetchUrl on AT LEAST 1-2 of the most relevant URLs before writing.
Step 3: Return your final report as a VALID JSON object only — no markdown, no backticks, no explanation.
Do not write the report after just one fetchUrl call.
Start your response with { and end with }.
The JSON must follow this exact structure:
${JSON.stringify(reportSchema, null, 2)}`,
        },
      }),
    );
    const modelTurn = response.candidates[0].content;
    const functionCall = response.functionCalls?.[0];

    if (functionCall) {
      const { id, name, args } = functionCall;
      console.log(`🛠️  [TOOL] Calling tool: "${name}"`);
      console.log(`📥 [TOOL] Args:`, JSON.stringify(args, null, 2));
      const result = await availableTools[name](args);
      messages.push(modelTurn);
      messages.push({
        role: "user",
        parts: [{ functionResponse: { id, name, response: { result } } }],
      });
      continue;
    }

    const text = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const report = JSON.parse(text);
    lastText = text;
    await saveToCache(topic, report);
    return res.json(JSON.parse(text));
  }
  console.warn("⚠️ Max iterations reached, returning last response");
  try {
    const report = JSON.parse(lastText);
    await saveToCache(topic, report);
    return res.json(JSON.parse(lastText));
  } catch {
    return res
      .status(500)
      .json({ error: "Max iterations reached", raw: lastText });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
