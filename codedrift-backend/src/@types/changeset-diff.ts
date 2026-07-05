/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import type { ChangesetFileComment } from "./changeset.ts";
import type { DiffFileData } from "./diff.ts";

export type ChangesetDiffFile = DiffFileData & {
  repositoryId: string;
  repositoryName: string;
  summary: string;
  comments: ChangesetFileComment[];
};

export type ChangesetDiff = {
  changeset: {
    id: string;
    name: string;
    description: string;
  };
  files: ChangesetDiffFile[];
};
