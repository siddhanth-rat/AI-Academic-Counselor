import "dotenv/config";
import { searchVectorStore } from "./rag";

async function runTest() {
  const testQueries = [
    "National Insurance Number right to work share code",
    "Ausbildung vocational visa B1 German monthly salary",
    "F1 visa 221g TAL triggers travel warning",
    "subclass 485 age 35 limitation"
  ];

  console.log("🔍 Testing RAG Semantic Search (pgvector + Gemini Embeddings)...");

  for (const query of testQueries) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`❓ Query: "${query}"`);
    console.log(`------------------------------------------------------------`);

    const results = await searchVectorStore(query, 2);

    if (results.length === 0) {
      console.log("❌ No matching chunks found.");
    } else {
      results.forEach((text, i) => {
        console.log(`\n✨ Match #${i + 1}:`);
        console.log(text.slice(0, 400) + (text.length > 400 ? "..." : ""));
      });
    }
  }
}

runTest().catch(console.error);
