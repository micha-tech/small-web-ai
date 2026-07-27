"use client";

import { FormEvent, useState } from "react";

type Message = {
  id: number;
  role: "user" | "model";
  content: string;
};

const welcomeMessage: Message = {
  id: 0,
  role: "model",
  content: "Hello. I am Michael. What would you like to explore?",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = prompt.trim();
    if (!content || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content,
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
        throw new Error(result.error || "Michael could not respond just now.");
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
              : "Michael could not respond just now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-svh bg-[#f4f5f1] px-4 py-5 text-[#17221c] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-3xl flex-col rounded-[2rem] border border-[#d9ded6] bg-[#fbfcf9] shadow-[0_22px_70px_rgba(28,44,34,0.08)] sm:min-h-[calc(100svh-4rem)]">
        <header className="flex items-center justify-between border-b border-[#e1e5dd] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#1f4d38] font-serif text-xl text-[#f7f2e8]">
              M
            </div>
            <div>
              <h1 className="font-serif text-2xl leading-none tracking-tight">MICHAEL</h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-[#68736c]">
                Gemini conversation
              </p>
            </div>
          </div>
          <span className="flex items-center gap-2 text-sm text-[#587061]">
            <span className="size-2 rounded-full bg-[#6b9b70]" />
            Online
          </span>
        </header>

        <section className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-8 sm:px-12 sm:py-10" aria-live="polite">
          {messages.map((message) => (
            <article
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              key={message.id}
            >
              {message.role === "model" && (
                <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#dbe8da] font-serif text-sm text-[#29533e]">
                  M
                </div>
              )}
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-6 sm:max-w-[75%] ${
                  message.role === "user"
                    ? "rounded-tr-sm bg-[#1f4d38] text-white"
                    : "rounded-tl-sm bg-[#edf0eb] text-[#263129]"
                }`}
              >
                {message.content}
              </div>
            </article>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#dbe8da] font-serif text-sm text-[#29533e]">
                M
              </div>
              <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-[#edf0eb] px-4 py-4" aria-label="Michael is thinking">
                <span className="size-1.5 animate-bounce rounded-full bg-[#738278] [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-[#738278] [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-[#738278]" />
              </div>
            </div>
          )}
        </section>

        <form className="border-t border-[#e1e5dd] p-4 sm:p-5" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="prompt">
            Message Michael
          </label>
          <div className="flex items-end gap-3 rounded-2xl border border-[#cfd7cd] bg-white p-2 pl-4 focus-within:border-[#5c8265] focus-within:ring-2 focus-within:ring-[#dce9dc]">
            <textarea
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 outline-none placeholder:text-[#849088]"
              id="prompt"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask Michael anything..."
              rows={1}
              value={prompt}
            />
            <button
              aria-label="Send message"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1f4d38] text-white transition hover:bg-[#163b2b] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!prompt.trim() || isLoading}
              type="submit"
            >
              <svg aria-hidden="true" fill="none" height="19" viewBox="0 0 24 24" width="19">
                <path d="m5 12 14-7-5 14-2-5-5-2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
          <p className="px-1 pt-3 text-center text-xs text-[#7a857d]">MICHAEL can make mistakes. Check important information.</p>
        </form>
      </div>
    </main>
  );
}
