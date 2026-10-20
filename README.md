# ADCET Portal — with AI FAQ Assistant

A React (Vite) website for Annasaheb Dange College of Engineering and Technology (ADCET), Ashta, with an **AI FAQ chatbot** powered by:

- **Gemini API** (`gemini-embedding-001` — 3072-dimension embeddings, plus `gemini-3.6-flash` for answers)
- **Firecrawl API** (crawls the website when building the FAQ knowledge base)
- **Vercel** (hosts the site + the serverless chat API)

## How the bot works (FAQ-type, not RAG)

```
BUILD TIME (your PC, run occasionally)          RUNTIME (Vercel, per chat message)
─────────────────────────────────────           ──────────────────────────────────
npm run build:faq                               User types a question in the widget
  │                                             │
  ├─1. Firecrawl crawls the site ──► markdown   ├─1. Gemini embeds the question
  ├─2. Gemini turns pages into FAQ pairs             (gemini-embedding-001)
  └─3. Gemini embeds each FAQ question                │
       ──► api/faq-index.json (committed)       ├─2. Cosine similarity vs FAQ index
                                                 ├─3. Best matching FAQ wins
                                                 └─4. Gemini answers from that FAQ
```

Unlike RAG (which retrieves raw text chunks and can hallucinate), this bot answers
from a **curated question → answer** list. If nothing matches well, it says so and
suggests questions instead of guessing.

## Project structure

```
adcetportal/
├── api/
│   ├── ask.js              ← Vercel serverless function (the bot's brain)
│   └── faq-index.json      ← generated FAQ knowledge base (commit after rebuild)
├── scripts/
│   └── build-faq.js        ← builds the FAQ index (Firecrawl + Gemini)
├── src/
│   ├── components/
│   │   └── AIAssistant.jsx ← floating chat widget
│   └── pages/              ← Home, About, Courses, Faculty, FAQ, ...
├── .env.example            ← template for your API keys
└── vercel.json             ← routes /api/* to serverless functions
```

## Local setup (step by step)

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create your `.env` file**
   - Copy `.env.example` to `.env`
   - Get a free Gemini key: https://aistudio.google.com/apikey
   - Get a Firecrawl key: https://firecrawl.dev (Settings → API Keys)
   - Paste both keys into `.env`

3. **Build the FAQ knowledge base** (needs both keys; costs a few credits)
   ```
   npm run build:faq
   ```
   This writes `api/faq-index.json`. Commit it whenever you rebuild:
   ```
   git add api/faq-index.json
   git commit -m "Refresh FAQ index"
   ```

4. **Run locally**
   ```
   npm run dev
   ```
   Open http://localhost:5173 and click **Ask ADCET AI**.
   *(Note: the `/api/ask` function only runs on Vercel; locally the widget will
   show the fallback message unless you run `vercel dev`.)*

## Deploy on Vercel (Git integration — recommended)

1. Push this repo to GitHub.
2. Go to https://vercel.com → **Add New → Project** → import your `adcetportal` repo.
3. Vercel auto-detects Vite. Keep the defaults:
   - Build Command: `npm run build` · Output Directory: `dist`
4. Before deploying, open **Environment Variables** and add:
   | Name | Value |
   |------|-------|
   | `GEMINI_API_KEY` | your Gemini key |
   *(Firecrawl is only used on your PC when rebuilding the FAQ index — it is NOT needed on Vercel.)*
5. Click **Deploy**. Done — every future `git push` to `main` redeploys automatically.

## Updating the bot's knowledge

When site content changes (new courses, notices, faculty…):

```
npm run build:faq
git add api/faq-index.json
git commit -m "Refresh FAQ index"
git push
```

Vercel redeploys with the fresh knowledge in ~1 minute.

## Security notes

- `.env` is gitignored — **never** paste your keys into code or commits.
- Set `GEMINI_API_KEY` only in Vercel's dashboard (Settings → Environment Variables).
- If a key leaks, revoke it and generate a new one immediately.
