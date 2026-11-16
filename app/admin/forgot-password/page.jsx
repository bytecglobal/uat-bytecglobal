"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoToken, setDemoToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Request failed.");
        return;
      }

      setSubmitted(true);
      if (data.demoResetToken) {
        setDemoToken(data.demoResetToken);
      }
    } catch {
      setError("Unable to reach the server.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#181613] px-4 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5c518] text-[#181613] font-black text-xl shadow-lg mb-3">
            B
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Reset Password</h1>
          <p className="mt-1 text-sm text-[#c6bea8]">
            Enter your admin email to receive secure recovery instructions.
          </p>
        </div>

        <div className="rounded-3xl border border-[#3b362c] bg-[#23201a] p-8 shadow-2xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
              <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Check Your Inbox</h3>
              <p className="text-xs text-[#c6bea8] leading-relaxed">
                If the email is associated with an active administrator, a reset link has been dispatched.
              </p>

              {demoToken && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-left">
                  <p className="text-[11px] font-mono text-amber-300 font-bold uppercase mb-1">
                    Development Reset Link
                  </p>
                  <Link
                    href={`/admin/reset-password?token=${demoToken}`}
                    className="text-xs text-[#f5c518] underline break-all"
                  >
                    Click here to reset your password with token
                  </Link>
                </div>
              )}

              <div className="pt-4">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#f5c518] hover:underline"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Admin Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-medium tracking-wider uppercase text-[#c6bea8] mb-2">
                  Admin Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bytecglobal.com"
                    className="w-full rounded-xl border border-[#3b362c] bg-[#181613] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-[#f5c518] focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f5c518] py-3.5 px-6 font-bold text-[#181613] transition hover:bg-[#dfad0a] disabled:opacity-50 text-sm cursor-pointer"
              >
                <span>{loading ? "Sending Instructions..." : "Send Reset Link"}</span>
                <ArrowRight size={16} />
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#c6bea8] hover:text-[#f5c518] transition"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
