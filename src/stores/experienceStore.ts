import { create } from "zustand";
import type { ProjectConfig } from "@/config/portfolio";

export interface FruitDrop {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

interface ExperienceStore {
  loaded: boolean;
  loadProgress: number;
  activeProject: ProjectConfig | null;
  sheetOpen: boolean;
  fruits: FruitDrop[];
  catchPulse: number;
  setLoaded: (loaded: boolean) => void;
  setLoadProgress: (progress: number) => void;
  openProject: (project: ProjectConfig) => void;
  closeProject: () => void;
  addFruit: (fruit: FruitDrop) => void;
  removeFruit: (id: number) => void;
  pulseCatch: () => void;
}

let fruitSeq = 0;
const FRUIT_EMOJIS = ["🍎", "🍊", "🍇", "🍓", "🍒", "🥝", "🍑"];

export function nextFruitId() {
  return fruitSeq++;
}

export function randomFruitEmoji() {
  return FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)];
}

export const useExperienceStore = create<ExperienceStore>((set) => ({
  loaded: false,
  loadProgress: 0,
  activeProject: null,
  sheetOpen: false,
  fruits: [],
  catchPulse: 0,
  setLoaded: (loaded) => set({ loaded }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  openProject: (project) => set({ activeProject: project, sheetOpen: true }),
  closeProject: () => set({ sheetOpen: false }),
  addFruit: (fruit) => set((s) => ({ fruits: [...s.fruits.slice(-7), fruit] })),
  removeFruit: (id) => set((s) => ({ fruits: s.fruits.filter((f) => f.id !== id) })),
  pulseCatch: () => {
    set({ catchPulse: 1 });
    setTimeout(() => set({ catchPulse: 0 }), 180);
  },
}));
