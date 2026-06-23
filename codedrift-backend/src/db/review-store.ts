/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import { uuidv7 } from "uuidv7";
import { db } from "./database.ts";
import type { Review } from "../@types/review.ts";

type ReviewRow = {
  id: string;
  base_branch: string;
  head_branch: string;
  created_date: string;
  repository_id: string;
};

const insertStatement = db.prepare(
  "INSERT INTO reviews (id, base_branch, head_branch, repository_id) " +
    "VALUES (@id, @baseBranch, @headBranch, @repositoryId) RETURNING *",
);

const selectByRepositoryStatement = db.prepare(
  "SELECT * FROM reviews WHERE repository_id = @repositoryId ORDER BY created_date",
);

const deleteStatement = db.prepare("DELETE FROM reviews WHERE id = @id");

const mapReviewRow = (row: ReviewRow): Review => ({
  id: row.id,
  baseBranch: row.base_branch,
  headBranch: row.head_branch,
  createdDate: row.created_date,
  repositoryId: row.repository_id,
});

export const saveReview = (
  repositoryId: string,
  baseBranch: string,
  headBranch: string,
): Review => {
  const id = uuidv7();
  const row = insertStatement.get({ id, baseBranch, headBranch, repositoryId }) as ReviewRow;

  return mapReviewRow(row);
};

export const listReviewsByRepository = (repositoryId: string): Review[] => {
  const rows = selectByRepositoryStatement.all({ repositoryId }) as ReviewRow[];

  return rows.map(mapReviewRow);
};

export const deleteReview = (id: string): boolean => {
  return deleteStatement.run({ id }).changes > 0;
};
