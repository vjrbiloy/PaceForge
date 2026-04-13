import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlan } from "@/features/training-plan/actions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { planId } = await params;
    const plan = await getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json(plan.weeks);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
