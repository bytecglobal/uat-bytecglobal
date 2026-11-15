import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { CLIENT_PROJECTS } from "@/components/client-work-grid";
import ClientWorkGallery from "@/components/client-work-gallery";

const card = "rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-strong hover:bg-subtle";

export const generateStaticParams = () => CLIENT_PROJECTS.map((p) => ({ slug: p.slug }));
export const generateMetadata = ({ params }) => ({
  title: CLIENT_PROJECTS.find((p) => p.slug === params.slug)?.title || "Client Work",
});

export default function ClientWorkPage({ params }) {
  const project = CLIENT_PROJECTS.find((p) => p.slug === params.slug);
  if (!project) notFound();

  return (
    <>
      {/* ── Page Header ── */}
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-muted">{project.tag}</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
            {project.title}
          </h1>
          {project.summary && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {project.summary}
            </p>
          )}
        </div>
      </section>

      {/* ── Image Gallery ── */}
      <section className="border-b border-border py-10">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <ClientWorkGallery project={project} />
        </div>
      </section>

      {/* ── Project Details: Challenge, Solution, Results, Tech Stack ── */}
      <section className="border-b border-border py-20">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div className="grid gap-4 md:grid-cols-2">
            {/* The Challenge */}
            <div className={card}>
              <h2 className="mb-2 font-semibold tracking-[-0.03em]">The challenge</h2>
              <p className="text-muted">{project.challenge}</p>
            </div>

            {/* Our Solution */}
            <div className={card}>
              <h2 className="mb-2 font-semibold tracking-[-0.03em]">Our solution</h2>
              <p className="text-muted">{project.solution}</p>
            </div>

            {/* Results */}
            <div className={card}>
              <h2 className="mb-3 font-semibold tracking-[-0.03em]">Results</h2>
              <ul className="space-y-2">
                {project.results.map((r) => (
                  <li key={r} className="flex gap-2 text-muted">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech Stack */}
            <div className={card}>
              <h2 className="mb-3 font-semibold tracking-[-0.03em]">Tech stack</h2>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-border bg-subtle px-3 py-1.5 font-mono text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div className="rounded-xl border border-border bg-subtle p-10 text-center sm:p-12">
            <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Interested in a similar project?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted">
              Let&rsquo;s discuss how we can build something great for your business.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="https://calendly.com/team-bytecglobal/30min"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
              >
                Book a Meeting
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-subtle"
              >
                View More Projects
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
