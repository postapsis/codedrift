/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import type { Changeset } from "@/@types/changeset.ts";
import type { ChangesetDiff } from "@/@types/changeset-diff.ts";
import type { ApiResponse } from "@/@types/api-response.ts";

export const fetchChangesets = async (reviewId: string): Promise<Changeset[]> => {
  const response = await fetch(`/api/review/${reviewId}/changesets`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch changesets (${response.status})`);
  }

  const body: ApiResponse<Changeset[]> = await response.json();

  return body.data;
};

export const fetchChangesetDiff = async (
  reviewId: string,
  changesetId: string,
): Promise<ChangesetDiff> => {
  const response = await fetch(`/api/review/${reviewId}/changeset/${changesetId}/diff`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch changeset diff (${response.status})`);
  }

  const body: ApiResponse<ChangesetDiff> = await response.json();

  return body.data;
};
