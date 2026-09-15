import { create } from "zustand";
import type { ProjectConfig } from "@/config/portfolio";

interface ExperienceStore {
  loaded: boolean;
  loadProgress: number;
  activeProject: ProjectConfig | null;
  sheetOpen: boolean;
  setLoaded: (loaded: boolean) => void;
  setLoadProgress: (progress: number) => void;
  openProject: (project: ProjectConfig) => void;
  closeProject: () => void;
}

export const useExperienceStore = create<ExperienceStore>((set) => ({
  loaded: false,
  loadProgress: 0,
  activeProject: null,
  sheetOpen: false,
  setLoaded: (loaded) => set({ loaded }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  openProject: (project) => set({ activeProject: project, sheetOpen: true }),
  closeProject: () => set({ sheetOpen: false }),
}));
