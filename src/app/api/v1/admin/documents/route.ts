import { NextRequest } from "next/server";
import { storeVectorDocument } from "@/lib/rag";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logSystemAction } from "@/lib/audit";

// Helper to chunk text into paragraphs / sections for vector storage
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const p of paragraphs) {
    if ((currentChunk + "\n\n" + p).length > maxChunkSize) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = p;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${p}` : p;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks.length > 0 ? chunks : [text.slice(0, maxChunkSize)];
}

/** Extract plain text from a buffer based on file type */
async function extractText(buffer: Buffer, strategy: string): Promise<string> {
  if (strategy === "txt") {
    return buffer.toString("utf-8");
  }

  if (strategy === "pdf") {
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
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let category = "General";
    let fullText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = (formData.get("title") as string) || (file?.name || "Uploaded Document");
      category = (formData.get("category") as string) || "General";
      const manualText = (formData.get("text") as string) || "";

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        let strategy = "txt";
        if (file.type === "application/pdf") {
          strategy = "pdf";
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          strategy = "docx";
        }
        const extractedText = await extractText(buffer, strategy);
        // Clean up unprintable characters if binary/pdf plain text extraction
        fullText = extractedText.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ");
      } else {
        fullText = manualText;
      }
    } else {
      const body = await req.json();
      title = body.title || "Untitled Document";
      category = body.category || "General";
      fullText = body.text || "";
    }

    if (!fullText || !fullText.trim()) {
      return new Response(JSON.stringify({ error: "No text content found in document or file attachment" }), { status: 400 });
    }

    const chunks = chunkText(fullText.trim());
    const timestamp = Date.now();

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `doc-${timestamp}-chunk-${i + 1}`;
      const metadata = {
        title: chunks.length > 1 ? `${title} (Part ${i + 1}/${chunks.length})` : title,
        category,
        chunkIndex: i,
        totalChunks: chunks.length,
        uploadedAt: new Date().toISOString()
      };
      await storeVectorDocument(chunkId, chunks[i], metadata);
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
    await logSystemAction({
      actorId: user.id,
      actionType: "UPLOAD_DOCUMENT",
      targetEntity: title,
      ipAddress,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully indexed "${title}" into ${chunks.length} vector chunk(s)!`,
      chunksCount: chunks.length
    }), { status: 200 });

  } catch (error: any) {
    console.error("Document upload error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed to process document attachment" }), { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const documents: Array<{ id: string; metadata: any }> = await prisma.$queryRaw`
      SELECT id, metadata FROM "VectorKnowledgeBase" LIMIT 50;
    `;
    const formatted = documents.map(doc => {
      const meta = typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata;
      return {
        id: doc.id,
        title: meta.title || "Document Chunk",
        text: meta.text || "",
        category: meta.category || "General"
      };
    });
    return new Response(JSON.stringify({ documents: formatted }), { status: 200 });
  } catch (error: any) {
    console.error("Get documents error:", error);
    return new Response(JSON.stringify({ documents: [] }), { status: 200 });
  }
}
