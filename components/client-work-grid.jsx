import Link from "next/link";
import { SDG_PROJECTS } from "@/lib/site";

// The home page "Recent client projects" grid and the /client-work/[slug] detail
// pages are driven by the shared SDG_PROJECTS list defined in lib/site.
export const CLIENT_PROJECTS = SDG_PROJECTS;

export default function ClientWorkGrid() {
  return (
    <div className="client-work-grid grid gap-6 sm:grid-cols-2">
      {CLIENT_PROJECTS.map((p) => (
        <Link key={p.slug} href={`/client-work/${p.slug}`} className="client-work-card group">
          <div className="client-work-image relative aspect-video w-full overflow-hidden rounded-xl">
            <img
              src={p.cover}
              alt={p.title}
              loading="lazy"
              className="h-full w-full object-contain"
            />

          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.08em] text-muted">{p.tag}</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">{p.title}</h3>
          <p className="mt-1 text-sm text-muted">{p.summary}</p>
        </Link>
      ))}
    </div>
  );
}
