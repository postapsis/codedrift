/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
export type ChangesetInput = {
  name: string;
  description: string;
  filesPaths: string[];
};

export type Changeset = ChangesetInput & {
  id: string;
  reviewId: string;
};
