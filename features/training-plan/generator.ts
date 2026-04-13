/**
 * Rule-based Training Plan Generator
 *
 * Generates a 12-week half marathon training plan following these rules:
 *  - Weekly mileage increases by max 10%
 *  - Every 4th week is a cutback week (80% of previous peak)
 *  - 1 long run per week
 *  - Max 2 hard workouts per week (Tempo + Interval)
 *  - At least 1 rest day per week
 *  - Four phases: Base (wk 1-3), Build (wk 4-7), Peak (wk 8-10), Taper (wk 11-12)
 */

import { ExperienceLevel, TrainingPhase, WorkoutType } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";

export interface WorkoutSpec {
  type: WorkoutType;
  distanceKm: number;
  paceMinPerKm: number;
  description: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  date: Date;
}

export interface WeekSpec {
  weekNumber: number;
  phase: TrainingPhase;
  totalKm: number;
  isCutbackWeek: boolean;
  workouts: WorkoutSpec[];
}

export interface PlanSpec {
  weeks: WeekSpec[];
}

// ─── Phase boundaries (1-indexed week numbers) ───────────────────────────────

function getPhase(week: number): TrainingPhase {
  if (week <= 3) return TrainingPhase.BASE;
  if (week <= 7) return TrainingPhase.BUILD;
  if (week <= 10) return TrainingPhase.PEAK;
  return TrainingPhase.TAPER;
}

function isCutback(week: number): boolean {
  return week === 4 || week === 8 || week === 12;
}

// ─── Pace Calculations ───────────────────────────────────────────────────────

interface PaceZones {
  easy: number;       // min/km
  tempo: number;
  interval: number;
  longRun: number;
}

/**
 * Derive training paces from a goal finish time.
 * If no goal time, fall back to experience-level defaults.
 */
function derivePaceZones(
  experience: ExperienceLevel,
  goalTimeMinutes?: number
): PaceZones {
  // Half marathon distance in km
  const HM_KM = 21.0975;

  let racePace: number; // min/km

  if (goalTimeMinutes) {
    racePace = goalTimeMinutes / HM_KM;
  } else {
    // Default race paces by experience
    racePace = experience === ExperienceLevel.BEGINNER ? 7.0 : 5.5;
  }

  return {
    easy: racePace * 1.3,       // 30% slower than race pace
    longRun: racePace * 1.25,   // 25% slower
    tempo: racePace * 0.97,     // ~3% faster (comfortably hard)
    interval: racePace * 0.9,   // 10% faster (hard effort)
  };
}

// ─── Workout Descriptions ────────────────────────────────────────────────────

function describeEasyRun(km: number, pace: number): string {
  return `${km.toFixed(1)} km easy run at a comfortable, conversational pace (${formatPaceInline(pace)} /km). Focus on building aerobic base — you should be able to hold a full conversation.`;
}

function describeLongRun(km: number, pace: number): string {
  return `${km.toFixed(1)} km long run at an easy effort (${formatPaceInline(pace)} /km). This is your key weekly workout for building endurance. Run by effort, not pace.`;
}

function describeTempoRun(km: number, pace: number): string {
  return `${km.toFixed(1)} km tempo run with 2 km warm-up, ${(km - 4).toFixed(1)} km at tempo pace (${formatPaceInline(pace)} /km — comfortably hard), then 2 km cool-down.`;
}

function describeIntervalRun(km: number, pace: number): string {
  return `${km.toFixed(1)} km interval session. 2 km warm-up, then 6× 400 m @ ${formatPaceInline(pace)} /km with 90 s rest, 2 km cool-down. Focus on form at speed.`;
}

function describeRestDay(): string {
  return "Complete rest or light cross-training (yoga, walking, swimming). Allow your body to absorb training stress.";
}

