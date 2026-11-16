/**
 * Client-safe template placeholder replacer
 * Replaces placeholders like {{customer_name}}, {{service_name}} with real payload values
 */
export function renderTemplatePlaceholders(text = "", payload = {}) {
  let rendered = text;
  const map = {
    customer_name: payload.name || payload.customerName || "Valued Client",
    customer_email: payload.email || payload.customerEmail || "",
    company_name: payload.companyName || payload.company || "your business",
    service_name: payload.service || payload.serviceName || "Software Engineering Services",
    meeting_date: payload.meetingDate || payload.date || "your scheduled time",
    meeting_link: payload.meetingLink || "https://calendly.com/team-bytecglobal/30min",
    project_name: payload.projectName || payload.title || "Custom Project",
  };

  for (const [key, value] of Object.entries(map)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}
