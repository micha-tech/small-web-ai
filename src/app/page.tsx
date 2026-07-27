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

const welcomeMessage: Message = {
  id: 0,
  role: "model",
  content:
    "Welcome to Sentient AI. I’m ready to help you analyze complex information, plan decisive action, and turn ambiguity into an operating advantage.",
};

const prompts = [
  {
    index: "01",
    title: "Analyze a complex decision",
    detail: "Surface tradeoffs, risks, and the strongest path forward.",
    prompt:
      "Help me analyze a complex decision. Start by asking me for the context, constraints, and desired outcome.",
  },
  {
    index: "02",
    title: "Build an operating plan",
    detail: "Turn an objective into milestones, owners, and next actions.",
    prompt:
      "Help me build an operating plan. Start by asking for the objective, timeline, stakeholders, and constraints.",
  },
  {
    index: "03",
    title: "Synthesize intelligence",
    detail: "Distill scattered information into a clear executive brief.",
    prompt:
      "Help me synthesize a set of information into an executive brief. Ask me to provide the source material first.",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfConversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfConversationRef.current?.scrollIntoView({
      behavior: messages.length > 2 ? "smooth" : "auto",
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

  function startNewConversation() {
    setMessages([welcomeMessage]);
    setPrompt("");
  }

  const hasStartedConversation = messages.length > 1;

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
          </div>
          <div className="brand-copy">
            <strong>SENTIENT AI</strong>
            <span>By Sentient Engineering</span>
          </div>
        </div>

        <button className="new-thread-button" onClick={startNewConversation}>
          <span className="button-icon" aria-hidden="true">
            +
          </span>
          <span>New conversation</span>
          <kbd>⌘ N</kbd>
        </button>

        <div className="rail-section">
          <p className="rail-label">System capabilities</p>
          <div className="capability-list">
            <div>
              <span className="capability-indicator" />
              <p>
                <strong>Strategic analysis</strong>
                <span>Decision support and synthesis</span>
              </p>
            </div>
            <div>
              <span className="capability-indicator" />
              <p>
                <strong>Operational planning</strong>
                <span>Structured plans and execution</span>
              </p>
            </div>
            <div>
              <span className="capability-indicator" />
              <p>
                <strong>Knowledge work</strong>
                <span>Research, writing, and reasoning</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rail-footer">
          <div className="rail-status">
            <span className="status-pulse" />
            <div>
              <strong>Runtime configured</strong>
              <span>Server-managed model access</span>
            </div>
          </div>
          <p>Sentient Engineering / SI-01</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="command-bar">
          <div className="mobile-brand">
            <div className="brand-mark" aria-hidden="true">
              <span />
            </div>
            <strong>SENTIENT AI</strong>
          </div>
          <div className="workspace-title">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>General intelligence</strong>
          </div>
          <div className="command-status">
            <span className="secure-badge">
              <span className="secure-dot" />
              Server key
            </span>
            <span className="session-id">SESSION / LIVE</span>
          </div>
        </header>

        <div className="conversation">
          <div className="conversation-inner">
            {!hasStartedConversation && (
              <section className="welcome-panel" aria-labelledby="welcome-title">
                <p className="eyebrow">
                  <span />
                  Sentient intelligence system
                </p>
                <h1 id="welcome-title">
                  Intelligence built
                  <br />
                  for consequential work.
                </h1>
                <p className="welcome-copy">
                  Reason through complexity, synthesize critical information,
                  and move from question to action with confidence.
                </p>
                <div className="prompt-grid">
                  {prompts.map((item) => (
                    <button
                      className="prompt-card"
                      key={item.index}
                      onClick={() => void submitMessage(item.prompt)}
                      type="button"
                    >
                      <span className="prompt-index">{item.index}</span>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                      <span className="prompt-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section
              className={`message-stream ${
                hasStartedConversation ? "message-stream-active" : ""
              }`}
              aria-live="polite"
              aria-label="Conversation with Sentient AI"
            >
              {messages.map((message) => (
                <article
                  className={`message-row message-${message.role}`}
                  key={message.id}
                >
                  <div className="message-identity">
                    {message.role === "model" ? (
                      <div className="sentient-avatar" aria-hidden="true">
                        <span />
                      </div>
                    ) : (
                      <div className="user-avatar" aria-hidden="true">
                        Y
                      </div>
                    )}
                    <div>
                      <strong>
                        {message.role === "model" ? "Sentient AI" : "You"}
                      </strong>
                      <span>
                        {message.role === "model" ? "Intelligence system" : "Operator"}
                      </span>
                    </div>
                  </div>
                  <div className="message-content">{message.content}</div>
                </article>
              ))}

              {isLoading && (
                <article className="message-row message-model">
                  <div className="message-identity">
                    <div className="sentient-avatar" aria-hidden="true">
                      <span />
                    </div>
                    <div>
                      <strong>Sentient AI</strong>
                      <span>Processing</span>
                    </div>
                  </div>
                  <div className="thinking-state" aria-label="Sentient AI is thinking">
                    <span />
                    <span />
                    <span />
                    <p>Reasoning through your request</p>
                  </div>
                </article>
              )}
              <div ref={endOfConversationRef} />
            </section>
          </div>
        </div>

        <div className="composer-zone">
          <form className="composer" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="prompt">
              Message Sentient AI
            </label>
            <textarea
              id="prompt"
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Ask Sentient AI to analyze, plan, or create…"
              rows={1}
              value={prompt}
            />
            <div className="composer-controls">
              <div className="composer-meta">
                <span>Gemini runtime</span>
                <span className="meta-divider" />
                <span>Server-side access</span>
              </div>
              <button
                aria-label="Send message"
                className="send-button"
                disabled={!prompt.trim() || isLoading}
                type="submit"
              >
                <span>Send</span>
                <span aria-hidden="true">↑</span>
              </button>
            </div>
          </form>
          <p className="composer-note">
            Sentient AI can make mistakes. Verify critical decisions and outputs.
          </p>
        </div>
      </section>
    </main>
  );
}
