import { prisma } from "@/lib/prisma";
import { runWithRetry } from "@/lib/gemini";

// Track API rate-limiting status globally to speed up multi-chunk uploads
let globalEmbeddingRateLimitActive = false;
let rateLimitResetTime = 0;

export async function generateEmbedding(text: string): Promise<number[]> {
  const now = Date.now();
  if (globalEmbeddingRateLimitActive && now < rateLimitResetTime) {
    // Return mock vector if we are in cooldown
    return new Array(768).fill(0);
  }

  try {
    const response = await runWithRetry((ai) =>
      ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: { outputDimensionality: 768 }
      })
    );
    const res = response as any;
    return res.embedding?.values || res.embeddings?.[0]?.values || [];
  } catch (err: any) {
    const status = err?.status ?? err?.httpErrorCode ?? 0;
    const errStr = JSON.stringify(err) + " " + (err?.message || "");
    const isRateLimit =
      status === 429 ||
      errStr.includes("429") ||
      errStr.includes("quota") ||
      errStr.includes("rate limit") ||
      errStr.includes("RESOURCE_EXHAUSTED");

    if (isRateLimit) {
      console.warn("[RAG] Gemini embedding rate-limited. Activating cooldown and returning mock vector.");
      globalEmbeddingRateLimitActive = true;
      rateLimitResetTime = Date.now() + 60 * 1000; // Cooldown for 1 minute
      return new Array(768).fill(0);
    }

    console.error("Failed to generate embedding after retries:", err);
    throw err;
  }
}

export async function storeVectorDocument(id: string, text: string, metadata: Record<string, any> = {}) {
  const embedding = await generateEmbedding(text);
  if (!embedding.length) return;
  const vectorStr = `[${embedding.join(",")}]`;
  const metaJson = JSON.stringify({ text, ...metadata });

  await prisma.$executeRaw`
    INSERT INTO "VectorKnowledgeBase" (id, embedding, metadata)
    VALUES (${id}, ${vectorStr}::vector, ${metaJson}::jsonb)
    ON CONFLICT (id) DO UPDATE
    SET embedding = EXCLUDED.embedding, metadata = EXCLUDED.metadata;
  `;
}

export async function searchVectorStore(query: string, limit: number = 3) {
  try {
    const embedding = await generateEmbedding(query);
    if (!embedding.length) {
      return ["Vector store search unavailable (Missing GEMINI_API_KEY)."];
    }

    const isMock = embedding.every(v => v === 0);

    if (isMock) {
      console.log(`[RAG] Query embedding is mock. Performing keyword search for: "${query}"`);
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      if (keywords.length > 0) {
        const conditions = keywords.map((_, idx) => `(metadata->>'text') ILIKE $${idx + 1}`);
        const sqlQuery = `
          SELECT id, metadata, 1.0 AS similarity
          FROM "VectorKnowledgeBase"
          WHERE ${conditions.join(" AND ")}
          LIMIT ${limit};
        `;
        const results: any[] = await prisma.$queryRawUnsafe(sqlQuery, ...keywords.map(k => `%${k}%`));
        if (results && results.length > 0) {
          return results.map(r => {
            const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
            return meta.text || JSON.stringify(meta);
          });
        }
      }
      
      const results: any[] = await prisma.$queryRaw`
        SELECT id, metadata, 1.0 AS similarity
        FROM "VectorKnowledgeBase"
        LIMIT ${limit};
      `;
      return results.map(r => {
        const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
        return meta.text || JSON.stringify(meta);
      });
    }

    const vectorStr = `[${embedding.join(",")}]`;

    const results: Array<{ id: string; metadata: any; similarity: number }> = await prisma.$queryRaw`
      SELECT id, metadata, 1 - (embedding <=> ${vectorStr}::vector) AS similarity
      FROM "VectorKnowledgeBase"
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit};
    `;

    if (!results || results.length === 0) {
      return [];
    }

    return results.map(r => {
      const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
      return meta.text || JSON.stringify(meta);
    });
  } catch (err) {
    console.error("Error searching vector store:", err);
    return [];
  }
}
