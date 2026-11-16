import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { SettingsRepository } from "@/lib/repositories/settings.repository";
import { recordAuditLogSync } from "@/lib/auth/session";
import { getResendApiKey } from "@/lib/env";

export async function GET(req) {
  return withAdminAuth(req, "emails", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status") || "all";
      const search = searchParams.get("search") || "";

      const { emails } = await SettingsRepository.listEmails({
        status: status === "all" ? null : status,
        search,
        limit: 100,
      });

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
    } catch (err) {
      console.error("Emails GET error:", err);
      return NextResponse.json({ success: false, error: "Failed to load email records." }, { status: 500 });
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "emails", async (r, admin) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { action, emailId, to, subject, body: emailBody, category } = body;
      const resendApiKey = getResendApiKey();

      // 1. Retry failed email
      if (action === "retry" && emailId) {
        const { emails } = await SettingsRepository.listEmails({ limit: 500 });
        const email = emails.find((e) => e.id === emailId);
        if (!email) {
          return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });
        }

        let deliveryStatus = "failed";
        let providerResponse = "";

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
                text: email.body || email.subject,
              }),
            });
            if (res.ok) {
              deliveryStatus = "sent";
              providerResponse = "Delivered via Resend REST API (Retried)";
            } else {
              deliveryStatus = "failed";
              providerResponse = `Resend retry error: HTTP ${res.status}`;
            }
          } catch (err) {
            deliveryStatus = "failed";
            providerResponse = `Retry error: ${err.message}`;
          }
        } else {
          deliveryStatus = "failed";
          providerResponse = "Cannot send: RESEND_API_KEY is not configured in environment.";
        }

        const updated = await SettingsRepository.logEmail({
          recipientEmail: email.to,
          senderEmail: email.from,
          subject: email.subject,
          category: email.category,
          status: deliveryStatus,
          providerResponse,
        });

        return NextResponse.json({ success: true, email: updated });
      }

      // 2. Compose and send new email
      if (!to || !subject || !emailBody) {
        return NextResponse.json({ success: false, error: "Recipient, subject, and body are required" }, { status: 400 });
      }

      const fromAddress = "BytecGlobal <onboarding@resend.dev>";
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
              from: fromAddress,
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
        deliveryStatus = "failed";
        providerResponse = "Not Sent: RESEND_API_KEY is not configured. Add a verified Resend key to environment to enable live dispatch.";
      }

      const newEmail = await SettingsRepository.logEmail({
        recipientEmail: to,
        senderEmail: fromAddress,
        subject,
        category: category || "General",
        status: deliveryStatus,
        providerResponse,
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "SEND_EMAIL",
        module: "EMAILS",
        recordId: newEmail?.id || "email",
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Email to ${to} (${deliveryStatus}).`,
        result: deliveryStatus === "sent" ? "success" : "warning",
      });

      return NextResponse.json({ success: true, email: newEmail });
    } catch (err) {
      console.error("Emails POST error:", err);
      return NextResponse.json({ success: false, error: "Failed to dispatch email." }, { status: 500 });
    }
  });
}
