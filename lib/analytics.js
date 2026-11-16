import { getDb, saveDb } from "@/lib/db";

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
  const db = getDb();
  const now = new Date().toISOString();
  const { browser, os, device } = parseUserAgent(userAgent);

  let cleanVisitorId = visitorId || `vis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let cleanSessionId = sessionId || `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Find or create visitor
  let visitor = db.visitors.find((v) => v.visitorId === cleanVisitorId);
  const isNewVisitor = !visitor;

  // Determine source
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

  if (isNewVisitor) {
    visitor = {
      visitorId: cleanVisitorId,
      firstVisit: now,
      lastVisit: now,
      totalVisits: 1,
      landingPage: path,
      exitPage: path,
      pagesVisited: [path],
      referrer: referrer || "Direct",
      trafficSource,
      browser,
      os,
      deviceType: device,
      location: "India / Global",
      sessions: [cleanSessionId],
    };
    db.visitors.unshift(visitor);
  } else {
    visitor.lastVisit = now;
    visitor.exitPage = path;
    if (!visitor.pagesVisited.includes(path)) {
      visitor.pagesVisited.push(path);
    }
    if (!visitor.sessions.includes(cleanSessionId)) {
      visitor.sessions.push(cleanSessionId);
      visitor.totalVisits += 1;
    }
  }

  // Create event record
  const eventRecord = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventName, // page_view, session_start, whatsapp_click, meeting_click, contact_submit, service_view, project_view, etc.
    path,
    visitorId: cleanVisitorId,
    sessionId: cleanSessionId,
    browser,
    os,
    device,
    trafficSource,
    metadata,
    timestamp: now,
  };

  db.analytics_events.unshift(eventRecord);

  // Keep last 5000 events for fast performance
  if (db.analytics_events.length > 5000) {
    db.analytics_events = db.analytics_events.slice(0, 5000);
  }
  if (db.visitors.length > 2000) {
    db.visitors = db.visitors.slice(0, 2000);
  }

  await saveDb(db);

  return { visitorId: cleanVisitorId, sessionId: cleanSessionId, eventId: eventRecord.id };
}

/**
 * Computes dashboard and analytics metrics based on real database records
 */
export function getAnalyticsOverview(dateRange = "30d") {
  const db = getDb();
  const now = new Date();

  let daysBack = 30;
  if (dateRange === "today") daysBack = 1;
  else if (dateRange === "yesterday") daysBack = 2;
  else if (dateRange === "7d") daysBack = 7;
  else if (dateRange === "30d") daysBack = 30;
  else if (dateRange === "90d") daysBack = 90;

  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const visitorsInRange = db.visitors.filter((v) => new Date(v.lastVisit) >= cutoff);
  const eventsInRange = db.analytics_events.filter((e) => new Date(e.timestamp) >= cutoff);
  const contactsInRange = db.contacts.filter((c) => new Date(c.createdAt) >= cutoff);
  const leadsInRange = db.leads.filter((l) => new Date(l.createdAt) >= cutoff);
  const meetingsInRange = db.meetings.filter((m) => new Date(m.createdAt) >= cutoff);

  const totalVisitors = visitorsInRange.length;
  const uniqueVisitors = new Set(visitorsInRange.map((v) => v.visitorId)).size;
  const returningVisitors = visitorsInRange.filter((v) => v.totalVisits > 1).length;
  const totalPageViews = eventsInRange.filter((e) => e.eventName === "page_view").length;
  const whatsappClicks = eventsInRange.filter((e) => e.eventName === "whatsapp_click").length;
  const meetingClicks = eventsInRange.filter((e) => e.eventName === "meeting_click").length;
  const totalInquiries = contactsInRange.length;
  const activeLeads = leadsInRange.filter((l) => !["won", "lost"].includes(l.stage)).length;
  const conversionRate = totalVisitors > 0 ? ((totalInquiries / totalVisitors) * 100).toFixed(1) : "0.0";

  // Traffic sources breakdown
  const sourceMap = {};
  visitorsInRange.forEach((v) => {
    const src = v.trafficSource || "Direct";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const trafficSources = Object.entries(sourceMap).map(([name, count]) => ({
    name,
    count,
    percentage: totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0,
  }));

  // Device breakdown
  const deviceMap = { Desktop: 0, Mobile: 0, Tablet: 0 };
  visitorsInRange.forEach((v) => {
    const dev = v.deviceType || "Desktop";
    deviceMap[dev] = (deviceMap[dev] || 0) + 1;
  });

  // Browser breakdown
  const browserMap = {};
  visitorsInRange.forEach((v) => {
    const b = v.browser || "Other";
    browserMap[b] = (browserMap[b] || 0) + 1;
  });

  // Popular pages
  const pageMap = {};
  eventsInRange
    .filter((e) => e.eventName === "page_view")
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
    const dayViews = eventsInRange.filter((e) => e.eventName === "page_view" && e.timestamp.startsWith(dayStr)).length;
    const dayVisitors = visitorsInRange.filter((v) => v.lastVisit.startsWith(dayStr)).length;
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
      whatsappClicks,
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
