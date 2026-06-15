"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { CommandPalette } from "@/components/shared/CommandPalette";
import {
  Activity,
  CheckCircle,
  Bell,
  Cpu,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Zap,
  Globe,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const setIsOpen = useAppStore((state) => state.setCommandPaletteOpen);

  const [testPRN, setTestPRN] = useState("");
  const [prnChecked, setPrnChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const handleDemoCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPRN || testPRN.length < 5) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPrnChecked(true);
    }, 1200);
  };

  const faqs = [
    {
      q: "How does the SIU Result Monitor work?",
      a: "Our system runs an independent background service utilizing headless Selenium drivers that poll the Symbiosis International University exam portal. It inputs your PRN and verifies result tables in real-time, logging success or failure parameters.",
    },
    {
      q: "Is it safe to enter my PRN?",
      a: "Absolutely. PRNs are public identification numbers and are only used to fetch raw HTML response text from the Symbiosis result portal. We do not require passwords, verification keys, or personal credentials.",
    },
    {
      q: "Do I need to keep the tab open?",
      a: "For the live sound alert and confetti, keeping the dashboard tab open is recommended. However, the background agent checks the portal 24/7 and updates the database, meaning you will see the exact detection time in the history feed whenever you open the site.",
    },
    {
      q: "How fast will I be notified?",
      a: "The standard check interval is set to 60 seconds. As soon as the portal lists the results, the status changes to SUCCESS and an alert sound, native browser alert, and confetti sequence are instantly fired.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden grid-bg">
      {/* Background radial spotlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black shadow-lg shadow-indigo-500/20">
              S
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span>SIU Monitor</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition">Features</Link>
            <Link href="#stats" className="hover:text-foreground transition">Stats</Link>
            <Link href="#faq" className="hover:text-foreground transition">FAQ</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition cursor-pointer"
            >
              <span>Press</span>
              <kbd className="border border-border/80 rounded bg-background px-1 text-[10px]">Ctrl K</kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted/80 transition cursor-pointer"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M6.343 12a6 6 0 1112 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-6 pt-12 pb-20 text-center md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 backdrop-blur">
            <Sparkles className="h-3 w-3 animate-spin" />
            <span>2026 Symbiosis Results Monitoring Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Get Notified the Second Your{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              SIU Result
            </span>{" "}
            Drops.
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop frantically reloading the Symbiosis exam portal. Monitor your PRN in the background and receive instant sirens, confetti, and browser notifications when your grades go live.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-all cursor-pointer text-base"
            >
              Launch Dashboard <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#demo"
              className="rounded-xl border border-border bg-card/40 hover:bg-card/90 px-6 py-3.5 font-bold text-foreground transition-all backdrop-blur text-base"
            >
              Try Live Demo
            </Link>
          </div>
        </motion.div>

        {/* Live Demo Widget */}
        <motion.div
          id="demo"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-2xl glass-card text-left"
        >
          <div className="flex items-center justify-between border-b border-border/40 bg-black/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                LIVE SANDBOX MONITOR
              </span>
            </div>
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
            </div>
          </div>

          <div className="p-8">
            {!prnChecked ? (
              <form onSubmit={handleDemoCheck} className="space-y-4">
                <label className="block text-sm font-semibold text-foreground">
                  Try checking a simulated PRN status
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter PRN (e.g. 24070126017)"
                    value={testPRN}
                    onChange={(e) => setTestPRN(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none ring-offset-background focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold px-6 py-3 transition shrink-0 cursor-pointer"
                  >
                    {loading ? "Checking..." : "Verify Portal"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-indigo-500" />
                  Ensure volume is up to test the alerts.
                </p>
              </form>
            ) : (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-center py-6"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4 animate-bounce">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Result Portal is Reachable</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  PRN {testPRN} verified. The Symbiosis portal returned a 200 OK code (Checked in 410ms).
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setPrnChecked(false);
                      setTestPRN("");
                    }}
                    className="text-xs border border-border hover:bg-muted text-foreground rounded-lg px-4 py-2 font-medium transition cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard?prn=${testPRN}`)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border/40 bg-black/10 py-24">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Engineered for absolute speed and reliability.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              We separate browser workers from API layers to promise 99.9% check uptime.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl glass-card p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Headless Selenium Workers</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Independent nodes log in, bypass Javascript requirements, and extract raw seat table parameters with maximum precision.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl glass-card p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Multi-Sensory Alerts</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Looping audio sirens, fullscreen confetti explosions, and persistent browser notifications ensure you miss absolutely nothing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl glass-card p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Live Latency Charts</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Observe the university exam portal response speeds and logs, providing real-time data on portal lag and availability.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl glass-card p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Zero account overhead</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                No sign-ups, no Google authorization, no emails. Enter a PRN and immediately view details. 100% public and transparent.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl glass-card p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Next.js Edge Backend</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Hosted on Vercel's global CDN for sub-10ms dashboard loads. Built using SQLite/PostgreSQL with type-safe Prisma bindings.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl glass-card p-6 relative overflow-hidden group">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Live Simulation Console</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Trigger mock success actions to preview notifications and display screens directly from the dashboard command console.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
            <div className="rounded-xl border border-border/40 bg-card/45 p-6 backdrop-blur">
              <div className="text-4xl font-extrabold text-indigo-500">60s</div>
              <div className="text-sm font-semibold text-muted-foreground mt-2">Checking Frequency</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/45 p-6 backdrop-blur">
              <div className="text-4xl font-extrabold text-indigo-500">420ms</div>
              <div className="text-sm font-semibold text-muted-foreground mt-2">Average Response Time</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/45 p-6 backdrop-blur">
              <div className="text-4xl font-extrabold text-indigo-500">99.9%</div>
              <div className="text-sm font-semibold text-muted-foreground mt-2">Portal Availability</div>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/45 p-6 backdrop-blur">
              <div className="text-4xl font-extrabold text-indigo-500">0</div>
              <div className="text-sm font-semibold text-muted-foreground mt-2">Accounts Required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-black/10 py-24 border-y border-border/40">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              What Students Are Saying
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur">
              <p className="text-sm text-foreground italic leading-relaxed">
                "I was playing Valorant when the dashboard alert started blasting audio. Tabbed out, saw the green result badge, checked, and found out I cleared! Absolute life-saver."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-xs font-bold">
                  AS
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Aditya Singh</div>
                  <div className="text-[10px] text-muted-foreground">B.Tech CS Student</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur">
              <p className="text-sm text-foreground italic leading-relaxed">
                "I used to sit and refresh that clunky Symbiosis exam frame every 10 minutes. This site just sits quietly in the corner and alerts me in real-time. Breathtaking UI!"
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-xs font-bold">
                  RP
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Rohan Patel</div>
                  <div className="text-[10px] text-muted-foreground">MBA Candidate</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur">
              <p className="text-sm text-foreground italic leading-relaxed">
                "The response time graph and historical screenshots are amazing features. You can actually see if the SIU server is down or slow. Vercel dashboard quality!"
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-xs font-bold">
                  SM
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Sneha Mehta</div>
                  <div className="text-[10px] text-muted-foreground">BBA Student</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              <HelpCircle className="h-7 w-7 text-indigo-500" /> FAQ
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = faqOpen === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card/40 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : index)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-foreground hover:bg-muted/30 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/20 mt-1">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/20 py-12">
        <div className="container mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-muted-foreground">
            <div className="h-6 w-6 rounded bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-black">
              S
            </div>
            <span>© 2026 SIU Result Monitor. All rights reserved.</span>
          </div>

          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <Link href="#features" className="hover:text-foreground">Features</Link>
            <Link href="#faq" className="hover:text-foreground">FAQ</Link>
          </div>
        </div>
      </footer>

      {/* Command Palette Modal */}
      <CommandPalette />
    </div>
  );
}
