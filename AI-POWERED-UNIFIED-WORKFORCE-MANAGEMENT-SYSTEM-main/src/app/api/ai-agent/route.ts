import { NextRequest, NextResponse } from "next/server";
import { generateText, isStepCount, tool } from "ai";
import { google } from "@ai-sdk/google";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { text } = await generateText({
      model: google("gemini-3.6-flash"),
      prompt: `You are APEX, an AI assistant for SecureGuard Property Services.
Worker Context: ${JSON.stringify(context || {})}

User Message: ${message}`,
      tools: {
        sendEmail: tool({
          description: "Send an actual email to a specified recipient using Resend.",
          inputSchema: z.object({
            to: z.email().describe("Recipient's email address"),
            subject: z.string().describe("Subject line of the email"),
            body: z.string().describe("Main body content of the email"),
          }),
          execute: async ({ to, subject, body }: { to: string; subject: string; body: string }) => {
            try {
              const data = await resend.emails.send({
                from: "onboarding@resend.dev",
                to: [to],
                subject,
                html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
              });

              return {
                success: true,
                messageId: data.data?.id,
                details: `Email delivered to ${to}`,
              };
            } catch (err: unknown) {
              console.error("Resend API Error:", err);
              const message = err instanceof Error ? err.message : "Failed to send email";
              return {
                success: false,
                error: message,
              };
            }
          },
        }),
      },
      stopWhen: isStepCount(5),
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
