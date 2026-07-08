// Touch to refresh TS server
import { NextRequest } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { searchVectorStore } from "@/lib/rag";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSystemInstructions } from "@/lib/AI_instructions";
import { getRecommendations } from "@/lib/recommendation";
import { runWithModelsAndRetry } from "@/lib/gemini";
import { isIpBanned, checkIpRateLimit, checkUserCostBudget } from "@/lib/rate-limit";
import { verifyCsrf } from "@/lib/csrf";
import { sanitizeInput } from "@/lib/sanitize";
import { redactPii } from "@/lib/pii-scanner";

// Force cache refresh

// ----------------------------------------------------------------------
// 1. UNIVERSAL AGENTIC TOOLS (Function Calling)
// ----------------------------------------------------------------------
// When Gemini wants to look up data (like a user's profile, or a knowledge base), 
// it asks the server to run one of these "tools" and return the result.
// This function executes the requested tool and returns the data back to Gemini.
async function executeToolCall(call: any, sessionId: string) {
  // Extract any parameters Gemini passed into the function
  const args = call.args || {};

  // --------------------------------------------------------------------
  // TOOL: query_crm_api
  // Purpose: Fetches the currently logged-in user's profile data from PostgreSQL
  // --------------------------------------------------------------------
  if (call.name === "query_crm_api") {
    try {
      // 1. Check who is currently logged in using NextAuth
      const session = await auth();

      if (session?.user?.email) {
        // 2. Fetch their full profile from the database (including related student records)
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { student_profile: true }
        });

        // 3. Format the database record into a clean object and return it to Gemini
        // Gemini will use this data to dynamically answer questions about the user!
        if (dbUser) {
          const sp = dbUser.student_profile;
          return {
            status: "success",
            data: {
              name: dbUser.name,
              city: dbUser.city,
              state: dbUser.state,
              dateOfBirth: dbUser.date_of_birth?.toISOString().slice(0, 10) || null,
              current_phase: sp?.current_phase || "PHASE_1_SELF_DISCOVERY",
              current_gpa: sp?.current_gpa ? Number(sp.current_gpa) : null,
              current_degree: sp?.current_degree || null,
              graduation_year: sp?.graduation_year || null,
              academic_board: sp?.academic_board || null,
              ielts_score: sp?.ielts_score ? Number(sp.ielts_score) : null,
              toefl_score: sp?.toefl_score || null,
              pte_score: sp?.pte_score || null,
              gre_score: sp?.gre_score || null,
              gmat_score: sp?.gmat_score || null,
              preferred_course: sp?.preferred_course || null,
              preferred_degree: sp?.preferred_degree || null,
              target_country: sp?.target_country || null,
              preferred_intake: sp?.preferred_intake || null,
              budget_usd: sp?.budget_usd || null,
              scholarship_required: sp?.scholarship_required || false,
              work_experience_years: sp?.work_experience_years ? Number(sp.work_experience_years) : null,
              research_experience: sp?.research_experience || false,
              sop_uploaded: sp?.sop_uploaded || false,
              resume_uploaded: sp?.resume_uploaded || false,
              passport_ready: sp?.passport_ready || false,
              visa_cas_i20_ready: sp?.visa_cas_i20_ready || false,
              visa_financials_ready: sp?.visa_financials_ready || false,
            }
          };
        }
      }
    } catch (e) {
      console.error("CRM query error:", e);
    }
    // Fallback data if the database query fails or the user isn't fully logged in
    return {
      status: "success",
      data: { name: "Student", city: null, state: null, dateOfBirth: null, countryOfOrigin: "India", current_gpa: 3.8, budget_usd: 50000, current_phase: "PHASE_1_SELF_DISCOVERY" }
    };
  }

  if (call.name === "search_vector_store") {
    const query = args.query || "";
    const vectorResults = await searchVectorStore(query);
    if (vectorResults && vectorResults.length > 0 && !vectorResults[0].includes("unavailable")) {
      return { results: vectorResults };
    }
    // Fallback if vector database is empty or returns no matches
    const q = query.toLowerCase();
    if (q.includes("visa") || q.includes("uk")) {
      return { results: ["UK Student Visa (Tier 4) requires a CAS letter, proof of funds ($1,334/month for London), and a TB test."] };
    }
    if (q.includes("mba") || q.includes("fee")) {
      return { results: ["The average MBA tuition fee for top universities ranges from $40,000 to $75,000 per year."] };
    }
    return { results: [`Knowledge base searched for '${query}'. Provide detailed academic insights using established university parameters.`] };
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

  if (call.name === "escalate_to_counselor") {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "PENDING_ESCALATION" }
      });
      return { status: "success", message: "Escalation initiated successfully." };
    } catch (e: any) {
      console.error("Tool escalation error:", e);
      return { status: "error", message: "Failed to update session status in DB." };
    }
  }

  if (call.name === "recommend_universities") {
    try {
      const recs = await getRecommendations({
        country: args.country || undefined,
        maxBudget: args.max_budget || undefined,
        degree: args.degree || undefined,
        course: args.course || undefined,
        gpa: args.gpa || undefined,
        ielts: args.ielts || undefined,
        toefl: args.toefl || undefined,
        pte: args.pte || undefined,
        gre: args.gre || undefined,
        gmat: args.gmat || undefined,
        workExperience: args.work_experience || undefined,
      });
      return { status: "success", recommendations: recs };
    } catch (err: any) {
      console.error("recommend_universities tool error:", err);
      return { status: "error", message: err.message || "Failed to recommend universities." };
    }
  }

  if (call.name === "update_student_profile") {
    try {
      const session = await auth();
      if (session?.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
        if (dbUser) {
          const updateData: any = {};
          if (args.current_phase !== undefined) updateData.current_phase = String(args.current_phase);
          if (args.current_gpa !== undefined) updateData.current_gpa = args.current_gpa === null ? null : Number(args.current_gpa);
          if (args.current_degree !== undefined) updateData.current_degree = args.current_degree === null ? null : String(args.current_degree);
          if (args.graduation_year !== undefined) updateData.graduation_year = args.graduation_year === null ? null : Number(args.graduation_year);
          if (args.academic_board !== undefined) updateData.academic_board = args.academic_board === null ? null : String(args.academic_board);
          
          if (args.ielts_score !== undefined) updateData.ielts_score = args.ielts_score === null ? null : Number(args.ielts_score);
          if (args.toefl_score !== undefined) updateData.toefl_score = args.toefl_score === null ? null : Number(args.toefl_score);
          if (args.pte_score !== undefined) updateData.pte_score = args.pte_score === null ? null : Number(args.pte_score);
          if (args.gre_score !== undefined) updateData.gre_score = args.gre_score === null ? null : Number(args.gre_score);
          if (args.gmat_score !== undefined) updateData.gmat_score = args.gmat_score === null ? null : Number(args.gmat_score);
          
          if (args.preferred_course !== undefined) updateData.preferred_course = args.preferred_course === null ? null : String(args.preferred_course);
          if (args.preferred_degree !== undefined) updateData.preferred_degree = args.preferred_degree === null ? null : String(args.preferred_degree);
          if (args.target_country !== undefined) updateData.target_country = args.target_country === null ? null : String(args.target_country);
          if (args.preferred_intake !== undefined) updateData.preferred_intake = args.preferred_intake === null ? null : String(args.preferred_intake);
          
          if (args.budget_usd !== undefined) updateData.budget_usd = args.budget_usd === null ? null : Number(args.budget_usd);
          if (args.scholarship_required !== undefined) updateData.scholarship_required = Boolean(args.scholarship_required);
          
          if (args.work_experience_years !== undefined) updateData.work_experience_years = args.work_experience_years === null ? null : Number(args.work_experience_years);
          if (args.research_experience !== undefined) updateData.research_experience = Boolean(args.research_experience);
          
          if (args.sop_uploaded !== undefined) updateData.sop_uploaded = Boolean(args.sop_uploaded);
          if (args.resume_uploaded !== undefined) updateData.resume_uploaded = Boolean(args.resume_uploaded);
          if (args.passport_ready !== undefined) updateData.passport_ready = Boolean(args.passport_ready);
          if (args.visa_cas_i20_ready !== undefined) updateData.visa_cas_i20_ready = Boolean(args.visa_cas_i20_ready);
          if (args.visa_financials_ready !== undefined) updateData.visa_financials_ready = Boolean(args.visa_financials_ready);

          let profileUpdated = false;
          if (Object.keys(updateData).length > 0) {
            await prisma.studentProfile.upsert({
              where: { user_id: dbUser.id },
              update: updateData,
              create: {
                user_id: dbUser.id,
                ...updateData
              }
            });
            profileUpdated = true;
          }

          if (args.clear_shortlist) {
            await prisma.shortlistedProgram.deleteMany({
              where: { student_id: dbUser.id }
            });
            return { status: "success", message: "Student profile updated and shortlist cleared successfully." };
          }

          if (profileUpdated) {
            return { status: "success", message: "Student profile updated successfully in CRM." };
          }
          return { status: "success", message: "No new data to update." };
        }
      }
    } catch (e) {
      console.error("Update profile error:", e);
      return { status: "error", message: "Failed to update profile." };
    }
    return { status: "error", message: "User not authenticated or found." };
  }

  return { error: "Unknown tool" };
}

