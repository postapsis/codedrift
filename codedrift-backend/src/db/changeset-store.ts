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

export type ResolvedChangesetFile = {
  repositoryId: string;
  filePath: string;
  summary: string;
  comments: ChangesetFileComment[];
};

export type ResolvedChangesetInput = {
  name: string;
  description: string;
  files: ResolvedChangesetFile[];
};

export type ChangesetFileKey = {
  repositoryId: string;
  filePath: string;
};

type ChangesetRow = {
  id: string;
  review_id: string;
  name: string;
  description: string;
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
  line_number: number;
  side: ChangesetCommentSide;
  comment: string;
};

const insertChangesetStatement = db.prepare(
  "INSERT INTO changesets (id, review_id, name, description) " +
    "VALUES (@id, @reviewId, @name, @description) RETURNING *",
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
  "SELECT * FROM changesets WHERE review_id = @reviewId ORDER BY created_at",
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
  "SELECT line_number, side, comment FROM changeset_file_comments " +
    "WHERE changeset_file_id = @changesetFileId " +
    "ORDER BY line_number",
);

const mapChangesetFileCommentRow = (row: ChangesetFileCommentRow): ChangesetFileComment => ({
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
  files: (selectFilesByChangesetStatement.all({ changesetId: row.id }) as ChangesetFileRow[]).map(
    mapChangesetFileRow,
  ),
});

const insertChangeset = db.transaction(
  (reviewId: string, input: ResolvedChangesetInput): ChangesetRow => {
    const id = uuidv7();
    const row = insertChangesetStatement.get({
      id,
      reviewId,
      name: input.name,
      description: input.description,
    }) as ChangesetRow;

    for (const file of input.files) {
      const fileId = uuidv7();
      insertChangesetFileStatement.run({
        id: fileId,
        changesetId: id,
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
    }

    return row;
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
