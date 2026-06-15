"use client";

import React, { useEffect, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";

export function AudioAlertPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundAlertPlaying = useAppStore((state) => state.soundAlertPlaying);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const soundVolume = useAppStore((state) => state.soundVolume);

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = soundVolume;

    if (soundAlertPlaying && soundEnabled) {
      audioRef.current.play().catch((err) => {
        console.warn("Audio play blocked by browser autoplay policy. User interaction required:", err);
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [soundAlertPlaying, soundEnabled, soundVolume]);

  return (
    <audio
      ref={audioRef}
      src="/audio.mp3"
      loop
      style={{ display: "none" }}
    />
  );
}
