"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  UserPlus,
  X,
  KeyRound,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordScore = Object.values(passwordRules).filter(Boolean).length;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    if (!emailValid || !password || !captchaToken || passwordScore < 4) {
      toast.error("Please fill in all requirements correctly.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, captchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (isSignUp) {
        toast.success(data.message || "Account created! You can now sign in.");
        setIsSignUp(false);
        setPassword("");
        setSubmitted(false);
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      } else {
        toast.success("Login successful! Redirecting...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      toast.success(data.message || "Reset link dispatched.");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to process request.");
    } finally {
      setForgotLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setSubmitted(false);
    recaptchaRef.current?.reset();
    setCaptchaToken(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">
        <div className="w-full">
          {/* Logo & Header */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-xl shadow-orange-200">
              {isSignUp ? <UserPlus size={28} /> : <LockKeyhole size={28} />}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Comilla University
            </h1>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {isSignUp ? "Create Account" : "Secure Login"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {isSignUp
                ? "Register a new account to get started."
                : "Welcome back! Sign in to continue."}
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-2xl shadow-orange-100 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`w-full rounded-xl border bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                      submitted && !emailValid
                        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-500 focus:ring-orange-100"
                    }`}
                  />

                  {emailValid && (
                    <Check
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                    />
                  )}
                </div>

                {submitted && !emailValid && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle size={14} />
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>

                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-semibold text-orange-500 transition hover:text-orange-600"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isSignUp ? "Create a strong password" : "Enter your password"
                    }
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 text-sm outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-orange-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                {/* Password Strength Score */}
                {password && (
                  <div className="mt-3">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-gray-500">Password strength</span>

                      <span
                        className={`font-semibold ${
                          passwordScore <= 1
                            ? "text-red-500"
                            : passwordScore <= 3
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {passwordScore <= 1
                          ? "Weak"
                          : passwordScore <= 3
                          ? "Medium"
                          : "Strong"}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${
                            level <= passwordScore
                              ? passwordScore <= 1
                                ? "bg-red-400"
                                : passwordScore <= 3
                                ? "bg-yellow-400"
                                : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Rule valid={passwordRules.length} text="8+ characters" />
                      <Rule
                        valid={passwordRules.uppercase}
                        text="Uppercase letter"
                      />
                      <Rule valid={passwordRules.number} text="Number" />
                      <Rule
                        valid={passwordRules.special}
                        text="Special character"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Google reCAPTCHA Component */}
              <div className="flex flex-col items-center justify-center pt-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                  onChange={handleCaptchaChange}
                />
                {submitted && !captchaToken && (
                  <p className="mt-2 text-xs text-red-500">
                    Please complete the verification check.
                  </p>
                )}
              </div>

              {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus size={18} /> : <LockKeyhole size={18} />}
                  {isSignUp ? "Register" : "Sign In"}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google Sign In Button */}
          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </a>

        

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Toggle Mode Button */}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="w-full rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
            >
              {isSignUp ? "Already have an account? Sign In" : "Create New Account"}
            </button>
          </div>

          {/* Security Footer */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck size={15} />
            <span>Protected by Google reCAPTCHA & TLS</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <KeyRound size={20} />
                <span>Forgot Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Enter your registered email address and we will send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
                >
                  {forgotLoading ? "Sending Link..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Rule({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] ${
        valid ? "text-green-600" : "text-gray-400"
      }`}
    >
      <Check size={13} />
      {text}
    </div>
  );
}