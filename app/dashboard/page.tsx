import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActivePlan, getUserPlans } from "@/features/training-plan/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekView } from "@/components/training/week-view";
import { PlanStats } from "@/components/training/plan-stats";
import { WorkoutCard } from "@/components/training/workout-card";
import { Activity, ChevronRight, Plus } from "lucide-react";
import { format, isAfter, isBefore, startOfToday, addDays } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const [activePlan, allPlans] = await Promise.all([getActivePlan(), getUserPlans()]);

  const today = startOfToday();

  // Find current week
  const currentWeek = activePlan?.weeks.find((week) => {
    const weekWorkouts = week.workouts;
    if (weekWorkouts.length === 0) return false;
    const firstDate = new Date(weekWorkouts[0].date);
    const lastDate = new Date(weekWorkouts[weekWorkouts.length - 1].date);
    return !isBefore(today, firstDate) && !isAfter(today, lastDate);
  }) ?? activePlan?.weeks[0];

  // Upcoming workouts (next 7 days)
  const nextWeek = addDays(today, 7);
  const upcomingWorkouts = activePlan?.weeks
    .flatMap((w) => w.workouts)
    .filter((w) => {
      const d = new Date(w.date);
      return (
        w.status === "PENDING" &&
        w.type !== "REST_DAY" &&
        !isBefore(d, today) &&
        isBefore(d, nextWeek)
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hey, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">{format(today, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Link href="/onboarding">
          <Button>
            <Plus className="w-4 h-4" />
            New plan
          </Button>
        </Link>
      </div>

      {!activePlan ? (
        /* Empty state */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Activity className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No training plan yet</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Create your first personalized 12-week half marathon training plan in just 2 minutes.
          </p>
          <Link href="/onboarding">
            <Button size="lg">
              Build my plan
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active plan card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{activePlan.name}</CardTitle>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {format(new Date(activePlan.startDate), "MMM d")} –{" "}
                    {format(new Date(activePlan.endDate), "MMM d, yyyy")}
                  </p>
                </div>
                <Link href={`/plans/${activePlan.id}`}>
                  <Button variant="outline" size="sm">
                    Full plan
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardHeader>
            </Card>

            {/* Current week */}
            {currentWeek && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">This week</h2>
                <WeekView week={currentWeek} isCurrentWeek />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PlanStats plan={activePlan} />

            {/* Upcoming workouts */}
            {upcomingWorkouts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Upcoming workouts</h3>
                <div className="space-y-2">
                  {upcomingWorkouts.map((w) => (
                    <WorkoutCard key={w.id} workout={w} compact />
                  ))}
                </div>
              </div>
            )}

            {/* Other plans */}
            {allPlans.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Other plans</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {allPlans
                    .filter((p) => p.id !== activePlan.id)
                    .map((plan) => (
                      <Link
                        key={plan.id}
                        href={`/plans/${plan.id}`}
                        className="block p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(plan.startDate), "MMM d, yyyy")}
                        </p>
                      </Link>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
