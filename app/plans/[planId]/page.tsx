import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getPlan, setActivePlan } from "@/features/training-plan/actions";
import { WeekView } from "@/components/training/week-view";
import { PlanStats } from "@/components/training/plan-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isAfter, isBefore, startOfToday, addDays } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { PHASE_LABELS } from "@/lib/utils";

interface Props {
  params: Promise<{ planId: string }>;
}

export default async function PlanPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { planId } = await params;
  const plan = await getPlan(planId);
  if (!plan) notFound();

  const today = startOfToday();

  const currentWeekIndex = plan.weeks.findIndex((week) => {
    const workouts = week.workouts;
    if (workouts.length === 0) return false;
    const first = new Date(workouts[0].date);
    const last = new Date(workouts[workouts.length - 1].date);
    return !isBefore(today, first) && !isAfter(today, last);
  });

  // Group weeks by phase
  const phaseGroups: Record<string, typeof plan.weeks> = {};
  for (const week of plan.weeks) {
    if (!phaseGroups[week.phase]) phaseGroups[week.phase] = [];
    phaseGroups[week.phase].push(week);
  }

  const allWorkouts = plan.weeks.flatMap((w) => w.workouts);
  const completedKm = allWorkouts
    .filter((w) => w.status === "COMPLETED")
    .reduce((sum, w) => sum + w.distanceKm, 0);
  const totalKm = allWorkouts.reduce((sum, w) => sum + w.distanceKm, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back + Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
              {plan.isActive && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  <Star className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-gray-500">
              {format(new Date(plan.startDate), "MMMM d, yyyy")} –{" "}
              {format(new Date(plan.endDate), "MMMM d, yyyy")}
              {" · "}
              <span className="font-medium">{totalKm.toFixed(0)} km total</span>
            </p>
          </div>

          {!plan.isActive && (
            <form
              action={async () => {
                "use server";
                await setActivePlan(planId);
              }}
            >
              <Button type="submit" variant="outline">
                Set as active plan
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weeks */}
        <div className="lg:col-span-2 space-y-10">
          {Object.entries(phaseGroups).map(([phase, weeks]) => (
            <div key={phase}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {PHASE_LABELS[phase] ?? phase}
                </h2>
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-sm text-gray-400">
                  {weeks.reduce((s, w) => s + w.totalKm, 0).toFixed(0)} km
                </span>
              </div>
              <div className="space-y-4">
                {weeks.map((week) => (
                  <WeekView
                    key={week.id}
                    week={week}
                    isCurrentWeek={plan.weeks.indexOf(week) === currentWeekIndex}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PlanStats plan={plan} />

          {/* Volume progression preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plan.weeks.map((week, i) => {
                  const maxKm = Math.max(...plan.weeks.map((w) => w.totalKm));
                  const pct = (week.totalKm / maxKm) * 100;
                  const isCurrentWeek = i === currentWeekIndex;
                  return (
                    <div key={week.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-12">Wk {week.weekNumber}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            week.isCutbackWeek
                              ? "bg-amber-400"
                              : isCurrentWeek
                              ? "bg-emerald-500"
                              : "bg-blue-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-14 text-right">
                        {week.totalKm.toFixed(0)} km
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                  Build
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Cutback
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Current
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
