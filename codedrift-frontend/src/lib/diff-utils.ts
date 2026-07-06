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

export const getDiffFileByDisplayPath = (
  diffFiles: ChangesetDiffFile[],
  displayPath: string | undefined,
): ChangesetDiffFile | undefined => {
  if (!displayPath) {
    return undefined;
  }

  return diffFiles.find((file) => getDiffFileDisplayPath(file) === displayPath);
};
