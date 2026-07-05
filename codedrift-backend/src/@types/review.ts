/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
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
