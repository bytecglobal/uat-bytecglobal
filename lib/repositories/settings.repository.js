import { getAdminClient } from "@/lib/supabase/admin";

export const SettingsRepository = {
  // ----------------------------------------------------------------------------
  // System Settings (general, security, integrations)
  // Strictly NO WhatsApp or phone integrations.
  // ----------------------------------------------------------------------------
  async getSystemSettings() {
    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      if (error || !data) {
        return this.getDefaultSystemSettings();
      }

      return {
        general: data.general || {},
        security: data.security || {},
        integrations: {
          resend: {
            configured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your_api_key_here"),
            status:
              process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your_api_key_here"
                ? "Connected"
                : "Not Configured",
          },
          calendly: {
            configured: true,
            status: "Connected (Default Meeting Link)",
          },
          supabase: {
            configured: true,
            status: "Connected (Supabase PostgreSQL)",
          },
        },
      };
    } catch {
      return this.getDefaultSystemSettings();
    }
  },

  getDefaultSystemSettings() {
    return {
      general: {
        siteName: "BytecGlobal",
        supportEmail: "bytecglobal@gmail.com",
        timezone: "Asia/Kolkata",
        dateFormat: "YYYY-MM-DD",
        maintenanceMode: false,
      },
      security: {
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        sessionExpiryHours: 24,
        enforceStrongPasswords: true,
      },
      integrations: {
        resend: {
          configured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your_api_key_here"),
          status:
            process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your_api_key_here"
              ? "Connected"
              : "Not Configured",
        },
        calendly: {
          configured: true,
          status: "Connected (Default Meeting Link)",
        },
        supabase: {
          configured: true,
          status: "Connected (Supabase PostgreSQL)",
        },
      },
    };
  },

  async updateSystemSettings(updates = {}) {
    const supabase = getAdminClient();
    const current = await this.getSystemSettings();

    const payload = {
      id: "default",
      general: updates.general ? { ...current.general, ...updates.general } : current.general,
      security: updates.security ? { ...current.security, ...updates.security } : current.security,
      integrations: updates.integrations ? { ...current.integrations, ...updates.integrations } : current.integrations,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("system_settings").upsert(payload);
    if (error) throw new Error(error.message);
    return this.getSystemSettings();
  },

  // ----------------------------------------------------------------------------
  // SEO Settings
  // ----------------------------------------------------------------------------
  async getSeoSettings() {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("seo_settings").select("*");
    if (error || !data || data.length === 0) {
      return {
        global: {
          siteName: "BytecGlobal",
          titleTemplate: "%s | BytecGlobal - Engineering Digital Excellence",
          defaultTitle: "BytecGlobal | Custom Software, AI & Cloud Engineering",
          defaultDescription:
            "BytecGlobal builds enterprise custom software, web platforms, mobile apps, and AI solutions tailored to operational business needs.",
          canonicalBase: "https://bytecglobal.com",
          robots: "index, follow",
          ogImage: "/og-image.png",
        },
        pages: {
          "/": {
            title: "BytecGlobal — Digital Transformation & Custom Software",
            description:
              "We turn spreadsheets, paper forms and manual follow-ups into custom software, web platforms, mobile apps and AI tools.",
          },
          "/about": {
            title: "About Us — BytecGlobal",
            description:
              "Learn about BytecGlobal's philosophy, engineering standards, and mission to deliver exceptional digital platforms.",
          },
          "/services": {
            title: "Services — BytecGlobal Engineering Solutions",
            description: "Full-cycle software engineering: Web, Mobile, AI/ML, Data Science, and Cloud DevOps.",
          },
          "/solutions": {
            title: "Enterprise Solutions — BytecGlobal",
            description: "From custom ERPs to intelligent automation workflows, explore our end-to-end business solutions.",
          },
          "/projects": {
            title: "Client Work & Case Studies — BytecGlobal",
            description: "Explore real enterprise software, mobile apps, and automated dashboards engineered by BytecGlobal.",
          },
          "/technologies": {
            title: "Technology Stack — BytecGlobal",
            description: "Our modern tech stack: React, Next.js, Node.js, Python, PostgreSQL, AWS, and modern AI models.",
          },
          "/contact": {
            title: "Contact Us — BytecGlobal",
            description: "Connect with our engineering leadership to discuss your project requirements or book a consultation.",
          },
        },
      };
    }

    const globalRow = data.find((r) => r.is_global || r.id === "global");
    const pages = {};
    data
      .filter((r) => !r.is_global && r.id !== "global" && r.path)
      .forEach((r) => {
        pages[r.path] = {
          title: r.title,
          description: r.description,
          ...(r.metadata || {}),
        };
      });

    return {
      global: {
        siteName: globalRow?.metadata?.siteName || "BytecGlobal",
        titleTemplate: globalRow?.metadata?.titleTemplate || "%s | BytecGlobal - Engineering Digital Excellence",
        defaultTitle: globalRow?.title || "BytecGlobal | Custom Software, AI & Cloud Engineering",
        defaultDescription: globalRow?.description || "",
        canonicalBase: globalRow?.metadata?.canonicalBase || "https://bytecglobal.com",
        robots: globalRow?.metadata?.robots || "index, follow",
        ogImage: globalRow?.metadata?.ogImage || "/og-image.png",
      },
      pages,
    };
  },

  async updateSeoSettings({ global, pages }) {
    const supabase = getAdminClient();
    if (global) {
      await supabase.from("seo_settings").upsert({
        id: "global",
        is_global: true,
        path: null,
        title: global.defaultTitle,
        description: global.defaultDescription,
        metadata: {
          siteName: global.siteName,
          titleTemplate: global.titleTemplate,
          canonicalBase: global.canonicalBase,
          robots: global.robots,
          ogImage: global.ogImage,
        },
        updated_at: new Date().toISOString(),
      });
    }

    if (pages && typeof pages === "object") {
      for (const [pathKey, pageData] of Object.entries(pages)) {
        const id = `page_${pathKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
        await supabase.from("seo_settings").upsert({
          id,
          is_global: false,
          path: pathKey,
          title: pageData.title || "",
          description: pageData.description || "",
          metadata: pageData,
          updated_at: new Date().toISOString(),
        });
      }
    }

    return this.getSeoSettings();
  },

  // ----------------------------------------------------------------------------
  // Email Templates
  // ----------------------------------------------------------------------------
  async listEmailTemplates() {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("email_templates").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      subject: t.subject,
      content: t.content,
      placeholders: t.placeholders || [],
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  },

  async createEmailTemplate({ name, category, subject, content, placeholders = [] }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        name,
        category,
        subject,
        content,
        placeholders,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      subject: data.subject,
      content: data.content,
      placeholders: data.placeholders,
      createdAt: data.created_at,
    };
  },

  async updateEmailTemplate(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.subject !== undefined) payload.subject = updates.subject;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.placeholders !== undefined) payload.placeholders = updates.placeholders;

    const { data, error } = await supabase.from("email_templates").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteEmailTemplate(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ----------------------------------------------------------------------------
  // Sent Emails Log
  // ----------------------------------------------------------------------------
  async listEmails({ page = 1, limit = 50, search, status } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("emails").select("*", { count: "exact" });
    if (status && status !== "all") query = query.eq("status", status);
    if (search) {
      query = query.or(`recipient_email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      emails: (data || []).map((e) => ({
        id: e.id,
        to: e.recipient_email,
        from: e.sender_email,
        subject: e.subject,
        category: e.category,
        status: e.status,
        providerResponse: e.provider_response,
        sentAt: e.sent_at,
        createdAt: e.created_at,
      })),
      total: count || 0,
      page,
      limit,
    };
  },

  async logEmail({ recipientEmail, senderEmail, subject, category, status, providerResponse }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("emails")
      .insert({
        recipient_email: recipientEmail,
        sender_email: senderEmail || "inquiries@bytecglobal.com",
        subject,
        category: category || "General",
        status: status || "sent",
        provider_response: providerResponse || "",
        sent_at: status === "sent" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) console.warn("Email logging error:", error.message);
    return data;
  },

  // ----------------------------------------------------------------------------
  // Automations & Automation Logs
  // ----------------------------------------------------------------------------
  async listAutomations() {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("automations").select("*").order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((a) => ({
      id: a.id,
      name: a.name,
      trigger: a.trigger_event,
      description: a.description,
      enabled: a.enabled,
      actions: a.actions || [],
      executionCount: a.execution_count,
      lastRunAt: a.last_run_at,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
  },

  async createAutomation({ name, trigger, description, enabled = true, actions = [] }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("automations")
      .insert({
        name,
        trigger_event: trigger,
        description,
        enabled,
        actions,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateAutomation(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.trigger !== undefined) payload.trigger_event = updates.trigger;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.enabled !== undefined) payload.enabled = updates.enabled;
    if (updates.actions !== undefined) payload.actions = updates.actions;

    const { data, error } = await supabase.from("automations").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteAutomation(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("automations").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  async listAutomationLogs({ page = 1, limit = 50 } = {}) {
    const supabase = getAdminClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from("automation_logs")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    return {
      logs: (data || []).map((l) => ({
        id: l.id,
        automationId: l.automation_id,
        automationName: l.automation_name,
        trigger: l.trigger_event,
        status: l.status,
        details: l.details,
        timestamp: l.timestamp,
      })),
      total: count || 0,
      page,
      limit,
    };
  },

  async logAutomationRun({ automationId, automationName, trigger, status, details }) {
    const supabase = getAdminClient();
    await supabase.from("automation_logs").insert({
      automation_id: automationId || null,
      automation_name: automationName || "",
      trigger_event: trigger || "manual",
      status: status || "success",
      details: details || "",
    });

    if (automationId) {
      // Increment execution count and set last_run_at
      const { data: current } = await supabase.from("automations").select("execution_count").eq("id", automationId).single();
      const count = ((current && current.execution_count) || 0) + 1;
      await supabase
        .from("automations")
        .update({
          execution_count: count,
          last_run_at: new Date().toISOString(),
        })
        .eq("id", automationId);
    }
  },

  // ----------------------------------------------------------------------------
  // Testimonials / Reviews
  // ----------------------------------------------------------------------------
  async listTestimonials({ publishedOnly = false } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("testimonials").select("*").order("display_order", { ascending: true });
    if (publishedOnly) query = query.eq("status", "published");

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map((r) => ({
      id: r.id,
      clientName: r.client_name,
      companyName: r.company_name,
      designation: r.designation,
      reviewText: r.review_text,
      rating: r.rating,
      clientImage: r.client_image,
      featured: r.featured,
      status: r.status,
      displayOrder: r.display_order,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async createTestimonial({ clientName, companyName, designation, reviewText, rating = 5, featured = false, status = "published" }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        client_name: clientName,
        company_name: companyName || "",
        designation: designation || "",
        review_text: reviewText,
        rating: Number(rating) || 5,
        featured: Boolean(featured),
        status,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateTestimonial(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.clientName !== undefined) payload.client_name = updates.clientName;
    if (updates.companyName !== undefined) payload.company_name = updates.companyName;
    if (updates.designation !== undefined) payload.designation = updates.designation;
    if (updates.reviewText !== undefined) payload.review_text = updates.reviewText;
    if (updates.rating !== undefined) payload.rating = Number(updates.rating) || 5;
    if (updates.featured !== undefined) payload.featured = updates.featured;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;

    const { data, error } = await supabase.from("testimonials").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteTestimonial(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  // ----------------------------------------------------------------------------
  // Newsletter Subscribers
  // ----------------------------------------------------------------------------
  async listNewsletterSubscribers({ page = 1, limit = 50 } = {}) {
    const supabase = getAdminClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact" })
      .order("subscribed_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    return {
      subscribers: (data || []).map((s) => ({
        id: s.id,
        email: s.email,
        status: s.status,
        campaignsReceived: s.campaigns_received,
        subscribedAt: s.subscribed_at,
      })),
      total: count || 0,
      page,
      limit,
    };
  },

  async addNewsletterSubscriber(email) {
    const supabase = getAdminClient();
    const normalized = email.trim().toLowerCase();
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email: normalized, status: "subscribed" }, { onConflict: "email" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteNewsletterSubscriber(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },
};
