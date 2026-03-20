import { ArrowRight, CheckCircle2, ExternalLink, FolderKanban, Sparkles } from "lucide-react";
import analyticsScreenshot from "../../../docs/assets/analytics.png";
import dashboardScreenshot from "../../../docs/assets/dashboard.png";

const liveAppUrl = "https://job-sprint-ten.vercel.app/";
const repoUrl = "https://github.com/romazzz/JobSprint";

const outcomes = [
  {
    title: "Stable CV-to-application history",
    body: "Applications now store a durable cvAssetId so renames do not break the historical record.",
  },
  {
    title: "Intentional CV library",
    body: "Users can keep up to five managed variants, set a default, duplicate strong baselines, and see where each asset is used.",
  },
  {
    title: "Reusable scripts and templates",
    body: "Assets Vault moved from passive storage to inline editing with delete confirmations and explicit feedback.",
  },
];

const demoFlow = [
  "Create a base CV, then duplicate it into a role-specific variant.",
  "Mark the tailored variant as the default recommendation.",
  "Rename the original CV and confirm linked applications still resolve correctly.",
  "Open CV Optimizer and show that the selected application pulls the right CV context.",
];

const productSignals = [
  "Dashboard focuses the candidate on next actions instead of raw record-keeping.",
  "Analytics makes execution quality and funnel movement visible.",
  "Assets Vault keeps the inputs stable enough for tailoring, reuse, and review.",
];

export default function CaseStudyAssetsVaultPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_46%,#f9f4ea_100%)] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(18,75,230,0.24),transparent_45%),radial-gradient(circle_at_top_right,rgba(230,170,18,0.18),transparent_38%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-white/85 px-4 py-2 text-sm font-medium text-brand-blue shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Shareable Product Story
            </div>
            <h1 className="mt-6 max-w-3xl font-['Space_Grotesk',Inter,sans-serif] text-4xl leading-tight font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Assets Vault turned JobSprint from a tracker into a small CV operating system.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Most job-search tools stop at storing applications. This feature focused on the execution
              inputs behind those applications: durable CV variants, reusable text assets, and links that
              stay trustworthy after edits.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.55)] backdrop-blur sm:min-w-80">
            <div className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Proof of Work</div>
            <a
              className="inline-flex items-center justify-between rounded-2xl bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-mid"
              href={liveAppUrl}
            >
              Open live app
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-blue/30 hover:text-brand-blue"
              href={repoUrl}
            >
              View repository
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_30px_80px_-40px_rgba(18,75,230,0.45)]">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-brand-blue">
              <FolderKanban className="h-4 w-4" />
              Problem
            </div>
            <h2 className="mt-4 font-['Space_Grotesk',Inter,sans-serif] text-3xl tracking-[-0.03em] text-slate-950">
              Static CV files break down as soon as a search branches into multiple lanes.
            </h2>
            <div className="mt-6 grid gap-3 text-sm leading-7 text-slate-700 sm:text-base">
              <p>One generic document gets overloaded.</p>
              <p>Application rows drift away from the version that was actually submitted.</p>
              <p>Renaming or replacing a CV makes historical context ambiguous.</p>
              <p>Reusable outreach scripts become copy-paste clutter instead of assets.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-amber/25 bg-brand-dark p-7 text-white shadow-[0_30px_80px_-45px_rgba(60,55,44,0.8)]">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-amber">Outcome</div>
            <h2 className="mt-4 font-['Space_Grotesk',Inter,sans-serif] text-3xl tracking-[-0.03em]">
              The app now keeps execution inputs clean, reusable, and historically trustworthy.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-200 sm:text-base">
              {productSignals.map((signal) => (
                <div key={signal} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand-amber" />
                  <p>{signal}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {outcomes.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-slate-200/90 bg-white/90 p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.5)] backdrop-blur"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">What changed</div>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-blue">Product context</div>
            <h2 className="mt-3 font-['Space_Grotesk',Inter,sans-serif] text-3xl tracking-[-0.03em] text-slate-950">
              The feature sits inside a broader execution system.
            </h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-7 text-slate-600 lg:block">
            These screenshots show the framing around the feature: JobSprint is helping the candidate decide,
            act, and iterate instead of just maintaining rows in a table.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_26px_80px_-45px_rgba(18,75,230,0.45)]">
            <img
              alt="JobSprint dashboard view with execution-focused widgets"
              className="h-full w-full object-cover object-top"
              src={dashboardScreenshot}
            />
            <figcaption className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
              Dashboard context: next actions, pipeline stats, and probability framing.
            </figcaption>
          </figure>

          <figure className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_26px_80px_-45px_rgba(145,120,60,0.38)]">
            <img
              alt="JobSprint analytics view showing funnel and execution trends"
              className="h-full w-full object-cover object-top"
              src={analyticsScreenshot}
            />
            <figcaption className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
              Analytics context: visible conversion, effort, and search quality signals.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.45)] lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-blue">Suggested demo flow</div>
            <h2 className="mt-3 font-['Space_Grotesk',Inter,sans-serif] text-3xl tracking-[-0.03em] text-slate-950">
              A reviewer can understand the improvement in under three minutes.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              This is the sequence to use when sharing the feature live or in a short recording.
            </p>
          </div>

          <ol className="space-y-4">
            {demoFlow.map((step, index) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-700 sm:text-base"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
