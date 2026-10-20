#!/usr/bin/env node
/**
 * build-faq.js — Builds the FAQ knowledge base for the ADCET AI assistant.
 *
 * How it works (3 steps):
 *   1. FIRECRAWL crawls the site and returns clean markdown for every page.
 *   2. GEMINI reads each page and turns it into FAQ pairs (question + answer).
 *   3. GEMINI embeds every question as a 3072-dimension vector
 *      (model: gemini-embedding-001) and we save everything to api/faq-index.json.
 *
 * Usage:
 *   cp .env.example .env     <- put your two API keys in .env first
 *   npm run build:faq
 *
 * Env vars required in .env:
 *   GEMINI_API_KEY     -> https://aistudio.google.com/apikey
 *   FIRECRAWL_API_KEY  -> https://firecrawl.dev
 * Optional:
 *   CRAWL_URL          -> site to crawl (default https://adcetportal.vercel.app)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, "..", "api", "faq-index.json");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
const CRAWL_URL = process.env.CRAWL_URL || "https://adcetportal.vercel.app";

if (!GEMINI_KEY || !FIRECRAWL_KEY) {
  console.error(
    "\n[ERROR] Missing API keys.\n" +
      "  1. Copy .env.example to .env\n" +
      "  2. Fill in GEMINI_API_KEY and FIRECRAWL_API_KEY\n" +
      "  3. Run: npm run build:faq\n"
  );
  process.exit(1);
}

const EMBED_MODEL = "gemini-embedding-001"; // 3072-dimension embeddings
const EMBED_DIMS = 3072;
const GEN_MODEL = "gemini-3.6-flash";
const MAX_PAGES = 25;
const MAX_FAQS_PER_PAGE = 6;

/* ------------------------------------------------------------------ */
/* Seed FAQs — always included, taken from the site's FAQ page.        */
/* These guarantee the bot answers core questions even if the crawl    */
/* returns very little.                                                */
/* ------------------------------------------------------------------ */
const SEED_FAQS = [
  {
    question: "What is ADCET?",
    answer:
      "Annasaheb Dange College of Engineering and Technology (ADCET), Ashta is an autonomous engineering institute affiliated to Shivaji University, Kolhapur and approved by AICTE, New Delhi.",
    category: "About",
  },
  {
    question: "Where is ADCET located?",
    answer:
      "ADCET is located at Ashta, in Walwa Taluka of Sangli district, Maharashtra.",
    category: "About",
  },
  {
    question: "What courses are offered at ADCET?",
    answer:
      "ADCET offers undergraduate and postgraduate programs in various engineering and technology disciplines, along with programs in areas such as Computer Applications and Business Administration.",
    category: "Courses",
  },
  {
    question: "How can I apply for admission?",
    answer:
      "Students seeking admission should follow the admission procedure prescribed by the relevant admission authorities. Candidates should check the official admission information for eligibility, application procedure, important dates and required documents.",
    category: "Admissions",
  },
  {
    question: "Is ADCET an autonomous institute?",
    answer:
      "Yes. Annasaheb Dange College of Engineering and Technology, Ashta is an Empowered Autonomous Institute affiliated to Shivaji University, Kolhapur.",
    category: "About",
  },
  {
    question: "Is ADCET approved by AICTE?",
    answer:
      "Yes. The engineering programs offered by ADCET are approved by the All India Council for Technical Education (AICTE), New Delhi.",
    category: "About",
  },
  {
    question: "Is ADCET accredited by NAAC?",
    answer:
      "Yes. ADCET has been accredited by the National Assessment and Accreditation Council (NAAC) with an A++ grade.",
    category: "About",
  },
  {
    question: "Are hostel facilities available?",
    answer:
      "Yes. ADCET provides hostel facilities for students along with campus amenities and other student support facilities.",
    category: "Facilities",
  },
  {
    question: "Does ADCET provide placement assistance?",
    answer:
      "Yes. The institute has a dedicated Training and Placement system that supports students through placement activities, industry interaction, training programs and recruitment opportunities.",
    category: "Placements",
  },
  {
    question: "How can I contact ADCET?",
    answer:
      "Students and visitors can contact the institute through the official contact details provided on the ADCET website or visit the Contact Us section of this website.",
    category: "Contact",
  },
  {
    question: "Where can I find the latest college notices?",
    answer:
      "Latest announcements, circulars, academic updates, examination information and other notices can be found in the Notices section of the website.",
    category: "Academics",
  },
  {
    question: "Where can I find information about faculty members?",
    answer:
      "Faculty information is available department-wise. Students can visit the Faculty section to view information about faculty members and their respective departments.",
    category: "Faculty",
  },
];

