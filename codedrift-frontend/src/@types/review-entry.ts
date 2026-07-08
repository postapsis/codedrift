/*
 * Author: Jamius Siam
 * Since: 24/06/2026
 */
export type RefMode = "branch" | "commit";

export type ReviewEntry = {
  key: string;
  repositoryId: string;
  refMode: RefMode;
  baseRef: string;
  headRef: string;
};
