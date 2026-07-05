/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */
import path from "node:path";
import { getReviewInfo as queryReviewInfo, setReviewOverview } from "../db/review-store.ts";
import { getChangesetFileKeys, saveChangeset } from "../db/changeset-store.ts";
import type { ResolvedChangesetFile } from "../db/changeset-store.ts";
import type {
  Changeset,
  ChangesetFileComment,
  ChangesetFileCommentInput,
  ChangesetInput,
} from "../@types/changeset.ts";
import type { ReviewInfo, ReviewOverview, ReviewRepositoryInfo } from "../@types/review.ts";

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

  if (!input.files?.length) {
    throw new ChangesetInputError("Changeset must include at least one file");
  }

  const info = getReviewInfo(reviewId);

  const existingFileKeys = new Set(
    getChangesetFileKeys(reviewId).map((key) => `${key.repositoryId}:${key.filePath}`),
  );
  const seenFileKeys = new Set<string>();
  const resolvedFiles: ResolvedChangesetFile[] = [];

  for (const file of input.files) {
    const absolutePath = normalizeAbsolutePath(file.filePath);
    const { repositoryId, relativePath } = resolveRepository(info.repositories, absolutePath);

    if (!file.summary?.trim()) {
      throw new ChangesetInputError(`File "${absolutePath}" is missing a change summary`);
    }

    const fileKey = `${repositoryId}:${relativePath}`;

    if (seenFileKeys.has(fileKey)) {
      throw new ChangesetInputError(
        `File "${absolutePath}" is listed more than once in the changeset`,
      );
    }

    if (existingFileKeys.has(fileKey)) {
      throw new ChangesetInputError(`File "${absolutePath}" already belongs to another changeset`);
    }

    seenFileKeys.add(fileKey);
    resolvedFiles.push({
      repositoryId,
      filePath: relativePath,
      summary: file.summary,
      comments: (file.comments ?? []).map((comment) => normalizeComment(absolutePath, comment)),
    });
  }

  return saveChangeset(reviewId, {
    name: input.name,
    description: input.description,
    files: resolvedFiles,
  });
};

export const getChangesetFiles = (reviewId: string): string[] => {
  const info = getReviewInfo(reviewId);

  const repositoryPathsById = new Map(
    info.repositories.map((repository) => [
      repository.repositoryId,
      normalizeRepositoryPath(repository.repositoryPath),
    ]),
  );

  return getChangesetFileKeys(reviewId).map((key) => {
    const repositoryPath = repositoryPathsById.get(key.repositoryId);

    return repositoryPath ? `${repositoryPath}/${key.filePath}` : key.filePath;
  });
};

export const addReviewOverview = (reviewId: string, overview: string): ReviewOverview => {
  if (!overview?.trim()) {
    throw new ChangesetInputError("Review overview is required");
  }

  if (!setReviewOverview(reviewId, overview)) {
    throw new ChangesetInputError(`Review "${reviewId}" not found`);
  }

  return { reviewId, overview };
};

const normalizeAbsolutePath = (filePath: string): string => {
  const normalizedPath = path.posix.normalize(filePath.trim().replaceAll("\\", "/"));

  if (!path.posix.isAbsolute(normalizedPath)) {
    throw new ChangesetInputError(
      `File path "${filePath}" must be an absolute path inside one of the review's repositories`,
    );
  }

  return normalizedPath;
};

const normalizeRepositoryPath = (repositoryPath: string): string => {
  const normalizedPath = path.posix.normalize(repositoryPath.trim().replaceAll("\\", "/"));

  return normalizedPath.endsWith("/") ? normalizedPath.slice(0, -1) : normalizedPath;
};

const resolveRepository = (
  repositories: ReviewRepositoryInfo[],
  absolutePath: string,
): { repositoryId: string; relativePath: string } => {
  let match: { repositoryId: string; repositoryPath: string } | null = null;

  for (const repository of repositories) {
    const repositoryPath = normalizeRepositoryPath(repository.repositoryPath);

    if (
      absolutePath.startsWith(`${repositoryPath}/`) &&
      (!match || repositoryPath.length > match.repositoryPath.length)
    ) {
      match = { repositoryId: repository.repositoryId, repositoryPath };
    }
  }

  if (!match) {
    throw new ChangesetInputError(
      `File "${absolutePath}" is not inside any repository of this review`,
    );
  }

  return {
    repositoryId: match.repositoryId,
    relativePath: absolutePath.slice(match.repositoryPath.length + 1),
  };
};

const normalizeComment = (
  absolutePath: string,
  comment: ChangesetFileCommentInput,
): ChangesetFileComment => {
  if (!Number.isInteger(comment.lineNumber) || comment.lineNumber < 1) {
    throw new ChangesetInputError(
      `File "${absolutePath}" has a comment with an invalid line number ` +
        `(${comment.lineNumber}); line numbers are 1-based integers`,
    );
  }

  if (!comment.comment?.trim()) {
    throw new ChangesetInputError(
      `File "${absolutePath}" has an empty comment at line ${comment.lineNumber}`,
    );
  }

  return {
    lineNumber: comment.lineNumber,
    side: comment.side ?? "new",
    comment: comment.comment,
  };
};
