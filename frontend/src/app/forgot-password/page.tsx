"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
} from "lucide-react";
import { apiJson } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    email_sent?: boolean;
    delivery_mode?: string;
    dev_reset_url?: string;
    dev_notice?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setBusy(true);

    try {
      const data = await apiJson<{
        ok: boolean;
        message: string;
        email_sent?: boolean;
        delivery_mode?: string;
        dev_reset_url?: string;
        dev_notice?: string;
      }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset link."
      );
    } finally {
      setBusy(false);
    }
  };

  const copyDevUrl = () => {
    if (!result?.dev_reset_url) return;
    navigator.clipboard.writeText(result.dev_reset_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle =
    "w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-white/30 outline-none transition-all focus:border-accent-pink/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-accent-pink/10";

  return (
    <main className="relative min-h-screen w-full flex bg-[#07070B] text-white overflow-hidden items-center justify-center">
      <section className="flex-1 flex items-center justify-center px-5 py-12 relative z-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-accent-magenta/20 blur-[140px]" />
          <div className="absolute bottom-10 left-10 w-[350px] h-[350px] rounded-full bg-accent-pink/15 blur-[120px]" />
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

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-5 rounded-2xl bg-gradient-to-br from-accent-pink to-accent-magenta shadow-[0_0_30px_rgba(255,92,147,0.35)]">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-[28px] font-bold tracking-tight">
              Reset password
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              Enter your email address to receive your password reset link.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={submit}
                className="space-y-4"
              >
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-[13px] font-medium text-white/70 mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || !email}
                  className="group relative w-full mt-4 py-3.5 rounded-xl font-semibold text-[15px] text-black bg-gradient-to-r from-accent-pink to-accent-magenta shadow-[0_8px_30px_-6px_rgba(255,92,147,0.55)] hover:shadow-[0_10px_40px_-6px_rgba(255,92,147,0.75)] hover:-translate-y-[1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  {busy ? (
                    <span className="w-5 h-5 border-2 border-black/25 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {result.email_sent ? "Check your email" : "Reset link ready"}
                  </h3>
                  <p className="text-sm text-white/60 mb-5 leading-relaxed">
                    {result.email_sent ? (
                      <>
                        We sent a password reset link to{" "}
                        <span className="text-white font-medium">{email}</span>.
                        Please check your inbox.
                      </>
                    ) : (
                      <>
                        Password reset link generated for{" "}
                        <span className="text-white font-medium">{email}</span>.
                      </>
                    )}
                  </p>
                </div>

                {/* Dev Mode direct link helper if email wasn't delivered to external inbox */}
                {result.dev_reset_url && (
                  <div className="w-full mt-1 mb-5 p-4 rounded-xl bg-accent-pink/[0.07] border border-accent-pink/25">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent-pink">
                        Local Dev Mode Link
                      </span>
                      <button
                        onClick={copyDevUrl}
                        className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    <a
                      href={result.dev_reset_url}
                      className="inline-flex items-center justify-center gap-2 w-full mt-2 py-2.5 rounded-lg font-semibold text-xs text-black bg-gradient-to-r from-accent-pink to-accent-magenta shadow-[0_4px_16px_rgba(255,92,147,0.3)] hover:shadow-[0_6px_22px_rgba(255,92,147,0.5)] transition-all"
                    >
                      <span>Open Reset Page Directly</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <p className="text-[11px] text-white/40 mt-3 leading-normal">
                      Note: Set <code className="text-white/60 font-mono">SMTP_HOST</code> and <code className="text-white/60 font-mono">SMTP_USER</code> in <code className="text-white/60 font-mono">backend/.env</code> to send to real inboxes.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                  <button
                    onClick={() => {
                      setResult(null);
                      setEmail("");
                    }}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    Try another email
                  </button>
                  <Link
                    href="/login"
                    className="font-medium text-accent-pink hover:text-white transition-colors"
                  >
                    Return to login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  );
}
