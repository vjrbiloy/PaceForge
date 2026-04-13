"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTrainingPlan } from "./generator";
import { ExperienceLevel, WorkoutStatus } from "@prisma/client";
import { addWeeks } from "date-fns";

// ─── Create Training Plan ─────────────────────────────────────────────────────

export interface CreatePlanInput {
  name: string;
  currentWeeklyKm: number;
  experience: ExperienceLevel;
  trainingDaysPerWeek: number;
  goalTimeMinutes?: number;
  startDate: string; // ISO date string
}

export async function createTrainingPlan(input: CreatePlanInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const startDate = new Date(input.startDate);
  const endDate = addWeeks(startDate, 12);

  const planSpec = generateTrainingPlan({
    startDate,
    currentWeeklyKm: input.currentWeeklyKm,
    experience: input.experience,
    trainingDaysPerWeek: input.trainingDaysPerWeek,
    goalTimeMinutes: input.goalTimeMinutes,
  });

  const plan = await prisma.trainingPlan.create({
    data: {
      userId: session.user.id,
      name: input.name,
      goalDistance: "HALF_MARATHON",
      goalTimeMinutes: input.goalTimeMinutes ?? null,
      startDate,
      endDate,
      currentWeeklyKm: input.currentWeeklyKm,
      experience: input.experience,
      trainingDaysPerWeek: input.trainingDaysPerWeek,
      weeks: {
        create: planSpec.weeks.map((week) => ({
          weekNumber: week.weekNumber,
          phase: week.phase,
          totalKm: week.totalKm,
          isCutbackWeek: week.isCutbackWeek,
          workouts: {
            create: week.workouts.map((w) => ({
              date: w.date,
              type: w.type,
              distanceKm: w.distanceKm,
              paceMinPerKm: w.paceMinPerKm,
              description: w.description,
              dayOfWeek: w.dayOfWeek,
              status: WorkoutStatus.PENDING,
            })),
          },
        })),
      },
    },
    include: { weeks: { include: { workouts: true } } },
  });

  revalidatePath("/dashboard");
  return plan;
}

// ─── Fetch User Plans ─────────────────────────────────────────────────────────

export async function getUserPlans() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  return prisma.trainingPlan.findMany({
    where: { userId: session.user.id },
    include: {
      weeks: {
        include: { workouts: true },
        orderBy: { weekNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Fetch Single Plan ────────────────────────────────────────────────────────

export async function getPlan(planId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  return prisma.trainingPlan.findFirst({
    where: { id: planId, userId: session.user.id },
    include: {
      weeks: {
        include: {
          workouts: { orderBy: { date: "asc" } },
        },
        orderBy: { weekNumber: "asc" },
      },
    },
  });
}

// ─── Update Workout Status ────────────────────────────────────────────────────

export async function updateWorkoutStatus(
  workoutId: string,
  status: WorkoutStatus
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Verify ownership through join
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId },
    include: {
      week: { include: { plan: { select: { userId: true } } } },
    },
  });

  if (!workout || workout.week.plan.userId !== session.user.id) {
    throw new Error("Workout not found or unauthorized");
  }

  const updated = await prisma.workout.update({
    where: { id: workoutId },
    data: { status },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/plans/${workout.week.trainingPlanId}`);
  return updated;
}

// ─── Reschedule Workout ───────────────────────────────────────────────────────

export async function rescheduleWorkout(workoutId: string, newDate: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId },
    include: {
      week: { include: { plan: { select: { userId: true } } } },
    },
  });

  if (!workout || workout.week.plan.userId !== session.user.id) {
    throw new Error("Workout not found or unauthorized");
  }

  const updated = await prisma.workout.update({
    where: { id: workoutId },
    data: {
      date: new Date(newDate),
      status: WorkoutStatus.RESCHEDULED,
      rescheduledFrom: workout.rescheduledFrom ?? workout.date,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/plans/${workout.week.trainingPlanId}`);
  return updated;
}

// ─── Get Active Plan ──────────────────────────────────────────────────────────

export async function getActivePlan() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  return prisma.trainingPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      weeks: {
        include: {
          workouts: { orderBy: { date: "asc" } },
        },
        orderBy: { weekNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Set Active Plan ──────────────────────────────────────────────────────────

export async function setActivePlan(planId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Deactivate all plans
  await prisma.trainingPlan.updateMany({
    where: { userId: session.user.id },
    data: { isActive: false },
  });

  // Activate selected
  const plan = await prisma.trainingPlan.update({
    where: { id: planId },
    data: { isActive: true },
  });

  revalidatePath("/dashboard");
  return plan;
}
