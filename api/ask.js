import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// FAQ-type bot: the knowledge base is a list of curated question/answer pairs
// (api/faq-index.json, built by `npm run build:faq`). We embed the user's
// question, find the closest FAQ question, and answer from that FAQ entry.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const faqIndex = JSON.parse(
  readFileSync(path.join(__dirname, "faq-index.json"), "utf-8")
);
const FAQS = faqIndex.faqs || [];

const EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=";

// Primary first; automatic fallback when the primary is unavailable (Google outages).
const GEN_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];
const GEN_TIMEOUT_MS = 20000;

// Below this cosine similarity the question doesn't match any FAQ well
// enough, and we suggest alternatives instead of guessing.
const MATCH_THRESHOLD = 0.42;

const ANSWER_PROMPT = `You are the FAQ assistant for ADCET (Annasaheb Dange College of Engineering and Technology, Ashta).

The user asked a question. The knowledge base matched it to this frequently asked question and its official answer:

MATCHED FAQ QUESTION: {faqQuestion}

OFFICIAL ANSWER: {faqAnswer}

USER QUESTION: {userQuestion}

Write a helpful reply to the user:
1. Base it ONLY on the official answer above. Do not invent facts, dates or numbers.
2. Answer directly and naturally, as a friendly college helpdesk assistant would.
3. 1-3 sentences. If the official answer is short, keep your reply short.
4. Do not mention FAQs, matching, embeddings or how you work.`;

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a) {
  return Math.sqrt(dot(a, a));
}

async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}`);
  return res.json();
}

async function generateWithFallback(apiKey, prompt) {
  let lastError = new Error("no model attempted");
  for (const model of GEN_MODELS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEN_TIMEOUT_MS);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      if (!res.ok) {
        lastError = new Error(`${model} HTTP ${res.status}`);
        console.warn(`generate failed (${lastError.message}), trying fallback`);
        continue;
      }
      const data = await res.json();
      const text =
        (data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts
            .map((p) => p.text || "")
            .join("")) ||
        "";
      if (text.trim()) return text.trim();
      lastError = new Error(`${model} returned empty text`);
      console.warn(`generate empty (${model}), trying fallback`);
    } catch (e) {
      lastError = e;
      console.warn(`generate error (${model}): ${e.message || e}, trying fallback`);
    }
  }
  throw lastError;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ answer: "Method not allowed", matched: false });
  }

  const question = ((req.body && req.body.question) || "").toString().trim();
  if (!question) {
    return res.status(400).json({
      answer: "Please ask a question about ADCET.",
      matched: false,
    });
  }

  try {
    const key = process.env.GEMINI_API_KEY;

    const embedData = await postJSON(EMBED_URL + key, {
      model: "models/gemini-embedding-001",
      content: { parts: [{ text: question }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: faqIndex.embedding_dimensions || 3072,
    });
    const q = embedData.embedding.values;
    const qn = norm(q);

    const scored = FAQS.map((f) => ({
      f,
      s: qn && norm(f.embedding) ? dot(q, f.embedding) / (qn * norm(f.embedding)) : 0,
    }));
    scored.sort((a, b) => b.s - a.s);
    const best = scored[0];

    // No FAQ is close enough -> don't guess, offer alternatives.
    if (!best || best.s < MATCH_THRESHOLD) {
      const suggestions = scored.slice(0, 3).map((r) => r.f.question);
      return res.status(200).json({
        answer:
          "I'm not sure about that one — my answers come from ADCET's frequently asked questions. " +
          "Try asking about admissions, courses, hostel, placements, faculty or contacts. " +
          `You could also ask things like: "${suggestions[0]}"`,
        matched: false,
        suggestions,
      });
    }

    const prompt = ANSWER_PROMPT.replace(/\{faqQuestion\}/g, best.f.question)
      .replace(/\{faqAnswer\}/g, best.f.answer)
      .replace(/\{userQuestion\}/g, question);

    // Answer with Gemini; if Gemini is down, fall back to the official answer verbatim.
    let answer;
    try {
      answer = await generateWithFallback(key, prompt);
    } catch {
      answer = best.f.answer;
    }

    return res.status(200).json({
      answer,
      matched: true,
      matched_faq: { id: best.f.id, question: best.f.question, category: best.f.category },
      score: best.s,
    });
  } catch {
    return res.status(200).json({
      answer: "Sorry, the AI service is temporarily unavailable. Please try again later.",
      matched: false,
    });
  }
}
