import { useEffect, useRef, useState } from "react";
import FAQ_DATA from "../data/faqs";
import "./AIAssistant.css";

/* =======================================================================
   ADCET AI Assistant — floating FAQ widget
   - Rule-based keyword matching first (fast, free, works offline).
   - If no FAQ matches well, falls back to the serverless Gemini endpoint
     (/api/ask). If that is unavailable too, a friendly fallback is shown.
   ======================================================================= */

const API_URL = "";
const API_BASE = API_URL ? API_URL.replace(/\/$/, "") : "";

const WELCOME_TEXT =
  "Hello! I'm here to help you with anything related to ADCET.";

const FALLBACK_TEXT =
  "I'm sorry, I don't have an answer for that yet. 😕\n\n" +
  "I currently know about: Admissions, Fees & Payments, Departments, Hostel, " +
  "Placements and Transport. Try re-phrasing your question, or tap one of the " +
  "suggestions below.";

const GREETING_RE =
  /^(hi|hello|hey|hii|helo|namaskar|good morning|good afternoon|good evening)\b/;
const THANKS_RE = /^(thanks|thank you|thankyou|ok|okay|great|nice|cool)\b/;
const BYE_RE = /^(bye|goodbye|see you)\b/;
const WHO_RE = /^(who are you|what are you|your name)\b/;

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "on", "for",
  "and", "or", "at", "by", "with", "what", "how", "do", "does", "can", "i",
  "you", "we", "me", "my", "it", "this", "that", "there", "please", "tell",
  "about", "give", "have", "has", "any", "from", "be", "as", "if", "so",
]);

/* ------------------------- matching engine ------------------------- */

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreFaq(faq, query) {
  const q = " " + normalize(query) + " ";
  let score = 0;

  for (const kw of faq.keywords) {
    const k = normalize(kw);
    if (!k) continue;
    if (q.includes(k)) score += 3 + Math.min(k.split(" ").length - 1, 2);
  }

  const qWords = normalize(faq.q)
    .split(" ")
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const queryWords = new Set(normalize(query).split(" "));
  for (const w of qWords) if (queryWords.has(w)) score += 1;

  return score;
}

function matchQuestion(query) {
  if (!query || !query.trim()) return null;
  let best = null;

  for (const cat of FAQ_DATA.categories) {
    for (const faq of cat.faqs) {
      const s = scoreFaq(faq, query);
      if (!best || s > best.score) best = { faq, category: cat, score: s };
    }
  }
  return best && best.score >= 4 ? best : null;
}

function greetingReply(text) {
  const t = normalize(text);
  if (GREETING_RE.test(t))
    return "Hello! 👋 I'm the ADCET AI Assistant. Ask me about admissions, fees, departments, hostel, placements or transport — or tap a category below.";
  if (THANKS_RE.test(t))
    return "You're welcome! 😊 Is there anything else about ADCET I can help you with?";
  if (BYE_RE.test(t))
    return "Goodbye! 👋 Feel free to come back any time you have a college question.";
  if (WHO_RE.test(t))
    return "I'm the ADCET AI Assistant — I answer common college questions instantly using a built-in FAQ knowledge base, with a Gemini-powered fallback for everything else.";
  return null;
}

const catById = (id) => FAQ_DATA.categories.find((c) => c.id === id);

