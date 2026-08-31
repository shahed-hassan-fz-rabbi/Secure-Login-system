"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, KeyRound, Loader2, LogOut } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; name?: string; twoFactorEnabled?: boolean } | null>(null);

  // 2FA Setup States
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [submitting2FA, setSubmitting2FA] = useState(false);

  useEffect(() => {
    // Fetch user details
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStart2FASetup = async () => {
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQrCodeUrl(data.qrCodeUrl);
      setSecretKey(data.secret);
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate 2FA");
    }
  };

  const handleVerify2FA = async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setSubmitting2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("2FA Enabled successfully!");
      setQrCodeUrl(null);
      setOtpCode("");
      setUser((prev) => (prev ? { ...prev, twoFactorEnabled: true } : prev));
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setSubmitting2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("2FA Disabled");
      setUser((prev) => (prev ? { ...prev, twoFactorEnabled: false } : prev));
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* 2FA Section */}
        <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.twoFactorEnabled ? (
                <ShieldCheck className="text-green-600" size={28} />
              ) : (
                <ShieldAlert className="text-orange-500" size={28} />
              )}
              <div>
                <h3 className="font-bold text-gray-800">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-gray-500">
                  {user?.twoFactorEnabled
                    ? "2FA is active and protecting your account."
                    : "Secure your account with Google Authenticator."}
                </p>
              </div>
            </div>

            {user?.twoFactorEnabled ? (
              <button
                onClick={handleDisable2FA}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
              >
                Disable 2FA
              </button>
            ) : (
              !qrCodeUrl && (
                <button
                  onClick={handleStart2FASetup}
                  className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
                >
                  Enable 2FA
                </button>
              )
            )}
          </div>

          {/* QR Code Activation Modal */}
          {qrCodeUrl && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                1. Scan this QR Code with Google Authenticator:
              </p>
              <div className="my-4 flex flex-col items-center">
                <Image src={qrCodeUrl} alt="2FA QR Code" width={180} height={180} className="rounded-lg border" />
                <p className="mt-2 text-xs text-gray-400">
                  Secret Key: <span className="font-mono font-bold text-gray-600">{secretKey}</span>
                </p>
              </div>

              <p className="text-sm font-semibold text-gray-700">
                2. Enter the 6-digit code from the app:
              </p>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-center text-sm font-bold tracking-widest outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  onClick={handleVerify2FA}
                  disabled={submitting2FA || otpCode.length !== 6}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-70"
                >
                  {submitting2FA ? "Activating..." : "Confirm & Activate"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}