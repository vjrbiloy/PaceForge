import { cn, WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABELS } from "@/lib/utils";

interface WorkoutBadgeProps {
  type: string;
  className?: string;
}

export function WorkoutBadge({ type, className }: WorkoutBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        WORKOUT_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-700 border-gray-200",
        className
      )}
    >
      {WORKOUT_TYPE_LABELS[type] ?? type}
    </span>
  );
}
