import "dotenv/config";
import fs from "fs";
import path from "path";
import { storeVectorDocument } from "./rag";

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

async function seedVisaFiles() {
  const countries = ["Aus", "UK", "Germany", "USA"];
  const researchDir = path.join(process.cwd(), "Research", "Visa");

  console.log("🚀 Initializing Visa RAG Seeding...");

  for (const country of countries) {
    const filename = `${country}_Visa.txt`;
    const filePath = path.join(researchDir, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: File not found at ${filePath}`);
      continue;
    }

    console.log(`📖 Reading ${filename}...`);
    const content = fs.readFileSync(filePath, "utf-8");
    const chunks = chunkText(content);
    console.log(`🧩 Split ${filename} into ${chunks.length} chunks.`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `visa-${country.toLowerCase()}-chunk-${i + 1}`;
      const metadata = {
        title: `${country} Visa Guide (Part ${i + 1}/${chunks.length})`,
        category: "Visa",
        country: country === "Aus" ? "Australia" : country === "USA" ? "United States" : country === "UK" ? "United Kingdom" : "Germany",
        chunkIndex: i,
        totalChunks: chunks.length,
        uploadedAt: new Date().toISOString()
      };

      await storeVectorDocument(chunkId, chunks[i], metadata);
      console.log(`   Indexed chunk ${i + 1}/${chunks.length} for ${country}`);
    }
  }

  console.log("✅ Visa RAG Seeding complete!");
}

seedVisaFiles().catch(e => {
  console.error("❌ Error seeding visa files:", e);
  process.exit(1);
});
