import { SITE } from "@/lib/site";

export default function WhatsAppFab() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const defaultMessage = "Hello BytecGlobal team, I would like to inquire about your software and engineering services.";
  const isVisible = true;
  const position = "bottom-right";

  // Fallback to SITE.whatsapp if not set in DB/env
  const finalHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`
    : SITE.whatsapp || "https://wa.me/";

  if (!isVisible) return null;

  return (
    <div
      className={`vx-floating-actions ${position === "bottom-left" ? "left-6 right-auto" : ""}`}
    >
      <a
        href={finalHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="vx-whatsapp"
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true">
          <path
            d="m6.5 25.6 1.2-4.4a11 11 0 1 1 4.1 4l-5.3 1.4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 10.4c.3-.2.6-.1.7.2l1.1 2.4c.1.3.1.5-.1.7l-.8 1c.7 1.7 2.1 3 3.7 3.8l1.1-.9c.2-.2.4-.2.7-.1l2.3 1.1c.4.2.4.5.3.8-.3 1.4-1.4 2-2.6 1.8-4.5-.7-8.6-4.7-8.8-8.1 0-1.2 1-2.4 2.4-2.7Z"
            fill="currentColor"
          />
        </svg>
      </a>
    </div>
  );
}
