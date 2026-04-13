"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, RotateCcw, ChevronDown, ChevronUp, MapPin, Zap } from "lucide-react";
import { WorkoutBadge } from "./workout-badge";
import { Button } from "@/components/ui/button";
import { cn, formatPace, WORKOUT_TYPE_BADGE } from "@/lib/utils";
import { updateWorkoutStatus, rescheduleWorkout } from "@/features/training-plan/actions";

interface WorkoutCardProps {
  workout: {
    id: string;
    type: string;
    date: Date | string;
    distanceKm: number;
    paceMinPerKm: number | null;
    description: string;
    notes: string | null;
    status: string;
    dayOfWeek: number;
  };
  compact?: boolean;
}

const STATUS_CONFIG = {
  PENDING: { icon: Clock, label: "Pending", color: "text-gray-400" },
  COMPLETED: { icon: CheckCircle, label: "Done", color: "text-emerald-500" },
  SKIPPED: { icon: XCircle, label: "Skipped", color: "text-red-400" },
  RESCHEDULED: { icon: RotateCcw, label: "Rescheduled", color: "text-amber-500" },
};

export function WorkoutCard({ workout, compact = false }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(workout.status);
  const [loading, setLoading] = useState<string | null>(null);

  const isRest = workout.type === "REST_DAY";
  const date = new Date(workout.date);
  const statusCfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;

  async function handleStatus(newStatus: "COMPLETED" | "SKIPPED") {
    setLoading(newStatus);
    try {
      await updateWorkoutStatus(workout.id, newStatus as never);
      setStatus(newStatus);
    } finally {
      setLoading(null);
    }
  }

  const dotColor = WORKOUT_TYPE_BADGE[workout.type] ?? "bg-gray-400";

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        isRest
          ? "bg-gray-50 border-gray-100"
          : "bg-white border-gray-100 shadow-sm hover:shadow-md",
        status === "COMPLETED" && "opacity-70",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <div className={cn("w-3 h-3 rounded-full mt-1.5 flex-shrink-0", dotColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <WorkoutBadge type={workout.type} />
              <span className="text-xs text-gray-400">{format(date, "EEE, MMM d")}</span>
            </div>
            <div className="flex items-center gap-1">
              <StatusIcon className={cn("w-4 h-4", statusCfg.color)} />
              <span className={cn("text-xs font-medium", statusCfg.color)}>{statusCfg.label}</span>
            </div>
          </div>

          {!isRest && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              {workout.distanceKm > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">{workout.distanceKm.toFixed(1)}</span>
                  <span className="text-gray-400">km</span>
                </span>
              )}
              {workout.paceMinPerKm && workout.paceMinPerKm > 0 && (
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">{formatPace(workout.paceMinPerKm)}</span>
                </span>
              )}
            </div>
          )}

          {!compact && (
            <button
              className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Hide details" : "Show details"}
            </button>
          )}

          {expanded && !compact && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-2">
              {workout.description}
            </p>
          )}

          {!isRest && status === "PENDING" && !compact && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                loading={loading === "COMPLETED"}
                onClick={() => handleStatus("COMPLETED")}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Mark done
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={loading === "SKIPPED"}
                onClick={() => handleStatus("SKIPPED")}
              >
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                Skip
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
