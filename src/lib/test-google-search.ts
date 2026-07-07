import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await (ai.models as any).list();
    const list = res.models || [];
    console.log("Gemini models found:");
    for (const m of list) {
      if (m.name.includes("gemini")) {
        console.log(`- ${m.name}`);
      }
    }
  } catch (err: any) {
    console.error("Error:", err);
  }
}
main();
