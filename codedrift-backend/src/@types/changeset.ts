/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
export type ChangesetCommentSide = "old" | "new";

export type ChangesetFileComment = {
  lineNumber: number;
  side: ChangesetCommentSide;
  comment: string;
};

export type ChangesetFileCommentInput = {
  lineNumber: number;
  side?: ChangesetCommentSide | undefined;
  comment: string;
};

export type ChangesetFileInput = {
  filePath: string;
  summary: string;
  comments?: ChangesetFileCommentInput[] | undefined;
};

export type ChangesetInput = {
  name: string;
  description: string;
  files: ChangesetFileInput[];
};

export type ChangesetFile = {
  repositoryId: string;
  repositoryName: string;
  filePath: string;
  summary: string;
  comments: ChangesetFileComment[];
};

export type Changeset = {
  id: string;
  reviewId: string;
  name: string;
  description: string;
  files: ChangesetFile[];
};
