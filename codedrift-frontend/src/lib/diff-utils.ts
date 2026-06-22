/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */
import type { DiffFileData } from "@/@types/diff.ts";

export const getDiffFileId = (file: DiffFileData): string => {
  return `${file.changeType}:${file.oldFileName}:${file.newFileName}`;
};

export const getDiffFileDisplayPath = (file: DiffFileData): string => {
  if (file.changeType === "deleted") {
    return file.oldFileName;
  }

  return file.newFileName || file.oldFileName;
};

export const getSelectedDiffFile = (
  diffFiles: DiffFileData[],
  selectedFileId: string | null,
): DiffFileData | undefined => {
  return diffFiles.find((file) => getDiffFileId(file) === selectedFileId) ?? diffFiles.at(0);
};