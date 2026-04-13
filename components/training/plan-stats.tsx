import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Calendar, CheckCircle, Target } from "lucide-react";
import { formatPace } from "@/lib/utils";

interface PlanStatsProps {
  plan: {
    goalTimeMinutes: number | null;
    startDate: Date | string;
    endDate: Date | string;
    currentWeeklyKm: number;
    experience: string;
    trainingDaysPerWeek: number;
    weeks: Array<{
      workouts: Array<{ status: string; type: string }>;
    }>;
  };
}

export function PlanStats({ plan }: PlanStatsProps) {
  const allWorkouts = plan.weeks.flatMap((w) => w.workouts).filter((w) => w.type !== "REST_DAY");
  const completed = allWorkouts.filter((w) => w.status === "COMPLETED").length;
  const total = allWorkouts.length;
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  const HM_KM = 21.0975;
  const targetPace = plan.goalTimeMinutes ? formatPace(plan.goalTimeMinutes / HM_KM) : "No goal set";

  const stats = [
    {
      icon: CheckCircle,
      label: "Completed",
      value: `${completed}/${total}`,
      sub: "workouts",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: Target,
      label: "Target Pace",
      value: targetPace,
      sub: "race pace",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Activity,
      label: "Experience",
      value: plan.experience === "BEGINNER" ? "Beginner" : "Intermediate",
      sub: "level",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: Calendar,
      label: "Training Days",
      value: `${plan.trainingDaysPerWeek}x`,
      sub: "per week",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-emerald-700">{Math.round(progressPct)}%</span>
        </div>
        <Progress value={progressPct} />
        <p className="text-xs text-gray-400 mt-2">{completed} of {total} workouts completed</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-xl mb-3 ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
