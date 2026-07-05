/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */
import type { ChangesetDiffFile } from "@/@types/changeset-diff.ts";

export const getDiffFileId = (file: ChangesetDiffFile): string => {
  return `${file.repositoryId}:${file.changeType}:${file.oldFileName}:${file.newFileName}`;
};

export const getDiffFileDisplayPath = (file: ChangesetDiffFile): string => {
  const filePath =
    file.changeType === "deleted" ? file.oldFileName : file.newFileName || file.oldFileName;

  return `${file.repositoryName}/${filePath}`;
};

export const getSelectedDiffFile = (
  diffFiles: ChangesetDiffFile[],
  selectedFileId: string | null,
): ChangesetDiffFile | undefined => {
  return diffFiles.find((file) => getDiffFileId(file) === selectedFileId) ?? diffFiles.at(0);
};
