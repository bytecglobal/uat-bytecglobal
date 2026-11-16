"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { card } from "@/components/section";

export default function StartProjectForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: "",
    budget: "",
    timeline: "",
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
          error: data.message || "Failed to submit project brief. Please try again.",
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
        service: "",
        budget: "",
        timeline: "",
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
        <h3 className="mb-2 text-xl font-semibold tracking-[-0.03em]">Project Brief Received</h3>
        <p className="mx-auto max-w-md text-sm text-muted">
          Thank you for detailing your project. Our technical team will review your specifications and schedule a discovery discussion within one business day.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ loading: false, success: false, error: null })}
          className="mt-6 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-subtle"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} space-y-4`} noValidate>
      <h3 className="text-xl font-semibold tracking-[-0.03em]">Project Details</h3>
      <p className="text-sm text-muted">Provide your specifications to receive a tailored estimate and roadmap.</p>

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

      {/* Honeypot anti-spam field */}
      <div className="sr-only" aria-hidden="true" style={{ display: "none" }}>
        <label htmlFor="brief-website">Do not fill this</label>
        <input
          id="brief-website"
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
          <label htmlFor="brief-name" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Contact Name <span className="text-accent-ink">*</span>
          </label>
          <input
            id="brief-name"
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
          <label htmlFor="brief-email" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Business Email <span className="text-accent-ink">*</span>
          </label>
          <input
            id="brief-email"
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="brief-service" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Primary Focus
          </label>
          <select
            id="brief-service"
            name="service"
            value={formData.service}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
          >
            <option value="">Select focus</option>
            <option value="Custom Software / ERP">Custom Software / ERP</option>
            <option value="Web Application / SaaS">Web Application / SaaS</option>
            <option value="Mobile Application">Mobile Application</option>
            <option value="AI / Automation Solution">AI / Automation Solution</option>
            <option value="Data Science / Analytics">Data Science / Analytics</option>
            <option value="Cloud / DevOps Consulting">Cloud / DevOps Consulting</option>
            <option value="Architecture / Technical Advisory">Technical Advisory</option>
          </select>
        </div>

        <div>
          <label htmlFor="brief-budget" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Budget Range
          </label>
          <select
            id="brief-budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
          >
            <option value="">Select range</option>
            <option value="<$5k">&lt; $5,000</option>
            <option value="$5k - $15k">$5,000 - $15,000</option>
            <option value="$15k - $50k">$15,000 - $50,000</option>
            <option value="$50k+">$50,000+</option>
            <option value="Flexible / Undetermined">Flexible / Undetermined</option>
          </select>
        </div>

        <div>
          <label htmlFor="brief-timeline" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
            Target Timeline
          </label>
          <select
            id="brief-timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
          >
            <option value="">Select timeline</option>
            <option value="Immediate (< 1 month)">Immediate (&lt; 1 month)</option>
            <option value="1 - 3 months">1 - 3 months</option>
            <option value="3 - 6 months">3 - 6 months</option>
            <option value="Exploring / Planning">Exploring / Planning</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="brief-message" className="mb-1 block font-mono text-xs uppercase tracking-[0.08em] text-faint">
          What problem are you looking to solve? <span className="text-accent-ink">*</span>
        </label>
        <textarea
          id="brief-message"
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={3000}
          value={formData.message}
          onChange={handleChange}
          placeholder="Describe the system, target users, desired integrations, or operational bottlenecks..."
          className="w-full rounded-lg border border-border bg-subtle px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent-ink"
        />
      </div>

      <button
        type="submit"
        disabled={status.loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting Brief...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Submit Project Brief</span>
          </>
        )}
      </button>
    </form>
  );
}
