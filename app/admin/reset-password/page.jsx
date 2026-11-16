"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Password reset failed.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 2500);
    } catch {
      setError("Failed to connect to authentication server.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#3b362c] bg-[#23201a] p-8 shadow-2xl">
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success ? (
        <div className="space-y-4 text-center py-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Password Updated</h3>
          <p className="text-xs text-[#c6bea8]">
            Your administrator password has been updated securely. Redirecting to login...
          </p>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#f5c518] hover:underline font-bold"
            >
              <span>Click here if not redirected</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {!initialToken && (
            <div>
              <label className="block text-xs font-mono font-medium tracking-wider uppercase text-[#c6bea8] mb-2">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from recovery email"
                className="w-full rounded-xl border border-[#3b362c] bg-[#181613] py-3 px-4 text-sm text-white placeholder-gray-600 focus:border-[#f5c518] focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-medium tracking-wider uppercase text-[#c6bea8] mb-2">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-[#3b362c] bg-[#181613] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-[#f5c518] focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium tracking-wider uppercase text-[#c6bea8] mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-xl border border-[#3b362c] bg-[#181613] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-[#f5c518] focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f5c518] py-3.5 px-6 font-bold text-[#181613] transition hover:bg-[#dfad0a] disabled:opacity-50 text-sm cursor-pointer shadow-md"
          >
            <span>{loading ? "Updating Credentials..." : "Set New Password"}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#181613] px-4 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5c518] text-[#181613] font-black text-xl shadow-lg mb-3">
            B
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Create New Password</h1>
          <p className="mt-1 text-sm text-[#c6bea8]">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
