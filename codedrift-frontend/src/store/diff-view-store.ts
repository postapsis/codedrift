/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { create } from "zustand";
import type { DiffFileData } from "@/@types/diff.ts";
import { getDiffFileId } from "@/lib/diff-utils.ts";

type DiffQueryState = {
  diffFiles: DiffFileData[];
  isLoading: boolean;
  errorMessage: string | null;
};

type DiffViewStore = DiffQueryState & {
  selectedFileId: string | null;
  setFromDiffQueryState: (queryState: DiffQueryState) => void;
  setSelectedFileId: (selectedFileId: string | null) => void;
};

export const useDiffViewStore = create<DiffViewStore>((set) => ({
  diffFiles: [],
  selectedFileId: null,
  isLoading: true,
  errorMessage: null,
  setFromDiffQueryState: (queryState): void => {
    set((state) => {
      const selectedFileExists =
        state.selectedFileId !== null &&
        queryState.diffFiles.some((file) => getDiffFileId(file) === state.selectedFileId);

      const firstFile = queryState.diffFiles.at(0);

      return {
        ...queryState,
        selectedFileId: selectedFileExists
          ? state.selectedFileId
          : firstFile
            ? getDiffFileId(firstFile)
            : null,
      };
    });
  },
  setSelectedFileId: (selectedFileId): void => {
    set({ selectedFileId });
  },
}));
