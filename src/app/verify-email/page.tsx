"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed or link expired.");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification.");
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <p className="text-gray-600 font-medium">Verifying your email...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="text-green-500" size={48} />
          <h2 className="text-xl font-bold text-gray-800">Verified!</h2>
          <p className="text-sm text-gray-600">{message}</p>
          <p className="text-xs text-orange-500 mt-2">Redirecting to login page in 3 seconds...</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3">
          <XCircle className="text-red-500" size={48} />
          <h2 className="text-xl font-bold text-gray-800">Verification Failed</h2>
          <p className="text-sm text-red-500">{message}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6">
      <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-8 shadow-2xl shadow-orange-100">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  );
}