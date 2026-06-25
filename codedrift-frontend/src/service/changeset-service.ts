/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import type { Changeset } from "@/@types/changeset.ts";
import type { ApiResponse } from "@/@types/api-response.ts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const fetchChangesets = async (reviewId: string): Promise<Changeset[]> => {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}/review/${reviewId}/changesets`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch changesets (${response.status})`);
  }

  const body: ApiResponse<Changeset[]> = await response.json();

  return body.data;
};
