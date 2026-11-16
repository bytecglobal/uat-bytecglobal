"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      // Successful login
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to authentication service.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#181613] px-4 py-12 text-white">
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5c518] text-[#181613] font-black text-2xl shadow-lg mb-4">
            B
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-display">
            BytecGlobal <span className="text-[#f5c518]">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-[#c6bea8]">
            Enterprise Content Management &amp; Operations Portal
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-[#3b362c] bg-[#23201a] p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
              <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Authentication Failed</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-medium tracking-wider uppercase text-[#c6bea8] mb-2">
                Administrator Email
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono font-medium tracking-wider uppercase text-[#c6bea8]">
                  Password
                </label>
                <Link
                  href="/admin/forgot-password"
                  className="text-xs text-[#f5c518] hover:underline transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#3b362c] bg-[#181613] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-[#f5c518] focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f5c518] py-3.5 px-6 font-bold text-[#181613] transition hover:bg-[#dfad0a] focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-offset-2 focus:ring-offset-[#181613] disabled:opacity-50 shadow-md text-sm cursor-pointer"
            >
              <span>{loading ? "Authenticating Session..." : "Sign In to Admin Portal"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Setup Assistance for Initial Admin */}
          <div className="mt-6 border-t border-[#3b362c] pt-5 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
              <Shield size={14} className="text-[#f5c518]" />
              <span>Protected by brute-force rate-limiting and audit logging.</span>
            </p>
          </div>
        </div>

        {/* Back to public website link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs text-[#c6bea8] hover:text-[#f5c518] transition inline-flex items-center gap-1"
          >
            <span>&larr; Return to BytecGlobal Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
