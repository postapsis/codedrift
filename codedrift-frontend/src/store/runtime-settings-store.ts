/*
 * Author: Jamius Siam
 * Since: 06/07/2026
 */
import { create } from "zustand";

type RuntimeSettingsStore = {
  isFileBrowserCollapsed: boolean;
  setIsFileBrowserCollapsed: (isFileBrowserCollapsed: boolean) => void;
};

export const useRuntimeSettingsStore = create<RuntimeSettingsStore>((set) => ({
  isFileBrowserCollapsed: false,
  setIsFileBrowserCollapsed: (isFileBrowserCollapsed): void => {
    set({ isFileBrowserCollapsed });
  },
}));
