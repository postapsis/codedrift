/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { DiffFileData } from "@/@types/diff.ts";

export type DiffViewContextValue = {
  diffFiles: DiffFileData[];
  selectedFile: DiffFileData | undefined;
  selectedFileId: string | null;
  setSelectedFileId: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
  errorMessage: string | null;
};

export const getDiffFileId = (file: DiffFileData): string => {
  return `${file.changeType}:${file.oldFileName}:${file.newFileName}`;
};

export const getDiffFileDisplayPath = (file: DiffFileData): string => {
  if (file.changeType === "deleted") {
    return file.oldFileName;
  }

  return file.newFileName || file.oldFileName;
};

export const DiffViewContext = createContext<DiffViewContextValue | null>(null);

export const useDiffViewContext = (): DiffViewContextValue => {
  const context = useContext(DiffViewContext);

  if (!context) {
    throw new Error("useDiffViewContext must be used inside DiffViewContext.Provider");
  }

  return context;
};