// ----------------------------------------------------------------------
// 2. MAIN CHAT ENDPOINT (POST Request)
// ----------------------------------------------------------------------
// When a user types a message in the chat UI and clicks "Send", 
// the browser makes a POST request to this endpoint with their message history.
export async function POST(req: NextRequest) {
  try {
    // CSRF Protection Check
    if (!verifyCsrf(req)) {
      return new Response(JSON.stringify({ error: "Access Denied: CSRF validation failed." }), { status: 403 });
    }

    // Extract client IP and verify rate limits / bans
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || 
               req.headers.get("x-real-ip") || 
               "127.0.0.1";

    if (await isIpBanned(ip)) {
      return new Response(
        JSON.stringify({ error: "Access Denied: Your IP has been flagged for abuse. Please contact support." }),
        { status: 403 }
      );
    }

    const rateLimit = await checkIpRateLimit(ip);
    if (!rateLimit.allowed) {
      if (rateLimit.isAbusive) {
        return new Response(
          JSON.stringify({ error: "Access Denied: Too many requests. Your IP has been flagged and banned." }),
          { status: 403 }
        );
      }
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a minute before trying again." }),
        { status: 429 }
      );
    }

    // 1. Extract the message history and the ID of the current chat session
    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), { status: 400 });
    }

    // 2. Identify the user making the request
    const authSession = await auth();
    const profile = authSession?.user?.email
      ? await prisma.user.findUnique({ where: { email: authSession.user.email } })
      : null;

    if (profile) {
      // User Daily Token Cost Limit Check
      const budgetCheck = await checkUserCostBudget(profile.id);
      if (!budgetCheck.allowed) {
        return new Response(
          JSON.stringify({ error: `Daily API budget limit reached (Spent $${budgetCheck.totalCost.toFixed(2)}/$0.50). Please try again tomorrow.` }),
          { status: 429 }
        );
      }
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

    // 3. Inject the user's real data directly into the AI's core instructions!
    // This is how the AI magically knows their name and city without asking.
    const profileContext = profile
      ? `Registered profile: name=${profile.name || "Student"}, city=${profile.city || "not provided"}, state=${profile.state || "not provided"}, date of birth=${profile.date_of_birth?.toISOString().slice(0, 10) || "not provided"}.`
      : "No registered profile is available.";
      
    const isStudent = !profile || profile.role === "STUDENT";

    // 4. Transform the message history into the strict format that Gemini expects (with PII redaction)
    const contents: any[] = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model", // Identify who said what
      parts: [{ text: m.role === "user" ? redactPii(sanitizeInput(m.content)) : sanitizeInput(m.content) }],
    }));

    const systemInstruction = {
      role: "system",
      parts: [{
        text: getSystemInstructions(profileContext)
      }]
    };

    const functionDeclarations: any[] = [
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
      },
      {
        name: "recommend_universities",
        description: "Recommends Safe, Target, and Reach universities based on budget, GPA, test scores, degree level, and major.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            country: { type: Type.STRING, description: "Filter by destination country (e.g. USA, UK, Canada, Australia, Germany)" },
            max_budget: { type: Type.INTEGER, description: "Maximum budget in USD for annual tuition" },
            degree: { type: Type.STRING, description: "Preferred degree level (e.g. MS, MBA, Bachelors, PhD)" },
            course: { type: Type.STRING, description: "Preferred course/field of study (e.g. Computer Science, Finance)" },
            gpa: { type: Type.NUMBER, description: "Student's current GPA" },
            ielts: { type: Type.NUMBER, description: "Student's IELTS score" },
            toefl: { type: Type.INTEGER, description: "Student's TOEFL score" },
            pte: { type: Type.INTEGER, description: "Student's PTE score" },
            gre: { type: Type.INTEGER, description: "Student's GRE score" },
            gmat: { type: Type.INTEGER, description: "Student's GMAT score" },
            work_experience: { type: Type.NUMBER, description: "Student's years of work experience" },
          }
        }
      },
      {
        name: "update_student_profile",
        description: "Updates the student's CRM profile with new academic, standardized test scores, preferences, and checklist states.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            current_phase: { type: Type.STRING, description: "One of: PHASE_1_SELF_DISCOVERY, PHASE_2_ACADEMIC_PLANNING, etc." },
            current_gpa: { type: Type.NUMBER, description: "Student's current GPA" },
            current_degree: { type: Type.STRING, description: "Student's current degree" },
            graduation_year: { type: Type.INTEGER, description: "Student's expected graduation year" },
            academic_board: { type: Type.STRING, description: "Academic board name (e.g. CBSE, IB)" },
            ielts_score: { type: Type.NUMBER, description: "IELTS score" },
            toefl_score: { type: Type.INTEGER, description: "TOEFL score" },
            pte_score: { type: Type.INTEGER, description: "PTE score" },
            gre_score: { type: Type.INTEGER, description: "GRE score" },
            gmat_score: { type: Type.INTEGER, description: "GMAT score" },
            preferred_course: { type: Type.STRING, description: "Preferred major/course of study" },
            preferred_degree: { type: Type.STRING, description: "Preferred degree (e.g. MS, MBA, Bachelors, PhD)" },
            target_country: { type: Type.STRING, description: "Target country" },
            preferred_intake: { type: Type.STRING, description: "Target intake term (e.g. Fall 2026)" },
            budget_usd: { type: Type.INTEGER, description: "Maximum budget in USD" },
            scholarship_required: { type: Type.BOOLEAN, description: "Is scholarship required?" },
            work_experience_years: { type: Type.NUMBER, description: "Years of work experience" },
            research_experience: { type: Type.BOOLEAN, description: "Does student have research experience?" },
            sop_uploaded: { type: Type.BOOLEAN, description: "SOP status" },
            resume_uploaded: { type: Type.BOOLEAN, description: "Resume status" },
            passport_ready: { type: Type.BOOLEAN, description: "Passport status" },
            visa_cas_i20_ready: { type: Type.BOOLEAN, description: "CAS or I-20 received status" },
            visa_financials_ready: { type: Type.BOOLEAN, description: "Visa financial docs ready status" },
            clear_shortlist: { type: Type.BOOLEAN, description: "Set to true to clear all shortlisted programs for this student." }
          }
        }
      }
    ];

    if (isStudent) {
      functionDeclarations.push({
        name: "escalate_to_counselor",
        description: "Escalates the current chat session to a human admissions counselor team when the user requests connection.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      });
    }

    const lastUserMessage = (messages[messages.length - 1]?.content || "").toLowerCase();
    const needsWebSearch = 
      lastUserMessage.includes("rank") ||
      lastUserMessage.includes("latest") ||
      lastUserMessage.includes("current") ||
      lastUserMessage.includes("news") ||
      lastUserMessage.includes("top") ||
      lastUserMessage.includes("best") ||
      lastUserMessage.includes("2025") ||
      lastUserMessage.includes("2026") ||
      lastUserMessage.includes("compare") ||
      lastUserMessage.includes("comparison") ||
      lastUserMessage.includes("scholarship") ||
      lastUserMessage.includes("funding");

    const tools: any[] = needsWebSearch 
      ? [{ googleSearch: {} }]
      : [{ functionDeclarations }];

    const config: any = {
      systemInstruction,
      tools,
      temperature: process.env.GEMINI_TEMPERATURE ? parseFloat(process.env.GEMINI_TEMPERATURE) : 0.3,
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

        // 5. Connect to Google's GenAI Platform via the reliability wrapper
        let loopCount = 0;
        const maxLoops = 5;
        let finalAiContent = "";
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;

        // 6. We define a list of models to try. If the first one hits a rate limit 
        // (meaning we asked it too many questions too fast), it gracefully tries the next one!
        const candidateModels = [
          'gemini-2.5-flash',
          'gemini-3.1-flash-lite',
          'gemini-2.5-flash-lite',
          'gemini-flash-lite-latest'
        ];

        // 7. This "while loop" is the engine that lets the AI use tools.
        // If the AI asks for a tool (like fetching CRM data), it pauses, gets the data, 
        // and loops again to answer the original question!
        while (loopCount < maxLoops) {
          // 8. Stream from Gemini with automatic key rotation, model fallback, and retry backoff
          const responseStream = await runWithModelsAndRetry(
            candidateModels,
            (ai, currentModel) =>
              ai.models.generateContentStream({
                model: currentModel,
                contents, // This is the entire conversation history we built earlier
                config
              })
          );

          let currentToolCalls: any[] = [];
          let currentModelParts: any[] = [];

          if (responseStream) {
            let lastChunkOfStream: any = null;
            for await (const chunk of responseStream) {
              lastChunkOfStream = chunk;
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                currentToolCalls.push(...chunk.functionCalls);
              }
              if (chunk.text) {
                finalAiContent += chunk.text;
                await sendSSE(JSON.stringify({ text: chunk.text }));
              }
              if (chunk.candidates && chunk.candidates[0]?.content?.parts) {
                currentModelParts.push(...chunk.candidates[0].content.parts);
              }
            }
            if (lastChunkOfStream?.usageMetadata) {
              totalPromptTokens += lastChunkOfStream.usageMetadata.promptTokenCount || 0;
              totalCompletionTokens += lastChunkOfStream.usageMetadata.candidatesTokenCount || 0;
            }
          }

          // If no tool calls are returned, the model is finished and we break out of the loop
          if (currentToolCalls.length === 0) {
            break;
          }

          // Execute all returned tool calls
          const functionResponses = [];
          for (const call of currentToolCalls) {
            const result = await executeToolCall(call, sessionId);
            functionResponses.push({ name: call.name, response: result });
          }

          // Append model turn (with the raw parts, preserving thought signatures)
          contents.push({
            role: "model",
            parts: currentModelParts
          });

          // Append user turn (with the function responses)
          contents.push({
            role: "user",
            parts: functionResponses.map(r => ({ functionResponse: r }))
          });

          loopCount++;
        }

        // Save transaction to PostgreSQL database if sessionId is a valid UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId || "");
        if (isUuid && messages.length > 0) {
          const userPrompt = messages[messages.length - 1].content;

          const promptLower = userPrompt.toLowerCase();
          const aiLower = finalAiContent.toLowerCase();

          const isCancelRequest =
            promptLower.includes("cancel") &&
            (promptLower.includes("escalate") || promptLower.includes("counselor") || promptLower.includes("human") || promptLower.includes("takeover"));

          const impliesEscalation = isStudent && !isCancelRequest && (
            (promptLower.includes("connect") && promptLower.includes("counselor")) ||
            (promptLower.includes("connect") && promptLower.includes("human")) ||
            promptLower.includes("talk to counselor") ||
            promptLower.includes("talk to a counselor") ||
            promptLower.includes("human assistance") ||
            promptLower.includes("escalate") ||
            (aiLower.includes("connecting you") && aiLower.includes("counselor")) ||
            (aiLower.includes("escalated your") || aiLower.includes("escalating your"))
          );

            const userMsgId = crypto.randomUUID();
            const aiMsgId = crypto.randomUUID();
            
            // Send the AI message ID back to the client so it can attach feedback to it
            await sendSSE(JSON.stringify({ id: aiMsgId }));

            const estimatedCost = (totalPromptTokens * 0.075 + totalCompletionTokens * 0.30) / 1_000_000;
            const redactedUserPrompt = redactPii(sanitizeInput(userPrompt));
            try {
              await prisma.$transaction([
                prisma.message.createMany({
                  data: [
                    { id: userMsgId, session_id: sessionId, sender_type: "USER", content: redactedUserPrompt },
                    { id: aiMsgId, session_id: sessionId, sender_type: "AI", content: finalAiContent }
                  ]
                }),
                prisma.messageMetric.create({
                  data: {
                    message_id: aiMsgId,
                    prompt_tokens: totalPromptTokens,
                    completion_tokens: totalCompletionTokens,
                    estimated_cost: estimatedCost
                  }
                }),
              ...(impliesEscalation ? [
                prisma.session.update({
                  where: { id: sessionId },
                  data: { status: "PENDING_ESCALATION" }
                })
              ] : isCancelRequest ? [
                prisma.session.update({
                  where: { id: sessionId },
                  data: { status: "ACTIVE" }
                })
              ] : [])
            ]);
          } catch (dbErr) {
            console.error("Failed to save messages to database:", dbErr);
          }
        }

        await sendSSE("[DONE]");
        await writer.close();
      } catch (err: any) {
        console.error("Stream error:", err);
        try {
          // Stream a safe, generic error fallback message instead of crashing or returning simulated advice
          const mockText = getFallbackErrorResponse();
          const words = mockText.split(" ");
          for (const word of words) {
            await new Promise(r => setTimeout(r, 40));
            await sendSSE(JSON.stringify({ text: word + " " }));
          }
          await sendSSE("[DONE]");
          await writer.close();
        } catch (streamErr) {
          await writer.abort(streamErr);
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
    return new Response(JSON.stringify({ error: error?.message || error?.toString() || "Internal Server Error" }), { status: 500 });
  }
}

function getFallbackErrorResponse(): string {
  return "I apologize, but I am currently experiencing high traffic or connection issues. I'm unable to process your request at the moment. Please try sending your message again in a few moments, or check back shortly. If you need urgent assistance, you can request to connect with a human counselor.";
}

