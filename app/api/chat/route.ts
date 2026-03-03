import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.");
  }
  return key;
}

type ChatMessage = {
  role: "user" | "model" | "system";
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
  imageBase64?: string;
  imageMimeType?: string;
};

function toGeminiContent(m: ChatMessage): { role: "user" | "model"; parts: { text: string }[] } {
  return {
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const messages = body.messages ?? [];
    const imageBase64 = body.imageBase64?.trim();
    const imageMimeType = body.imageMimeType?.trim() || "image/jpeg";

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const hasText = lastUser?.content?.trim();
    const hasImage = imageBase64 && /^data:image\/\w+;base64,/.test(imageBase64)
      ? imageBase64.replace(/^data:image\/\w+;base64,/, "")
      : imageBase64;

    if (!lastUser || (!hasText && !hasImage)) {
      return new Response(
        JSON.stringify({ error: "Send a message and/or attach an image." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const textContent = hasText ? lastUser.content.trim() : "What do you see in this image?";
    const rawBase64 = hasImage && hasImage.length > 0
      ? (imageBase64!.startsWith("data:") ? imageBase64!.replace(/^data:[^;]+;base64,/, "") : imageBase64!)
      : null;

    const apiKey = getApiKey();
    const client = new GoogleGenerativeAI(apiKey);
    const modelId = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
    const model = client.getGenerativeModel({
      model: modelId,
      systemInstruction:
        "You're a woman talking to another woman in a private chat. Write like you're texting a friend—warm, real, and conversational. " +
        "Use 'I' and talk like a person: 'I get it,' 'honestly,' 'that sounds rough,' 'yeah no that's normal.' " +
        "No corporate or AI phrases: no 'I'd be happy to help,' 'Great question!,' 'Here are some tips,' or bullet lists. No sign-offs like 'Hope this helps!' " +
        "Keep it short (a few sentences). Sound like a supportive friend who's been through it, not a doctor or a customer-service bot. " +
        "You help with periods, vaginal discharge, PCOS, trying for pregnancy, early pregnancy worries, urinary tract infections (UTIs), and sexually transmitted infections (STIs/STDs). " +
        "For discharge, explain in plain language what is often normal vs. when it can mean an infection and what patterns to watch for. " +
        "For UTIs and STIs, gently explain symptoms, how they spread, and practical prevention (hydration, peeing after sex, barrier protection, regular testing, safer-sex habits) without shaming. " +
        "Give real, practical advice when you can: things that often help (heat, rest, tracking your cycle, diet tweaks, talking to someone), what other women do, what's worth trying at home, and what to bring up with a provider. Don't just say 'see a doctor' for everything. " +
        "Only suggest seeing a doctor when it's actually needed: worrying or unusual symptoms, need for diagnosis or treatment, or when they're asking something only a provider can answer. When you do, say it like a friend would—e.g. 'that's one of those things worth getting checked' or 'if it keeps up def see someone.' " +
        "Never diagnose or prescribe. Stay accurate, sex-positive, and kind. " +
        "If the user writes in a language other than English, reply in that same language so they can read it comfortably. " +
        "Script and romanization: If the user writes in romanized form (Latin/English letters only, e.g. 'tumi kemon acho', 'aap kaise ho', 'delhi me konse gynae ache he'), always reply in that same language using romanized form (Latin letters)—do not switch to the native script (e.g. do not reply in Bengali or Devanagari script). If they use the native script, reply in that script. " +
        "Important: Match the language of the user's current (latest) message. If they switch language mid-conversation (e.g. from Bengali to Hindi, or from Hindi to English), switch with them and reply in the new language. " +
        "Interpret what the user means even when they make spelling mistakes, use transliteration, or write casually (e.g. 'cigarrete', 'thikachi', 'hochena'). Respond to their intent, not to the exact spelling. " +
        "When users ask for doctor or gynecologist recommendations in a city (in any language, e.g. 'kolkata te bhalo gyno'), the app may show them real options—do not say you cannot recommend or name doctors; if they have set a location or mentioned a city, they will get help from the app.",
    });

    // Send full conversation history so the model keeps the same language and context.
    type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
    type ContentTurn = { role: "user" | "model"; parts: Part[] };

    const contents: ContentTurn[] = [];
    const historyMessages = messages.slice(0, -1);
    for (const m of historyMessages) {
      contents.push({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content?.trim() || "(empty)" }],
      });
    }

    const lastUserParts: Part[] =
      rawBase64 && imageMimeType
        ? [
            { inlineData: { mimeType: imageMimeType, data: rawBase64 } },
            { text: textContent },
          ]
        : [{ text: textContent }];
    contents.push({ role: "user", parts: lastUserParts });

    const result = await model.generateContent({ contents: contents as never });

    const reply =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "Sorry, I couldn't generate a response right now.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Gemini chat error:", message, error);

    const isDev = process.env.NODE_ENV === "development";
    const userMessage =
      message.includes("GEMINI_API_KEY") || message.includes("API key")
        ? message
        : isDev
          ? message
          : "Unexpected error while contacting the chatbot.";

    return new Response(
      JSON.stringify({ error: userMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

