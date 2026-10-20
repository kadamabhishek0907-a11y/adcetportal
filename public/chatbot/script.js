/* =========================================================================
   script.js — ADCET AI Assistant chatbot logic
   Rule-based FAQ matching (no AI key, works offline once files are loaded).

   Public pieces (also exported for Node tests):
     - normalize(text)          : lowercase, strip punctuation
     - scoreFaq(faq, query)     : keyword overlap score for one FAQ
     - matchQuestion(query)     : best {faq, category, score} or null
     - greetingReply(text)      : canned reply for hi/thanks/etc, or null
   UI pieces are wired in init().
   ========================================================================= */

(function () {
  "use strict";

  /* ---------- small helpers ---------- */
  const $ = (sel) => document.querySelector(sel);

  function normalize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /* ---------- matching engine ---------- */

  // Words too common to be useful for matching.
  const STOP_WORDS = new Set([
    "the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "on", "for",
    "and", "or", "at", "by", "with", "what", "how", "do", "does", "can", "i",
    "you", "we", "me", "my", "it", "this", "that", "there", "please", "tell",
    "about", "give", "have", "has", "any", "from", "be", "as", "if", "so",
  ]);

  // Score one FAQ against a query. Bigger = better match.
  function scoreFaq(faq, query) {
    const q = " " + normalize(query) + " ";
    let score = 0;

    // Each keyword hit is worth 3 points (long keywords weigh more).
    for (const kw of faq.keywords) {
      const k = normalize(kw);
      if (!k) continue;
      if (q.includes(" " + k + " ") || q.includes(k)) {
        score += 3 + Math.min(k.split(" ").length - 1, 2);
      }
    }

    // Every content word from the question found in the query adds 1 point.
    const qWords = normalize(faq.q).split(" ").filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    const queryWords = new Set(normalize(query).split(" "));
    for (const w of qWords) if (queryWords.has(w)) score += 1;

    return score;
  }

  // Find the best FAQ across every category.
  function matchQuestion(query) {
    if (!query || !query.trim()) return null;
    let best = null;

    for (const cat of FAQ_DATA.categories) {
      for (const faq of cat.faqs) {
        const s = scoreFaq(faq, query);
        if (!best || s > best.score) best = { faq, category: cat, score: s };
      }
    }
    // Below this threshold we treat it as "no answer found".
    return best && best.score >= 4 ? best : null;
  }

  // Canned replies for social messages.
  function greetingReply(text) {
    const t = normalize(text);
    if (/^(hi|hello|hey|hii|helo|namaskar|good morning|good afternoon|good evening)\b/.test(t)) {
      return {
        text: "Hello! 👋 I'm the ADCET AI Assistant. Ask me about admissions, fees, departments, hostel, placements or transport — or tap a category below.",
        showCategories: true,
      };
    }
    if (/^(thanks|thank you|thankyou|ok|okay|great|nice|cool)\b/.test(t)) {
      return { text: "You're welcome! 😊 Is there anything else about ADCET I can help you with?" };
    }
    if (/^(bye|goodbye|see you)\b/.test(t)) {
      return { text: "Goodbye! 👋 Feel free to come back any time you have a college question." };
    }
    if (/^(who are you|what are you|your name)\b/.test(t)) {
      return { text: "I'm the ADCET AI Assistant — a rule-based FAQ helper for Annasaheb Dange College of Engineering & Technology, Ashta. I answer common college questions instantly, without needing an internet connection." };
    }
    return null;
  }

  /* Export for Node-based tests (no-op in the browser). */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { normalize, scoreFaq, matchQuestion, greetingReply, STOP_WORDS };
  }

  /* ---------- UI code only runs in a browser ---------- */
  if (typeof document === "undefined") return;

  const els = {
    widget: $("#chat-widget"),
    launcher: $("#chat-launcher"),
    body: $("#chat-body"),
    form: $("#chat-form"),
    input: $("#chat-input"),
    typing: $("#typing-indicator"),
    menuBtn: $("#menu-btn"),
    menu: $("#menu-dropdown"),
    minBtn: $("#minimize-btn"),
    closeBtn: $("#close-btn"),
    attachBtn: $("#attach-btn"),
  };

  const WELCOME_TEXT = "Hello! I'm here to help you with anything related to ADCET.";
  const FALLBACK_TEXT =
    "I'm sorry, I don't have an answer for that yet. 😕\n\n" +
    "I currently know about: Admissions, Fees & Payments, Departments, Hostel, Placements and Transport.\n" +
    "Try re-phrasing your question, or tap one of the suggestions below.";

  /* ---------- rendering ---------- */

  function scrollToEnd() {
    els.body.scrollTop = els.body.scrollHeight;
  }

  function addRow(kind) {
    const row = document.createElement("div");
    row.className = "msg-row " + kind;
    els.body.appendChild(row);
    return row;
  }

  // Generic message bubble. content may be a string or a DocumentFragment/node.
  function addMessage(kind, content) {
    const row = addRow(kind);

    if (kind === "bot") {
      const av = document.createElement("span");
      av.className = "msg-avatar";
      av.setAttribute("aria-hidden", "true");
      av.textContent = "🤖";
      row.appendChild(av);
    }

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    if (typeof content === "string") {
      bubble.textContent = content;               // safe: no HTML injection
    } else {
      bubble.appendChild(content);
    }

    const time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = nowTime();
    bubble.appendChild(time);

    row.appendChild(bubble);
    scrollToEnd();
    return bubble;
  }

  // "You can ask me about:" + 6 category cards.
  function buildCategoryGrid() {
    const frag = document.createDocumentFragment();

    const title = document.createElement("p");
    title.className = "chat-section-title";
    title.textContent = "You can ask me about:";
    frag.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "category-grid";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "FAQ categories");

    FAQ_DATA.categories
      .filter((c) => c.showAsCard !== false)
      .forEach((cat) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "category-card";
        btn.setAttribute("aria-label", "Show frequently asked questions about " + cat.label);

        const icon = document.createElement("span");
        icon.className = "cat-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = cat.icon;

        const label = document.createElement("span");
        label.textContent = cat.label;

        btn.append(icon, label);
        btn.addEventListener("click", () => openCategory(cat.id));
        grid.appendChild(btn);
      });

    frag.appendChild(grid);
    return frag;
  }

  // List of clickable questions for a category.
  function buildQuestionList(category) {
    const frag = document.createDocumentFragment();

    const title = document.createElement("p");
    title.className = "chat-section-title";
    title.textContent = category.icon + " " + category.label + " — tap a question:";
    frag.appendChild(title);

    const list = document.createElement("div");
    list.className = "chip-list";
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "Questions about " + category.label);

    category.faqs.forEach((faq) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = faq.q;
      btn.setAttribute("aria-label", "Ask: " + faq.q);
      btn.addEventListener("click", () => {
        addMessage("user", faq.q);
        respond(faq, category);
      });
      list.appendChild(btn);
    });

    // Back-to-categories chip.
    const back = document.createElement("button");
    back.type = "button";
    back.className = "chip";
    back.textContent = "⌂ Back to all categories";
    back.addEventListener("click", () => addMessage("bot", buildCategoryGrid()));
    list.appendChild(back);

    frag.appendChild(list);
    return frag;
  }

  // Suggested follow-up buttons under an answer.
  function buildFollowups(faq) {
    if (!faq.follow || !faq.follow.length) return null;

    const wrap = document.createElement("div");
    wrap.className = "followups";

    const label = document.createElement("p");
    label.className = "followups-label";
    label.textContent = "Suggested follow-ups:";
    wrap.appendChild(label);

    faq.follow.forEach((fq) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = fq;
      btn.setAttribute("aria-label", "Ask follow-up: " + fq);
      btn.addEventListener("click", () => {
        addMessage("user", fq);
        handleQuery(fq);
      });
      wrap.appendChild(btn);
    });

    return wrap;
  }

  /* ---------- typing indicator ---------- */
  let typingTimer = null;
  function showTyping() {
    els.typing.hidden = false;
    scrollToEnd();
  }
  function hideTyping() {
    els.typing.hidden = true;
    clearTimeout(typingTimer);
  }

  // Wait ~500-900ms so the reply feels natural, then reveal the content.
  function botSay(buildContent, done) {
    showTyping();
    const delay = 500 + Math.random() * 400;
    typingTimer = setTimeout(() => {
      hideTyping();
      addMessage("bot", buildContent());
      if (done) done();
    }, delay);
  }

  /* ---------- answering ---------- */

  // Show a known FAQ (from a card, chip, follow-up or typed match).
  function respond(faq, category) {
    botSay(() => {
      const frag = document.createDocumentFragment();

      const txt = document.createElement("span");
      txt.textContent = faq.a;
      frag.appendChild(txt);

      if (faq.sample) {
        const badge = document.createElement("span");
        badge.className = "sample-badge";
        badge.textContent = "⚠ Sample answer — verify with the college office";
        frag.appendChild(badge);
      }

      const fu = buildFollowups(faq);
      if (fu) frag.appendChild(fu);

      // A "browse this category" shortcut when we arrived via typed text.
      if (category && !document.querySelector(".chip-list")) {
        const browse = document.createElement("button");
        browse.type = "button";
        browse.className = "chip";
        browse.style.marginTop = "8px";
        browse.textContent = "⌂ See all " + category.label + " questions";
        browse.addEventListener("click", () => openCategory(category.id));
        frag.appendChild(browse);
      }

      return frag;
    });
  }

  // Friendly "not found" reply with 3 suggested questions.
  function fallbackReply() {
    botSay(() => {
      const frag = document.createDocumentFragment();
      const txt = document.createElement("span");
      txt.textContent = FALLBACK_TEXT;
      frag.appendChild(txt);

      // Suggest a few popular questions.
      const picks = [
        FAQ_DATA.categories[0].faqs[0],   // admission process
        FAQ_DATA.categories[4].faqs[0],   // placement cell
        FAQ_DATA.categories[3].faqs[0],   // hostel
      ];
      const list = document.createElement("div");
      list.className = "chip-list";
      picks.forEach((faq) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.textContent = faq.q;
        btn.addEventListener("click", () => {
          addMessage("user", faq.q);
          respond(faq, null);
        });
        list.appendChild(btn);
      });
      frag.appendChild(list);

      const cats = document.createElement("button");
      cats.type = "button";
      cats.className = "chip";
      cats.style.marginTop = "6px";
      cats.textContent = "⌂ Browse all categories";
      cats.addEventListener("click", () => addMessage("bot", buildCategoryGrid()));
      frag.appendChild(cats);

      return frag;
    });
  }

  // Route one typed/chipped query through greeting -> match -> fallback.
  function handleQuery(text) {
    const greeting = greetingReply(text);
    if (greeting) {
      botSay(() => {
        const frag = document.createDocumentFragment();
        const txt = document.createElement("span");
        txt.textContent = greeting.text;
        frag.appendChild(txt);
        if (greeting.showCategories) frag.appendChild(buildCategoryGrid());
        return frag;
      });
      return;
    }

    const hit = matchQuestion(text);
    if (hit) respond(hit.faq, hit.category);
    else fallbackReply();
  }

  function openCategory(catId) {
    const cat = FAQ_DATA.categories.find((c) => c.id === catId);
    if (!cat) return;
    botSay(() => buildQuestionList(cat));
  }

  /* ---------- widget open / close / minimize ---------- */

  function openWidget() {
    els.widget.classList.remove("is-hidden");
    els.launcher.hidden = true;
    els.launcher.setAttribute("aria-expanded", "true");
    setTimeout(() => els.input.focus(), 150);
    scrollToEnd();
  }

  function hideWidget() {
    els.widget.classList.add("is-hidden");
    els.launcher.hidden = false;
    els.launcher.setAttribute("aria-expanded", "false");
    els.launcher.focus();
  }

  /* ---------- three-dot menu ---------- */

  function toggleMenu(open) {
    const show = typeof open === "boolean" ? open : els.menu.hidden;
    els.menu.hidden = !show;
    els.menuBtn.setAttribute("aria-expanded", String(show));
  }

  function restartChat() {
    els.body.innerHTML = "";
    addMessage("bot", WELCOME_TEXT);
    addMessage("bot", buildCategoryGrid());
    toggleMenu(false);
  }

  /* ---------- events ---------- */

  function onSubmit(e) {
    e.preventDefault();
    const text = els.input.value.trim();
    if (!text) { els.input.focus(); return; }   // never send empty messages
    addMessage("user", text);
    els.input.value = "";
    els.input.focus();
    handleQuery(text);
  }

  function init() {
    // First conversation.
    addMessage("bot", WELCOME_TEXT);
    addMessage("bot", buildCategoryGrid());

    els.form.addEventListener("submit", onSubmit);
    els.launcher.addEventListener("click", openWidget);
    els.closeBtn.addEventListener("click", hideWidget);
    els.minBtn.addEventListener("click", hideWidget);

    els.menuBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
    document.addEventListener("click", (e) => {
      if (!els.menu.hidden && !e.target.closest(".menu-wrap")) toggleMenu(false);
    });

    els.menu.addEventListener("click", (e) => {
      const action = e.target.closest("button")?.dataset.action;
      if (action === "restart")   restartChat();
      if (action === "categories") { addMessage("bot", buildCategoryGrid()); toggleMenu(false); }
      if (action === "about") {
        addMessage("bot",
          "I'm a rule-based FAQ assistant for ADCET. I match your question against a built-in " +
          "knowledge base (admissions, fees, departments, hostel, placements, transport) — no " +
          "internet or AI key needed. Answers marked as sample are placeholders; please verify " +
          "fees, dates and policies with the college office.");
        toggleMenu(false);
      }
    });

    els.attachBtn.addEventListener("click", () => {
      addMessage("bot", "📎 File attachments aren't supported in this demo, but you can type your question and I'll answer it!");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
