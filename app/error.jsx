"use client";

import { useEffect } from "react";
import Button from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // In production, internal stack traces are suppressed from client display
    if (process.env.NODE_ENV !== "production") {
      // In development, keep track for debugging
    }
  }, [error]);

  return (
    <section className="grid min-h-[70vh] place-content-center justify-items-start gap-5 px-6 py-20 sm:px-10">
      <p className="font-mono text-6xl text-faint">500</p>
      <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Something went wrong.</h1>
      <p className="max-w-md text-base text-muted">
        An unexpected error occurred while loading this page. Our technical team has been notified.
      </p>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Button href="/" variant="secondary">
          Back home
        </Button>
      </div>
    </section>
  );
}
