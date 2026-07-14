/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
export type RefType = "branch" | "commit";

export type ReviewRepository = {
  repositoryId: string;
  repositoryName: string;
  baseRef: string;
  headRef: string;
};

export type Review = {
  id: string;
  name: string;
  createdDate: string;
  repositories: ReviewRepository[];
};

export type ReviewRepositoryInfo = {
  repositoryId: string;
  repositoryName: string;
  repositoryPath: string;
  baseRef: string;
  headRef: string;
  refType: RefType;
};

export type ReviewOverview = {
  reviewId: string;
  overview: string | null;
};

export type ReviewInfo = {
  reviewId: string;
  name: string;
  repositories: ReviewRepositoryInfo[];
};

export type BaseBranchSyncStatus =
  | "up-to-date"
  | "behind"
  | "not-applicable"
  | "no-upstream"
  | "error";

export type ReviewRepositoryBaseStatus = {
  repositoryId: string;
  repositoryName: string;
  baseRef: string;
  status: BaseBranchSyncStatus;
  behindBy: number;
  upstream: string | null;
  message: string | null;
};
