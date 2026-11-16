import { getAdminClient } from "@/lib/supabase/admin";

export const AnalyticsRepository = {
  async recordVisitorSession({ visitorId, landingPage = "/", ip, userAgent }) {
    if (!visitorId) return null;
    const supabase = getAdminClient();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("visitors")
      .select("*")
      .eq("visitor_id", visitorId)
      .maybeSingle();

    if (existing) {
      const pages = Array.isArray(existing.pages_visited) ? existing.pages_visited : [];
      if (!pages.includes(landingPage)) pages.push(landingPage);

      const { data } = await supabase
        .from("visitors")
        .update({
          last_visit: now,
          total_visits: (existing.total_visits || 1) + 1,
          exit_page: landingPage,
          pages_visited: pages,
          ip_address: ip || existing.ip_address,
        })
        .eq("id", existing.id)
        .select()
        .single();
      return data;
    } else {
      const { data } = await supabase
        .from("visitors")
        .insert({
          visitor_id: visitorId,
          first_visit: now,
          last_visit: now,
          total_visits: 1,
          landing_page: landingPage,
          exit_page: landingPage,
          pages_visited: [landingPage],
          ip_address: ip || "",
        })
        .select()
        .single();
      return data;
    }
  },

  async recordEvent({
    eventName,
    path = "/",
    visitorId,
    sessionId,
    browser,
    os,
    device,
    trafficSource,
    metadata = {},
  }) {
    // If a legacy whatsapp_click event is received, ignore it cleanly
    if (eventName === "whatsapp_click") {
      return null;
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("analytics_events")
      .insert({
        event_name: eventName,
        path,
        visitor_id: visitorId || null,
        session_id: sessionId || null,
        browser: browser || "Unknown",
        os: os || "Unknown",
        device: device || "Desktop",
        traffic_source: trafficSource || "Direct",
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.warn("Analytics event insertion error:", error.message);
      return null;
    }
    return data;
  },

  async listVisitors({ page = 1, limit = 50, search, device, source } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("visitors").select("*", { count: "exact" });

    if (search) {
      query = query.or(`visitor_id.ilike.%${search}%,landing_page.ilike.%${search}%,exit_page.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("last_visit", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const visitorIds = (data || []).map((v) => v.visitor_id);
    const eventsMap = {};
    if (visitorIds.length > 0) {
      const { data: evts } = await supabase
        .from("analytics_events")
        .select("visitor_id, browser, os, device, traffic_source")
        .in("visitor_id", visitorIds)
        .order("timestamp", { ascending: false });

      (evts || []).forEach((e) => {
        if (!eventsMap[e.visitor_id]) {
          eventsMap[e.visitor_id] = e;
        }
      });
    }

    let visitors = (data || []).map((v) => {
      const evt = eventsMap[v.visitor_id] || {};
      return {
        id: v.id,
        visitorId: v.visitor_id,
        firstVisit: v.first_visit,
        lastVisit: v.last_visit,
        totalVisits: v.total_visits,
        landingPage: v.landing_page || "/",
        exitPage: v.exit_page || "/",
        pagesVisited: v.pages_visited || [],
        deviceType: evt.device || "Desktop",
        browser: evt.browser || "Chrome",
        os: evt.os || "Windows",
        trafficSource: evt.traffic_source || "Direct",
        ip: v.ip_address,
      };
    });

    if (device && device !== "all") {
      visitors = visitors.filter((v) => v.deviceType === device);
    }
    if (source && source !== "all") {
      visitors = visitors.filter((v) => v.trafficSource === source);
    }

    return {
      visitors,
      total: count || 0,
      page,
      limit,
    };
  },

  async getDashboardAnalytics() {
    const supabase = getAdminClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [visitorsRes, eventsRes, contactsRes, leadsRes, clientsRes, projectsRes] = await Promise.all([
      supabase.from("visitors").select("id", { count: "exact", head: true }),
      supabase.from("analytics_events").select("*").gte("timestamp", thirtyDaysAgo),
      supabase.from("contacts").select("id, status, created_at"),
      supabase.from("leads").select("id, stage, estimated_value"),
      supabase.from("clients").select("id, status, total_value"),
      supabase.from("projects").select("id, status, progress, budget"),
    ]);

    const events = eventsRes.data || [];
    const pageViews = events.filter((e) => e.event_name === "page_view").length;
    const meetingClicks = events.filter((e) => e.event_name === "meeting_click").length;
    const contactSubmissions = contactsRes.data ? contactsRes.data.length : 0;

    const pipelineValue = (leadsRes.data || []).reduce(
      (sum, l) => sum + (Number(l.estimated_value) || 0),
      0
    );

    const activeClientsCount = (clientsRes.data || []).filter((c) => c.status === "active").length;
    const activeProjectsCount = (projectsRes.data || []).filter(
      (p) => p.status === "in_progress" || p.status === "planning"
    ).length;

    // Traffic sources breakdown
    const sourcesMap = {};
    events.forEach((e) => {
      const src = e.traffic_source || "Direct";
      sourcesMap[src] = (sourcesMap[src] || 0) + 1;
    });

    return {
      kpis: {
        totalVisitors: visitorsRes.count || 0,
        pageViews,
        meetingClicks,
        contactSubmissions,
        pipelineValue,
        activeClients: activeClientsCount,
        activeProjects: activeProjectsCount,
      },
      trafficSources: sourcesMap,
      recentContacts: (contactsRes.data || []).slice(0, 5),
    };
  },
};
