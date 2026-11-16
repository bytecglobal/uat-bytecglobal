import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics";

function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const userAgent = req.headers.get("user-agent") || "";
    const ip = getClientIp(req);

    const result = await trackEvent({
      eventName: body.eventName || "page_view",
      path: body.path || "/",
      visitorId: body.visitorId,
      sessionId: body.sessionId,
      referrer: body.referrer || req.headers.get("referer") || "",
      userAgent,
      ip,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Analytics track error:", err);
    return NextResponse.json({ success: false, error: "Tracking error" }, { status: 500 });
  }
}
