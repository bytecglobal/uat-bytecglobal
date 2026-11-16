import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";
import { getResendApiKey } from "@/lib/env";

export async function GET(req) {
  return withAdminAuth(req, "emails", async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const db = getDb();
    let emails = [...(db.emails || [])];

    if (status !== "all") {
      emails = emails.filter((e) => e.status === status);
    }

    const resendApiKey = getResendApiKey();
    const providerConfigured = Boolean(resendApiKey && resendApiKey !== "re_your_api_key_here");

    return NextResponse.json({
      success: true,
      emails,
      provider: {
        name: "Resend",
        configured: providerConfigured,
        status: providerConfigured ? "Connected" : "Not Configured (Requires RESEND_API_KEY)",
      },
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "emails", async () => {
    const body = await req.json().catch(() => ({}));
    const { action, emailId, to, subject, body: emailBody, category } = body;
    const db = getDb();
    const now = new Date().toISOString();
    const resendApiKey = getResendApiKey();

    // 1. Retry failed email
    if (action === "retry" && emailId) {
      const email = (db.emails || []).find((e) => e.id === emailId);
      if (!email) {
        return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });
      }

      if (resendApiKey && resendApiKey !== "re_your_api_key_here") {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: email.from || "BytecGlobal <onboarding@resend.dev>",
              to: [email.to],
              subject: email.subject,
              text: email.body,
            }),
          });
          if (res.ok) {
            email.status = "sent";
            email.providerResponse = "Delivered via Resend REST API (Retried)";
            email.sentAt = now;
          } else {
            email.status = "failed";
            email.providerResponse = `Resend retry error: HTTP ${res.status}`;
          }
        } catch (err) {
          email.status = "failed";
          email.providerResponse = `Retry error: ${err.message}`;
        }
      } else {
        email.status = "failed";
        email.providerResponse = "Cannot send: RESEND_API_KEY is not configured in environment.";
      }

      await saveDb(db);
      return NextResponse.json({ success: true, email });
    }

    // 2. Compose and send new email
    if (!to || !subject || !emailBody) {
      return NextResponse.json({ success: false, error: "Recipient, subject, and body are required" }, { status: 400 });
    }

    const fromAddress = "BytecGlobal <inquiries@bytecglobal.com>";
    let deliveryStatus = "sent";
    let providerResponse = "Sent via Resend REST API";

    if (resendApiKey && resendApiKey !== "re_your_api_key_here") {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "BytecGlobal <onboarding@resend.dev>",
            to: [to],
            subject,
            text: emailBody,
          }),
        });

        if (!res.ok) {
          deliveryStatus = "failed";
          providerResponse = `Provider responded with error: ${res.status}`;
        }
      } catch (err) {
        deliveryStatus = "failed";
        providerResponse = `Network error: ${err.message}`;
      }
    } else {
      // Missing credentials: as required in Part 11:
      // "If credentials are missing, display an integration setup warning. Do not show an email as successfully sent unless the provider confirms the relevant submission."
      deliveryStatus = "failed";
      providerResponse = "Not Sent: RESEND_API_KEY is not configured. Add a verified Resend key to environment to enable live dispatch.";
    }

    const newEmail = {
      id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      to,
      from: fromAddress,
      subject,
      body: emailBody,
      category: category || "General",
      status: deliveryStatus,
      providerResponse,
      sentAt: deliveryStatus === "sent" ? now : null,
      createdAt: now,
    };

    if (!db.emails) db.emails = [];
    db.emails.unshift(newEmail);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "SEND_EMAIL",
      module: "EMAILS",
      recordId: newEmail.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Email to ${to} (${deliveryStatus}).`,
      result: deliveryStatus === "sent" ? "success" : "warning",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, email: newEmail });
  });
}