/* ------------------------------ widget ------------------------------ */

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    { id: 1, kind: "text", sender: "bot", text: WELCOME_TEXT },
    { id: 2, kind: "categories", sender: "bot" },
  ]);

  const nextId = useRef(3);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  /* keep the newest message in view */
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const push = (msg) =>
    setMessages((prev) => [...prev, { id: nextId.current++, time: nowTime(), ...msg }]);

  /* show a bot message after a short "typing" delay */
  const botSay = (msg, delay = 650) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      push(msg);
    }, delay);
  };

  /* ------------------------- answering paths ------------------------- */

  const showAnswer = (faq, categoryId, extraDelay = 0) => {
    botSay(
      { kind: "answer", sender: "bot", text: faq.a, sample: !!faq.sample, follow: faq.follow || [], categoryId },
      600 + extraDelay
    );
  };

  const showFallback = () => {
    const picks = [
      FAQ_DATA.categories[0].faqs[0], // admission process
      FAQ_DATA.categories[4].faqs[0], // placement cell
      FAQ_DATA.categories[3].faqs[0], // hostel
    ];
    botSay({ kind: "fallback", sender: "bot", text: FALLBACK_TEXT, suggestions: picks });
  };

  // Try the serverless Gemini endpoint when the local FAQ base has no match.
  const askServer = async (text) => {
    try {
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.answer) {
        botSay({ kind: "text", sender: "bot", text: data.answer }, 300);
        return;
      }
    } catch {
      /* fall through to the local fallback */
    }
    showFallback();
  };

  const handleQuery = (text) => {
    const greeting = greetingReply(text);
    if (greeting) {
      botSay({ kind: "text", sender: "bot", text: greeting });
      return;
    }
    const hit = matchQuestion(text);
    if (hit) showAnswer(hit.faq, hit.category.id);
    else askServer(text);
  };

  /* ----------------------------- actions ----------------------------- */

  const send = (text) => {
    const value = (text ?? input).trim();
    if (!value || typing) return; // never send empty messages
    push({ kind: "text", sender: "user", text: value });
    setInput("");
    handleQuery(value);
  };

  const openCategory = (id) => {
    const cat = catById(id);
    if (!cat) return;
    botSay({ kind: "questions", sender: "bot", categoryId: id });
  };

  const restart = () => {
    setMessages([
      { id: nextId.current++, kind: "text", sender: "bot", text: WELCOME_TEXT },
      { id: nextId.current++, kind: "categories", sender: "bot" },
    ]);
    setMenuOpen(false);
  };

  /* --------------------------- rendering ----------------------------- */

  const renderCategories = () => (
    <>
      <p className="aa-section-title">You can ask me about:</p>
      <div className="aa-category-grid" role="group" aria-label="FAQ categories">
        {FAQ_DATA.categories
          .filter((c) => c.showAsCard !== false)
          .map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="aa-category-card"
              onClick={() => openCategory(cat.id)}
              aria-label={`Show frequently asked questions about ${cat.label}`}
            >
              <span className="aa-cat-icon" aria-hidden="true">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
      </div>
    </>
  );

  const renderQuestions = (categoryId) => {
    const cat = catById(categoryId);
    if (!cat) return null;
    return (
      <>
        <p className="aa-section-title">{cat.icon} {cat.label} — tap a question:</p>
        <div className="aa-chip-list" role="group" aria-label={`Questions about ${cat.label}`}>
          {cat.faqs.map((faq) => (
            <button
              key={faq.q}
              type="button"
              className="aa-chip"
              onClick={() => send(faq.q)}
              aria-label={`Ask: ${faq.q}`}
            >
              {faq.q}
            </button>
          ))}
          <button type="button" className="aa-chip" onClick={() => push({ kind: "categories", sender: "bot" })}>
            ⌂ Back to all categories
          </button>
        </div>
      </>
    );
  };

  const renderMessage = (m) => {
    if (m.sender === "user") {
      return (
        <div key={m.id} className="aa-row aa-row-user">
          <div className="aa-bubble aa-bubble-user">
            {m.text}
            <span className="aa-time">{m.time}</span>
          </div>
        </div>
      );
    }

    let content = null;
    if (m.kind === "categories") content = renderCategories();
    else if (m.kind === "questions") content = renderQuestions(m.categoryId);
    else if (m.kind === "fallback") {
      content = (
        <>
          <span style={{ whiteSpace: "pre-line" }}>{m.text}</span>
          <div className="aa-chip-list" style={{ marginTop: 8 }}>
            {m.suggestions.map((faq) => (
              <button key={faq.q} type="button" className="aa-chip" onClick={() => send(faq.q)}>
                {faq.q}
              </button>
            ))}
            <button type="button" className="aa-chip" onClick={() => push({ kind: "categories", sender: "bot" })}>
              ⌂ Browse all categories
            </button>
          </div>
        </>
      );
    } else {
      content = (
        <>
          <span style={{ whiteSpace: "pre-line" }}>{m.text}</span>
          {m.sample && (
            <span className="aa-sample-badge">⚠ Sample answer — verify with the college office</span>
          )}
          {m.follow?.length > 0 && (
            <div className="aa-followups">
              <p className="aa-followups-label">Suggested follow-ups:</p>
              {m.follow.map((fq) => (
                <button key={fq} type="button" className="aa-chip aa-chip-follow" onClick={() => send(fq)}>
                  {fq}
                </button>
              ))}
            </div>
          )}
        </>
      );
    }

    return (
      <div key={m.id} className="aa-row aa-row-bot">
        <span className="aa-avatar" aria-hidden="true">🤖</span>
        <div className="aa-bubble aa-bubble-bot">
          {content}
          <span className="aa-time">{m.time}</span>
        </div>
      </div>
    );
  };

  /* ------------------------------ widget ----------------------------- */

  return (
    <>
      <button
        className="aa-launcher"
        onClick={() => setIsOpen(true)}
        aria-label="Open ADCET AI Assistant chat"
        aria-expanded={isOpen}
        aria-controls="aa-widget"
        hidden={isOpen}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3C6.99 3 3 6.36 3 10.5c0 2.3 1.24 4.35 3.2 5.76-.14 1.2-.6 2.3-1.35 3.24 1.63-.2 3.13-.83 4.35-1.7.9.25 1.86.4 2.8.4 5.01 0 9-3.36 9-7.7S17.01 3 12 3z" />
        </svg>
      </button>

      <section
        id="aa-widget"
        className={`aa-widget${isOpen ? "" : " aa-hidden"}`}
        role="dialog"
        aria-label="ADCET AI Assistant chat window"
      >
        <header className="aa-header">
          <div className="aa-header-left">
            <span className="aa-bot-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2a1.2 1.2 0 0 1 1.2 1.2V5h2.3A3.5 3.5 0 0 1 19 8.5v7a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 5 15.5v-7A3.5 3.5 0 0 1 8.5 5h2.3V3.2A1.2 1.2 0 0 1 12 2zM8.5 8A1.5 1.5 0 0 0 7 9.5v4a1.5 1.5 0 0 0 3 0v-4A1.5 1.5 0 0 0 8.5 8zm7 0a1.5 1.5 0 0 0-1.5 1.5v4a1.5 1.5 0 0 0 3 0v-4A1.5 1.5 0 0 0 15.5 8zM10 16h4a1 1 0 0 1 0 2h-4a1 1 0 0 1 0-2z" />
              </svg>
            </span>
            <div className="aa-header-text">
              <h2 className="aa-title">ADCET AI Assistant</h2>
              <p className="aa-subtitle">Your smart companion for all college queries</p>
              <span className="aa-status">
                <span className="aa-status-dot" aria-hidden="true" />Online
              </span>
            </div>
          </div>

          <div className="aa-header-actions">
            <div className="aa-menu-wrap">
              <button
                type="button"
                className="aa-icon-btn"
                aria-label="More options"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
              {menuOpen && (
                <div className="aa-menu" role="menu">
                  <button type="button" role="menuitem" onClick={restart}>↺ Restart chat</button>
                  <button type="button" role="menuitem" onClick={() => { push({ kind: "categories", sender: "bot" }); setMenuOpen(false); }}>
                    ⌂ Main categories
                  </button>
                  <button type="button" role="menuitem" onClick={() => { botSay({ kind: "text", sender: "bot", text: "I'm a rule-based FAQ assistant for ADCET. I match your question against a built-in knowledge base (admissions, fees, departments, hostel, placements, transport). If I don't know the answer, I ask a Gemini-powered AI service for help. Answers marked as sample are placeholders — please verify fees, dates and policies with the college office." }); setMenuOpen(false); }}>
                    ℹ About this bot
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="aa-icon-btn" aria-label="Minimize chat" onClick={() => setIsOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="12" x2="18" y2="12" /></svg>
            </button>
            <button type="button" className="aa-icon-btn" aria-label="Close chat" onClick={() => setIsOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </button>
          </div>
        </header>

        <div className="aa-body" ref={bodyRef} role="log" aria-live="polite" aria-label="Chat conversation">
          {messages.map(renderMessage)}
        </div>

        {typing && (
          <div className="aa-typing">
            <span className="aa-avatar" aria-hidden="true">🤖</span>
            <span className="aa-typing-bubble">
              <span className="aa-dot" /><span className="aa-dot" /><span className="aa-dot" />
            </span>
            <span className="aa-sr-only">Assistant is typing</span>
          </div>
        )}

        <form
          className="aa-input-row"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          <button
            type="button"
            className="aa-attach-btn"
            aria-label="Attach a file (demo only)"
            onClick={() => botSay({ kind: "text", sender: "bot", text: "📎 File attachments aren't supported yet, but you can type your question and I'll answer it!" })}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            id="aa-input"
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            autoComplete="off"
            aria-label="Type your message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
          />
          <button type="submit" className="aa-send-btn" aria-label="Send message" disabled={typing}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.4 20.4l17.4-7.5c.8-.4.8-1.5 0-1.8L3.4 3.6c-.7-.3-1.4.3-1.3 1L3.2 11c.1.4.4.7.8.8l9.5 1.2-9.5 1.2c-.4.1-.7.4-.8.8L2.1 19.4c-.1.7.6 1.3 1.3 1z" />
            </svg>
          </button>
        </form>

        <footer className="aa-footer">Powered by ADCET AI</footer>
      </section>
    </>
  );
}

export default AIAssistant;
