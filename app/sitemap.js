import { SITE, SERVICES, PROJECTS } from "@/lib/site";
import { CLIENT_PROJECTS } from "@/components/client-work-grid";

export default function sitemap() {
  const lastModified = new Date();

  // Core static pages with priority and change frequencies
  const corePages = [
    { path: "", changeFrequency: "weekly", priority: 1.0 },
    { path: "/services", changeFrequency: "weekly", priority: 0.9 },
    { path: "/solutions", changeFrequency: "monthly", priority: 0.8 },
    { path: "/projects", changeFrequency: "monthly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/technologies", changeFrequency: "monthly", priority: 0.7 },
    { path: "/how-we-work", changeFrequency: "monthly", priority: 0.7 },
    { path: "/start-project", changeFrequency: "monthly", priority: 0.9 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.9 },
    { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  ].map((page) => ({
    url: `${SITE.url}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Dynamic service detail pages
  const servicePages = SERVICES.map((s) => ({
    url: `${SITE.url}/services/${s.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  // Dynamic project showcase pages
  const projectPages = PROJECTS.map((p) => ({
    url: `${SITE.url}/projects/${p.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  // Dynamic client work case study pages
  const clientWorkPages = CLIENT_PROJECTS.map((p) => ({
    url: `${SITE.url}/client-work/${p.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...corePages, ...servicePages, ...projectPages, ...clientWorkPages];
}
