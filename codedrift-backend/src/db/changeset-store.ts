/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import { uuidv7 } from "uuidv7";
import { db } from "./database.ts";
import type {
  Changeset,
  ChangesetCommentSide,
  ChangesetFile,
  ChangesetFileComment,
} from "../@types/changeset.ts";

export type ResolvedChangesetFileComment = Omit<ChangesetFileComment, "id">;

export type ResolvedChangesetFile = {
  repositoryId: string;
  filePath: string;
  summary: string;
  comments: ResolvedChangesetFileComment[];
};

export type ResolvedChangesetInput = {
  name: string;
  description: string;
  order: number;
  files: ResolvedChangesetFile[];
};

export type ChangesetFileKey = {
  repositoryId: string;
  filePath: string;
};

export type CommentContext = {
  id: string;
  reviewId: string;
  changesetId: string;
  repositoryId: string;
  filePath: string;
  lineNumber: number;
  side: ChangesetCommentSide;
  comment: string;
};

type ChangesetRow = {
  id: string;
  review_id: string;
  name: string;
  description: string;
  sort_order: number;
  created_at: string;
};

type ChangesetFileRow = {
  id: string;
  repository_id: string;
  repository_name: string;
  file_path: string;
  summary: string;
};

type ChangesetFileKeyRow = {
  repository_id: string;
  file_path: string;
};

type ChangesetFileCommentRow = {
  id: string;
  line_number: number;
  side: ChangesetCommentSide;
  comment: string;
};

type CommentContextRow = {
  id: string;
  review_id: string;
  changeset_id: string;
  repository_id: string;
  file_path: string;
  line_number: number;
  side: ChangesetCommentSide;
  comment: string;
};

const insertChangesetStatement = db.prepare(
  "INSERT INTO changesets (id, review_id, name, description, sort_order) " +
    "VALUES (@id, @reviewId, @name, @description, @order) RETURNING *",
);

const insertChangesetFileStatement = db.prepare(
  "INSERT INTO changeset_files (id, changeset_id, repository_id, file_path, summary) " +
    "VALUES (@id, @changesetId, @repositoryId, @filePath, @summary)",
);

const insertChangesetFileCommentStatement = db.prepare(
  "INSERT INTO changeset_file_comments (id, changeset_file_id, line_number, side, comment) " +
    "VALUES (@id, @changesetFileId, @lineNumber, @side, @comment)",
);

const selectChangesetFileKeysStatement = db.prepare(
  "SELECT cf.repository_id, cf.file_path FROM changeset_files cf " +
    "JOIN changesets c ON c.id = cf.changeset_id " +
    "WHERE c.review_id = @reviewId " +
    "ORDER BY cf.file_path",
);

const selectChangesetsStatement = db.prepare(
  "SELECT * FROM changesets WHERE review_id = @reviewId ORDER BY sort_order, created_at",
);

const selectChangesetByIdStatement = db.prepare("SELECT * FROM changesets WHERE id = @id");

const selectFilesByChangesetStatement = db.prepare(
  "SELECT cf.id, cf.repository_id, r.name AS repository_name, cf.file_path, cf.summary " +
    "FROM changeset_files cf " +
    "JOIN repositories r ON r.id = cf.repository_id " +
    "WHERE cf.changeset_id = @changesetId " +
    "ORDER BY cf.id",
);

const selectCommentsByChangesetFileStatement = db.prepare(
  "SELECT id, line_number, side, comment FROM changeset_file_comments " +
    "WHERE changeset_file_id = @changesetFileId " +
    "ORDER BY line_number",
);

const deleteChangesetStatement = db.prepare("DELETE FROM changesets WHERE id = @id");

const updateChangesetStatement = db.prepare(
  "UPDATE changesets SET name = @name, description = @description, sort_order = @order " +
    "WHERE id = @id",
);

const updateChangesetFileSummaryStatement = db.prepare(
  "UPDATE changeset_files SET summary = @summary WHERE id = @id",
);

const deleteChangesetFileStatement = db.prepare("DELETE FROM changeset_files WHERE id = @id");

const selectChangesetFileIdStatement = db.prepare(
  "SELECT id FROM changeset_files " +
    "WHERE changeset_id = @changesetId AND repository_id = @repositoryId " +
    "AND file_path = @filePath",
);

const selectCommentContextStatement = db.prepare(
  "SELECT cfc.id, c.review_id, c.id AS changeset_id, cf.repository_id, cf.file_path, " +
    "cfc.line_number, cfc.side, cfc.comment " +
    "FROM changeset_file_comments cfc " +
    "JOIN changeset_files cf ON cf.id = cfc.changeset_file_id " +
    "JOIN changesets c ON c.id = cf.changeset_id " +
    "WHERE cfc.id = @id",
);

const updateCommentStatement = db.prepare(
  "UPDATE changeset_file_comments " +
    "SET line_number = @lineNumber, side = @side, comment = @comment " +
    "WHERE id = @id",
);

const deleteCommentStatement = db.prepare("DELETE FROM changeset_file_comments WHERE id = @id");

const mapChangesetFileCommentRow = (row: ChangesetFileCommentRow): ChangesetFileComment => ({
  id: row.id,
  lineNumber: row.line_number,
  side: row.side,
  comment: row.comment,
});

