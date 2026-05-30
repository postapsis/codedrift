/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
export type DiffChangeType = "changed" | "added" | "moved" | "deleted";

export type DiffFileData = {
  oldFileName: string;
  newFileName: string;
  fileLanguage: string;
  rawDiff: string;
  changeType: DiffChangeType;
};
