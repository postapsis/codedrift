/*
 * Author: Jamius Siam
 * Since: 22/06/2026
 */
import { db } from "./database.ts";
import type { Repository } from "../@types/repository.ts";

type RepositoryRow = {
  id: number;
  name: string;
  path: string;
  created_at: string;
};

const insertStatement = db.prepare(
  "INSERT INTO repositories (name, path) VALUES (@name, @path) RETURNING *",
);

export const saveRepository = (name: string, repositoryPath: string): Repository => {
  const row = insertStatement.get({ name, path: repositoryPath }) as RepositoryRow;

  return {
    id: row.id,
    name: row.name,
    path: row.path,
    createdAt: row.created_at,
  };
};
