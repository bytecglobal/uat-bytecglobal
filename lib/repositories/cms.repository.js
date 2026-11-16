import { getAdminClient } from "@/lib/supabase/admin";
import { SITE, SERVICES, SOLUTIONS, PROJECTS, TECH, NAV } from "@/lib/site";

export const CmsRepository = {
  // ----------------------------------------------------------------------------
  // Sections (homepage, heroAnimation, about, branding)
  // ----------------------------------------------------------------------------
  async getSections() {
    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase.from("cms_sections").select("*");
      if (error || !data || data.length === 0) {
        return this.getDefaultSections();
      }

      const sections = {};
      data.forEach((row) => {
        sections[row.id] = {
          ...row.data,
          visibility: row.visibility,
          updatedAt: row.updated_at,
          publishedAt: row.published_at,
        };
      });

      // Fill in any missing section with defaults
      const defaults = this.getDefaultSections();
      return { ...defaults, ...sections };
    } catch {
      return this.getDefaultSections();
    }
  },

  getDefaultSections() {
    const now = new Date().toISOString();
    return {
      homepage: {
        categoryText: "Software · AI · Cloud · Data",
        mainHeading: "Your digital transformation",
        highlightedHeading: "partner.",
        description:
          "We turn spreadsheets, paper forms and manual follow-ups into custom software, web platforms, mobile apps and AI tools, built around how your business really works.",
        primaryButtonText: "Let's talk",
        primaryButtonUrl: "/start-project",
        secondaryButtonText: "See our work",
        secondaryButtonUrl: "/projects",
        tags: ["100% custom-built", "Web, mobile, AI & cloud under one roof"],
        visibility: true,
        updatedAt: now,
      },
      heroAnimation: {
        enabled: true,
        particleCount: 160,
        particleSize: 3,
        animationSpeed: 1,
        visibility: true,
        behavior: "interactive-orbit",
        updatedAt: now,
      },
      about: {
        heading: "Engineering Digital Excellence for Forward-Thinking Enterprises",
        subheading: "Custom solutions crafted around how your business really operates.",
        content:
          "BytecGlobal is a premier technology partner specializing in enterprise custom software, cloud architecture, and artificial intelligence solutions. We replace manual friction with seamless, reliable software.",
        visibility: true,
        updatedAt: now,
      },
      branding: {
        name: SITE.name || "BytecGlobal",
        tagline: "Your digital transformation partner.",
        primaryColor: "#f5c518",
        accentInk: "#806000",
        darkBackground: "#29251b",
        logoText: "BytecGlobal",
        contactEmail: "bytecglobal@gmail.com",
        location: "India",
        visibility: true,
        updatedAt: now,
      },
    };
  },

  async updateSection(sectionId, data, visibility = true) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("cms_sections").upsert({
      id: sectionId,
      data,
      visibility,
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return true;
  },

  // ----------------------------------------------------------------------------
  // Services
  // ----------------------------------------------------------------------------
  async listServices({ publishedOnly = false } = {}) {
    try {
      const supabase = getAdminClient();
      let query = supabase.from("cms_services").select("*").order("display_order", { ascending: true });
      if (publishedOnly) query = query.eq("visibility", true);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return SERVICES.map((srv, idx) => ({
          id: `srv_${srv.slug}`,
          slug: srv.slug,
          title: srv.title,
          tagline: srv.tagline,
          sectionTitle: srv.sectionTitle,
          sectionIntro: srv.sectionIntro,
          short: srv.short,
          points: srv.points,
          tech: srv.tech || [],
          process: srv.process,
          whoWeWorkWith: srv.whoWeWorkWith,
          faqs: srv.faqs,
          finalCTA: srv.finalCTA,
          displayOrder: idx + 1,
          visibility: true,
        }));
      }

      return data.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        tagline: s.tagline,
        sectionTitle: s.section_title,
        sectionIntro: s.section_intro,
        short: s.short_desc,
        points: s.points || [],
        tech: s.tech || [],
        process: s.process || [],
        whoWeWorkWith: s.who_we_work_with || [],
        faqs: s.faqs || [],
        finalCTA: s.final_cta || {},
        displayOrder: s.display_order,
        visibility: s.visibility,
        updatedAt: s.updated_at,
      }));
    } catch {
      return SERVICES;
    }
  },

  async createService(service) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("cms_services")
      .insert({
        slug: service.slug,
        title: service.title,
        tagline: service.tagline || "",
        section_title: service.sectionTitle || "",
        section_intro: service.sectionIntro || "",
        short_desc: service.short || "",
        points: service.points || [],
        tech: service.tech || [],
        process: service.process || [],
        who_we_work_with: service.whoWeWorkWith || [],
        faqs: service.faqs || [],
        final_cta: service.finalCTA || {},
        display_order: service.displayOrder || 1,
        visibility: service.visibility !== undefined ? service.visibility : true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateService(id, updates) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.tagline !== undefined) payload.tagline = updates.tagline;
    if (updates.sectionTitle !== undefined) payload.section_title = updates.sectionTitle;
    if (updates.sectionIntro !== undefined) payload.section_intro = updates.sectionIntro;
    if (updates.short !== undefined) payload.short_desc = updates.short;
    if (updates.points !== undefined) payload.points = updates.points;
    if (updates.tech !== undefined) payload.tech = updates.tech;
    if (updates.process !== undefined) payload.process = updates.process;
    if (updates.whoWeWorkWith !== undefined) payload.who_we_work_with = updates.whoWeWorkWith;
    if (updates.faqs !== undefined) payload.faqs = updates.faqs;
    if (updates.finalCTA !== undefined) payload.final_cta = updates.finalCTA;
    if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
    if (updates.visibility !== undefined) payload.visibility = updates.visibility;

    const { data, error } = await supabase.from("cms_services").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteService(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("cms_services").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ----------------------------------------------------------------------------
  // Solutions
  // ----------------------------------------------------------------------------
  async listSolutions({ publishedOnly = false } = {}) {
    try {
      const supabase = getAdminClient();
      let query = supabase.from("cms_solutions").select("*").order("display_order", { ascending: true });
      if (publishedOnly) query = query.eq("visibility", true);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return SOLUTIONS.map((sol, idx) => ({
          id: `sol_${idx + 1}`,
          title: sol.title,
          text: sol.text,
          displayOrder: idx + 1,
          visibility: true,
        }));
      }

      return data.map((s) => ({
        id: s.id,
        title: s.title,
        text: s.text,
        displayOrder: s.display_order,
        visibility: s.visibility,
        updatedAt: s.updated_at,
      }));
    } catch {
      return SOLUTIONS;
    }
  },

  async createSolution(solution) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("cms_solutions")
      .insert({
        title: solution.title,
        text: solution.text,
        display_order: solution.displayOrder || 1,
        visibility: solution.visibility !== undefined ? solution.visibility : true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateSolution(id, updates) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.text !== undefined) payload.text = updates.text;
    if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
    if (updates.visibility !== undefined) payload.visibility = updates.visibility;

    const { data, error } = await supabase.from("cms_solutions").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteSolution(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("cms_solutions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ----------------------------------------------------------------------------
  // Projects (Portfolio)
  // ----------------------------------------------------------------------------
  async listProjects({ publishedOnly = false } = {}) {
    try {
      const supabase = getAdminClient();
      let query = supabase.from("cms_projects").select("*").order("display_order", { ascending: true });
      if (publishedOnly) query = query.eq("visibility", true);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return PROJECTS.map((prj, idx) => ({
          id: `prj_${prj.slug}`,
          slug: prj.slug,
          title: prj.title,
          tag: prj.tag,
          summary: prj.summary,
          challenge: prj.challenge,
          solution: prj.solution,
          results: prj.results,
          stack: prj.stack,
          featured: true,
          displayOrder: idx + 1,
          visibility: true,
        }));
      }

      return data.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        tag: p.tag,
        summary: p.summary,
        challenge: p.challenge,
        solution: p.solution,
        results: p.results || [],
        stack: p.stack || [],
        featured: p.featured,
        displayOrder: p.display_order,
        visibility: p.visibility,
        updatedAt: p.updated_at,
      }));
    } catch {
      return PROJECTS;
    }
  },

  async createProject(project) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("cms_projects")
      .insert({
        slug: project.slug,
        title: project.title,
        tag: project.tag || "",
        summary: project.summary || "",
        challenge: project.challenge || "",
        solution: project.solution || "",
        results: project.results || [],
        stack: project.stack || [],
        featured: Boolean(project.featured),
        display_order: project.displayOrder || 1,
        visibility: project.visibility !== undefined ? project.visibility : true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateProject(id, updates) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.tag !== undefined) payload.tag = updates.tag;
    if (updates.summary !== undefined) payload.summary = updates.summary;
    if (updates.challenge !== undefined) payload.challenge = updates.challenge;
    if (updates.solution !== undefined) payload.solution = updates.solution;
    if (updates.results !== undefined) payload.results = updates.results;
    if (updates.stack !== undefined) payload.stack = updates.stack;
    if (updates.featured !== undefined) payload.featured = updates.featured;
    if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
    if (updates.visibility !== undefined) payload.visibility = updates.visibility;

    const { data, error } = await supabase.from("cms_projects").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteProject(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("cms_projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ----------------------------------------------------------------------------
  // Technologies
  // ----------------------------------------------------------------------------
  async listTechnologies({ publishedOnly = false } = {}) {
    try {
      const supabase = getAdminClient();
      let query = supabase.from("cms_technologies").select("*").order("display_order", { ascending: true });
      if (publishedOnly) query = query.eq("visibility", true);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return TECH.map((t, idx) => ({
          id: `tech_${idx + 1}`,
          group: t.group,
          items: t.items,
          displayOrder: idx + 1,
          visibility: true,
        }));
      }

      return data.map((t) => ({
        id: t.id,
        group: t.group_name,
        items: t.items || [],
        displayOrder: t.display_order,
        visibility: t.visibility,
        updatedAt: t.updated_at,
      }));
    } catch {
      return TECH;
    }
  },

  async createTechnology(tech) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("cms_technologies")
      .insert({
        group_name: tech.group || tech.group_name,
        items: tech.items || [],
        display_order: tech.displayOrder || 1,
        visibility: tech.visibility !== undefined ? tech.visibility : true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateTechnology(id, updates) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.group !== undefined || updates.group_name !== undefined) {
      payload.group_name = updates.group || updates.group_name;
    }
    if (updates.items !== undefined) payload.items = updates.items;
    if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
    if (updates.visibility !== undefined) payload.visibility = updates.visibility;

    const { data, error } = await supabase.from("cms_technologies").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteTechnology(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("cms_technologies").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ----------------------------------------------------------------------------
  // Navigation & Footer
  // ----------------------------------------------------------------------------
  async listNavigation({ publishedOnly = false } = {}) {
    try {
      const supabase = getAdminClient();
      let query = supabase.from("cms_navigation").select("*").order("display_order", { ascending: true });
      if (publishedOnly) query = query.eq("visibility", true);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return NAV.map((item, idx) => ({
          id: `nav_${idx + 1}`,
          label: item.label,
          href: item.href,
          dropdown: Boolean(item.dropdown),
          displayOrder: idx + 1,
          visibility: true,
        }));
      }

      return data.map((n) => ({
        id: n.id,
        label: n.label,
        href: n.href,
        dropdown: n.has_dropdown,
        displayOrder: n.display_order,
        visibility: n.visibility,
        updatedAt: n.updated_at,
      }));
    } catch {
      return NAV;
    }
  },

  async updateNavigation(id, updates) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.label !== undefined) payload.label = updates.label;
    if (updates.href !== undefined) payload.href = updates.href;
    if (updates.dropdown !== undefined) payload.has_dropdown = updates.dropdown;
    if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
    if (updates.visibility !== undefined) payload.visibility = updates.visibility;

    const { data, error } = await supabase.from("cms_navigation").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getFooter() {
    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase.from("cms_footer").select("*").eq("id", "main").maybeSingle();
      if (error || !data) {
        return this.getDefaultFooter();
      }

      return {
        brandDescription: data.brand_description,
        contactEmail: data.contact_email,
        meetingUrl: data.meeting_url,
        meetingLabel: data.meeting_label,
        adminLoginLink: data.admin_login_link,
        copyrightText: data.copyright_text,
        companyLinks: data.company_links || [],
        socialLinks: data.social_links || [],
        visibility: data.visibility,
        updatedAt: data.updated_at,
      };
    } catch {
      return this.getDefaultFooter();
    }
  },

  getDefaultFooter() {
    return {
      brandDescription: "Software, AI and cloud engineering for ambitious businesses.",
      contactEmail: "bytecglobal@gmail.com",
      meetingUrl: "https://calendly.com/team-bytecglobal/30min",
      meetingLabel: "Book a Meeting",
      adminLoginLink: {
        label: "Admin Login",
        url: "/admin/login",
        enabled: true,
        displayOrder: 2,
        showLockIcon: true,
      },
      copyrightText: `© ${new Date().getFullYear()} BytecGlobal. All rights reserved.`,
      companyLinks: [
        { label: "About", href: "/about", enabled: true },
        { label: "How we work", href: "/how-we-work", enabled: true },
        { label: "Projects", href: "/projects", enabled: true },
        { label: "Technologies", href: "/technologies", enabled: true },
        { label: "Contact", href: "/contact", enabled: true },
      ],
      socialLinks: [
        { platform: "LinkedIn", url: "https://linkedin.com", enabled: true },
        { platform: "GitHub", url: "https://github.com", enabled: true },
      ],
      visibility: true,
    };
  },

  async updateFooter(updates) {
    const supabase = getAdminClient();
    const payload = { id: "main" };
    if (updates.brandDescription !== undefined) payload.brand_description = updates.brandDescription;
    if (updates.contactEmail !== undefined) payload.contact_email = updates.contactEmail;
    if (updates.meetingUrl !== undefined) payload.meeting_url = updates.meetingUrl;
    if (updates.meetingLabel !== undefined) payload.meeting_label = updates.meetingLabel;
    if (updates.adminLoginLink !== undefined) payload.admin_login_link = updates.adminLoginLink;
    if (updates.copyrightText !== undefined) payload.copyright_text = updates.copyrightText;
    if (updates.companyLinks !== undefined) payload.company_links = updates.companyLinks;
    if (updates.socialLinks !== undefined) payload.social_links = updates.socialLinks;
    if (updates.visibility !== undefined) payload.visibility = updates.visibility;

    const { error } = await supabase.from("cms_footer").upsert(payload);
    if (error) throw new Error(error.message);
    return true;
  },

  // ----------------------------------------------------------------------------
  // Aggregated Full CMS Payload (for Admin Panel /api/admin/cms)
  // ----------------------------------------------------------------------------
  async getAllCms() {
    const [sections, services, solutions, projects, technologies, navigation, footer] = await Promise.all([
      this.getSections(),
      this.listServices({ publishedOnly: false }),
      this.listSolutions({ publishedOnly: false }),
      this.listProjects({ publishedOnly: false }),
      this.listTechnologies({ publishedOnly: false }),
      this.listNavigation({ publishedOnly: false }),
      this.getFooter(),
    ]);

    return {
      sections,
      services,
      solutions,
      projects,
      technologies,
      navigation,
      footer,
    };
  },
};
