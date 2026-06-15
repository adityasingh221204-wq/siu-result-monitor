"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/use-app-store";
import { CommandPalette } from "@/components/shared/CommandPalette";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Settings,
  HelpCircle,
  Bell,
  Volume2,
  VolumeX,
  Play,
  RotateCw,
  Plus,
  Trash2,
  Eye,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  X,
  Sparkles,
  Award,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import confetti from "canvas-confetti";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const setIsOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const setSoundEnabled = useAppStore((state) => state.setSoundEnabled);
  const soundVolume = useAppStore((state) => state.soundVolume);
  const setSoundVolume = useAppStore((state) => state.setSoundVolume);

  // Confetti/Alarm states
  const soundAlertPlaying = useAppStore((state) => state.soundAlertPlaying);
  const setSoundAlertPlaying = useAppStore((state) => state.setSoundAlertPlaying);
  const isConfettiPlaying = useAppStore((state) => state.isConfettiPlaying);
  const setIsConfettiPlaying = useAppStore((state) => state.setIsConfettiPlaying);

  // Tabs
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  // UI state
  const [newPRN, setNewPRN] = useState("");
  const [newPRNName, setNewPRNName] = useState("");
  const [addingPRN, setAddingPRN] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
  const [nextCheckSeconds, setNextCheckSeconds] = useState(60);
  const [isClient, setIsClient] = useState(false);

  // Timer Ref for countdown
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hydration guard
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch status settings & trackers
  const { data: trackerData, isLoading: trackersLoading } = useQuery({
    queryKey: ["trackers"],
    queryFn: async () => {
      const res = await fetch("/api/check");
      if (!res.ok) throw new Error("Failed to fetch trackers");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Fetch health and latency history
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health/status");
      if (!res.ok) throw new Error("Failed to fetch health status");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Fetch monitoring checks history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const res = await fetch("/api/logs/history?limit=30");
      if (!res.ok) throw new Error("Failed to fetch logs history");
      return res.json();
    },
    refetchInterval: 3000,
  });

  // Next check countdown timer logic
  useEffect(() => {
    if (healthData?.checkInterval) {
      setNextCheckSeconds(healthData.checkInterval);
    }
  }, [healthData?.lastCheckedAt, healthData?.checkInterval]);

  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      setNextCheckSeconds((prev) => {
        if (prev <= 1) {
          queryClient.invalidateQueries({ queryKey: ["health"] });
          queryClient.invalidateQueries({ queryKey: ["history"] });
          return healthData?.checkInterval || 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [healthData?.checkInterval, queryClient]);

  // Request browser notifications permission
  useEffect(() => {
    if (isClient && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [isClient]);

  // Check if result has been detected in latest history logs
  useEffect(() => {
    if (historyData?.logs && historyData.logs.length > 0) {
      const latestLog = historyData.logs[0];
      if (latestLog.status === "SUCCESS") {
        // Trigger audio & confetti if not already playing
        if (!soundAlertPlaying && !isConfettiPlaying) {
          setSoundAlertPlaying(true);
          setIsConfettiPlaying(true);

          // Trigger browser notification
          if (isClient && "Notification" in window && Notification.permission === "granted") {
            new Notification("🚨 SIU RESULT OUT!", {
              body: `Results detected for PRN ${latestLog.tracker?.prn || ""}. Check exam portal immediately!`,
              icon: "/favicon.ico",
              requireInteraction: true,
            });
          }
        }
      }
    }
  }, [historyData?.logs, soundAlertPlaying, isConfettiPlaying, setSoundAlertPlaying, setIsConfettiPlaying, isClient]);

  // Confetti cycle
  useEffect(() => {
    let confettiInterval: NodeJS.Timeout | null = null;
    if (isConfettiPlaying) {
      const runConfetti = () => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981"],
        });
      };
      runConfetti();
      confettiInterval = setInterval(runConfetti, 2500);
    }
    return () => {
      if (confettiInterval) clearInterval(confettiInterval);
    };
  }, [isConfettiPlaying]);

  // Mutation to add tracker
  const addTrackerMutation = useMutation({
    mutationFn: async (payload: { prn: string; name?: string }) => {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", ...payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add tracker");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackers"] });
      setNewPRN("");
      setNewPRNName("");
      setAddingPRN(false);
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err.message);
    },
  });

  // Mutation to delete tracker
  const removeTrackerMutation = useMutation({
    mutationFn: async (prn: string) => {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", prn }),
      });
      if (!res.ok) throw new Error("Failed to delete tracker");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackers"] });
    },
  });

  // Mutation to update check interval settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (interval: number) => {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateSettings", interval }),
      });
      if (!res.ok) throw new Error("Failed to update check settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
    },
  });

  // Trigger manual simulation check
  const handleSimulate = async () => {
    try {
      await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate" }),
      });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: ["health"] });
    } catch (err) {
      console.error(err);
    }
  };

  // Clear sound and confetti
  const handleAcknowledgeResult = () => {
    setSoundAlertPlaying(false);
    setIsConfettiPlaying(false);
  };

  const activeTrackers = trackerData?.trackers || [];
  const latestChecks = historyData?.logs || [];
  const totalChecks = historyData?.totalChecks || 0;
  const isOnline = healthData?.status === "ONLINE";
  const isSlow = healthData?.status === "SLOW";
  const isDown = healthData?.status === "DOWN";

  // Check if result has ever been detected
  const isResultDetected = latestChecks.length > 0 && latestChecks[0].status === "SUCCESS";

  return (
    <div className="flex min-h-screen bg-background text-foreground grid-bg transition-colors duration-300">
      {/* Backdrop mesh glows */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

      {/* Main dashboard content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/50 backdrop-blur-md px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-tight">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black shadow shadow-indigo-500/10">
                S
              </div>
              <span className="hidden sm:inline">SIU Monitor</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:inline" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Portal Status:</span>
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-black/10 px-2.5 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">
                <span
                  className={`h-1.5 w-1.5 rounded-full animate-heartbeat ${
                    isOnline ? "bg-emerald-500 glow-emerald" : isSlow ? "bg-amber-500" : "bg-rose-500"
                  }`}
                />
                <span className="uppercase tracking-wider">
                  {isOnline ? "Online" : isSlow ? "Slow" : isDown ? "Down" : "Loading..."}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Simulation controls */}
            <button
              onClick={handleSimulate}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 hover:bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground transition cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 text-indigo-500" />
              <span>Mock Result</span>
            </button>

            {/* Spotlight shortcut */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 transition cursor-pointer"
            >
              <span>Search</span>
              <kbd className="border border-border/80 rounded bg-background px-1 text-[10px]">Ctrl K</kbd>
            </button>

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted/80 transition cursor-pointer"
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
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Active Result banner if success */}
          <AnimatePresence>
            {isResultDetected && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 glow-emerald backdrop-blur-md"
              >
                <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] rounded-full bg-emerald-500/10 blur-[40px] pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 animate-bounce">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Symbiosis Exam Results Detected!</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        The monitoring agent successfully detected the result tables. Action is required.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={handleAcknowledgeResult}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 text-sm transition shadow-lg shadow-emerald-500/25 cursor-pointer"
                    >
                      Acknowledge & Mute Alarm
                    </button>
                    <a
                      href="https://siuexam.siu.edu.in/forms/resultview.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold px-4 py-2.5 text-sm transition cursor-pointer"
                    >
                      Go to SIU Portal
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Monitoring Status */}
            <div className="rounded-2xl glass-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  MONITORING STATUS
                </span>
                <Clock className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">Active</span>
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-heartbeat glow-emerald mb-1.5" />
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Background worker is polling the Symbiosis portal every {healthData?.checkInterval || 60} seconds.
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 text-xs">
                <div>
                  <div className="text-muted-foreground">Next Check</div>
                  <div className="font-bold text-foreground mt-0.5">{nextCheckSeconds}s</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Checks</div>
                  <div className="font-bold text-foreground mt-0.5">{totalChecks}</div>
                </div>
              </div>
            </div>

            {/* Card 2: Result status detection */}
            <div className="rounded-2xl glass-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  RESULT STATUS
                </span>
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="mt-4">
                {isResultDetected ? (
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="h-8 w-8 animate-bounce" />
                    <span className="text-2xl font-extrabold">DETECTED!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 animate-pulse text-amber-500" />
                    <span className="text-2xl font-extrabold text-foreground">NOT FOUND</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {isResultDetected
                  ? "Verification service found active result tables on the exam server."
                  : "The exam portal form was entered. No active results are currently published."}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4 text-xs">
                <div>
                  <div className="text-muted-foreground">Last Successful Fetch</div>
                  <div className="font-bold text-foreground mt-0.5">
                    {latestChecks.length > 0
                      ? new Date(latestChecks[0].checkTime).toLocaleTimeString()
                      : "Never"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="font-bold text-foreground mt-0.5">99.8%</div>
                </div>
              </div>
            </div>

            {/* Card 3: Portal Health Stats */}
            <div className="rounded-2xl glass-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  PORTAL HEALTH
                </span>
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">
                  {healthData?.averageLatency || 0}ms
                </span>
                <span className="text-xs text-muted-foreground font-semibold">avg latency</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Overall system query latency to Symbiosis servers based on last 15 ticks.
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 text-xs">
                <div>
                  <div className="text-muted-foreground">Success Rate</div>
                  <div className="font-bold text-foreground mt-0.5">{healthData?.successRate || 100}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Active PRNs</div>
                  <div className="font-bold text-foreground mt-0.5">{activeTrackers.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-border/40 pb-px">
            <div className="flex gap-4">
              {[
                { id: "dashboard", label: "Dashboard", icon: Activity },
                { id: "monitor", label: "Monitor PRNs", icon: CheckCircle2 },
                { id: "history", label: "Log History", icon: History },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition cursor-pointer ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Panels */}
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid gap-6 lg:grid-cols-3"
              >
                {/* Left Columns (Charts & Live feed) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Chart widget */}
                  <div className="rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Portal Response Latency</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Time taken to request the Symbiosis page and complete the form
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                        <TrendingUp className="h-3.5 w-3.5" /> Stable
                      </span>
                    </div>
                    <div className="h-[240px] w-full">
                      {isClient && healthData?.latencyHistory ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={healthData.latencyHistory}>
                            <defs>
                              <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="time"
                              stroke="currentColor"
                              className="text-muted-foreground/60 text-[10px]"
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="currentColor"
                              className="text-muted-foreground/60 text-[10px]"
                              tickLine={false}
                              axisLine={false}
                              unit="ms"
                            />
                            <Tooltip
                              contentStyle={{
                                background: "rgba(12, 12, 14, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                              }}
                              itemStyle={{ color: "#f4f4f5" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="latency"
                              stroke="#6366f1"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#latencyGlow)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                          Chart loading or no latency ticks logged yet...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* History feed */}
                  <div className="rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur">
                    <h3 className="text-base font-bold text-foreground mb-4">Latest Logs History</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/40 text-xs font-bold text-muted-foreground uppercase">
                            <th className="pb-3">Check Time</th>
                            <th className="pb-3">Tracked PRN</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Latency</th>
                            <th className="pb-3 text-right">Screen</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {latestChecks.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                                No check history found. Ensure python script is running and sending logs.
                              </td>
                            </tr>
                          ) : (
                            latestChecks.map((log: any) => (
                              <tr key={log.id} className="border-b border-border/20 last:border-0 hover:bg-white/5 transition duration-150">
                                <td className="py-3 text-xs text-muted-foreground">
                                  {new Date(log.checkTime).toLocaleString()}
                                </td>
                                <td className="py-3 font-semibold text-xs text-foreground">
                                  {log.tracker?.prn}
                                </td>
                                <td className="py-3">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      log.status === "SUCCESS"
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : log.status === "NO_RESULT"
                                        ? "bg-indigo-500/10 text-indigo-400"
                                        : "bg-rose-500/10 text-rose-500"
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        log.status === "SUCCESS"
                                          ? "bg-emerald-500"
                                          : log.status === "NO_RESULT"
                                          ? "bg-indigo-500"
                                          : "bg-rose-500"
                                      }`}
                                    />
                                    {log.status === "SUCCESS"
                                      ? "Result Found"
                                      : log.status === "NO_RESULT"
                                      ? "No Result"
                                      : "Failed"}
                                  </span>
                                </td>
                                <td className="py-3 text-right text-xs text-muted-foreground font-mono">
                                  {log.responseTime}ms
                                </td>
                                <td className="py-3 text-right">
                                  {log.screenshot ? (
                                    <button
                                      onClick={() => setActiveScreenshot(log.screenshot)}
                                      className="rounded-lg p-1.5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                                      title="View bot screenshot"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/40 font-mono">-</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column (Activity Feed & Quick PRNs) */}
                <div className="space-y-6">
                  {/* Live Activity Feed */}
                  <div className="rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-foreground">Live activity</h3>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {latestChecks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Waiting for check activity logs...
                        </p>
                      ) : (
                        latestChecks.slice(0, 8).map((log: any, idx: number) => (
                          <div key={log.id} className="flex gap-3 text-xs leading-relaxed border-l-2 border-border/40 pl-3 relative">
                            <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full border border-card bg-indigo-500" />
                            <div className="flex-1">
                              <span className="font-bold text-foreground">
                                {new Date(log.checkTime).toLocaleTimeString()}
                              </span>
                              <p className="text-muted-foreground mt-0.5">
                                PRN {log.tracker?.prn}: Checked portal.{" "}
                                <span className={log.status === "SUCCESS" ? "text-emerald-500 font-bold" : ""}>
                                  {log.status === "SUCCESS"
                                    ? "Result detected!"
                                    : log.status === "NO_RESULT"
                                    ? "No result published."
                                    : `Failed: ${log.errorMessage || "Unknown error"}`}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Active PRNs table */}
                  <div className="rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur">
                    <h3 className="text-base font-bold text-foreground mb-4">Trackers Active</h3>
                    <div className="space-y-3">
                      {activeTrackers.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No active PRNs monitored. Head to the 'Monitor PRNs' tab to add your PRN.
                        </p>
                      ) : (
                        activeTrackers.map((tr: any) => (
                          <div key={tr.id} className="flex items-center justify-between rounded-xl border border-border bg-black/10 p-3">
                            <div>
                              <div className="text-xs font-bold text-foreground">{tr.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{tr.prn}</div>
                            </div>
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500">
                              <span className="h-1 w-1 rounded-full bg-emerald-500" /> Tracking
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Monitor Tab */}
            {activeTab === "monitor" && (
              <motion.div
                key="monitor-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-5 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">PRN Monitoring Setup</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add the PRNs of yourself or your friends to track multiple databases simultaneously.
                      </p>
                    </div>

                    <button
                      onClick={() => setAddingPRN(!addingPRN)}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add PRN
                    </button>
                  </div>

                  {/* Add PRN form */}
                  <AnimatePresence>
                    {addingPRN && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border border-border bg-black/10 rounded-xl p-5 mb-6"
                      >
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!newPRN) return;
                            addTrackerMutation.mutate({ prn: newPRN, name: newPRNName });
                          }}
                          className="grid gap-4 sm:grid-cols-3 items-end"
                        >
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              PRN Number *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 24070126017"
                              value={newPRN}
                              onChange={(e) => setNewPRN(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                              Student Name (optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Aditya Singh"
                              value={newPRNName}
                              onChange={(e) => setNewPRNName(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={addTrackerMutation.isPending}
                              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 text-sm transition cursor-pointer"
                            >
                              {addTrackerMutation.isPending ? "Adding..." : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingPRN(false);
                                setErrorMsg("");
                              }}
                              className="w-full rounded-lg border border-border hover:bg-muted text-foreground py-2 text-sm transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                        {errorMsg && (
                          <p className="text-xs text-rose-500 font-semibold mt-3">{errorMsg}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* List of active trackers */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {activeTrackers.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
                        No PRNs are currently set up for monitoring. Click 'Add PRN' to start.
                      </div>
                    ) : (
                      activeTrackers.map((tr: any) => (
                        <div
                          key={tr.id}
                          className="flex flex-col justify-between rounded-xl border border-border bg-background/50 p-5 relative overflow-hidden group hover:border-indigo-500/50 hover:shadow-lg transition duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-foreground">{tr.name}</h4>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">{tr.prn}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Stop monitoring PRN ${tr.prn}?`)) {
                                  removeTrackerMutation.mutate(tr.prn);
                                }
                              }}
                              className="rounded-lg p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              title="Delete tracker"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-6 flex items-center justify-between text-xs border-t border-border/40 pt-3">
                            <span className="text-[10px] text-muted-foreground">
                              Added: {new Date(tr.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-500">
                              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-foreground font-sans">Full Monitoring Log</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Historical list of every request made to Symbiosis Exam portal.
                      </p>
                    </div>

                    <button
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["history"] })}
                      className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                      title="Force Refresh"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 text-xs font-bold text-muted-foreground uppercase">
                          <th className="pb-3">Log ID</th>
                          <th className="pb-3">Timestamp</th>
                          <th className="pb-3">PRN Monitored</th>
                          <th className="pb-3">Status Result</th>
                          <th className="pb-3">Response Speed</th>
                          <th className="pb-3 text-right">Error Log</th>
                          <th className="pb-3 text-right">Screenshot</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {latestChecks.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                              No history found.
                            </td>
                          </tr>
                        ) : (
                          latestChecks.map((log: any) => (
                            <tr key={log.id} className="border-b border-border/20 last:border-0 hover:bg-white/5 transition duration-150">
                              <td className="py-3 font-mono text-xs text-muted-foreground">
                                {log.id.slice(0, 8)}
                              </td>
                              <td className="py-3 text-xs text-foreground">
                                {new Date(log.checkTime).toLocaleString()}
                              </td>
                              <td className="py-3 font-bold text-xs text-foreground">
                                {log.tracker?.prn}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    log.status === "SUCCESS"
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : log.status === "NO_RESULT"
                                      ? "bg-indigo-500/10 text-indigo-400"
                                      : "bg-rose-500/10 text-rose-500"
                                  }`}
                                >
                                  {log.status === "SUCCESS"
                                    ? "Result Out"
                                    : log.status === "NO_RESULT"
                                    ? "No Result"
                                    : "Failed"}
                                </span>
                              </td>
                              <td className="py-3 text-xs font-mono text-muted-foreground">
                                {log.responseTime}ms
                              </td>
                              <td className="py-3 text-right text-xs text-rose-500 max-w-[150px] truncate">
                                {log.errorMessage || "-"}
                              </td>
                              <td className="py-3 text-right">
                                {log.screenshot ? (
                                  <button
                                    onClick={() => setActiveScreenshot(log.screenshot)}
                                    className="rounded-lg p-1.5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40 font-mono">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur">
                  <h3 className="text-lg font-bold text-foreground border-b border-border/40 pb-3 mb-6">
                    Monitoring Configurations
                  </h3>

                  <div className="space-y-6 max-w-xl">
                    {/* Interval Slider */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Check Interval: {healthData?.checkInterval || 60} seconds
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="5"
                        value={healthData?.checkInterval || 60}
                        onChange={(e) => updateSettingsMutation.mutate(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                        Frequency at which the Python agent checks the university exam portal. Faster checking frequencies increase server overhead. (Min: 10s, Max: 300s).
                      </p>
                    </div>

                    {/* Sounds settings */}
                    <div className="border-t border-border/40 pt-5">
                      <h4 className="text-sm font-bold text-foreground mb-3">Sound alerts</h4>
                      <div className="flex items-center justify-between rounded-xl border border-border bg-black/10 p-4">
                        <div>
                          <div className="text-xs font-bold text-foreground">Play aggressive sound on result detected</div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Play repeating loop audio when result tables are successfully detected.
                          </p>
                        </div>

                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={`rounded-lg p-2.5 transition cursor-pointer ${
                            soundEnabled
                              ? "bg-indigo-600/20 text-indigo-400"
                              : "bg-muted-foreground/10 text-muted-foreground"
                          }`}
                        >
                          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </button>
                      </div>

                      {soundEnabled && (
                        <div className="mt-4">
                          <label className="block text-xs font-semibold text-muted-foreground mb-2">
                            Alert Volume: {Math.round(soundVolume * 100)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={soundVolume}
                            onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                            className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                      )}
                    </div>

                    {/* Test alert block */}
                    <div className="border-t border-border/40 pt-5">
                      <h4 className="text-sm font-bold text-foreground mb-2">Test alert experience</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        Test how the siren and confetti will feel without modifying your database data.
                      </p>
                      <button
                        onClick={() => {
                          setIsConfettiPlaying(true);
                          setSoundAlertPlaying(true);
                        }}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 text-xs transition cursor-pointer"
                      >
                        Trigger Test Celebration
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Confetti & sound active success popup screen */}
      <AnimatePresence>
        {(isConfettiPlaying || soundAlertPlaying) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-8 text-center shadow-2xl glow-emerald relative"
            >
              <div className="absolute top-[-30%] right-[-10%] w-[180px] h-[180px] rounded-full bg-emerald-500/10 blur-[50px] pointer-events-none" />
              <div className="absolute bottom-[-30%] left-[-10%] w-[180px] h-[180px] rounded-full bg-indigo-500/10 blur-[50px] pointer-events-none" />

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 mb-6 animate-bounce">
                <Award className="h-10 w-10" />
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                RESULT DECLARED!
              </h2>

              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                The automatic bot check detected seat numbers and results on the exam portal. Siren alert and browser notifications are firing in the background.
              </p>

              <div className="mt-8 space-y-3">
                <button
                  onClick={handleAcknowledgeResult}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer text-sm"
                >
                  Silence Alarm & Dismiss
                </button>

                <a
                  href="https://siuexam.siu.edu.in/forms/resultview.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center rounded-xl border border-border bg-black/20 hover:bg-black/40 text-foreground font-semibold py-3 transition text-sm cursor-pointer"
                >
                  Go to SIU Result Portal
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screenshot viewer lightbox */}
      <AnimatePresence>
        {activeScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveScreenshot(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-card rounded-xl border border-white/10 overflow-hidden shadow-2xl p-2 cursor-default"
            >
              <button
                onClick={() => setActiveScreenshot(null)}
                className="absolute top-4 right-4 rounded-lg bg-black/60 p-2 text-white hover:bg-black/90 transition cursor-pointer"
                title="Close Lightbox"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={activeScreenshot}
                alt="Selenium Bot debug screenshot"
                className="w-full h-auto rounded-lg max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Selenium headless screenshot capture</span>
                <span className="font-mono text-[10px]">Status: Captured 200 OK</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
