import Link from "next/link";
import { LayoutTemplate, Info, Layers, Sparkles, Briefcase, Cpu, Navigation, Footprints, ArrowRight } from "lucide-react";

const CMS_CARDS = [
  {
    title: "Homepage Hero & Animation",
    description: "Manage hero headline, action buttons, category tags, and the interactive 3D particle sphere.",
    href: "/admin/cms/homepage",
    icon: LayoutTemplate,
  },
  {
    title: "About Us Section",
    description: "Company history, engineering ethos, value proposition, and public narrative.",
    href: "/admin/cms/about",
    icon: Info,
  },
  {
    title: "Services Catalog",
    description: "All 8 corporate services: Software, Web, Mobile, AI/ML, Data Science, Cloud, Guidance, and SEO.",
    href: "/admin/cms/services",
    icon: Layers,
  },
  {
    title: "Business Solutions",
    description: "ERP systems, online portals, mobile platforms, dashboards, and cloud migrations.",
    href: "/admin/cms/solutions",
    icon: Sparkles,
  },
  {
    title: "Portfolio & Case Studies",
    description: "Real enterprise software stories, architectures, challenges, and measurable ROI.",
    href: "/admin/cms/portfolio",
    icon: Briefcase,
  },
  {
    title: "Technology Stack",
    description: "Frontend, backend, database, AI, and DevOps technology badges and toolsets.",
    href: "/admin/cms/technologies",
    icon: Cpu,
  },
  {
    title: "Header Navigation",
    description: "Menu hierarchy, mega dropdown toggles, display ordering, and external booking links.",
    href: "/admin/cms/navigation",
    icon: Navigation,
  },
  {
    title: "Footer & Admin Access",
    description: "4-column dark footer, corporate blurb, copyright, and the public Admin Login link toggle.",
    href: "/admin/cms/footer",
    icon: Footprints,
  },
];

export default function CMSOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
          Website Content Management System (CMS)
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Direct real-time control over all public BytecGlobal marketing pages, services, case studies, and brand copy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {CMS_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:border-[#f5c518] hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#806000] group-hover:bg-[#f5c518] group-hover:text-[#181613] transition">
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-sm text-gray-900 mt-3 group-hover:text-[#806000] transition">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{card.description}</p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#806000] border-t border-gray-50 pt-3">
                <span>Manage Section</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
