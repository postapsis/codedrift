/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */
import path from "node:path";
import {
  getReviewInfo as queryReviewInfo,
  setReviewOverview as persistReviewOverview,
} from "../db/review-store.ts";
import {
  addChangesetFile as insertChangesetFile,
  deleteChangeset as removeChangeset,
  deleteChangesetFile as removeChangesetFileRow,
  deleteComment as removeComment,
  getChangesetById,
  getChangesetFileId,
  getChangesetFileKeys,
  getChangesets as queryChangesets,
  getCommentContext,
  insertComment,
  saveChangeset,
  updateChangeset as persistChangeset,
  updateChangesetFileSummary as persistChangesetFileSummary,
  updateComment,
} from "../db/changeset-store.ts";
import type {
  CommentContext,
  ResolvedChangesetFile,
  ResolvedChangesetFileComment,
} from "../db/changeset-store.ts";
import type {
  Changeset,
  ChangesetCommentDetail,
  ChangesetCommentSide,
  ChangesetFileCommentInput,
  ChangesetFileInput,
  ChangesetInfo,
  ChangesetInput,
} from "../@types/changeset.ts";
import type { ReviewInfo, ReviewOverview, ReviewRepositoryInfo } from "../@types/review.ts";

export type EditCommentInput = {
  comment: string;
  lineNumber?: number | undefined;
  side?: ChangesetCommentSide | undefined;
};

export type UpdateChangesetInput = {
  name?: string | undefined;
  description?: string | undefined;
  order?: number | undefined;
};

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

  if (!Number.isInteger(input.order)) {
    throw new ChangesetInputError("Changeset order must be an integer");
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
    order: input.order,
    files: resolvedFiles,
  });
};

export const getChangesetsDetails = (reviewId: string): ChangesetInfo[] => {
  const info = getReviewInfo(reviewId);
  const repositoryPathsById = getRepositoryPathsById(info.repositories);

  return queryChangesets(reviewId).map((changeset) => ({
    changesetId: changeset.id,
    name: changeset.name,
    description: changeset.description,
    order: changeset.order,
    files: changeset.files.map((file) => ({
      filePath: toAbsolutePath(repositoryPathsById, file.repositoryId, file.filePath),
      summary: file.summary,
      comments: file.comments.map((comment) => ({
        commentId: comment.id,
        lineNumber: comment.lineNumber,
        side: comment.side,
        comment: comment.comment,
      })),
    })),
  }));
};

export const getComment = (reviewId: string, commentId: string): ChangesetCommentDetail => {
  const info = getReviewInfo(reviewId);
  const context = requireComment(reviewId, commentId);

  return toCommentDetail(info.repositories, context);
};

export const addComment = (
  reviewId: string,
  changesetId: string,
  filePath: string,
  comment: ChangesetFileCommentInput,
): ChangesetCommentDetail => {
  const info = getReviewInfo(reviewId);

  requireChangeset(reviewId, changesetId);

  const absolutePath = normalizeAbsolutePath(filePath);
  const { repositoryId, relativePath } = resolveRepository(info.repositories, absolutePath);
  const changesetFileId = getChangesetFileId(changesetId, repositoryId, relativePath);

  if (!changesetFileId) {
    throw new ChangesetInputError(
      `File "${absolutePath}" is not part of changeset "${changesetId}"`,
    );
  }

  const saved = insertComment(changesetFileId, normalizeComment(absolutePath, comment));

  return {
    commentId: saved.id,
    changesetId,
    filePath: absolutePath,
    lineNumber: saved.lineNumber,
    side: saved.side,
    comment: saved.comment,
  };
};

export const editComment = (
  reviewId: string,
  commentId: string,
  input: EditCommentInput,
): ChangesetCommentDetail => {
  const info = getReviewInfo(reviewId);
  const context = requireComment(reviewId, commentId);
  const absolutePath = toAbsolutePath(
    getRepositoryPathsById(info.repositories),
    context.repositoryId,
    context.filePath,
  );

  const merged = normalizeComment(absolutePath, {
    lineNumber: input.lineNumber ?? context.lineNumber,
    side: input.side ?? context.side,
    comment: input.comment,
  });

  updateComment(commentId, merged);

  return {
    commentId,
    changesetId: context.changesetId,
    filePath: absolutePath,
    lineNumber: merged.lineNumber,
    side: merged.side,
    comment: merged.comment,
  };
};

export const deleteComment = (
  reviewId: string,
  commentId: string,
): { commentId: string; deleted: boolean } => {
  requireComment(reviewId, commentId);
  removeComment(commentId);

  return { commentId, deleted: true };
};

export const deleteChangeset = (
  reviewId: string,
  changesetId: string,
): { changesetId: string; deleted: boolean } => {
  requireChangeset(reviewId, changesetId);
  removeChangeset(changesetId);

  return { changesetId, deleted: true };
};

