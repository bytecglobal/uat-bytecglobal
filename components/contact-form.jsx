"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { card } from "@/components/section";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
    website: "", // Honeypot field
  });

  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status.error) setStatus((prev) => ({ ...prev, error: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus({
          loading: false,
          success: false,
          error: data.message || "Failed to send enquiry. Please try again.",
        });
        return;
      }

      setStatus({
        loading: false,
        success: true,
        error: null,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        message: "",
        website: "",
      });
    } catch {
      setStatus({
        loading: false,
        success: false,
        error: "Network error. Please check your connection and try again.",
      });
    }
  };

  if (status.success) {
    return (
      <div className={`${card} border-accent/40 bg-accent/5 p-8 text-center`}>
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent/20 text-accent-ink">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-xl font-semibold tracking-[-0.03em]">Message Received</h3>
        <p className="mx-auto max-w-md text-sm text-muted">
          Thank you for reaching out. An engineer will review your inquiry and reply within one business day.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ loading: false, success: false, error: null })}
          className="mt-6 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-subtle"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} space-y-4`} noValidate>
      <h3 className="text-xl font-semibold tracking-[-0.03em]">Send us a message</h3>
      <p className="text-sm text-muted">Fill out the form below and we will respond promptly.</p>

      {status.error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{status.error}</span>
        </div>
      )}

      {/* Honeypot anti-spam field (hidden from legitimate users) */}
      <div className="sr-only" aria-hidden="true" style={{ display: "none" }}>
        <label htmlFor="contact-website">Leave this field blank</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Your Name <span className="text-accent-ink">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={100}
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Email Address <span className="text-accent-ink">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={100}
            value={formData.email}
            onChange={handleChange}
            placeholder="jane@company.com"
            className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Phone / WhatsApp
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            maxLength={30}
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
          />
        </div>

        <div>
          <label htmlFor="contact-service" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Service of Interest
          </label>
          <select
            id="contact-service"
            name="service"
            value={formData.service}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
          >
            <option value="">Select a service (optional)</option>
            <option value="Software Development">Software Development</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile App Development">Mobile App Development</option>
            <option value="AI & ML Development">AI & ML Development</option>
            <option value="Data Science">Data Science</option>
            <option value="Cloud & DevOps">Cloud & DevOps</option>
            <option value="Technical Project Guidance">Technical Project Guidance</option>
            <option value="SEO">SEO</option>
            <option value="Other">Other / Custom Inquiry</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
          Message <span className="text-accent-ink">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          minLength={10}
          maxLength={3000}
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us about your project, goals, or questions..."
          className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
        />
      </div>

      <button
        type="submit"
        disabled={status.loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Send Message</span>
          </>
        )}
      </button>
    </form>
  );
}
