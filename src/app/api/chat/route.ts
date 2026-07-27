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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction: "You are MICHAEL, a thoughtful, clear, and helpful conversational AI. Be concise unless the user asks for depth.",
      },
    });

    if (!response.text) {
      return Response.json({ error: "Michael did not return a text response. Please try again." }, { status: 502 });
    }

    return Response.json({ message: response.text });
  } catch (error) {
    console.error("Gemini request failed", error);
    return Response.json({ error: "Michael is unavailable right now. Please try again." }, { status: 502 });
  }
}