function formatPaceInline(minPerKm: number): string {
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Weekly Volume Progression ───────────────────────────────────────────────

/**
 * Build the 12-week volume ladder.
 * Week 1 starts at the user's current weekly mileage.
 * Increases 10% per week; cutback weeks drop to 80% of the previous week.
 */
function buildVolumeProgression(startingKm: number, experience: ExperienceLevel): number[] {
  const volumes: number[] = [];
  // Clamp starting volume to reasonable minimums
  let currentKm = Math.max(startingKm, experience === ExperienceLevel.BEGINNER ? 15 : 25);

  for (let w = 1; w <= 12; w++) {
    if (isCutback(w)) {
      const prev = volumes[w - 2] ?? currentKm;
      const cutbackKm = Math.round(prev * 0.8 * 10) / 10;
      volumes.push(cutbackKm);
      currentKm = cutbackKm;
    } else {
      if (w > 1) {
        // Cap the weekly km to avoid unrealistic jumps for beginners
        const maxKm = experience === ExperienceLevel.BEGINNER ? 60 : 90;
        currentKm = Math.min(Math.round(currentKm * 1.1 * 10) / 10, maxKm);
      }
      volumes.push(currentKm);
    }
  }

  return volumes;
}

// ─── Training Day Layout ─────────────────────────────────────────────────────

/**
 * Given total training days per week, return arrays of preferred workout-day
 * indices (day of week) and rest-day indices.
 *
 * We always want: Long Run on Sunday (0), hard days Tuesday (2)/Thursday (4).
 */
function layoutTrainingDays(trainingDaysPerWeek: number): {
  workoutDays: number[];
  restDays: number[];
} {
  const allSchedules: Record<number, number[]> = {
    3: [0, 2, 5],       // Sun, Tue, Fri
    4: [0, 2, 4, 6],    // Sun, Tue, Thu, Sat
    5: [0, 1, 3, 5, 6], // Sun, Mon, Wed, Fri, Sat
    6: [0, 1, 2, 4, 5, 6], // Mon–Sat with Sunday rest
  };

  const days = Math.min(6, Math.max(3, trainingDaysPerWeek));
  const workoutDays = allSchedules[days] ?? allSchedules[4];
  const restDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !workoutDays.includes(d));
  return { workoutDays, restDays };
}

// ─── Per-workout Assignment ──────────────────────────────────────────────────

interface WeeklyWorkoutAssignment {
  type: WorkoutType;
  dayOfWeek: number;
  distanceFraction: number; // fraction of weekly total
}

/**
 * Assign workout types to days of week for a given week.
 * Rules:
 *  - Long run on first available day (Sunday preferred)
 *  - Phases determine how many hard days
 *  - Base phase: no intervals
 *  - Build phase: add intervals in later weeks
 *  - Peak phase: both tempo + intervals
 *  - Taper: reduce intensity, mostly easy
 */
function assignWorkouts(
  weekNumber: number,
  phase: TrainingPhase,
  workoutDays: number[],
  isCutbackWeek: boolean
): WeeklyWorkoutAssignment[] {
  const assignments: WeeklyWorkoutAssignment[] = [];

  // Sort days: long run Sunday, hard days midweek
  const sortedDays = [...workoutDays].sort((a, b) => a - b);

  // Long run day: prefer Sunday (0) or last day of the week
  const longRunDay = sortedDays.includes(0) ? 0 : sortedDays[sortedDays.length - 1];
  const remainingDays = sortedDays.filter((d) => d !== longRunDay);

  // Determine hard workout count based on phase
  let hardCount = 0;
  if (!isCutbackWeek) {
    if (phase === TrainingPhase.BASE) hardCount = 0;
    else if (phase === TrainingPhase.BUILD) hardCount = 1;
    else if (phase === TrainingPhase.PEAK) hardCount = 2;
    else if (phase === TrainingPhase.TAPER) hardCount = 1;
  }

  // Cap hard workouts: max 2
  hardCount = Math.min(hardCount, 2);

  // Assign long run
  const longRunFraction = getLongRunFraction(workoutDays.length, phase, isCutbackWeek);
  assignments.push({ type: WorkoutType.LONG_RUN, dayOfWeek: longRunDay, distanceFraction: longRunFraction });

  // Hard days: prefer midweek (Tue=2, Thu=4)
  const preferredHardDays = [2, 4, 3].filter((d) => remainingDays.includes(d));
  const hardDays = preferredHardDays.slice(0, hardCount);

  // Assign hard workouts
  let tempoAssigned = false;
  let intervalAssigned = false;
  for (const hd of hardDays) {
    if (!tempoAssigned && (phase === TrainingPhase.BUILD || phase === TrainingPhase.PEAK || phase === TrainingPhase.TAPER)) {
      assignments.push({ type: WorkoutType.TEMPO_RUN, dayOfWeek: hd, distanceFraction: 0.18 });
      tempoAssigned = true;
    } else if (!intervalAssigned && phase === TrainingPhase.PEAK) {
      assignments.push({ type: WorkoutType.INTERVAL_RUN, dayOfWeek: hd, distanceFraction: 0.14 });
      intervalAssigned = true;
    } else {
      assignments.push({ type: WorkoutType.TEMPO_RUN, dayOfWeek: hd, distanceFraction: 0.18 });
    }
  }

  // Fill remaining workout days with easy runs
  const easyDays = remainingDays.filter((d) => !hardDays.includes(d));
  const usedFraction = assignments.reduce((s, a) => s + a.distanceFraction, 0);
  const easyFraction = (1 - usedFraction) / Math.max(easyDays.length, 1);

  for (const ed of easyDays) {
    assignments.push({ type: WorkoutType.EASY_RUN, dayOfWeek: ed, distanceFraction: easyFraction });
  }

  return assignments;
}

