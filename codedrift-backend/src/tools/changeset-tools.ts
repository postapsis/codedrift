/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */
import path from "node:path";
import { getReviewById, getReviewInfo as queryReviewInfo } from "../db/review-store.ts";
import { getChangesetFilePaths, saveChangeset } from "../db/changeset-store.ts";
import type { Changeset, ChangesetInput } from "../@types/changeset.ts";
import type { ReviewInfo } from "../@types/review.ts";

export class ChangesetInputError extends Error {}

export const getReviewInfo = (reviewId: string): ReviewInfo => {
  const info = queryReviewInfo(reviewId);

  if (!info) {
    throw new ChangesetInputError(`Review "${reviewId}" not found`);
  }

  return info;
};

export const addChangeset = (reviewId: string, input: ChangesetInput): Changeset => {
  if (!input.name?.trim()) {
    throw new ChangesetInputError("Changeset name is required");
  }

  if (!input.filesPaths?.length) {
    throw new ChangesetInputError("Changeset must include at least one file path");
  }

  if (!getReviewById(reviewId)) {
    throw new ChangesetInputError(`Review "${reviewId}" not found`);
  }

  const filesPaths = input.filesPaths.map(getRepoRelativePath);

  const existingFilePaths = new Set(getChangesetFilePaths(reviewId));
  const seenFilePaths = new Set<string>();

  for (const filePath of filesPaths) {
    if (seenFilePaths.has(filePath)) {
      throw new ChangesetInputError(
        `File path "${filePath}" is listed more than once in the changeset`,
      );
    }

    if (existingFilePaths.has(filePath)) {
      throw new ChangesetInputError(
        `File path "${filePath}" already belongs to another changeset`,
      );
    }

    seenFilePaths.add(filePath);
  }

  return saveChangeset(reviewId, { ...input, filesPaths });
};

export const getChangesetFiles = (reviewId: string): string[] => {
  if (!getReviewById(reviewId)) {
    throw new ChangesetInputError(`Review "${reviewId}" not found`);
  }

  return getChangesetFilePaths(reviewId);
};

const getRepoRelativePath = (filePath: string): string => {
  const normalizedPath = filePath.trim().replaceAll("\\", "/");

  if (
    !normalizedPath ||
    path.isAbsolute(filePath) ||
    path.win32.isAbsolute(filePath) ||
    path.posix.isAbsolute(normalizedPath)
  ) {
    throw new ChangesetInputError(
      "filePath must be a repository file path relative to the configured repository root",
    );
  }

  const repoRelativePath = path.posix.normalize(normalizedPath);

  if (repoRelativePath === "." || repoRelativePath === ".." || repoRelativePath.startsWith("../")) {
    throw new ChangesetInputError(
      "filePath must be a repository file path relative to the configured repository root",
    );
  }

  return repoRelativePath;
};
