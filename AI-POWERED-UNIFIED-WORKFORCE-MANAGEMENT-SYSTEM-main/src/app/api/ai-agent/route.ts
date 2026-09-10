import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getTrainingText } from "@/lib/workforce-training-data";

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is missing from environment variables (.env.local)" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an AI assistant for workforce management at SecureGuard Property Services.

${getTrainingText()}

Current worker context:
${JSON.stringify(context, null, 2)}

Rules:
- Be professional and helpful
- If you don't know, say "Let me connect you with HR"
- Don't make up information
- Keep responses concise (2-3 sentences)

Worker question: ${message}`;

    const { text } = await generateText({
      model: google("gemini-3.6-flash"),
      prompt: systemPrompt,
    });

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error("AI Agent Catch Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process request" },
      { status: 500 }
    );
  }
}