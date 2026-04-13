import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { Activity, ChevronRight } from "lucide-react";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Build your training plan</h1>
          <p className="text-gray-500">
            Answer a few questions and we&apos;ll generate a personalized 12-week half marathon plan.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
}
