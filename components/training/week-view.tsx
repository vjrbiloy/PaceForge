"use client";

import { cn, PHASE_LABELS, DAY_NAMES } from "@/lib/utils";
import { WorkoutCard } from "./workout-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface WeekViewProps {
  week: {
    id: string;
    weekNumber: number;
    phase: string;
    totalKm: number;
    isCutbackWeek: boolean;
    workouts: Array<{
      id: string;
      type: string;
      date: Date | string;
      distanceKm: number;
      paceMinPerKm: number | null;
      description: string;
      notes: string | null;
      status: string;
      dayOfWeek: number;
    }>;
  };
  isCurrentWeek?: boolean;
}

export function WeekView({ week, isCurrentWeek = false }: WeekViewProps) {
  const completedWorkouts = week.workouts.filter((w) => w.status === "COMPLETED").length;
  const totalWorkouts = week.workouts.filter((w) => w.type !== "REST_DAY").length;

  const phaseColors: Record<string, string> = {
    BASE: "bg-slate-100 text-slate-700",
    BUILD: "bg-blue-100 text-blue-700",
    PEAK: "bg-purple-100 text-purple-700",
    TAPER: "bg-amber-100 text-amber-700",
  };

  return (
    <Card className={cn(isCurrentWeek && "ring-2 ring-emerald-500 ring-offset-2")}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              Week {week.weekNumber}
              {isCurrentWeek && (
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  Current
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              {completedWorkouts}/{totalWorkouts} workouts done
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {week.isCutbackWeek && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              <TrendingDown className="w-3.5 h-3.5" />
              Cutback
            </span>
          )}
          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-lg", phaseColors[week.phase] ?? "bg-gray-100 text-gray-700")}>
            {PHASE_LABELS[week.phase] ?? week.phase}
          </span>
          <span className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            {week.totalKm.toFixed(0)} km
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {week.workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
