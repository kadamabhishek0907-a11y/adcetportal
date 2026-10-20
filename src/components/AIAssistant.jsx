import { useState } from "react";

// Same-origin: the FAQ endpoint ships as a Vercel serverless function in api/ask.js.
const API_URL = "";
const API_BASE = API_URL ? API_URL.replace(/\/$/, "") : ""; // "" -> call /api/ask on this same origin

const LOADING_TEXT = "…";

// Quick-start questions shown as clickable chips.
const SUGGESTED_QUESTIONS = [
  "What courses are offered at ADCET?",
  "How can I apply for admission?",
  "Is ADCET NAAC accredited?",
  "Does ADCET provide placements?",
  "Are hostel facilities available?",
];

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm the ADCET FAQ Assistant. Ask me anything about admissions, courses, hostel, placements or campus life.",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const askQuestion = async (question) => {
    if (!question || isLoading) return;

    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { text: LOADING_TEXT, sender: "bot", pending: true }]);

    try {
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.pending
            ? {
                ...m,
                pending: false,
                text: data.answer,
                category: data.matched ? data.matched_faq?.category : undefined,
              }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.pending
            ? {
                ...m,
                pending: false,
                text: "Sorry, the AI service is temporarily unavailable. Please try again later.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => askQuestion(input.trim());

  return (
    <>
      <button className="ai-widget-button" onClick={() => setIsOpen(!isOpen)}>
        🤖 {isOpen ? "Close AI" : "Ask ADCET AI"}
      </button>

      {isOpen && (
        <div className="ai-chat-box">
          <div className="chat-header">
            <span>ADCET FAQ Assistant</span>
            <span style={{ cursor: "pointer" }} onClick={() => setIsOpen(false)}>✕</span>
          </div>
          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  textAlign: msg.sender === "user" ? "right" : "left",
                  margin: "8px 0",
                }}
              >
                <span
                  style={{
                    background: msg.sender === "user" ? "#0284c7" : "#e2e8f0",
                    color: msg.sender === "user" ? "white" : "#1e293b",
                    padding: "6px 12px",
                    borderRadius: "12px",
                    display: "inline-block",
                    maxWidth: "80%",
                    opacity: msg.pending ? 0.6 : 1,
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.text === LOADING_TEXT ? "ADCET AI is thinking…" : msg.text}
                  {msg.category && (
                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        fontSize: "11px",
                        color: "#64748b",
                      }}
                    >
                      📁 {msg.category}
                    </span>
                  )}
                </span>
              </div>
            ))}

            {/* Suggested questions: shown under the welcome message */}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => askQuestion(q)}
                    disabled={isLoading}
                    style={{
                      background: "#f0f9ff",
                      color: "#0369a1",
                      border: "1px solid #bae6fd",
                      borderRadius: "14px",
                      padding: "5px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistant;
