/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { create } from "zustand";
import type { ChangesetDiffFile } from "@/@types/changeset-diff.ts";
import type { DiffMode } from "@/@types/settings.ts";

type DiffViewStore = {
  diffFiles: ChangesetDiffFile[];
  fileDiffModeOverrides: Record<string, DiffMode>;
  setDiffFiles: (diffFiles: ChangesetDiffFile[]) => void;
  setFileDiffModeOverride: (fileId: string, diffMode: DiffMode) => void;
};

export const useDiffViewStore = create<DiffViewStore>((set) => ({
  diffFiles: [],
  fileDiffModeOverrides: {},
  setDiffFiles: (diffFiles): void => {
    set({ diffFiles });
  },
  setFileDiffModeOverride: (fileId, diffMode): void => {
    set((state) => ({
      fileDiffModeOverrides: { ...state.fileDiffModeOverrides, [fileId]: diffMode },
    }));
  },
}));
