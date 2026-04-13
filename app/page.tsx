import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, ChevronRight, Shield, TrendingUp, Zap } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:pt-32 sm:pb-36">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-50 to-transparent rounded-full blur-3xl opacity-70" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Activity className="w-3.5 h-3.5" />
            Half Marathon Training Made Smart
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Your personal
            <span className="block text-emerald-600">running coach.</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            PaceForge generates science-backed 12-week training plans tailored to your current fitness,
            experience level, and race goal — no AI, just proven running rules.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signin">
              <Button size="lg" className="w-full sm:w-auto">
                Start for free
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Learn more
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "12 Weeks", label: "Structured plan" },
            { value: "4 Phases", label: "Base → Taper" },
            { value: "10% Rule", label: "Safe progression" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-emerald-600">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Built on proven training principles
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            Every plan follows established endurance training rules so you train smart, stay healthy, and hit your goal.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${f.bg}`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to train smarter?</h2>
        <p className="text-emerald-100 mb-8 max-w-lg mx-auto">
          Create your personalized 12-week half marathon plan in under 2 minutes.
        </p>
        <Link href="/signin">
          <Button size="lg" variant="secondary">
            Get started — it&apos;s free
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© 2026 PaceForge. Built for runners, by runners.</p>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "10% Mileage Rule",
    desc: "Weekly volume never increases by more than 10%, protecting you from overuse injuries.",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Structured Phases",
    desc: "Base, Build, Peak, and Taper phases progressively build your fitness and peak you on race day.",
    icon: Activity,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Cutback Weeks",
    desc: "Every 4th week is a recovery week with reduced volume — essential for adaptation.",
    icon: Shield,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Weekly Calendar",
    desc: "See all workouts in a clear weekly calendar view with type, distance, and pace at a glance.",
    icon: Calendar,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Pace Zones",
    desc: "Paces are derived from your goal finish time — easy, tempo, and interval zones calculated automatically.",
    icon: Zap,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    title: "Progress Tracking",
    desc: "Mark workouts complete, skip sessions, or reschedule as life happens. Your plan adapts.",
    icon: ChevronRight,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];
