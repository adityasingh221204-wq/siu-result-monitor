"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useRouter } from "next/navigation";
import {
  Search,
  Monitor,
  Moon,
  Sun,
  Plus,
  PlayCircle,
  Trash2,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
  const isOpen = useAppStore((state) => state.commandPaletteOpen);
  const setIsOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const setSoundEnabled = useAppStore((state) => state.setSoundEnabled);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items = [
    {
      id: "go-dashboard",
      title: "Go to Dashboard",
      description: "View main monitoring status and live analytics",
      icon: Monitor,
      action: () => {
        setActiveTab("dashboard");
        router.push("/dashboard");
      },
    },
    {
      id: "toggle-theme",
      title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      description: "Toggle between light and dark aesthetics",
      icon: theme === "dark" ? Sun : Moon,
      action: () => toggleTheme(),
    },
    {
      id: "toggle-sound",
      title: soundEnabled ? "Disable Alert Sounds" : "Enable Alert Sounds",
      description: "Toggle sirens and chirps upon result detection",
      icon: soundEnabled ? VolumeX : Volume2,
      action: () => setSoundEnabled(!soundEnabled),
    },
    {
      id: "simulate-success",
      title: "Simulate 'Result Found' (CONFETTI & ALARM)",
      description: "Artificially trigger the success screen and confettis",
      icon: PlayCircle,
      action: async () => {
        try {
          await fetch("/api/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "simulate" }),
          });
          // Refresh page or trigger client state
          window.dispatchEvent(new Event("monitoring-update"));
        } catch (err) {
          console.error(err);
        }
      },
    },
    {
      id: "clear-db",
      title: "Clear Mock History",
      description: "Truncate local database logs and mock checks",
      icon: Trash2,
      action: async () => {
        if (confirm("Are you sure you want to clear all monitoring logs?")) {
          // Send a post request or reset
          alert("Simulation Database cleared.");
        }
      },
    },
  ];

  // Filter items
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (index: number) => {
    const item = filtered[index];
    if (item) {
      item.action();
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Palette Box */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-card/90 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center border-b border-white/10 px-4 py-3">
              <Search className="mr-3 h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 hover:bg-white/10 text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No commands found.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex cursor-pointer items-center rounded-lg px-3 py-2.5 transition-colors ${
                        isSelected
                          ? "bg-primary text-white"
                          : "text-foreground hover:bg-white/5"
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${
                          isSelected ? "text-white" : "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.title}</div>
                        <div
                          className={`text-xs ${
                            isSelected ? "text-white/80" : "text-muted-foreground"
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 border border-white/10 rounded px-1.5 py-0.5 bg-black/20">
                        {item.id === "go-dashboard" ? "Enter" : `Cmd+K`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Use arrows</span>
                <kbd className="border border-white/10 rounded px-1 bg-white/5">↑↓</kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Press</span>
                <kbd className="border border-white/10 rounded px-1 bg-white/5">Enter</kbd>
                <span>to select</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
