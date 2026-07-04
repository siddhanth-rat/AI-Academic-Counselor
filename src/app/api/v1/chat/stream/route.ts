import { NextRequest } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Universal Agentic tools
async function executeToolCall(call: any) {
  const args = call.args || {};
  
  if (call.name === "query_crm_api") {
    return { 
      status: "success", 
      data: { name: "Alice", countryOfOrigin: "India", current_gpa: 3.8, budget_usd: 50000 } 
    };
  }
  
  if (call.name === "search_vector_store") {
    const q = (args.query || "").toLowerCase();
    if (q.includes("visa") || q.includes("uk")) {
      return { results: ["UK Student Visa (Tier 4) requires a CAS letter, proof of funds ($1,334/month for London), and a TB test."] };
    }
    if (q.includes("mba") || q.includes("fee")) {
      return { results: ["The average MBA tuition fee for top universities ranges from $40,000 to $75,000 per year."] };
    }
    // Return standard search confirmation so Gemini uses its extensive knowledge base
    return { results: [`Knowledge base searched for '${args.query}'. Provide detailed academic insights using established university parameters.`] };
  }
  
  if (call.name === "compare_universities") {
    const requestedUnis = args.universities || ["Requested University A", "Requested University B"];
    return {
      status: "success",
      message: `Compare the following universities in detail: ${requestedUnis.join(", ")}. Include rankings, tuition estimates, global reputation, and entry requirements.`
    };
  }
  
  if (call.name === "get_admission_policies") {
    return {
      policies: {
        ieltsWaiver: "Available if medium of instruction in Bachelor's was English (MOI certificate required).",
        depositDeadline: "31st May for Autumn intake.",
        scholarships: "Merit-based scholarships up to 50% tuition waiver automatically evaluated upon application."
      }
    };
  }
  return { error: "Unknown tool" };
}

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), { status: 400 });
    }

    const contents: any[] = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const systemInstruction = {
      role: "system",
      parts: [{
        text: "You are an expert Study Abroad Admission Counselor named 'AI Counselor'. You provide detailed, highly structured comparisons for any universities globally (e.g. NUS, NTU, Oxford, Harvard, MIT, etc.), explain admission policies, and assist students. Use markdown tables and lists. Format responses beautifully."
      }]
    };

    const tools: any[] = [{
      functionDeclarations: [
        {
          name: "query_crm_api",
          description: "Fetches user profile data from the CRM.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              student_id: { type: Type.STRING }
            }
          }
        },
        {
          name: "search_vector_store",
          description: "Searches institutional knowledge base for specific visa requirements or policies.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING }
            },
            required: ["query"]
          }
        },
        {
          name: "compare_universities",
          description: "Compares any universities globally by tuition, global rankings, programs, and GPA requirements.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              universities: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        },
        {
          name: "get_admission_policies",
          description: "Gets official admission policies regarding IELTS waivers, deposit deadlines, and scholarships.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              university: { type: Type.STRING }
            }
          }
        }
      ]
    }];

    const config: any = {
      systemInstruction,
      tools,
      temperature: 0.3,
    };

    // Use TransformStream to avoid "failed to pipe response" in Next.js
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendSSE = (data: string) => writer.write(encoder.encode(`data: ${data}\n\n`));

    // Run async work in the background; return readable immediately
    (async () => {
      try {
        if (!process.env.GEMINI_API_KEY) {
          const mockText = "Hello! I am the AI Counselor. My UI and streaming logic is ready! Please configure GEMINI_API_KEY in .env.";
          const words = mockText.split(" ");
          for (const word of words) {
            await new Promise(r => setTimeout(r, 50));
            await sendSSE(JSON.stringify({ text: word + " " }));
          }
          await sendSSE("[DONE]");
          await writer.close();
          return;
        }

        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents,
          config
        });

        let toolCalls: any[] = [];

        for await (const chunk of responseStream) {
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            toolCalls.push(...chunk.functionCalls);
          }
          if (chunk.text) {
            await sendSSE(JSON.stringify({ text: chunk.text }));
          }
        }

        if (toolCalls.length > 0) {
          const functionResponses = [];
          for (const call of toolCalls) {
            const result = await executeToolCall(call);
            functionResponses.push({ name: call.name, response: result });
          }

          contents.push({
            role: "model",
            parts: toolCalls.map(c => ({ functionCall: c }))
          });
          contents.push({
            role: "user",
            parts: functionResponses.map(r => ({ functionResponse: r }))
          });

          const secondStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents,
            config
          });

          for await (const chunk of secondStream) {
            if (chunk.text) {
              await sendSSE(JSON.stringify({ text: chunk.text }));
            }
          }
        }

        await sendSSE("[DONE]");
        await writer.close();
      } catch (err: any) {
        console.error("Stream error:", err);
        try {
          const isRateLimit = err?.status === 429 || JSON.stringify(err).includes("429") || JSON.stringify(err).includes("quota");
          const errorMsg = isRateLimit 
            ? "⚠️ **Gemini API Rate Limit Reached (429)**: The free tier quota was temporarily exceeded. Please wait a few seconds and send your message again!" 
            : `Error: ${err.message || "Unable to process request."}`;
          await sendSSE(JSON.stringify({ text: errorMsg }));
          await sendSSE("[DONE]");
          await writer.close();
        } catch {
          await writer.abort(err);
        }
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
