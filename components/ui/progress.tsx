import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  color?: "emerald" | "blue" | "amber" | "red";
}

export function Progress({ value, className, color = "emerald" }: ProgressProps) {
  const colors = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className={cn("w-full bg-gray-100 rounded-full h-2 overflow-hidden", className)}>
      <div
        className={cn("h-2 rounded-full transition-all duration-500", colors[color])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
