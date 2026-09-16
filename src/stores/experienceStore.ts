import { create } from "zustand";
import type { ProjectConfig } from "@/config/portfolio";

let fruitIdSeq = 0;

interface ExperienceStore {
  loaded: boolean;
  loadProgress: number;
  activeProject: ProjectConfig | null;
  sheetOpen: boolean;
  fruitDropAt: { clientX: number; clientY: number; id: number; ts: number } | null;
  fruitEatenId: number | null;
  setLoaded: (loaded: boolean) => void;
  setLoadProgress: (progress: number) => void;
  openProject: (project: ProjectConfig) => void;
  closeProject: () => void;
  queueFruitDrop: (clientX: number, clientY: number) => void;
  clearFruitDrop: () => void;
  markFruitEaten: (id: number) => void;
  clearFruitEaten: () => void;
}

export const useExperienceStore = create<ExperienceStore>((set) => ({
  loaded: false,
  loadProgress: 0,
  activeProject: null,
  sheetOpen: false,
  fruitDropAt: null,
  fruitEatenId: null,
  setLoaded: (loaded) => set({ loaded }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  openProject: (project) => set({ activeProject: project, sheetOpen: true }),
  closeProject: () => set({ sheetOpen: false }),
  queueFruitDrop: (clientX, clientY) =>
    set({
      fruitDropAt: {
        clientX,
        clientY,
        id: ++fruitIdSeq,
        ts: Date.now(),
      },
    }),
  clearFruitDrop: () => set({ fruitDropAt: null }),
  markFruitEaten: (id) => set({ fruitEatenId: id }),
  clearFruitEaten: () => set({ fruitEatenId: null }),
}));
