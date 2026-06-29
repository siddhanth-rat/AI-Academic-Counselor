import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Fetch mock user profile from DB
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return NextResponse.json({
        data: { name: "Alice", targetCountry: "UK", currentGpa: 3.8, budgetUsd: 50000 }
      });
    }
    return NextResponse.json({ data: profile });
  } catch (error) {
    return NextResponse.json({
      data: { name: "Alice", targetCountry: "UK", currentGpa: 3.8, budgetUsd: 50000 }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Save to PostgreSQL via Prisma
    const updatedProfile = await prisma.userProfile.create({
      data: {
        userId: body.userId || "guest_id",
        targetCountry: body.targetCountry || "UK",
        currentGpa: parseFloat(body.currentGpa || "3.8"),
        budgetUsd: parseFloat(body.budgetUsd || "50000"),
      }
    });
    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile in database" }, { status: 500 });
  }
}
