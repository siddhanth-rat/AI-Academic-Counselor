/**
 * /api/v1/chat/file/route.ts
 *
 * Ephemeral file-context chat endpoint.
 *
 * PRIVACY GUARANTEES:
 * - File binary and extracted text live only in this request's memory scope.
 * - No file, filename, or extracted text is written to disk or database.
 * - If PII is detected, the buffer is cleared and a 422 is returned immediately.
 * - After streaming, all references fall out of scope and are garbage-collected.
 */

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { scanForPii } from "@/lib/pii-scanner";
import { runWithRetry, runWithModelsAndRetry } from "@/lib/gemini";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CONTEXT_CHARS = 12000; // ~3,000 tokens — enough for a transcript

/** Accepted MIME types → extraction strategy */
const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

// Fallback model list (same as stream route)
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];

export const runtime = "nodejs";

/** Extract plain text from a buffer based on file type */
async function extractText(buffer: Buffer, strategy: string): Promise<string> {
  if (strategy === "txt") {
    return buffer.toString("utf-8");
  }

  if (strategy === "pdf") {
    // Dynamic import — avoids bundling issues in Next.js edge runtime
    // @ts-ignore - Internal path lacks type definitions, but we cast it immediately below
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (strategy === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type.");
}

export async function POST(req: NextRequest) {
  let fileBuffer: Buffer | null = null;
  let extractedText: string | null = null;

  try {
    const authSession = await auth();
    if (!authSession || !authSession.user || !authSession.user.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { email: authSession.user.email }
    });

    if (profile) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const messageCount = await prisma.message.count({
        where: {
          session: { user_id: profile.id },
          sender_type: "USER",
          created_at: { gte: oneDayAgo }
        }
      });
      if (messageCount >= 100) {
        return new Response(
          JSON.stringify({ error: "Daily message limit reached. You can send up to 100 messages every 24 hours." }),
          { status: 429 }
        );
      }
    }

    // ── 1. Parse multipart form data ───────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const messagesRaw = formData.get("messages") as string | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided." }), { status: 400 });
    }

    if (!messagesRaw) {
      return new Response(JSON.stringify({ error: "No messages provided." }), { status: 400 });
    }

    let messages: Array<{ role: string; content: string }>;
    try {
      messages = JSON.parse(messagesRaw);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid messages format." }), { status: 400 });
    }

    // ── 2. Validate file size ──────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` }),
        { status: 413 }
      );
    }

    // ── 3. Validate file type ──────────────────────────────────────────────
    const strategy = ACCEPTED_TYPES[file.type];
    if (!strategy) {
      return new Response(
        JSON.stringify({ error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." }),
        { status: 415 }
      );
    }

    // ── 4. Read into memory buffer (never written to disk) ─────────────────
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);

    // ── 5. Extract text ────────────────────────────────────────────────────
    extractedText = await extractText(fileBuffer, strategy);

    // Clear the binary buffer immediately — we only need text from here
    fileBuffer.fill(0); // Overwrite bytes before releasing reference
    fileBuffer = null;

    if (!extractedText || extractedText.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Could not extract readable text from this file. Is it a scanned image PDF?" }),
        { status: 422 }
      );
    }

    // ── 6. PII Scan ────────────────────────────────────────────────────────
    const piiResult = scanForPii(extractedText);

    if (!piiResult.clean) {
      // Immediately overwrite and clear the extracted text
      extractedText = null;

      const typeList = piiResult.detectedTypes.join(", ");
      return new Response(
        JSON.stringify({
          error: `File rejected — personal information detected`,
          detectedTypes: piiResult.detectedTypes,
          message: `We detected the following in your document: **${typeList}**. For your privacy and security, this file has not been processed or stored anywhere. Please remove any personal identifiers and try again.`,
        }),
        { status: 422 }
      );
    }

    // ── 7. Truncate to safe context window ────────────────────────────────
    const contextText = extractedText.slice(0, MAX_CONTEXT_CHARS);
    extractedText = null; // Release full text — we only keep the truncated slice

    // ── 7.5. Automated Student Checklist Verification ─────────────────────
    if (sessionId && process.env.GEMINI_API_KEY) {
      // Execute database update in background to not block stream startup
      (async () => {
        try {
          const { prisma } = await import("@/lib/prisma");
          const chatSession = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { user_id: true }
          });

          if (chatSession && chatSession.user_id) {
            const classification = await runWithRetry((ai) =>
              ai.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: `Analyze this text excerpt from a student's uploaded document. Is it a Statement of Purpose (SOP) or a Resume/CV/Bio-data? Respond with exactly one of these words: 'SOP', 'RESUME', or 'OTHER'. Do not output any other punctuation, reasoning, or markdown. Text:\n"${contextText.slice(0, 4000)}"`,
              })
            );
            
            const resultStr = (classification.text || "").trim().toUpperCase();
            
            if (resultStr.includes("SOP")) {
              await prisma.studentProfile.update({
                where: { user_id: chatSession.user_id },
                data: { sop_uploaded: true }
              });
              console.log(`[Checklist Auto-Update] Set sop_uploaded = true for student ${chatSession.user_id}`);
            } else if (resultStr.includes("RESUME")) {
              await prisma.studentProfile.update({
                where: { user_id: chatSession.user_id },
                data: { resume_uploaded: true }
              });
              console.log(`[Checklist Auto-Update] Set resume_uploaded = true for student ${chatSession.user_id}`);
            }
          }
        } catch (classifyErr) {
          console.error("[Checklist Auto-Update] Classification failed:", classifyErr);
        }
      })();
    }

    const fileName = file.name;

    // ── 8. Build Gemini contents ───────────────────────────────────────────
    const systemInstruction = {
      role: "system",
      parts: [{
        text: `You are "AI Counselor", a Study Abroad Admission Assistant. You ONLY answer questions that directly concern:
- University selection, rankings, and admissions (GPA, IELTS, deadlines, requirements)
- Tuition fees, scholarships, and financial aid for studying abroad
- Student visa applications and requirements
- Academic program selection and eligibility
- Connecting students to human counselors

The student has attached a document titled "${fileName}". Use the content below ONLY to answer admissions-related questions. Do not reference any personal details you see. Focus on academic results, grades, qualifications, and how they relate to university requirements.

DOCUMENT CONTENT (ephemeral — do not repeat verbatim):
---
${contextText}
---

HARD RULES:
- Do not repeat, quote, or summarise personal details from the document (names, dates, IDs, addresses).
- Only use the document to answer study-abroad admissions questions.
- If the document contains off-topic content, ignore it and redirect to admissions topics.
- Refuse any requests unrelated to education, visas, or university applications.`
      }]
    };

    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // ── 9. Stream from Gemini ──────────────────────────────────────────────
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const sendSSE = (data: string) => writer.write(encoder.encode(`data: ${data}\n\n`));

    if (!process.env.GEMINI_API_KEY) {
      await sendSSE(JSON.stringify({ text: "File received and processed. GEMINI_API_KEY not configured." }));
      await sendSSE("[DONE]");
      await writer.close();
      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    (async () => {
      try {
        // Stream from Gemini with automatic key rotation, model fallback, and retry backoff
        const stream = await runWithModelsAndRetry(
          CANDIDATE_MODELS,
          (ai, modelName) =>
            ai.models.generateContentStream({
              model: modelName,
              config: { systemInstruction, temperature: 0.2 },
              contents,
            })
        );

        for await (const chunk of stream) {
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            await sendSSE(JSON.stringify({ text }));
          }
        }

        await sendSSE("[DONE]");
      } catch (err: any) {
        await sendSSE(JSON.stringify({ text: `\n\n⚠️ Error processing document: ${err?.message ?? "Unknown error"}` }));
        await sendSSE("[DONE]");
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (err: any) {
    // Ensure buffers are cleared even on unexpected errors
    if (fileBuffer) { fileBuffer.fill(0); fileBuffer = null; }
    extractedText = null;

    console.error("[file/route] Unexpected error:", err?.message);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unexpected server error." }),
      { status: 500 }
    );
  }
}
