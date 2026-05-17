"use client";

import type { Howl as HowlType } from "howler";

let howlInstance: HowlType | null = null;
let sound: HowlType | null = null;

export async function preloadPageFlipSound(): Promise<void> {
  if (typeof window === "undefined") return;
  if (sound) return;
  const { Howl } = await import("howler");
  howlInstance = Howl as any;
  sound = new Howl({
    src: ["/sounds/page-flip.mp3"],
    volume: 0.4,
    onloaderror: () => {
      sound = null;
    },
  });
}

export function playPageFlip(): void {
  if (sound && typeof window !== "undefined") {
    try {
      sound.stop();
      sound.play();
    } catch {
      // swallow — sound is non-critical
    }
  }
}

export function isPageFlipSoundAvailable(): boolean {
  return sound !== null;
}
