import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "cms", async () => {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") || "all";

    const db = getDb();

    if (section === "homepage") {
      return NextResponse.json({
        success: true,
        homepage: db.cms_sections?.homepage || {},
        heroAnimation: db.cms_sections?.heroAnimation || {},
      });
    }

    if (section === "about") {
      return NextResponse.json({ success: true, about: db.cms_sections?.about || {} });
    }

    if (section === "services") {
      return NextResponse.json({ success: true, services: db.cms_services || [] });
    }

    if (section === "solutions") {
      return NextResponse.json({ success: true, solutions: db.cms_solutions || [] });
    }

    if (section === "portfolio") {
      return NextResponse.json({ success: true, portfolio: db.cms_projects || [] });
    }

    if (section === "technologies") {
      return NextResponse.json({ success: true, technologies: db.cms_technologies || [] });
    }

    if (section === "navigation") {
      return NextResponse.json({ success: true, navigation: db.cms_navigation || [] });
    }

    if (section === "footer") {
      return NextResponse.json({ success: true, footer: db.cms_footer || {} });
    }

    return NextResponse.json({
      success: true,
      sections: db.cms_sections || {},
      services: db.cms_services || [],
      solutions: db.cms_solutions || [],
      portfolio: db.cms_projects || [],
      technologies: db.cms_technologies || [],
      navigation: db.cms_navigation || [],
      footer: db.cms_footer || {},
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "cms", async () => {
    const body = await req.json().catch(() => ({}));
    const { section, item } = body;

    if (!section || !item) {
      return NextResponse.json({ success: false, error: "Section and item payload required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    if (section === "services") {
      const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const newService = {
        id: `srv_${slug}`,
        slug,
        title: item.title,
        tagline: item.tagline || "",
        sectionTitle: item.sectionTitle || item.title,
        sectionIntro: item.sectionIntro || "",
        short: item.short || "",
        points: Array.isArray(item.points) ? item.points : [],
        tech: Array.isArray(item.tech) ? item.tech : [],
        process: Array.isArray(item.process) ? item.process : [],
        whoWeWorkWith: item.whoWeWorkWith || "",
        faqs: Array.isArray(item.faqs) ? item.faqs : [],
        displayOrder: (db.cms_services || []).length + 1,
        visibility: true,
        updatedAt: now,
        publishedAt: now,
      };
      if (!db.cms_services) db.cms_services = [];
      db.cms_services.push(newService);
    } else if (section === "solutions") {
      const newSolution = {
        id: `sol_${Date.now()}`,
        title: item.title,
        text: item.text,
        displayOrder: (db.cms_solutions || []).length + 1,
        visibility: true,
        updatedAt: now,
        publishedAt: now,
      };
      if (!db.cms_solutions) db.cms_solutions = [];
      db.cms_solutions.push(newSolution);
    } else if (section === "portfolio") {
      const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const newProject = {
        id: `prj_${slug}`,
        slug,
        title: item.title,
        tag: item.tag || "Software",
        summary: item.summary || "",
        challenge: item.challenge || "",
        solution: item.solution || "",
        results: Array.isArray(item.results) ? item.results : [],
        stack: Array.isArray(item.stack) ? item.stack : [],
        featured: Boolean(item.featured),
        displayOrder: (db.cms_projects || []).length + 1,
        visibility: true,
        updatedAt: now,
        publishedAt: now,
      };
      if (!db.cms_projects) db.cms_projects = [];
      db.cms_projects.push(newProject);
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

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Item created." });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "cms", async () => {
    const body = await req.json().catch(() => ({}));
    const { section, data, publish } = body;

    if (!section || !data) {
      return NextResponse.json({ success: false, error: "Section and data are required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    if (section === "homepage") {
      db.cms_sections.homepage = {
        ...db.cms_sections.homepage,
        ...data,
        updatedAt: now,
        publishedAt: publish ? now : db.cms_sections.homepage.publishedAt,
      };
    } else if (section === "heroAnimation") {
      db.cms_sections.heroAnimation = {
        ...db.cms_sections.heroAnimation,
        ...data,
        updatedAt: now,
        publishedAt: publish ? now : db.cms_sections.heroAnimation.publishedAt,
      };
    } else if (section === "about") {
      db.cms_sections.about = {
        ...db.cms_sections.about,
        ...data,
        updatedAt: now,
        publishedAt: publish ? now : db.cms_sections.about.publishedAt,
      };
    } else if (section === "footer") {
      db.cms_footer = {
        ...db.cms_footer,
        ...data,
        updatedAt: now,
        publishedAt: publish ? now : db.cms_footer.publishedAt,
      };
    } else if (section === "services") {
      // Data is an array of updated services or single item update
      if (Array.isArray(data)) {
        db.cms_services = data;
      } else if (data.id) {
        const idx = (db.cms_services || []).findIndex((s) => s.id === data.id);
        if (idx !== -1) {
          db.cms_services[idx] = { ...db.cms_services[idx], ...data, updatedAt: now };
        }
      }
    } else if (section === "solutions") {
      if (Array.isArray(data)) db.cms_solutions = data;
    } else if (section === "portfolio") {
      if (Array.isArray(data)) db.cms_projects = data;
    } else if (section === "technologies") {
      if (Array.isArray(data)) db.cms_technologies = data;
    } else if (section === "navigation") {
      if (Array.isArray(data)) db.cms_navigation = data;
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

    await saveDb(db);
    return NextResponse.json({ success: true, message: "CMS section updated successfully." });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "cms", async () => {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");
    const id = searchParams.get("id");

    if (!section || !id) {
      return NextResponse.json({ success: false, error: "Section and ID required" }, { status: 400 });
    }

    const db = getDb();
    if (section === "services") {
      db.cms_services = (db.cms_services || []).filter((s) => s.id !== id);
    } else if (section === "solutions") {
      db.cms_solutions = (db.cms_solutions || []).filter((s) => s.id !== id);
    } else if (section === "portfolio") {
      db.cms_projects = (db.cms_projects || []).filter((p) => p.id !== id);
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

    await saveDb(db);
    return NextResponse.json({ success: true, message: "CMS item removed." });
  });
}
