"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, EyeOff, History, Lock, Mail, ShieldCheck, Sparkles, User as UserIcon, Zap } from "lucide-react";
import { useAuth } from "./AuthProvider";
import GoogleButton from "./GoogleButton";
import { readQueryParam } from "@/lib/history";
import { Logo } from "@/components/Logo";

type Mode = "login" | "signup";

function safeNext(): string {
  const n = readQueryParam("next");
  // Only allow same-origin relative paths to avoid open redirects.
  return n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/login") && !n.startsWith("/signup") ? n : "/playground";
}

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

export default function AuthForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const { user, loading, login, register, loginWithGoogle, googleClientId } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already signed in? Go straight to the workspace.
  useEffect(() => {
    if (!loading && user) router.replace(safeNext());
  }, [loading, user, router]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    window.history.replaceState(null, "", `/${m === "login" ? "login" : "signup"}${window.location.search}`);
  };

  const score = useMemo(() => passwordScore(password), [password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
      router.replace(safeNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  const onGoogle = async (credential: string) => {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle(credential);
      router.replace(safeNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  const input =
    "w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-white/30 outline-none transition-all focus:border-accent-pink/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-accent-pink/10";

  return (
    <main className="relative min-h-screen w-full flex bg-[#07070B] text-white overflow-hidden">
      {/* ---------- Brand panel ---------- */}
      <section className="hidden lg:flex relative w-[46%] flex-col justify-between p-12 overflow-hidden border-r border-white/[0.06]">
        <div className="absolute inset-0 -z-0 pointer-events-none">
          <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-accent-magenta/30 blur-[140px] auth-float" />
          <div className="absolute bottom-[-180px] right-[-120px] w-[520px] h-[520px] rounded-full bg-accent-pink/25 blur-[140px] auth-float-delayed" />
          <div className="absolute inset-0 bg-dotted-dark opacity-60" />
        </div>

        <Link href="/" className="relative z-10 font-mono text-xl tracking-widest font-bold flex items-center gap-3 w-fit">
          <Logo size={42} />
          VANTAGE
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-[40px] leading-[1.08] font-extrabold tracking-tight">
            Your hackathon war-room, <span className="text-gradient">remembered.</span>
          </h2>
          <p className="mt-4 text-white/55 text-[15px] leading-relaxed">
            Every strategy, scope cut, and X-Ray you run is saved privately to your account — pick up exactly where you left off, on any device.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              { icon: History, title: "Full conversation history", body: "Every playground run is saved and searchable." },
              { icon: Zap, title: "Personal defaults", body: "Your preferred model, temperature and persona." },
              { icon: ShieldCheck, title: "Private by design", body: "Your data is scoped to your account only." },
            ].map(({ icon: Icon, title, body }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex gap-3.5"
              >
                <span className="mt-0.5 w-9 h-9 shrink-0 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-accent-pink" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-[13px] text-white/45">{body}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[11px] font-mono text-white/30 tracking-wider">© {new Date().getFullYear()} VANTAGE</p>
      </section>

      {/* ---------- Form panel ---------- */}
      <section className="flex-1 flex items-center justify-center px-5 py-12 relative">
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute -top-32 -right-24 w-[380px] h-[380px] rounded-full bg-accent-magenta/25 blur-[120px]" />
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative w-full max-w-[420px]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-5 rounded-2xl bg-gradient-to-br from-accent-pink to-accent-magenta shadow-[0_0_30px_rgba(255,92,147,0.35)]">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                <h1 className="text-[28px] font-bold tracking-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
                <p className="mt-1.5 text-sm text-white/50">
                  {mode === "login" ? "Sign in to continue to your Vantage workspace" : "Start saving your strategies in seconds"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Segmented toggle */}
          <div className="relative grid grid-cols-2 p-1 mb-6 rounded-xl bg-white/[0.04] border border-white/[0.08]" role="tablist">
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white/[0.09] border border-white/10"
              style={{ left: mode === "login" ? 4 : "calc(50%)" }}
            />
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                id={`auth-tab-${m}`}
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`relative z-10 py-2 text-sm font-medium transition-colors ${mode === m ? "text-white" : "text-white/45 hover:text-white/75"}`}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {googleClientId && (
            <>
              <GoogleButton clientId={googleClientId} onCredential={onGoogle} onError={setError} text={mode === "login" ? "signin_with" : "signup_with"} />
              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/35 font-mono">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label htmlFor="auth-name" className="block text-[13px] font-medium text-white/70 mb-1.5">Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input id="auth-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className={input} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="auth-email" className="block text-[13px] font-medium text-white/70 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-[13px] font-medium text-white/70">Password</label>
                {mode === "login" && (
                  <Link href="/forgot-password" className="text-[12px] font-medium text-accent-pink hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  id="auth-password"
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
                  className={`${input} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "signup" && password && (
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="h-1 rounded-full transition-colors duration-300" style={{ background: i < score ? SCORE_COLOR[score] : "rgba(255,255,255,0.08)" }} />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono w-16 text-right" style={{ color: SCORE_COLOR[score] }}>{SCORE_LABEL[score]}</span>
                </div>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  id="auth-error"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-[13px] text-red-300"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              id="auth-submit"
              type="submit"
              disabled={busy || !email || !password}
              className="group relative w-full mt-2 py-3 rounded-xl font-semibold text-[15px] text-black bg-gradient-to-r from-accent-pink to-accent-magenta shadow-[0_8px_30px_-6px_rgba(255,92,147,0.55)] hover:shadow-[0_10px_40px_-6px_rgba(255,92,147,0.75)] hover:-translate-y-[1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              {busy ? (
                <span className="w-5 h-5 border-2 border-black/25 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-7 text-sm text-white/45">
            {mode === "login" ? "New to Vantage? " : "Already have an account? "}
            <button onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="font-medium text-accent-pink hover:text-white transition-colors">
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </section>
    </main>
  );
}
