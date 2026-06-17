# 🤖 Multi-Agent AI Research System

> An autonomous AI research agent that searches the web, reads articles, and generates structured tech reports — powered by Google Gemini + Groq (LLaMA 3.3)

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_LLaMA_3.3-F55036?style=for-the-badge&logo=meta&logoColor=white)

</div>

---

## ⚡ Animated Architecture
![Architecture](./assets/multi_agent_architecture..png)

## 🔄 Request Lifecycle

```
Request ──▶ Validate ──▶ Plan ──▶ Search ──▶ Read ──▶ Compress ──▶ Report
              │                     │          │          │
           Groq                  Gemini     Gemini     Groq
           LLaMA              (WebSearch) (fetchUrl) (summarize)
              │                     │          │
           ❌ reject            Serper API  fetch(url)
           ✅ continue          10 results  strip HTML
```

---

## 🧩 System Components

| Component      | File        | Model            | Purpose                    |
| -------------- | ----------- | ---------------- | -------------------------- |
| 🛡️ Input Guard | `utils.js`  | Groq LLaMA 3.3   | Validates tech relevance   |
| 🔍 Web Search  | `utils.js`  | Serper API       | Finds relevant URLs        |
| 📄 URL Fetcher | `utils.js`  | Groq LLaMA 3.3   | Reads + summarizes pages   |
| 🗜️ Compressor  | `index.js`  | Groq LLaMA 3.3   | Compresses message history |
| 🧠 Agent Brain | `index.js`  | Gemini 2.5-flash | Orchestrates tool calls    |
| 📊 Schema      | `Schema.js` | —                | Defines report structure   |
| 🔁 Retry Logic | `utils.js`  | —                | Handles 429/503 errors     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Google AI Studio API key → [aistudio.google.com](https://aistudio.google.com)
- Groq API key → [console.groq.com](https://console.groq.com)
- Serper API key → [serper.dev](https://serper.dev)

### Installation

```bash
git clone https://github.com/yourusername/multi-agent-research
cd multi-agent-research
npm install
```

### Environment Setup

Create a `.env` file:

```env
GoogleGenAI=your_gemini_api_key
summarizer=your_groq_api_key
SERPER_API_KEY=your_serper_api_key
```

### Run

```bash
npm start
# Server running on http://localhost:3000
```

### API Usage

```bash
curl -X POST http://localhost:3000/research \
  -H "Content-Type: application/json" \
  -d '{ "topic": "Model Context Protocol by Anthropic" }'
```

---

## 📦 Tech Stack

```
Backend     → Node.js + Express 5
Agent Brain → Google Gemini 2.5-flash (tool orchestration)
NLP Tasks   → Groq LLaMA 3.3-70b (summarization, validation)
Web Search  → Serper.dev API
```

---

## 🧠 How The Agent Thinks

```
Iteration 1:  Gemini → "I need to search first"
              → calls WebSearch("MCP Anthropic")
              → gets 10 URLs with titles and snippets

Iteration 2:  Gemini → "Let me read the most relevant URL"
              → calls fetchUrl("https://anthropic.com/...")
              → Groq summarizes HTML into 300 words
              → Gemini reads the summary

Iteration 3:  Gemini → "I need one more source"
              → calls fetchUrl("https://docs.anthropic.com/...")
              → Groq summarizes again

Iteration 4:  Gemini → "I have enough, writing report now"
              → returns structured JSON report
              → no tool call = loop exits
```

---

## ⚙️ Token Optimization Strategy

The system uses a 3-layer token reduction pipeline:

```
Layer 1 — HTML Compression
  Raw HTML (50,000 chars) → strip tags → slice(0, 5000) → ~1,200 tokens

Layer 2 — Content Summarization
  Page content (1,200 tokens) → Groq summarize → 300 words → ~400 tokens
  Savings: ~70% per fetchUrl call

Layer 3 — History Compression
  Triggered: messages.length > 6 && length % 4 === 0
  Keeps: original user query
  Compresses: entire conversation → 300 word summary
  Savings: prevents unbounded context growth
```

---

## 🔁 Retry Logic

```javascript
withRetry(fn, maxRetries = 3)
  → 503 UNAVAILABLE: wait 2s × attempt, retry
  → 429 RATE_LIMIT:  wait retryDelay from error, retry
  → other errors:    throw immediately
```

---

## 📁 Project Structure

```
multi-agent/
├── index.js       # Express server + agentic loop
├── api.js         # Gemini + Groq client setup
├── utils.js       # WebSearch, fetchUrl, summarizer, validateInput, withRetry
├── tools.js       # Tool declarations + availableTools map
├── Schema.js      # validationSchema + reportSchema
├── public/        # Frontend (index.html)
└── .env           # API keys
```

---

## 📊 Report Schema

```json
{
  "title": "string",
  "generatedAt": "ISO date",
  "topic": "string",
  "summary": "3-4 sentence overview",
  "sections": [
    {
      "heading": "string",
      "content": "string",
      "keyPoints": ["string"],
      "sources": [{ "title": "string", "url": "string" }]
    }
  ],
  "techStack": ["string"],
  "keyFacts": ["string"],
  "useCases": ["string"],
  "limitations": ["string"],
  "futureOutlook": "string",
  "allSources": [{ "title": "string", "url": "string" }]
}
```

---

## 🛡️ Guardrails

- Input validation — rejects non-tech topics before burning API quota
- Max iterations cap — prevents infinite agent loops
- Per-call retry logic — handles API rate limits gracefully
- HTML sanitization — strips scripts/styles before processing
- JSON parse safety — catches malformed model output with fallback

---

## 👤 Author

**Piyush Yadav**

---

## 📄 License

ISC
