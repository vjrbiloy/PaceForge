import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format pace (min/km) as "M:SS /km" */
export function formatPace(paceMinPerKm: number): string {
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

/** Format minutes as "H:MM:SS" or "MM:SS" */
export function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);
  const secs = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Calculate pace from goal time and distance */
export function calculatePaceFromGoalTime(
  goalTimeMinutes: number,
  distanceKm: number
): number {
  return goalTimeMinutes / distanceKm;
}

/** Workout type display labels */
export const WORKOUT_TYPE_LABELS: Record<string, string> = {
  EASY_RUN: "Easy Run",
  LONG_RUN: "Long Run",
  TEMPO_RUN: "Tempo Run",
  INTERVAL_RUN: "Interval Run",
  REST_DAY: "Rest Day",
};

export const WORKOUT_TYPE_COLORS: Record<string, string> = {
  EASY_RUN: "bg-green-100 text-green-800 border-green-200",
  LONG_RUN: "bg-blue-100 text-blue-800 border-blue-200",
  TEMPO_RUN: "bg-orange-100 text-orange-800 border-orange-200",
  INTERVAL_RUN: "bg-red-100 text-red-800 border-red-200",
  REST_DAY: "bg-gray-100 text-gray-600 border-gray-200",
};

export const WORKOUT_TYPE_BADGE: Record<string, string> = {
  EASY_RUN: "bg-green-500",
  LONG_RUN: "bg-blue-500",
  TEMPO_RUN: "bg-orange-500",
  INTERVAL_RUN: "bg-red-500",
  REST_DAY: "bg-gray-400",
};

export const PHASE_LABELS: Record<string, string> = {
  BASE: "Base Phase",
  BUILD: "Build Phase",
  PEAK: "Peak Phase",
  TAPER: "Taper Phase",
};

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
