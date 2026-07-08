import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json({ error: "Invalid citation ID" }, { status: 400 });
    }

    // Handle Fallbacks
    if (id.startsWith("fallback-")) {
      if (id === "fallback-visa") {
        return NextResponse.json({
          id,
          title: "UK Student Visa Requirements",
          text: "UK Student Visa (Tier 4) requires a CAS letter, proof of funds ($1,334/month for London), and a TB test."
        });
      }
      if (id === "fallback-mba") {
        return NextResponse.json({
          id,
          title: "MBA Tuition Estimates",
          text: "The average MBA tuition fee for top universities ranges from $40,000 to $75,000 per year."
        });
      }
      return NextResponse.json({
        id,
        title: "Knowledge Base Search Guidelines",
        text: "General educational guidelines search. Context matches generic admissions and planning standards."
      });
    }

    // Query Database
    const results: any[] = await prisma.$queryRaw`
      SELECT id, metadata
      FROM "VectorKnowledgeBase"
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "Citation not found" }, { status: 404 });
    }

    const r = results[0];
    const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;

    return NextResponse.json({
      id: r.id,
      title: meta.title || "Admissions Document",
      text: meta.text || JSON.stringify(meta)
    });
  } catch (error: any) {
    console.error("Fetch citation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
