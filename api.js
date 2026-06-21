import { GoogleGenAI } from "@google/genai";
import { LangCache } from "@redis-ai/langcache";
import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";
export const langcache = new LangCache({
  serverURL: process.env.SERVER_URL,
  apiKey: process.env.LANGCACHE_API_KEY,
  cacheId: process.env.CACHE_ID,
});
export const ai = new GoogleGenAI({ apiKey: process.env.GoogleGenAI });
export const summarizeragent = new Groq({
  apiKey: process.env.summarizer,
});
