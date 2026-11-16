import { NextResponse } from "next/server";
import { ContactFormSchema } from "@/lib/validation";
import { checkRateLimit, isDuplicateSubmission } from "@/lib/rate-limiter";
import { getContactRecipientEmail, getResendApiKey } from "@/lib/env";
import { getDb, saveDb } from "@/lib/db";
import { triggerWorkflow } from "@/lib/automations";

const MAX_BODY_SIZE_BYTES = 32 * 1024; // 32KB max payload

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
    // 1. Content-Type verification
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, message: "Invalid request content type." },
        { status: 415 }
      );
    }

    // 2. Body size limit verification
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Request payload exceeds allowed limit." },
        { status: 413 }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Request payload exceeds allowed limit." },
        { status: 413 }
      );
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, message: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    // 3. Rate limiting check
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many submissions. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetInSeconds),
          },
        }
      );
    }

    // 4. Schema validation with Zod
    const validationResult = ContactFormSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message || "Invalid input data.";
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 5. Bot & Honeypot detection
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json(
        { success: true, message: "Thank you for reaching out. We will get back to you shortly." },
        { status: 200 }
      );
    }

    // 6. Duplicate submission detection
    if (isDuplicateSubmission(clientIp, data.email, data.message)) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate submission detected. Please wait a minute before submitting again.",
        },
        { status: 429 }
      );
    }

    // 7. Save inquiry into real enterprise database
    const db = getDb();
    const now = new Date().toISOString();
    const contactId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newContact = {
      id: contactId,
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      companyName: data.company || "",
      service: data.service || "General Inquiry",
      subject: `Inquiry: ${data.service || "Software & Cloud Services"}`,
      message: data.message,
      budget: data.budget || "",
      timeline: data.timeline || "",
      sourcePage: parsedJson.sourcePage || "/contact",
      status: "new",
      assignedTo: "usr_superadmin",
      notes: [],
      clientIp,
      createdAt: now,
      updatedAt: now,
    };

    if (!db.contacts) db.contacts = [];
    db.contacts.unshift(newContact);
    await saveDb(db);

    // 8. Execute automated workflows
    await triggerWorkflow("contact_submit", {
      contactId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      companyName: data.company,
      service: data.service,
      message: data.message,
    });

    // 9. Email sending via Resend API if configured
    const resendApiKey = getResendApiKey();
    const recipientEmail = getContactRecipientEmail();
    const sanitizedSubject = `New Website Inquiry from ${data.name.replace(/[\r\n]/g, "")}`;
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f1c1d; border: 1px solid #e9ebf1; border-radius: 8px;">
        <h2 style="margin-top: 0; color: #29251b; border-bottom: 2px solid #f5c518; padding-bottom: 10px;">New Project / Contact Inquiry</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #646b76;">Full Name:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #646b76;">Email Address:</td>
            <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color: #806000;">${escapeHtml(data.email)}</a></td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #646b76;">Phone / WhatsApp:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.phone)}</td>
          </tr>` : ""}
          ${data.service ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #646b76;">Interested Service:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.service)}</td>
          </tr>` : ""}
          ${data.budget ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #646b76;">Budget Range:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.budget)}</td>
          </tr>` : ""}
          ${data.timeline ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #646b76;">Target Timeline:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.timeline)}</td>
          </tr>` : ""}
        </table>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e9ebf1;">
          <h3 style="margin-top: 0; font-size: 15px; color: #646b76;">Message / Project Brief:</h3>
          <div style="background: #f7f8fb; padding: 16px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${escapeHtml(data.message)}</div>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #7b838b;">
          Submitted via BytecGlobal website contact system. Client IP: ${escapeHtml(clientIp)}
        </p>
      </div>
    `;

    if (resendApiKey && resendApiKey !== "re_your_api_key_here") {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "BytecCloud Inquiries <onboarding@resend.dev>",
            to: [recipientEmail],
            reply_to: data.email,
            subject: sanitizedSubject,
            html: htmlBody,
          }),
        });
      } catch (err) {
        console.error("Resend API warning:", err.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for reaching out! We will review your inquiry and reply within one business day.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