/* ------------------------------------------------------------------ */
/* Step 1: crawl the site with Firecrawl                                */
/* ------------------------------------------------------------------ */
async function crawlSite() {
  console.log(`[1/3] Crawling ${CRAWL_URL} with Firecrawl (max ${MAX_PAGES} pages)...`);

  const startRes = await fetch("https://api.firecrawl.dev/v1/crawl", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: CRAWL_URL,
      limit: MAX_PAGES,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });

  if (!startRes.ok) {
    throw new Error(`Firecrawl crawl start failed: HTTP ${startRes.status} ${await startRes.text()}`);
  }

  const { id: jobId } = await startRes.json();
  if (!jobId) throw new Error("Firecrawl did not return a job id");
  console.log(`      Crawl job started (${jobId}), waiting...`);

  // Poll every 5 seconds until the job finishes (max 10 minutes).
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}` },
    });
    if (!pollRes.ok) continue;
    const status = await pollRes.json();
    const done = status.completed ?? status.data?.length ?? 0;
    console.log(`      status=${status.status} pages=${done}`);
    if (status.status === "completed") {
      const pages = (status.data || [])
        .filter((p) => p.markdown && p.markdown.trim())
        .map((p) => ({ url: p.metadata?.sourceURL || p.url || CRAWL_URL, markdown: p.markdown }));
      return pages;
    }
    if (status.status === "failed") {
      throw new Error(`Firecrawl job failed: ${JSON.stringify(status.error || status)}`);
    }
  }
  throw new Error("Firecrawl crawl timed out after 10 minutes");
}

/* ------------------------------------------------------------------ */
/* Step 2: turn each page into FAQ pairs with Gemini                    */
/* ------------------------------------------------------------------ */
const FAQ_PROMPT = `You are building the FAQ knowledge base for ADCET (Annasaheb Dange College of Engineering and Technology, Ashta).

Read the website page below and write ${MAX_FAQS_PER_PAGE} or fewer question-and-answer pairs that a student or parent might actually ask about this page.

STRICT RULES:
- Only use facts stated in the page. Never invent details, dates, numbers or names.
- Answers must be 1-3 sentences, helpful and specific.
- Questions must be short, natural, and searchable (e.g. "What is the NAAC grade of ADCET?").
- category must be one word: About, Courses, Admissions, Faculty, Placements, Facilities, Academics, Contact, Notices.
- If the page has almost no useful text, return an empty array [].

Return ONLY valid JSON in exactly this shape:
[{"question":"...","answer":"...","category":"..."}]

WEBSITE PAGE (${pageUrl}):
---
${pageMarkdown}
---`;

async function extractFaqsFromPage(page) {
  const prompt = FAQ_PROMPT.replace("{pageUrl}", page.url).replace(
    "{pageMarkdown}",
    page.markdown.slice(0, 16000)
  );

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEN_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini generateContent HTTP ${res.status} for ${page.url}`);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "[]";

  let faqs = [];
  try {
    faqs = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/, ""));
  } catch {
    console.warn(`      (could not parse FAQ JSON from ${page.url}, skipping)`);
    return [];
  }
  if (!Array.isArray(faqs)) return [];

  return faqs
    .filter((f) => f && typeof f.question === "string" && typeof f.answer === "string")
    .slice(0, MAX_FAQS_PER_PAGE)
    .map((f) => ({
      question: f.question.trim(),
      answer: f.answer.trim(),
      category: (f.category || "Other").toString().trim(),
      source_url: page.url,
    }))
    .filter((f) => f.question && f.answer);
}

/* ------------------------------------------------------------------ */
/* Step 3: embed every question into a 3072-dimension vector            */
/* ------------------------------------------------------------------ */
async function embedAll(texts) {
  const batches = [];
  for (let i = 0; i < texts.length; i += 20) batches.push(texts.slice(i, i + 20));

  const vectors = [];
  for (const [bi, batch] of batches.entries()) {
    const requests = batch.map((text) => ({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: EMBED_DIMS,
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      }
    );
    if (!res.ok) throw new Error(`Gemini batchEmbedContents HTTP ${res.status}`);
    const data = await res.json();
    for (const emb of data.embeddings) vectors.push(emb.values);
    console.log(`      embedded batch ${bi + 1}/${batches.length}`);
  }
  return vectors;
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */
function normalize(q) {
  return q.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

async function main() {
  let pages = [];
  try {
    pages = await crawlSite();
    console.log(`      Crawled ${pages.length} pages.\n`);
  } catch (e) {
    console.warn(`      [WARN] Crawl failed (${e.message}). Building index from seed FAQs only.\n`);
  }

  console.log(`[2/3] Generating FAQ pairs with Gemini (${GEN_MODEL})...`);
  const allFaqs = [...SEED_FAQS.map((f) => ({ ...f, source_url: `${CRAWL_URL}/faq` }))];
  for (const page of pages) {
    try {
      const faqs = await extractFaqsFromPage(page);
      console.log(`      ${faqs.length} FAQs from ${page.url}`);
      allFaqs.push(...faqs);
    } catch (e) {
      console.warn(`      (failed on ${page.url}: ${e.message})`);
    }
  }

  // Remove duplicate questions (same meaning, same wording).
  const seen = new Set();
  const uniqueFaqs = allFaqs.filter((f) => {
    const key = normalize(f.question);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`      ${uniqueFaqs.length} unique FAQs after dedupe.\n`);

  console.log(`[3/3] Embedding questions (${EMBED_MODEL}, ${EMBED_DIMS} dims)...`);
  const embeddings = await embedAll(uniqueFaqs.map((f) => f.question));

  const index = {
    generated_at: new Date().toISOString(),
    source_url: CRAWL_URL,
    embedding_model: EMBED_MODEL,
    embedding_dimensions: EMBED_DIMS,
    faqs: uniqueFaqs.map((faq, i) => ({
      id: `faq-${String(i + 1).padStart(3, "0")}`,
      ...faq,
      embedding: embeddings[i],
    })),
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(index));
  console.log(`\nDone! Wrote ${index.faqs.length} FAQs to api/faq-index.json`);
  console.log("Commit this file:  git add api/faq-index.json && git commit -m \"Refresh FAQ index\"");
}

main().catch((e) => {
  console.error(`\n[ERROR] ${e.message}`);
  process.exit(1);
});
