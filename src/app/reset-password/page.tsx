"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordScore = Object.values(passwordRules).filter(Boolean).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing or invalid reset token.");
      return;
    }

    if (passwordScore < 4) {
      setError("Please satisfy all password security requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center text-red-500">
        <AlertCircle className="mx-auto mb-2" size={32} />
        <h2 className="text-lg font-bold">Invalid Request</h2>
        <p className="text-sm mt-1">No reset token provided. Please request a new link.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          New Password
        </label>
        <div className="relative">
          <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new strong password"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 text-sm outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Confirm Password
        </label>
        <div className="relative">
          <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 size={19} className="animate-spin" />
            Updating Password...
          </>
        ) : (
          "Update Password"
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6">
      <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-8 shadow-2xl shadow-orange-100">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your new credentials below.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-4">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}