export const updateChangeset = (
  reviewId: string,
  changesetId: string,
  input: UpdateChangesetInput,
): { changesetId: string; name: string; description: string; order: number } => {
  if (input.name === undefined && input.description === undefined && input.order === undefined) {
    throw new ChangesetInputError("At least one of name, description or order must be provided");
  }

  if (input.name !== undefined && !input.name.trim()) {
    throw new ChangesetInputError("Changeset name must not be empty");
  }

  if (input.order !== undefined && !Number.isInteger(input.order)) {
    throw new ChangesetInputError("Changeset order must be an integer");
  }

  const changeset = requireChangeset(reviewId, changesetId);
  const name = input.name ?? changeset.name;
  const description = input.description ?? changeset.description;
  const order = input.order ?? changeset.order;

  persistChangeset(changesetId, name, description, order);

  return { changesetId, name, description, order };
};

export const setChangesetFile = (
  reviewId: string,
  changesetId: string,
  file: ChangesetFileInput,
): { changesetId: string; filePath: string; summary: string; action: "added" | "updated" } => {
  const info = getReviewInfo(reviewId);

  requireChangeset(reviewId, changesetId);

  const absolutePath = normalizeAbsolutePath(file.filePath);
  const { repositoryId, relativePath } = resolveRepository(info.repositories, absolutePath);

  if (!file.summary?.trim()) {
    throw new ChangesetInputError(`File "${absolutePath}" is missing a change summary`);
  }

  const changesetFileId = getChangesetFileId(changesetId, repositoryId, relativePath);

  if (changesetFileId) {
    if (file.comments?.length) {
      throw new ChangesetInputError(
        `File "${absolutePath}" is already in the changeset — use add_comment to add comments`,
      );
    }

    persistChangesetFileSummary(changesetFileId, file.summary);

    return { changesetId, filePath: absolutePath, summary: file.summary, action: "updated" };
  }

  const alreadyGrouped = getChangesetFileKeys(reviewId).some(
    (key) => key.repositoryId === repositoryId && key.filePath === relativePath,
  );

  if (alreadyGrouped) {
    throw new ChangesetInputError(`File "${absolutePath}" already belongs to another changeset`);
  }

  insertChangesetFile(changesetId, {
    repositoryId,
    filePath: relativePath,
    summary: file.summary,
    comments: (file.comments ?? []).map((comment) => normalizeComment(absolutePath, comment)),
  });

  return { changesetId, filePath: absolutePath, summary: file.summary, action: "added" };
};

export const removeChangesetFile = (
  reviewId: string,
  changesetId: string,
  filePath: string,
): { changesetId: string; filePath: string; deleted: boolean } => {
  const info = getReviewInfo(reviewId);
  const changeset = requireChangeset(reviewId, changesetId);

  const absolutePath = normalizeAbsolutePath(filePath);
  const { repositoryId, relativePath } = resolveRepository(info.repositories, absolutePath);
  const changesetFileId = getChangesetFileId(changesetId, repositoryId, relativePath);

  if (!changesetFileId) {
    throw new ChangesetInputError(
      `File "${absolutePath}" is not part of changeset "${changesetId}"`,
    );
  }

  if (changeset.files.length === 1) {
    throw new ChangesetInputError(
      "A changeset must keep at least one file — use delete_changeset to remove it entirely",
    );
  }

  removeChangesetFileRow(changesetFileId);

  return { changesetId, filePath: absolutePath, deleted: true };
};

export const setReviewOverview = (reviewId: string, overview: string): ReviewOverview => {
  if (!overview?.trim()) {
    throw new ChangesetInputError("Review overview is required");
  }

  if (!persistReviewOverview(reviewId, overview)) {
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

const getRepositoryPathsById = (repositories: ReviewRepositoryInfo[]): Map<string, string> =>
  new Map(
    repositories.map((repository) => [
      repository.repositoryId,
      normalizeRepositoryPath(repository.repositoryPath),
    ]),
  );

const toAbsolutePath = (
  repositoryPathsById: Map<string, string>,
  repositoryId: string,
  relativePath: string,
): string => {
  const repositoryPath = repositoryPathsById.get(repositoryId);

  return repositoryPath ? `${repositoryPath}/${relativePath}` : relativePath;
};

const requireChangeset = (reviewId: string, changesetId: string): Changeset => {
  const changeset = getChangesetById(changesetId);

  if (!changeset || changeset.reviewId !== reviewId) {
    throw new ChangesetInputError(`Changeset "${changesetId}" not found in review "${reviewId}"`);
  }

  return changeset;
};

const requireComment = (reviewId: string, commentId: string): CommentContext => {
  const context = getCommentContext(commentId);

  if (!context || context.reviewId !== reviewId) {
    throw new ChangesetInputError(`Comment "${commentId}" not found in review "${reviewId}"`);
  }

  return context;
};

const toCommentDetail = (
  repositories: ReviewRepositoryInfo[],
  context: CommentContext,
): ChangesetCommentDetail => ({
  commentId: context.id,
  changesetId: context.changesetId,
  filePath: toAbsolutePath(
    getRepositoryPathsById(repositories),
    context.repositoryId,
    context.filePath,
  ),
  lineNumber: context.lineNumber,
  side: context.side,
  comment: context.comment,
});

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
): ResolvedChangesetFileComment => {
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
