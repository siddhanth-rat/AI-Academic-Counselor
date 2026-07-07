import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateEmbedding } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const query = String(body.query || "").trim();
    if (!query) {
      return NextResponse.json({ error: "Query string is required" }, { status: 400 });
    }

    const embedding = await generateEmbedding(query);
    if (!embedding.length) {
      return NextResponse.json({ error: "Could not generate vector embedding" }, { status: 500 });
    }

    const isMock = embedding.every(v => v === 0);
    let results: Array<{ id: string; metadata: any; similarity: number }> = [];

    if (isMock) {
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (keywords.length > 0) {
        const conditions = keywords.map((_, idx) => `(metadata->>'text') ILIKE $${idx + 1}`);
        const sqlQuery = `
          SELECT id, metadata, 1.0 AS similarity
          FROM "VectorKnowledgeBase"
          WHERE ${conditions.join(" AND ")}
          LIMIT 10;
        `;
        results = await prisma.$queryRawUnsafe(sqlQuery, ...keywords.map(k => `%${k}%`));
      } else {
        results = await prisma.$queryRaw`
          SELECT id, metadata, 1.0 AS similarity
          FROM "VectorKnowledgeBase"
          LIMIT 10;
        `;
      }
    } else {
      const vectorStr = `[${embedding.join(",")}]`;
      results = await prisma.$queryRaw`
        SELECT id, metadata, 1 - (embedding <=> ${vectorStr}::vector) AS similarity
        FROM "VectorKnowledgeBase"
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT 10;
      `;
    }

    const formatted = results.map(r => {
      const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
      return {
        id: r.id,
        similarity: parseFloat(r.similarity.toString()),
        text: meta.text || "",
        title: meta.title || "Untitled Chunk",
        category: meta.category || "General",
        country: meta.country || null,
      };
    });

    return NextResponse.json({ results: formatted });
  } catch (error: any) {
    console.error("RAG Playground query error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
