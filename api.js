import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";
export const ai = new GoogleGenAI({ apiKey: process.env.GoogleGenAI });
export const summarizeragent = new Groq({
  apiKey: process.env.summarizer,
});
