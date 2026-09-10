import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    // System prompt for workforce assistant
    const systemPrompt = `You are an AI assistant for workforce management.
    
You help workers with:
- Shift schedules and timings
- Time-off requests
- Payroll questions
- Policy questions
- Contact information

Current context:
${JSON.stringify(context, null, 2)}

Rules:
- Be professional and helpful
- If you don't know, say "Let me connect you with HR"
- Don't make up information
- Keep responses concise (2-3 sentences)

Worker question: ${message}`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: systemPrompt,
    });

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("AI Agent Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}