/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import { uuidv7 } from "uuidv7";
import { db } from "./database.ts";
import type { Changeset, ChangesetInput } from "../@types/changeset.ts";

type ChangesetRow = {
  id: string;
  review_id: string;
  name: string;
  description: string;
  created_at: string;
};

type FilePathRow = {
  file_path: string;
};

const insertChangesetStatement = db.prepare(
  "INSERT INTO changesets (id, review_id, name, description) " +
    "VALUES (@id, @reviewId, @name, @description) RETURNING *",
);

const insertChangesetFileStatement = db.prepare(
  "INSERT INTO changeset_files (id, changeset_id, file_path) VALUES (@id, @changesetId, @filePath)",
);

const selectChangesetFilePathsStatement = db.prepare(
  "SELECT cf.file_path FROM changeset_files cf " +
    "JOIN changesets c ON c.id = cf.changeset_id " +
    "WHERE c.review_id = @reviewId " +
    "ORDER BY cf.file_path",
);

const selectChangesetsStatement = db.prepare(
  "SELECT * FROM changesets WHERE review_id = @reviewId ORDER BY created_at",
);

const selectFilePathsByChangesetStatement = db.prepare(
  "SELECT file_path FROM changeset_files WHERE changeset_id = @changesetId ORDER BY file_path",
);

const mapChangesetRow = (row: ChangesetRow, filesPaths: string[]): Changeset => ({
  id: row.id,
  reviewId: row.review_id,
  name: row.name,
  description: row.description,
  filesPaths,
});

const insertChangeset = db.transaction((reviewId: string, input: ChangesetInput): ChangesetRow => {
  const id = uuidv7();
  const row = insertChangesetStatement.get({
    id,
    reviewId,
    name: input.name,
    description: input.description,
  }) as ChangesetRow;

  for (const filePath of input.filesPaths) {
    insertChangesetFileStatement.run({ id: uuidv7(), changesetId: id, filePath });
  }

  return row;
});

export const saveChangeset = (reviewId: string, input: ChangesetInput): Changeset => {
  const row = insertChangeset(reviewId, input);

  return mapChangesetRow(row, input.filesPaths);
};

export const getChangesetFilePaths = (reviewId: string): string[] => {
  const rows = selectChangesetFilePathsStatement.all({ reviewId }) as FilePathRow[];

  return rows.map((row) => row.file_path);
};

export const getChangesets = (reviewId: string): Changeset[] => {
  const rows = selectChangesetsStatement.all({ reviewId }) as ChangesetRow[];

  return rows.map((row) => {
    const filePathRows = selectFilePathsByChangesetStatement.all({
      changesetId: row.id,
    }) as FilePathRow[];

    return mapChangesetRow(row, filePathRows.map((filePathRow) => filePathRow.file_path));
  });
};
