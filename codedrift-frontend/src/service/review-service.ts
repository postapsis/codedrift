/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import type { Review, ReviewOverview } from "@/@types/review.ts";
import type { ApiResponse } from "@/@types/api-response.ts";

export const fetchReviews = async (): Promise<Review[]> => {
  const response = await fetch(`/api/reviews`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews (${response.status})`);
  }

  const body: ApiResponse<Review[]> = await response.json();

  return body.data;
};

export const fetchReviewOverview = async (reviewId: string): Promise<ReviewOverview> => {
  const response = await fetch(`/api/review/${reviewId}/overview`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch review overview (${response.status})`);
  }

  const body: ApiResponse<ReviewOverview> = await response.json();

  return body.data;
};

export const fetchBranches = async (repositoryId: string): Promise<string[]> => {
  const response = await fetch(`/api/repository/${repositoryId}/branches`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch branches (${response.status})`);
  }

  const body: ApiResponse<string[]> = await response.json();

  return body.data;
};

export const createReview = async (input: {
  name: string;
  repositories: { repositoryId: string; baseRef: string; headRef: string }[];
}): Promise<Review> => {
  const response = await fetch(`/api/addReview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });

  const body: ApiResponse<Review | null> = await response.json();

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.message ?? `Failed to add review (${response.status})`);
  }

  return body.data;
};

export const deleteReview = async (id: string): Promise<void> => {
  const response = await fetch(`/api/review/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiResponse<null> | null;
    throw new Error(body?.message ?? `Failed to delete review (${response.status})`);
  }
};
