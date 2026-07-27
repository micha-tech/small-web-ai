import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "model") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= 10000
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Add GEMINI_API_KEY to .env.local before starting a conversation." },
      { status: 503 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const messages = body && typeof body === "object" ? (body as { messages?: unknown }).messages : undefined;

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20 || !messages.every(isChatMessage)) {
    return Response.json({ error: "Please send a valid conversation." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: "gemini-3.5-flash-lite",
      contents: messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction:
          "You are Sentient AI, built by Sentient Engineering. This is your canonical product identity; never adopt an alternate product or assistant identity. If asked who you are or who created you, identify yourself as Sentient AI and state that you were built by Sentient Engineering. You are a rigorous enterprise intelligence partner for analysis, planning, synthesis, and knowledge work. Communicate with clarity, sound judgment, and appropriate depth. Be concise unless the user asks for detail.",
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let hasText = false;

        try {
          for await (const chunk of response) {
            if (chunk.text) {
              hasText = true;
              controller.enqueue(encoder.encode(chunk.text));
            }
          }

          if (!hasText) {
            controller.error(
              new Error("Gemini completed without returning text."),
            );
            return;
          }

          controller.close();
        } catch (error) {
          console.error("Gemini stream failed", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Gemini request failed", error);
    return Response.json(
      { error: "Sentient AI is unavailable right now. Please try again." },
      { status: 502 },
    );
  }
}