function getLongRunFraction(
  trainingDays: number,
  phase: TrainingPhase,
  isCutback: boolean
): number {
  if (isCutback) return 0.28;
  if (phase === TrainingPhase.BASE) return 0.30;
  if (phase === TrainingPhase.BUILD) return 0.33;
  if (phase === TrainingPhase.PEAK) return 0.35;
  return 0.28; // taper
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export interface GeneratorInput {
  startDate: Date;
  currentWeeklyKm: number;
  experience: ExperienceLevel;
  trainingDaysPerWeek: number;
  goalTimeMinutes?: number;
}

export function generateTrainingPlan(input: GeneratorInput): PlanSpec {
  const { startDate, currentWeeklyKm, experience, trainingDaysPerWeek, goalTimeMinutes } = input;

  const paceZones = derivePaceZones(experience, goalTimeMinutes);
  const volumes = buildVolumeProgression(currentWeeklyKm, experience);
  const { workoutDays, restDays } = layoutTrainingDays(trainingDaysPerWeek);

  const weeks: WeekSpec[] = [];

  for (let w = 1; w <= 12; w++) {
    const phase = getPhase(w);
    const cutback = isCutback(w);
    const weekKm = volumes[w - 1];

    // Start of this week (plan starts on Monday of week 1)
    const weekStart = addDays(startOfDay(startDate), (w - 1) * 7);

    const assignments = assignWorkouts(w, phase, workoutDays, cutback);

    const workoutSpecs: WorkoutSpec[] = [];

    for (const a of assignments) {
      const date = addDays(weekStart, a.dayOfWeek === 0 ? 6 : a.dayOfWeek - 1);
      const rawKm = weekKm * a.distanceFraction;
      const distanceKm = Math.round(rawKm * 10) / 10;

      let paceMinPerKm: number;
      let description: string;

      switch (a.type) {
        case WorkoutType.LONG_RUN:
          paceMinPerKm = paceZones.longRun;
          description = describeLongRun(distanceKm, paceMinPerKm);
          break;
        case WorkoutType.TEMPO_RUN:
          paceMinPerKm = paceZones.tempo;
          description = describeTempoRun(distanceKm, paceMinPerKm);
          break;
        case WorkoutType.INTERVAL_RUN:
          paceMinPerKm = paceZones.interval;
          description = describeIntervalRun(distanceKm, paceMinPerKm);
          break;
        default:
          paceMinPerKm = paceZones.easy;
          description = describeEasyRun(distanceKm, paceMinPerKm);
      }

      workoutSpecs.push({
        type: a.type,
        distanceKm,
        paceMinPerKm: Math.round(paceMinPerKm * 100) / 100,
        description,
        dayOfWeek: a.dayOfWeek,
        date,
      });
    }

    // Add rest day workouts (distance = 0)
    for (const rd of restDays) {
      const date = addDays(weekStart, rd === 0 ? 6 : rd - 1);
      workoutSpecs.push({
        type: WorkoutType.REST_DAY,
        distanceKm: 0,
        paceMinPerKm: 0,
        description: describeRestDay(),
        dayOfWeek: rd,
        date,
      });
    }

    // Sort workouts by day of week
    workoutSpecs.sort((a, b) => {
      const da = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
      const db = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
      return da - db;
    });

    weeks.push({
      weekNumber: w,
      phase,
      totalKm: weekKm,
      isCutbackWeek: cutback,
      workouts: workoutSpecs,
    });
  }

  return { weeks };
}
