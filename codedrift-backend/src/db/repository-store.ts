/*
 * Author: Jamius Siam
 * Since: 22/06/2026
 */
import { uuidv7 } from "uuidv7";
import { db } from "./database.ts";
import type { Repository } from "../@types/repository.ts";

type RepositoryRow = {
  id: string;
  name: string;
  path: string;
  created_at: string;
};

const insertStatement = db.prepare(
  "INSERT INTO repositories (id, name, path) VALUES (@id, @name, @path) RETURNING *",
);

const selectByIdStatement = db.prepare("SELECT * FROM repositories WHERE id = @id");

const mapRepositoryRow = (row: RepositoryRow): Repository => ({
  id: row.id,
  name: row.name,
  path: row.path,
  createdAt: row.created_at,
});

export const saveRepository = (name: string, repositoryPath: string): Repository => {
  const id = uuidv7();
  const row = insertStatement.get({ id, name, path: repositoryPath }) as RepositoryRow;

  return mapRepositoryRow(row);
};

export const getRepositoryById = (id: string): Repository | null => {
  const row = selectByIdStatement.get({ id }) as RepositoryRow | undefined;

  return row ? mapRepositoryRow(row) : null;
};
