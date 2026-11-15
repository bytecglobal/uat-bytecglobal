import { Mail, Phone, MapPin } from "lucide-react";
import { SITE } from "@/lib/site";
import { PageHeader, Section, card } from "@/components/section";
import ContactForm from "@/components/contact-form";

export const metadata = {
  title: "Contact",
  description: "Get in touch with BytecCloud. Inquire about custom software development, AI solutions, web and mobile apps, or cloud consulting.",
};

export default function Contact() {
  const items = [
    [Mail, "Email", SITE.email, `mailto:${SITE.email}`],
    [Phone, "Phone", SITE.phone, `tel:${SITE.phone.replace(/\s/g, "")}`],
    [MapPin, "Location", SITE.location, null],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk about your project."
        intro="Email or message us and we'll reply within one business day."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Direct Channels</h2>
            <p className="text-sm text-muted">
              Prefer direct outreach? Reach us through any of the verified channels below.
            </p>
            <div className="space-y-4">
              {items.map(([I, t, v, h]) => (
                <div key={t} className={card}>
                  <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-border bg-subtle text-foreground">
                    <I className="h-4 w-4" />
                  </span>
                  <p className="font-mono text-xs uppercase tracking-[0.08em] text-faint">{t}</p>
                  {h ? (
                    <a href={h} className="mt-1 block font-medium transition-colors hover:text-accent-ink">
                      {v}
                    </a>
                  ) : (
                    <p className="mt-1 font-medium">{v}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
