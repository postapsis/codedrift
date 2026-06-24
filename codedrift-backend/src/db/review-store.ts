/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import { uuidv7 } from "uuidv7";
import { db } from "./database.ts";
import type { Review, ReviewRepository } from "../@types/review.ts";

type ReviewRow = {
  id: string;
  name: string;
  created_date: string;
};

type ReviewRepositoryRow = {
  repository_id: string;
  repository_name: string;
  base_ref: string;
  head_ref: string;
};

export type ReviewRepositoryInput = {
  repositoryId: string;
  baseRef: string;
  headRef: string;
};

const insertReviewStatement = db.prepare(
  "INSERT INTO reviews (id, name) VALUES (@id, @name) RETURNING *",
);

const insertReviewRepositoryStatement = db.prepare(
  "INSERT INTO review_repositories (id, review_id, repository_id, base_ref, head_ref) " +
    "VALUES (@id, @reviewId, @repositoryId, @baseRef, @headRef)",
);

const selectReviewByIdStatement = db.prepare("SELECT * FROM reviews WHERE id = @id");

const selectAllReviewsStatement = db.prepare("SELECT * FROM reviews ORDER BY created_date DESC");

const selectReviewRepositoriesStatement = db.prepare(
  "SELECT rr.repository_id, rr.base_ref, rr.head_ref, r.name AS repository_name " +
    "FROM review_repositories rr " +
    "JOIN repositories r ON r.id = rr.repository_id " +
    "WHERE rr.review_id = @reviewId " +
    "ORDER BY r.name",
);

const deleteStatement = db.prepare("DELETE FROM reviews WHERE id = @id");

const mapReviewRepositoryRow = (row: ReviewRepositoryRow): ReviewRepository => ({
  repositoryId: row.repository_id,
  repositoryName: row.repository_name,
  baseRef: row.base_ref,
  headRef: row.head_ref,
});

const mapReviewRow = (row: ReviewRow): Review => ({
  id: row.id,
  name: row.name,
  createdDate: row.created_date,
  repositories: (
    selectReviewRepositoriesStatement.all({ reviewId: row.id }) as ReviewRepositoryRow[]
  ).map(mapReviewRepositoryRow),
});

const insertReview = db.transaction((name: string, items: ReviewRepositoryInput[]): string => {
  const id = uuidv7();
  insertReviewStatement.run({ id, name });

  for (const item of items) {
    insertReviewRepositoryStatement.run({
      id: uuidv7(),
      reviewId: id,
      repositoryId: item.repositoryId,
      baseRef: item.baseRef,
      headRef: item.headRef,
    });
  }

  return id;
});

export const saveReview = (name: string, items: ReviewRepositoryInput[]): Review => {
  const id = insertReview(name, items);

  return getReviewById(id) as Review;
};

export const getReviewById = (id: string): Review | null => {
  const row = selectReviewByIdStatement.get({ id }) as ReviewRow | undefined;

  return row ? mapReviewRow(row) : null;
};

export const listReviews = (): Review[] => {
  const rows = selectAllReviewsStatement.all() as ReviewRow[];

  return rows.map(mapReviewRow);
};

export const deleteReview = (id: string): boolean => {
  return deleteStatement.run({ id }).changes > 0;
};
