import { storeVectorDocument } from "./rag";

export async function seedInitialKnowledgeBase() {
  const sampleDocs = [
    {
      id: "doc-1",
      text: "UK Student Visa (Tier 4) requires a CAS letter from an approved sponsor, proof of funds (£1,334 per month for living in London, or £1,023 per month outside London), and a TB test certificate if applicable.",
      metadata: { category: "visa", country: "UK" }
    },
    {
      id: "doc-2",
      text: "Standard MBA tuition fees for top international universities range between $40,000 and $85,000 annually. Most universities require 2-3 years of work experience and GRE/GMAT scores.",
      metadata: { category: "tuition", program: "MBA" }
    },
    {
      id: "doc-3",
      text: "Language proficiency requirements: Most English-speaking universities require an IELTS minimum overall band score of 6.5 (with no individual module below 6.0) or TOEFL iBT minimum score of 90.",
      metadata: { category: "admissions", test: "IELTS/TOEFL" }
    }
  ];

  console.log("Seeding initial RAG documents into VectorKnowledgeBase...");
  for (const doc of sampleDocs) {
    await storeVectorDocument(doc.id, doc.text, doc.metadata);
    console.log(`Indexed document: ${doc.id}`);
  }
  console.log("RAG Seeding complete!");
}
