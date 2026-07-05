/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { create } from "zustand";
import type { ChangesetDiffFile } from "@/@types/changeset-diff.ts";
import type { DiffMode } from "@/@types/settings.ts";
import { getDiffFileId } from "@/lib/diff-utils.ts";

type DiffViewStore = {
  diffFiles: ChangesetDiffFile[];
  selectedFileId: string | null;
  fileDiffModeOverrides: Record<string, DiffMode>;
  setDiffFiles: (diffFiles: ChangesetDiffFile[]) => void;
  setSelectedFileId: (selectedFileId: string | null) => void;
  setFileDiffModeOverride: (fileId: string, diffMode: DiffMode) => void;
};

export const useDiffViewStore = create<DiffViewStore>((set) => ({
  diffFiles: [],
  selectedFileId: null,
  fileDiffModeOverrides: {},
  setDiffFiles: (diffFiles): void => {
    set((state) => {
      const selectedFileId = getSelectedFileId(state, diffFiles);

      return {
        diffFiles,
        selectedFileId,
      };
    });
  },
  setSelectedFileId: (selectedFileId): void => {
    set({ selectedFileId });
  },
  setFileDiffModeOverride: (fileId, diffMode): void => {
    set((state) => ({
      fileDiffModeOverrides: { ...state.fileDiffModeOverrides, [fileId]: diffMode },
    }));
  },
}));

function getSelectedFileId(state: DiffViewStore, diffFiles: ChangesetDiffFile[]): string | null {
  const selectedFileExists =
    state.selectedFileId !== null &&
    diffFiles.some((file) => getDiffFileId(file) === state.selectedFileId);

  const firstFile = diffFiles.at(0);

  if (selectedFileExists) {
    // If selected file exists in the new diff files list, return it
    return state.selectedFileId;
  } else if (firstFile) {
    // If selected file doesn't exist, return the first file
    return getDiffFileId(firstFile);
  } else {
    // If no files exist, return null
    return null;
  }
}
