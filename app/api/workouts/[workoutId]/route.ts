import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateWorkoutStatus, rescheduleWorkout } from "@/features/training-plan/actions";
import { WorkoutStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workoutId } = await params;
    const body = await req.json();

    if (body.status) {
      const updated = await updateWorkoutStatus(workoutId, body.status as WorkoutStatus);
      return NextResponse.json(updated);
    }

    if (body.newDate) {
      const updated = await rescheduleWorkout(workoutId, body.newDate);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
