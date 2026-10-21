"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, LoaderCircle, MessageCircle, Sparkles, X } from "lucide-react";
import { askAssistant } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const suggestions = [
  "Which laptop is best for coding?",
  "Best headphones under $400",
  "Compare two phones",
];

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  question: string | null;
}

export function ChatPanel({ open, onClose, question }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && question) setDraft(`Tell me about ${question}. Is it a good choice?`);
  }, [open, question]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading || message.length > 500) return;

    const previous = messages;
    setMessages([...previous, { role: "user", content: message }]);
    setDraft("");
    setError(null);
    setLoading(true);

    try {
      const answer = await askAssistant(message, previous);
      setMessages((current) => [...current, { role: "model", content: answer }]);
    } catch (err) {
      // Do not add failed requests to the conversation history.
      setMessages(previous);
      setDraft(message);
      setError(err instanceof Error ? err.message : "Unable to reach the assistant.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="chat-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="chat-panel" role="dialog" aria-modal="true" aria-label="AI shopping assistant">
        <header className="chat-header">
          <div className="chat-identity">
            <span className="chat-avatar"><Sparkles size={19} /></span>
            <div>
              <strong>Shopping assistant</strong>
              <span>Powered by Gemini · Product-aware</span>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close chat">
            <X size={20} />
          </button>
        </header>

        <div className="chat-scroll" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <span className="welcome-icon"><Bot size={26} /></span>
              <h3>How can I help you shop?</h3>
              <p>
                I can compare products in our catalog, explain features,
                and recommend the right tech for your budget.
              </p>
              <div className="suggestion-list">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    disabled={loading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((entry, index) => (
            <div
              className={`chat-bubble ${entry.role === "user" ? "bubble-user" : "bubble-ai"}`}
              key={`${index}-${entry.role}`}
            >
              <span>{entry.content}</span>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble bubble-ai typing">
              <LoaderCircle size={16} className="spin" /> Thinking...
            </div>
          )}
          {error && (
            <div className="chat-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="chat-compose"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <label className="sr-only" htmlFor="chat-input">Your shopping question</label>
          <input
            ref={inputRef}
            id="chat-input"
            value={draft}
            maxLength={500}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about any product..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !draft.trim()} aria-label="Send message">
            <ArrowUp size={19} />
          </button>
        </form>
        <p className="chat-note">
          <MessageCircle size={12} /> Answers are AI-generated; verify important details.
        </p>
      </aside>
    </div>
  );
}
