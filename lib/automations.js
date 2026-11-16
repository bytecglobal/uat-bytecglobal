import { getDb, saveDb } from "@/lib/db";
import { getContactRecipientEmail, getResendApiKey } from "@/lib/env";
import { renderTemplatePlaceholders } from "@/lib/template-utils";

export { renderTemplatePlaceholders };

/**
 * Core event dispatcher that triggers enabled workflows matching trigger type
 */
export async function triggerWorkflow(triggerType, payload = {}) {
  const db = getDb();
  const now = new Date().toISOString();

  const matchingAutomations = (db.automations || []).filter(
    (a) => a.trigger === triggerType && a.enabled === true
  );

  const results = [];

  for (const automation of matchingAutomations) {
    let success = true;
    const executionDetails = [];

    try {
      for (const action of automation.actions || []) {
        if (action.type === "save_inquiry") {
          executionDetails.push("Inquiry saved to database.");
        } else if (action.type === "create_lead") {
          // Check if lead already exists for this contact
          const existingLead = (db.leads || []).find((l) => l.email === payload.email);
          if (!existingLead && payload.email) {
            const newLead = {
              id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              contactId: payload.contactId || "",
              name: payload.name || "New Inquirer",
              email: payload.email,
              phone: payload.phone || "",
              companyName: payload.companyName || "",
              service: payload.service || "General Inquiry",
              stage: "new",
              estimatedValue: 15000,
              source: "Automated Contact Ingestion",
              assignedTo: "usr_superadmin",
              notes: [{ id: `n_${Date.now()}`, author: "Workflow Automation", text: "Auto-created lead from inquiry.", createdAt: now }],
              createdAt: now,
              updatedAt: now,
            };
            db.leads.unshift(newLead);
            executionDetails.push(`Lead created (${newLead.id}).`);
          }
        } else if (action.type === "notify_admin") {
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: `New ${triggerType.replace(/_/g, " ").toUpperCase()}`,
            message: `${payload.name ? payload.name + " (" + payload.email + ")" : "A new event"} triggered ${automation.name}.`,
            category: triggerType === "contact_submit" ? "inquiry" : triggerType === "meeting_booked" ? "meeting" : "lead",
            read: false,
            link: triggerType === "contact_submit" ? "/admin/contacts" : triggerType === "meeting_booked" ? "/admin/meetings" : "/admin/leads",
            createdAt: now,
          };
          if (!db.notifications) db.notifications = [];
          db.notifications.unshift(notification);
          executionDetails.push("In-app admin notification dispatched.");
        } else if (action.type === "send_template_email") {
          const template = (db.templates || []).find((t) => t.id === action.params?.templateId) || (db.templates || [])[0];
          if (template && payload.email) {
            const emailSubject = renderTemplatePlaceholders(template.subject, payload);
            const emailBody = renderTemplatePlaceholders(template.content, payload);

            // Attempt email delivery via Resend if configured
            const resendApiKey = getResendApiKey();
            const fromAddress = "BytecGlobal <onboarding@resend.dev>";
            let emailStatus = "sent";
            let providerResponse = "Simulated delivery (dev mode)";

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
                    to: [payload.email],
                    subject: emailSubject,
                    text: emailBody,
                  }),
                });
                if (!res.ok) {
                  emailStatus = "failed";
                  providerResponse = `Resend status: ${res.status}`;
                } else {
                  providerResponse = "Delivered via Resend REST API";
                }
              } catch (e) {
                emailStatus = "failed";
                providerResponse = e.message;
              }
            }

            const emailRecord = {
              id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              to: payload.email,
              from: fromAddress,
              subject: emailSubject,
              body: emailBody,
              category: template.category || "Automated",
              status: emailStatus,
              providerResponse,
              sentAt: now,
              createdAt: now,
            };
            if (!db.emails) db.emails = [];
            db.emails.unshift(emailRecord);
            executionDetails.push(`Email (${emailStatus}) logged for ${payload.email}.`);
          }
        }
      }
    } catch (err) {
      success = false;
      executionDetails.push(`Execution error: ${err.message}`);
    }

    // Log automation run
    automation.executionCount = (automation.executionCount || 0) + 1;
    automation.lastRunAt = now;

    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      automationId: automation.id,
      automationName: automation.name,
      trigger: triggerType,
      status: success ? "success" : "failed",
      details: executionDetails.join(" "),
      timestamp: now,
    };

    if (!db.automation_logs) db.automation_logs = [];
    db.automation_logs.unshift(logEntry);
    results.push(logEntry);
  }

  await saveDb(db);
  return results;
}
