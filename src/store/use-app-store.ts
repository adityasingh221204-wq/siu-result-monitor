import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  theme: "dark" | "light";
  soundEnabled: boolean;
  soundVolume: number;
  commandPaletteOpen: boolean;
  selectedPRN: string;
  isConfettiPlaying: boolean;
  soundAlertPlaying: boolean;
  activeTab: "dashboard" | "monitor" | "history" | "analytics" | "settings";
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSelectedPRN: (prn: string) => void;
  setIsConfettiPlaying: (playing: boolean) => void;
  setSoundAlertPlaying: (playing: boolean) => void;
  setActiveTab: (tab: "dashboard" | "monitor" | "history" | "analytics" | "settings") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "dark",
      soundEnabled: true,
      soundVolume: 0.8,
      commandPaletteOpen: false,
      selectedPRN: "",
      isConfettiPlaying: false,
      soundAlertPlaying: false,
      activeTab: "dashboard",
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setSoundVolume: (soundVolume) => set({ soundVolume }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setSelectedPRN: (selectedPRN) => set({ selectedPRN }),
      setIsConfettiPlaying: (isConfettiPlaying) => set({ isConfettiPlaying }),
      setSoundAlertPlaying: (soundAlertPlaying) => set({ soundAlertPlaying }),
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: "siu-result-monitor-storage",
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        soundVolume: state.soundVolume,
        selectedPRN: state.selectedPRN,
      }),
    }
  )
);