const mapChangesetFileRow = (row: ChangesetFileRow): ChangesetFile => ({
  repositoryId: row.repository_id,
  repositoryName: row.repository_name,
  filePath: row.file_path,
  summary: row.summary,
  comments: (
    selectCommentsByChangesetFileStatement.all({
      changesetFileId: row.id,
    }) as ChangesetFileCommentRow[]
  ).map(mapChangesetFileCommentRow),
});

const mapChangesetRow = (row: ChangesetRow): Changeset => ({
  id: row.id,
  reviewId: row.review_id,
  name: row.name,
  description: row.description,
  order: row.sort_order,
  files: (selectFilesByChangesetStatement.all({ changesetId: row.id }) as ChangesetFileRow[]).map(
    mapChangesetFileRow,
  ),
});

const insertFileForChangeset = (changesetId: string, file: ResolvedChangesetFile): void => {
  const fileId = uuidv7();
  insertChangesetFileStatement.run({
    id: fileId,
    changesetId,
    repositoryId: file.repositoryId,
    filePath: file.filePath,
    summary: file.summary,
  });

  for (const comment of file.comments) {
    insertChangesetFileCommentStatement.run({
      id: uuidv7(),
      changesetFileId: fileId,
      lineNumber: comment.lineNumber,
      side: comment.side,
      comment: comment.comment,
    });
  }
};

const insertChangeset = db.transaction(
  (reviewId: string, input: ResolvedChangesetInput): ChangesetRow => {
    const id = uuidv7();
    const row = insertChangesetStatement.get({
      id,
      reviewId,
      name: input.name,
      description: input.description,
      order: input.order,
    }) as ChangesetRow;

    for (const file of input.files) {
      insertFileForChangeset(id, file);
    }

    return row;
  },
);

const insertChangesetFile = db.transaction(
  (changesetId: string, file: ResolvedChangesetFile): void => {
    insertFileForChangeset(changesetId, file);
  },
);

export const saveChangeset = (reviewId: string, input: ResolvedChangesetInput): Changeset => {
  const row = insertChangeset(reviewId, input);

  return mapChangesetRow(row);
};

export const getChangesetFileKeys = (reviewId: string): ChangesetFileKey[] => {
  const rows = selectChangesetFileKeysStatement.all({ reviewId }) as ChangesetFileKeyRow[];

  return rows.map((row) => ({ repositoryId: row.repository_id, filePath: row.file_path }));
};

export const getChangesets = (reviewId: string): Changeset[] => {
  const rows = selectChangesetsStatement.all({ reviewId }) as ChangesetRow[];

  return rows.map(mapChangesetRow);
};

export const getChangesetById = (changesetId: string): Changeset | null => {
  const row = selectChangesetByIdStatement.get({ id: changesetId }) as ChangesetRow | undefined;

  return row ? mapChangesetRow(row) : null;
};

export const deleteChangeset = (changesetId: string): boolean =>
  deleteChangesetStatement.run({ id: changesetId }).changes > 0;

export const updateChangeset = (
  changesetId: string,
  name: string,
  description: string,
  order: number,
): boolean =>
  updateChangesetStatement.run({ id: changesetId, name, description, order }).changes > 0;

export const addChangesetFile = (changesetId: string, file: ResolvedChangesetFile): void => {
  insertChangesetFile(changesetId, file);
};

export const updateChangesetFileSummary = (changesetFileId: string, summary: string): boolean =>
  updateChangesetFileSummaryStatement.run({ id: changesetFileId, summary }).changes > 0;

export const deleteChangesetFile = (changesetFileId: string): boolean =>
  deleteChangesetFileStatement.run({ id: changesetFileId }).changes > 0;

export const getChangesetFileId = (
  changesetId: string,
  repositoryId: string,
  filePath: string,
): string | null => {
  const row = selectChangesetFileIdStatement.get({ changesetId, repositoryId, filePath }) as
    | { id: string }
    | undefined;

  return row?.id ?? null;
};

export const insertComment = (
  changesetFileId: string,
  comment: ResolvedChangesetFileComment,
): ChangesetFileComment => {
  const id = uuidv7();

  insertChangesetFileCommentStatement.run({
    id,
    changesetFileId,
    lineNumber: comment.lineNumber,
    side: comment.side,
    comment: comment.comment,
  });

  return { id, ...comment };
};

export const getCommentContext = (commentId: string): CommentContext | null => {
  const row = selectCommentContextStatement.get({ id: commentId }) as CommentContextRow | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    reviewId: row.review_id,
    changesetId: row.changeset_id,
    repositoryId: row.repository_id,
    filePath: row.file_path,
    lineNumber: row.line_number,
    side: row.side,
    comment: row.comment,
  };
};

export const updateComment = (commentId: string, comment: ResolvedChangesetFileComment): boolean =>
  updateCommentStatement.run({
    id: commentId,
    lineNumber: comment.lineNumber,
    side: comment.side,
    comment: comment.comment,
  }).changes > 0;

export const deleteComment = (commentId: string): boolean =>
  deleteCommentStatement.run({ id: commentId }).changes > 0;
