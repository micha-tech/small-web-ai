"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";

type Message = {
  id: number;
  role: "user" | "model";
  content: string;
};

type RequestState = "idle" | "waiting" | "streaming";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const endOfConversationRef = useRef<HTMLDivElement>(null);
  const isBusy = requestState !== "idle";

  useEffect(() => {
    endOfConversationRef.current?.scrollIntoView({
      behavior:
        requestState === "streaming" || messages.length <= 1 ? "auto" : "smooth",
    });
  }, [messages, requestState]);

  async function submitMessage(content: string) {
    const nextPrompt = content.trim();
    if (!nextPrompt || isBusy) {
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
    setRequestState("waiting");

    const assistantMessageId = Date.now() + 1;
    let streamedContent = "";
    let assistantMessageCreated = false;

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

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          result?.error || "Sentient AI could not respond just now.",
        );
      }

      if (!response.body) {
        throw new Error("Sentient AI returned an unreadable response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        const nextChunk = decoder.decode(value, { stream: !done });

        if (nextChunk) {
          streamedContent += nextChunk;

          if (!assistantMessageCreated) {
            assistantMessageCreated = true;
            setRequestState("streaming");
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                id: assistantMessageId,
                role: "model",
                content: streamedContent,
              },
            ]);
          } else {
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: streamedContent }
                  : message,
              ),
            );
          }
        }

        if (done) {
          break;
        }
      }

      if (!streamedContent.trim()) {
        throw new Error("Sentient AI did not return a text response.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sentient AI could not respond just now.";

      if (assistantMessageCreated) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: `${streamedContent}\n\nResponse interrupted. Please try again.`,
                }
              : message,
          ),
        );
      } else {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: assistantMessageId,
            role: "model",
            content: errorMessage,
          },
        ]);
      }
    } finally {
      setRequestState("idle");
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
            <Image
              alt="Sentient Engineering"
              className="brand-logo"
              height={279}
              preload
              src="/sentient-engineering-logo.png"
              width={1268}
            />
          </div>
          <button
            className="new-chat"
            disabled={isBusy}
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

      <section
        aria-busy={isBusy}
        aria-label="Conversation with Sentient AI"
        className="chat"
      >
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
            </section>
          ) : (
            <div className="messages" aria-live="polite">
              {messages.map((message, index) => (
                <article
                  className={`message message-${message.role} ${
                    requestState === "streaming" &&
                    index === messages.length - 1 &&
                    message.role === "model"
                      ? "message-streaming"
                      : ""
                  }`}
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

              {requestState === "waiting" && (
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
              disabled={!prompt.trim() || isBusy}
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
