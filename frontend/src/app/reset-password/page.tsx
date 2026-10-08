"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { apiJson, setToken } from "@/lib/api";

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

const SCORE_LABEL = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
const SCORE_COLOR = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);

  // 1. Verify token on page load
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("No reset token found in URL. Please request a new link.");
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const res = await apiJson<{
          valid: boolean;
          email: string;
          masked_email?: string;
          name?: string;
        }>(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);

        if (isMounted) {
          if (res.valid) {
            setTokenValid(true);
            setUserEmail(res.masked_email || res.email);
          } else {
            setTokenValid(false);
            setTokenError("This reset link is invalid or has expired.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          setTokenError(
            err instanceof Error
              ? err.message
              : "Invalid or expired password reset link."
          );
        }
      } finally {
        if (isMounted) setVerifying(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Submit new password
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!token) {
      setFormError("Missing reset token.");
      return;
    }

    setBusy(true);
    try {
      const res = await apiJson<{
        ok: boolean;
        message: string;
        token?: string;
      }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          new_password: password,
        }),
      });

      if (res.ok) {
        if (res.token) {
          // Store session token so user is automatically authenticated
          setToken(res.token);
        }
        setSuccess(true);
      } else {
        setFormError(res.message || "Failed to reset password.");
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. The link might be expired."
      );
    } finally {
      setBusy(false);
    }
  };

  const inputStyle =
    "w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-11 py-3 text-[15px] text-white placeholder-white/30 outline-none transition-all focus:border-accent-pink/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-accent-pink/10";

  return (
    <main className="relative min-h-screen w-full flex bg-[#07070B] text-white overflow-hidden items-center justify-center">
      <section className="flex-1 flex items-center justify-center px-5 py-12 relative z-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-accent-magenta/20 blur-[150px]" />
          <div className="absolute bottom-10 right-10 w-[350px] h-[350px] rounded-full bg-accent-pink/15 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative w-full max-w-[440px]"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-5 rounded-2xl bg-gradient-to-br from-accent-pink to-accent-magenta shadow-[0_0_30px_rgba(255,92,147,0.35)]">
              <KeyRound className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-[28px] font-bold tracking-tight">
              Set new password
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              {userEmail
                ? `Enter a secure new password for ${userEmail}`
                : "Create a strong new password for your account"}
            </p>
          </div>

          {/* State 1: Verifying Token */}
          {verifying && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-8 h-8 border-2 border-accent-pink border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-white/60">Verifying reset token...</p>
            </div>
          )}

          {/* State 2: Invalid / Expired Token */}
          {!verifying && !tokenValid && !success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-white/[0.03] border border-red-500/20 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Invalid or Expired Link
              </h3>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                {tokenError ||
                  "This password reset link is invalid or has already expired."}
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-accent-pink to-accent-magenta shadow-[0_6px_20px_rgba(255,92,147,0.4)] hover:shadow-[0_8px_30px_rgba(255,92,147,0.6)] transition-all"
              >
                Request a new link
              </Link>
            </motion.div>
          )}

          {/* State 3: Password Form */}
          {!verifying && tokenValid && !success && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={submit}
              className="space-y-4"
            >
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-[13px] font-medium text-white/70 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="h-1 rounded-full transition-colors duration-300"
                          style={{
                            background:
                              i < score
                                ? SCORE_COLOR[score]
                                : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[11px] font-mono w-16 text-right"
                      style={{ color: SCORE_COLOR[score] }}
                    >
                      {SCORE_LABEL[score]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-[13px] font-medium text-white/70 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy || !password || !confirmPassword}
                className="group relative w-full mt-5 py-3.5 rounded-xl font-semibold text-[15px] text-black bg-gradient-to-r from-accent-pink to-accent-magenta shadow-[0_8px_30px_-6px_rgba(255,92,147,0.55)] hover:shadow-[0_10px_40px_-6px_rgba(255,92,147,0.75)] hover:-translate-y-[1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                {busy ? (
                  <span className="w-5 h-5 border-2 border-black/25 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* State 4: Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Password reset successfully!
              </h3>
              <p className="text-sm text-white/60 mb-6 max-w-sm">
                Your password has been securely updated. You can now jump
                straight into the workspace or log in.
              </p>
              <div className="w-full space-y-2.5">
                <Link
                  href="/playground"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-accent-pink to-accent-magenta shadow-[0_8px_25px_rgba(255,92,147,0.4)] hover:shadow-[0_10px_35px_rgba(255,92,147,0.6)] transition-all"
                >
                  Go to Workspace
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full py-2.5 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Return to Login
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full flex bg-[#07070B] text-white items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-pink border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
