import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { CmsRepository } from "@/lib/repositories/cms.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "cms", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const section = searchParams.get("section") || "all";

      if (section === "homepage") {
        const sections = await CmsRepository.getSections();
        return NextResponse.json({
          success: true,
          homepage: sections.homepage || {},
          heroAnimation: sections.heroAnimation || {},
        });
      }

      if (section === "about") {
        const sections = await CmsRepository.getSections();
        return NextResponse.json({ success: true, about: sections.about || {} });
      }

      if (section === "services") {
        const services = await CmsRepository.listServices({ publishedOnly: false });
        return NextResponse.json({ success: true, services });
      }

      if (section === "solutions") {
        const solutions = await CmsRepository.listSolutions({ publishedOnly: false });
        return NextResponse.json({ success: true, solutions });
      }

      if (section === "portfolio") {
        const portfolio = await CmsRepository.listProjects({ publishedOnly: false });
        return NextResponse.json({ success: true, portfolio });
      }

      if (section === "technologies") {
        const technologies = await CmsRepository.listTechnologies({ publishedOnly: false });
        return NextResponse.json({ success: true, technologies });
      }

      if (section === "navigation") {
        const navigation = await CmsRepository.listNavigation({ publishedOnly: false });
        return NextResponse.json({ success: true, navigation });
      }

      if (section === "footer") {
        const footer = await CmsRepository.getFooter();
        return NextResponse.json({ success: true, footer });
      }

      const allCms = await CmsRepository.getAllCms();
      return NextResponse.json({
        success: true,
        sections: allCms.sections,
        services: allCms.services,
        solutions: allCms.solutions,
        portfolio: allCms.projects,
        technologies: allCms.technologies,
        navigation: allCms.navigation,
        footer: allCms.footer,
      });
    } catch (err) {
      console.error("CMS GET error:", err);
      return NextResponse.json({ success: false, error: "Failed to load CMS data." }, { status: 500 });
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "cms", async (r, admin) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { section, item } = body;

      if (!section || !item) {
        return NextResponse.json({ success: false, error: "Section and item payload required" }, { status: 400 });
      }

      if (section === "services") {
        const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await CmsRepository.createService({ ...item, slug });
      } else if (section === "solutions") {
        await CmsRepository.createSolution(item);
      } else if (section === "portfolio") {
        const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await CmsRepository.createProject({ ...item, slug });
      } else if (section === "technologies") {
        await CmsRepository.createTechnology(item);
      }

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CMS_CREATE_ITEM",
        module: "CMS",
        recordId: section,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created new ${section} item in CMS.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Item created." });
    } catch (err) {
      console.error("CMS POST error:", err);
      return NextResponse.json({ success: false, error: "Failed to create CMS item." }, { status: 500 });
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "cms", async (r, admin) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { section, data, publish } = body;

      if (!section || !data) {
        return NextResponse.json({ success: false, error: "Section and data are required" }, { status: 400 });
      }

      if (section === "homepage" || section === "heroAnimation" || section === "about" || section === "branding") {
        await CmsRepository.updateSection(section, data, true);
      } else if (section === "footer") {
        await CmsRepository.updateFooter(data);
      } else if (section === "services") {
        if (Array.isArray(data)) {
          for (const s of data) {
            if (s.id) await CmsRepository.updateService(s.id, s);
          }
        } else if (data.id) {
          await CmsRepository.updateService(data.id, data);
        }
      } else if (section === "solutions") {
        if (Array.isArray(data)) {
          for (const sol of data) {
            if (sol.id) await CmsRepository.updateSolution(sol.id, sol);
          }
        } else if (data.id) {
          await CmsRepository.updateSolution(data.id, data);
        }
      } else if (section === "portfolio") {
        if (Array.isArray(data)) {
          for (const p of data) {
            if (p.id) await CmsRepository.updateProject(p.id, p);
          }
        } else if (data.id) {
          await CmsRepository.updateProject(data.id, data);
        }
      } else if (section === "technologies") {
        if (Array.isArray(data)) {
          for (const t of data) {
            if (t.id) await CmsRepository.updateTechnology(t.id, t);
          }
        } else if (data.id) {
          await CmsRepository.updateTechnology(data.id, data);
        }
      } else if (section === "navigation") {
        if (Array.isArray(data)) {
          for (const n of data) {
            if (n.id) await CmsRepository.updateNavigation(n.id, n);
          }
        } else if (data.id) {
          await CmsRepository.updateNavigation(data.id, data);
        }
      }

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: publish ? "CMS_PUBLISH_SECTION" : "CMS_UPDATE_SECTION",
        module: "CMS",
        recordId: section,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `${publish ? "Published" : "Updated"} CMS section: ${section}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "CMS section updated successfully." });
    } catch (err) {
      console.error("CMS PATCH error:", err);
      return NextResponse.json({ success: false, error: "Failed to update CMS section." }, { status: 500 });
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "cms", async (r, admin) => {
    try {
      const { searchParams } = new URL(req.url);
      const section = searchParams.get("section");
      const id = searchParams.get("id");

      if (!section || !id) {
        return NextResponse.json({ success: false, error: "Section and ID required" }, { status: 400 });
      }

      if (section === "services") {
        await CmsRepository.deleteService(id);
      } else if (section === "solutions") {
        await CmsRepository.deleteSolution(id);
      } else if (section === "portfolio") {
        await CmsRepository.deleteProject(id);
      } else if (section === "technologies") {
        await CmsRepository.deleteTechnology(id);
      }

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CMS_DELETE_ITEM",
        module: "CMS",
        recordId: id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted CMS item ${id} from ${section}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "CMS item removed." });
    } catch (err) {
      console.error("CMS DELETE error:", err);
      return NextResponse.json({ success: false, error: "Failed to delete CMS item." }, { status: 500 });
    }
  });
}
