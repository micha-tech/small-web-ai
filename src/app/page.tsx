"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Message = {
  id: number;
  role: "user" | "model";
  content: string;
};

const suggestions = [
  {
    label: "Think through a decision",
    prompt:
      "Help me think through an important decision. Start by asking for the context and constraints.",
  },
  {
    label: "Create an action plan",
    prompt:
      "Help me turn an objective into a clear action plan. Ask me for the goal and timeline first.",
  },
  {
    label: "Summarize information",
    prompt:
      "Help me turn a set of information into a concise executive summary. Ask me to share the material.",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfConversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfConversationRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [isLoading, messages]);

  async function submitMessage(content: string) {
    const nextPrompt = content.trim();
    if (!nextPrompt || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: nextPrompt,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };

      const reply = result.message;
      if (!response.ok || !reply) {
        throw new Error(result.error || "Sentient AI could not respond just now.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { id: Date.now() + 1, role: "model", content: reply },
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now() + 1,
          role: "model",
          content:
            error instanceof Error
              ? error.message
              : "Sentient AI could not respond just now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(prompt);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(prompt);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              S
            </span>
            <div>
              <strong>Sentient AI</strong>
              <span>by Sentient Engineering</span>
            </div>
          </div>
          <button
            className="new-chat"
            onClick={() => {
              setMessages([]);
              setPrompt("");
            }}
            type="button"
          >
            <span aria-hidden="true">+</span>
            New chat
          </button>
        </div>
      </header>

      <section className="chat" aria-label="Conversation with Sentient AI">
        <div className="chat-inner">
          {messages.length === 0 ? (
            <section className="welcome" aria-labelledby="welcome-title">
              <span className="welcome-mark" aria-hidden="true">
                S
              </span>
              <h1 id="welcome-title">How can I help?</h1>
              <p>
                Ask a question, explore an idea, or work through something
                complex.
              </p>
              <div className="suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    onClick={() => void submitMessage(suggestion.prompt)}
                    type="button"
                  >
                    {suggestion.label}
                    <span aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div className="messages" aria-live="polite">
              {messages.map((message) => (
                <article
                  className={`message message-${message.role}`}
                  key={message.id}
                >
                  {message.role === "model" && (
                    <span className="message-avatar" aria-hidden="true">
                      S
                    </span>
                  )}
                  <div>
                    {message.role === "model" && <strong>Sentient AI</strong>}
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}

              {isLoading && (
                <article className="message message-model">
                  <span className="message-avatar" aria-hidden="true">
                    S
                  </span>
                  <div>
                    <strong>Sentient AI</strong>
                    <div className="thinking" aria-label="Sentient AI is thinking">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </article>
              )}
              <div ref={endOfConversationRef} />
            </div>
          )}
        </div>
      </section>

      <div className="composer-area">
        <form className="composer" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="prompt">
            Message Sentient AI
          </label>
          <textarea
            id="prompt"
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Message Sentient AI..."
            rows={1}
            value={prompt}
          />
          <div className="composer-footer">
            <span>Enter to send · Shift + Enter for a new line</span>
            <button
              aria-label="Send message"
              disabled={!prompt.trim() || isLoading}
              type="submit"
            >
              ↑
            </button>
          </div>
        </form>
        <p className="disclaimer">
          Sentient AI can make mistakes. Check important information.
        </p>
      </div>
    </main>
  );
}
