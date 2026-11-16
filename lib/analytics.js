import { AnalyticsRepository } from "@/lib/repositories/analytics.repository";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Parses user agent string to extract clean browser, os, and device type
 */
export function parseUserAgent(ua = "") {
  let browser = "Other";
  let os = "Other";
  let device = "Desktop";

  if (!ua) return { browser, os, device };

  // Device
  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/tablet|ipad/i.test(ua)) device = "Tablet";
  else device = "Desktop";

  // Browser
  if (/edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  // OS
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { browser, os, device };
}

/**
 * Ingests an analytics event (beacon) sent from the public website
 */
export async function trackEvent({
  eventName,
  path = "/",
  visitorId,
  sessionId,
  referrer = "",
  userAgent = "",
  ip = "127.0.0.1",
  metadata = {},
}) {
  // If legacy whatsapp_click is fired, ignore cleanly
  if (eventName === "whatsapp_click") {
    return { ignored: true };
  }

  const { browser, os, device } = parseUserAgent(userAgent);

  const cleanVisitorId = visitorId || `vis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cleanSessionId = sessionId || `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Determine traffic source
  let trafficSource = "Direct";
  if (referrer) {
    if (referrer.includes("google") || referrer.includes("bing") || referrer.includes("yahoo") || referrer.includes("duckduckgo")) {
      trafficSource = "Organic Search";
    } else if (referrer.includes("linkedin") || referrer.includes("twitter") || referrer.includes("facebook") || referrer.includes("instagram")) {
      trafficSource = "Social Media";
    } else if (!referrer.includes("bytecglobal.com") && !referrer.includes("localhost")) {
      trafficSource = "Referral";
    }
  }

  // Record visitor in PostgreSQL
  await AnalyticsRepository.recordVisitorSession({
    visitorId: cleanVisitorId,
    landingPage: path,
    ip,
    userAgent,
  });

  // Record event in PostgreSQL
  const event = await AnalyticsRepository.recordEvent({
    eventName,
    path,
    visitorId: cleanVisitorId,
    sessionId: cleanSessionId,
    browser,
    os,
    device,
    trafficSource,
    metadata,
  });

  return {
    visitorId: cleanVisitorId,
    sessionId: cleanSessionId,
    eventId: event?.id || `evt_${Date.now()}`,
  };
}

/**
 * Computes dashboard and analytics metrics based on Supabase PostgreSQL records
 */
export async function getAnalyticsOverview(dateRange = "30d") {
  const supabase = getAdminClient();
  const now = new Date();

  let daysBack = 30;
  if (dateRange === "today") daysBack = 1;
  else if (dateRange === "yesterday") daysBack = 2;
  else if (dateRange === "7d") daysBack = 7;
  else if (dateRange === "30d") daysBack = 30;
  else if (dateRange === "90d") daysBack = 90;

  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const [visitorsRes, eventsRes, contactsRes, leadsRes, meetingsRes] = await Promise.all([
    supabase.from("visitors").select("*").gte("last_visit", cutoff),
    supabase.from("analytics_events").select("*").gte("timestamp", cutoff),
    supabase.from("contacts").select("*").gte("created_at", cutoff),
    supabase.from("leads").select("*").gte("created_at", cutoff),
    supabase.from("meetings").select("*").gte("created_at", cutoff),
  ]);

  const visitorsInRange = visitorsRes.data || [];
  const eventsInRange = eventsRes.data || [];
  const contactsInRange = contactsRes.data || [];
  const leadsInRange = leadsRes.data || [];
  const meetingsInRange = meetingsRes.data || [];

  const totalVisitors = visitorsInRange.length;
  const uniqueVisitors = new Set(visitorsInRange.map((v) => v.visitor_id)).size;
  const returningVisitors = visitorsInRange.filter((v) => (v.total_visits || 1) > 1).length;
  const totalPageViews = eventsInRange.filter((e) => e.event_name === "page_view").length;
  const meetingClicks = eventsInRange.filter((e) => e.event_name === "meeting_click").length;
  const totalInquiries = contactsInRange.length;
  const activeLeads = leadsInRange.filter((l) => !["won", "lost"].includes(l.stage)).length;
  const conversionRate = totalVisitors > 0 ? ((totalInquiries / totalVisitors) * 100).toFixed(1) : "0.0";

  // Traffic sources breakdown
  const sourceMap = {};
  eventsInRange.forEach((e) => {
    const src = e.traffic_source || "Direct";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const trafficSources = Object.entries(sourceMap).map(([name, count]) => ({
    name,
    count,
    percentage: eventsInRange.length > 0 ? Math.round((count / eventsInRange.length) * 100) : 0,
  }));

  // Device breakdown
  const deviceMap = { Desktop: 0, Mobile: 0, Tablet: 0 };
  eventsInRange.forEach((e) => {
    const dev = e.device || "Desktop";
    deviceMap[dev] = (deviceMap[dev] || 0) + 1;
  });

  // Browser breakdown
  const browserMap = {};
  eventsInRange.forEach((e) => {
    const b = e.browser || "Other";
    browserMap[b] = (browserMap[b] || 0) + 1;
  });

  // Popular pages
  const pageMap = {};
  eventsInRange
    .filter((e) => e.event_name === "page_view")
    .forEach((e) => {
      const p = e.path || "/";
      pageMap[p] = (pageMap[p] || 0) + 1;
    });
  const popularPages = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, views]) => ({ path, views }));

  // Generate real daily traffic timeline points for the date range
  const dailyTimeline = [];
  const days = Math.min(daysBack, 30);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split("T")[0];
    const dayViews = eventsInRange.filter((e) => e.event_name === "page_view" && e.timestamp.startsWith(dayStr)).length;
    const dayVisitors = visitorsInRange.filter((v) => v.last_visit.startsWith(dayStr)).length;
    dailyTimeline.push({
      date: dayStr.slice(5), // MM-DD
      views: dayViews,
      visitors: dayVisitors,
    });
  }

  return {
    kpis: {
      totalVisitors,
      uniqueVisitors,
      returningVisitors,
      totalPageViews,
      totalInquiries,
      newLeads: leadsInRange.length,
      activeLeads,
      meetingsScheduled: meetingsInRange.length,
      meetingClicks,
      conversionRate: `${conversionRate}%`,
    },
    trafficSources,
    devices: deviceMap,
    browsers: browserMap,
    popularPages,
    dailyTimeline,
  };
}
