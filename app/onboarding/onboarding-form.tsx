"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTrainingPlan } from "@/features/training-plan/actions";
import { Button } from "@/components/ui/button";
import { ExperienceLevel } from "@prisma/client";
import { AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  experience: ExperienceLevel;
  currentWeeklyKm: number;
  trainingDaysPerWeek: number;
  goalTimeMinutes: number | undefined;
  hasGoalTime: boolean;
  goalHours: number;
  goalMins: number;
  startDate: string;
}

const today = new Date().toISOString().split("T")[0];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name: "Half Marathon Plan",
    experience: ExperienceLevel.BEGINNER,
    currentWeeklyKm: 20,
    trainingDaysPerWeek: 4,
    goalTimeMinutes: undefined,
    hasGoalTime: false,
    goalHours: 2,
    goalMins: 15,
    startDate: today,
  });

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const goalTimeMinutes = form.hasGoalTime
        ? form.goalHours * 60 + form.goalMins
        : undefined;

      const plan = await createTrainingPlan({
        name: form.name,
        currentWeeklyKm: form.currentWeeklyKm,
        experience: form.experience,
        trainingDaysPerWeek: form.trainingDaysPerWeek,
        goalTimeMinutes,
        startDate: form.startDate,
      });

      router.push(`/plans/${plan.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
      {/* Progress bar */}
      <div className="flex">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "flex-1 h-1.5 transition-all duration-300",
              s <= step ? "bg-emerald-500" : "bg-gray-100"
            )}
          />
        ))}
      </div>

      <div className="p-8">
        <p className="text-xs font-medium text-emerald-600 mb-1">Step {step} of 3</p>

        {/* ── Step 1: Experience & Goal ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your running background</h2>
              <p className="text-sm text-gray-500 mt-1">This helps us calibrate the right intensity.</p>
            </div>

            {/* Plan name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                placeholder="Half Marathon Plan"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience level</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: ExperienceLevel.BEGINNER,
                    label: "Beginner",
                    desc: "Running < 1 year or < 25 km/week",
                  },
                  {
                    value: ExperienceLevel.INTERMEDIATE,
                    label: "Intermediate",
                    desc: "Running 1+ years or 25–60 km/week",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("experience", opt.value)}
                    className={cn(
                      "text-left p-4 rounded-2xl border-2 transition-all",
                      form.experience === opt.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you have a goal time?</label>
              <div className="flex gap-3 mb-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => update("hasGoalTime", v)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                      form.hasGoalTime === v
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 text-gray-600 hover:border-gray-200"
                    )}
                  >
                    {v ? "Yes" : "No goal time"}
                  </button>
                ))}
              </div>

              {form.hasGoalTime && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Hours</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={form.goalHours}
                      onChange={(e) => update("goalHours", Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <span className="text-gray-400 mt-5">:</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Minutes</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={form.goalMins}
                      onChange={(e) => update("goalMins", Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Mileage & Schedule ────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Current training load</h2>
              <p className="text-sm text-gray-500 mt-1">
                We use this to set a safe starting point for your plan.
              </p>
            </div>

            {/* Current weekly km */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Current weekly mileage
              </label>
              <div className="relative">
                <input
                  type="range"
                  min={10}
                  max={70}
                  step={5}
                  value={form.currentWeeklyKm}
                  onChange={(e) => update("currentWeeklyKm", Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10 km</span>
                  <span className="text-emerald-700 font-bold text-sm">{form.currentWeeklyKm} km/week</span>
                  <span>70 km</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Rough average is fine. If you&apos;re not running at all, choose a low value (10–15 km).
              </p>
            </div>

            {/* Training days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training days per week
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    onClick={() => update("trainingDaysPerWeek", d)}
                    className={cn(
                      "py-3 rounded-xl border-2 text-sm font-semibold transition-all",
                      form.trainingDaysPerWeek === d
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 text-gray-600 hover:border-gray-200"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                4–5 days is optimal for most runners. At least 1 rest day will always be included.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 3: Start Date ────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">When do you start?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your plan will run for exactly 12 weeks from this date.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date</label>
              <input
                type="date"
                value={form.startDate}
                min={today}
                onChange={(e) => update("startDate", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Plan summary</h3>
              {[
                { label: "Plan", value: form.name },
                { label: "Goal distance", value: "Half Marathon (21.1 km)" },
                {
                  label: "Goal time",
                  value: form.hasGoalTime
                    ? `${form.goalHours}h ${form.goalMins}m`
                    : "No goal time",
                },
                {
                  label: "Experience",
                  value: form.experience === ExperienceLevel.BEGINNER ? "Beginner" : "Intermediate",
                },
                { label: "Starting mileage", value: `${form.currentWeeklyKm} km/week` },
                { label: "Training days", value: `${form.trainingDaysPerWeek} days/week` },
                { label: "Duration", value: "12 weeks" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={() => setStep((s) => (s + 1) as Step)}>
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button loading={loading} onClick={handleSubmit}>
              Generate my plan
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
