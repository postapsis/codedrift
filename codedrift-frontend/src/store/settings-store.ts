/*
 * Author: Jamius Siam
 * Since: 06/07/2026
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DiffMode } from "@/@types/settings.ts";

type SettingsStore = {
  codeFontSize: number;
  diffMode: DiffMode;
  copyPathWithRepoName: boolean;
  setCodeFontSize: (codeFontSize: number) => void;
  setDiffMode: (diffMode: DiffMode) => void;
  setCopyPathWithRepoName: (copyPathWithRepoName: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      codeFontSize: 12,
      diffMode: "split",
      copyPathWithRepoName: false,
      setCodeFontSize: (codeFontSize): void => {
        set({ codeFontSize });
      },
      setDiffMode: (diffMode): void => {
        set({ diffMode });
      },
      setCopyPathWithRepoName: (copyPathWithRepoName): void => {
        set({ copyPathWithRepoName });
      },
    }),
    {
      name: "codedrift-settings",
      storage: createJSONStorage(() => localStorage),
      version: 0,
    },
  ),
);
