import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

    // 1. Fetch all detailed message metrics with message dates
    const rawMetrics = await prisma.messageMetric.findMany({
      include: {
        message: {
          select: {
            created_at: true,
          }
        }
      }
    });

    if (rawMetrics.length === 0) {
      return NextResponse.json({ success: true, message: "No metrics to clean up." });
    }

    // 2. Group metrics by date (YYYY-MM-DD)
    const aggregated: Record<string, {
      prompt: number;
      completion: number;
      cost: number;
      count: number;
    }> = {};

    for (const item of rawMetrics) {
      const dateStr = new Date(item.message.created_at).toISOString().split("T")[0];
      if (!aggregated[dateStr]) {
        aggregated[dateStr] = { prompt: 0, completion: 0, cost: 0.0, count: 0 };
      }
      aggregated[dateStr].prompt += item.prompt_tokens;
      aggregated[dateStr].completion += item.completion_tokens;
      aggregated[dateStr].cost += parseFloat(item.estimated_cost.toString());
      aggregated[dateStr].count += 1;
    }

    // 3. Upsert into DailyMetric table
    const upsertPromises = Object.entries(aggregated).map(([dateStr, stats]) => {
      const dateVal = new Date(dateStr);
      return prisma.dailyMetric.upsert({
        where: { date: dateVal },
        update: {
          prompt_tokens: { increment: stats.prompt },
          completion_tokens: { increment: stats.completion },
          estimated_cost: { increment: stats.cost },
          message_count: { increment: stats.count },
        },
        create: {
          date: dateVal,
          prompt_tokens: stats.prompt,
          completion_tokens: stats.completion,
          estimated_cost: stats.cost,
          message_count: stats.count,
        }
      });
    });

    await prisma.$transaction(upsertPromises);

    // 4. Delete/prune the processed MessageMetric records
    const idsToDelete = rawMetrics.map(item => item.id);
    await prisma.messageMetric.deleteMany({
      where: {
        id: { in: idsToDelete }
      }
    });

    // 5. Audit log the cleanup action
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
    if (user) {
      const { logSystemAction } = await import("@/lib/audit");
      await logSystemAction({
        actorId: user.id,
        actionType: "CLEANUP_METRICS",
        targetEntity: `Aggregated ${rawMetrics.length} metrics across ${Object.keys(aggregated).length} day(s)`,
        ipAddress,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully aggregated ${rawMetrics.length} detailed metrics into daily summary statistics.`,
      daysAggregated: Object.keys(aggregated),
    });
  } catch (error: any) {
    console.error("Cleanup metrics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
