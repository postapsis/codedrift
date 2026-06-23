/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import type { Review } from "@/@types/review.ts";
import type { ApiResponse } from "@/@types/api-response.ts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const fetchReviews = async (repositoryId: string): Promise<Review[]> => {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}/repository/${repositoryId}/reviews`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews (${response.status})`);
  }

  const body: ApiResponse<Review[]> = await response.json();

  return body.data;
};

export const fetchBranches = async (repositoryId: string): Promise<string[]> => {
  const response = await fetch(`${apiBaseUrl}/repository/${repositoryId}/branches`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch branches (${response.status})`);
  }

  const body: ApiResponse<string[]> = await response.json();

  return body.data;
};

export const createReview = async (input: {
  repositoryId: string;
  baseBranch: string;
  headBranch: string;
}): Promise<Review> => {
  const response = await fetch(`${apiBaseUrl}/addReview`, {
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
  const response = await fetch(`${apiBaseUrl}/review/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiResponse<null> | null;
    throw new Error(body?.message ?? `Failed to delete review (${response.status})`);
  }
};
