import { Link, Navigate } from "react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  LineChart,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "../app/components/ui/button";
import { useApp } from "../app/context";
import { appPath } from "../app/routing";

const PROOF_POINTS = [
  {
    title: "Clear job-search operating system",
    description:
      "JobSprint turns scattered links, applications, outreach, and CV variants into one execution layer with a visible next move.",
    icon: Workflow,
  },
  {
    title: "Built for measurable progress",
    description:
      "The product connects pipeline hygiene, prioritisation, analytics, and follow-up momentum so effort compounds instead of fragmenting.",
    icon: LineChart,
  },
  {
    title: "Demonstrates systems thinking",
    description:
      "This is not just a dashboard. It is a product case study in routing, workflow design, state modeling, and recruiter-facing UX narrative.",
    icon: Sparkles,
  },
];

const FEATURE_STRIPS = [
  "Command Centre surfaces the strongest next action first.",
  "Job OS tracks companies, roles, applications, outreach, and assets together.",
  "CV Optimizer links tailoring workflows to live opportunities.",
];

export default function LandingPage() {
  const { session, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400 dark:text-neutral-600">
        Loading session...
      </div>
    );
  }

  if (session) {
    return <Navigate to={appPath()} replace />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_42%,#f7f7f2_100%)] text-slate-950">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(18,75,230,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(230,170,18,0.18),transparent_28%)]" />

      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              JobSprint
            </div>
            <div className="text-sm text-slate-600">
              Product execution layer for modern job search workflows
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Sign in
            </Link>
            <Button asChild className="rounded-full px-5">
              <Link to="/app">
                Open demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 shadow-sm">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              See the system. Enter the workflow.
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">
              A job search product that behaves like an execution system, not a static tracker.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              JobSprint helps candidates act on the right next move, keep their pipeline clean,
              and connect opportunity data to real workflow decisions. It also proves product,
              frontend, and systems-thinking depth in one experience.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-sm font-semibold">
                <Link to="/app">
                  Explore the product
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-6 text-sm font-semibold"
              >
                <Link to="/signin">Go to sign in</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              {FEATURE_STRIPS.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.45)] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.72)]">
            <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,75,230,0.35),rgba(15,23,42,0.98))] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-blue-200">
                    What It Proves
                  </div>
                  <div className="mt-2 text-2xl font-semibold">Product + systems thinking</div>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-white/80">
                  Recruiter-ready
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {[
                  "Intentional information architecture from entry page to authenticated workspace",
                  "Execution-first UX that prioritises decisions instead of passive reporting",
                  "Scalable SPA structure with protected routing, modular pages, and reusable UI",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <p className="text-sm leading-6 text-white/84">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="grid gap-5 lg:grid-cols-3">
            {PROOF_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <article
                  key={point.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_22px_70px_-48px_rgba(15,23,42,0.4)] backdrop-blur"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                    {point.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{point.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-10 shadow-[0_28px_80px_-55px_rgba(15,23,42,0.42)] sm:px-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Why it matters
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Most job searches lose momentum because the workflow is fragmented.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  Roles live in one place, CVs in another, outreach in another, and decisions
                  depend on memory. JobSprint unifies that process into a single system so users
                  can act with more focus, more consistency, and better signal.
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  The result is a job search that is easier to manage, easier to improve, and far
                  more intentional from first outreach to final interview.
                </p>
              </div>
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-sm font-semibold">
                <Link to="/app">
                  Launch JobSprint
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
