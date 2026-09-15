import { create } from "zustand";
import type { ProjectConfig } from "@/config/portfolio";

interface ExperienceStore {
  loaded: boolean;
  loadProgress: number;
  activeProject: ProjectConfig | null;
  sheetOpen: boolean;
  fruitDropAt: { clientX: number; clientY: number; ts: number } | null;
  setLoaded: (loaded: boolean) => void;
  setLoadProgress: (progress: number) => void;
  openProject: (project: ProjectConfig) => void;
  closeProject: () => void;
  queueFruitDrop: (clientX: number, clientY: number) => void;
  clearFruitDrop: () => void;
}

export const useExperienceStore = create<ExperienceStore>((set) => ({
  loaded: false,
  loadProgress: 0,
  activeProject: null,
  sheetOpen: false,
  fruitDropAt: null,
  setLoaded: (loaded) => set({ loaded }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  openProject: (project) => set({ activeProject: project, sheetOpen: true }),
  closeProject: () => set({ sheetOpen: false }),
  queueFruitDrop: (clientX, clientY) =>
    set({ fruitDropAt: { clientX, clientY, ts: Date.now() } }),
  clearFruitDrop: () => set({ fruitDropAt: null }),
}));
