"use client";

import { useRef, useState, useTransition } from "react";
import { submitContact } from "@/app/actions/contact";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const field =
  "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-faint transition-colors focus:border-accent-ink focus:outline-none";
const label = "mb-1.5 block text-sm font-medium text-foreground";

export default function ContactForm() {
  const formRef = useRef(null);
  const [status, setStatus] = useState(null); // null | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(formRef.current);
    startTransition(async () => {
      const result = await submitContact(data);
      if (result.ok) {
        setStatus("success");
        formRef.current?.reset();
      } else {
        setErrorMsg(result.error || "Something went wrong.");
        setStatus("error");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface px-8 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-accent-ink" />
        <h3 className="text-lg font-semibold tracking-[-0.03em]">Message received</h3>
        <p className="max-w-sm text-sm text-muted">
          Thanks for reaching out. We&apos;ll reply within one business day.
        </p>
        <button
          type="button"
          onClick={() => setStatus(null)}
          className="mt-2 rounded-full border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-subtle"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>
            Name <span className="text-accent-ink">*</span>
          </label>
          <input id="name" name="name" type="text" required placeholder="Your name" className={field} />
        </div>
        <div>
          <label htmlFor="email" className={label}>
            Email <span className="text-accent-ink">*</span>
          </label>
          <input id="email" name="email" type="email" required placeholder="you@company.com" className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="company" className={label}>
          Company <span className="text-sm font-normal text-faint">(optional)</span>
        </label>
        <input id="company" name="company" type="text" placeholder="Your company name" className={field} />
      </div>

      <div>
        <label htmlFor="message" className={label}>
          Message <span className="text-accent-ink">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us about your project or how we can help..."
          className={field + " resize-none"}
        />
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send message
          </>
        )}
      </button>
    </form>
  );
}
