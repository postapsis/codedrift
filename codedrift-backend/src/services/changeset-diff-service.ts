/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import { getReviewInfo } from "../db/review-store.ts";
import { getChangesetById } from "../db/changeset-store.ts";
import { DiffService } from "./diff-service.ts";
import type { ChangesetDiff, ChangesetDiffFile } from "../@types/changeset-diff.ts";
import type { DiffFileData } from "../@types/diff.ts";

export class ChangesetDiffService {
  static async getChangesetDiff(
    reviewId: string,
    changesetId: string,
  ): Promise<ChangesetDiff | null> {
    const info = getReviewInfo(reviewId);
    const changeset = getChangesetById(changesetId);

    if (!info || !changeset || changeset.reviewId !== reviewId) {
      return null;
    }

    const repositoriesById = new Map(
      info.repositories.map((repository) => [repository.repositoryId, repository]),
    );
    const repositoryIds = [...new Set(changeset.files.map((file) => file.repositoryId))];
    const diffIndexByRepository = new Map<string, Map<string, DiffFileData>>();

    for (const repositoryId of repositoryIds) {
      const repository = repositoriesById.get(repositoryId);

      if (!repository) {
        continue;
      }

      const diffFiles = await DiffService.getDiffFiles(
        repository.repositoryPath,
        repository.baseRef,
        repository.headRef,
      );

      diffIndexByRepository.set(repositoryId, ChangesetDiffService.indexDiffFiles(diffFiles));
    }

    const files: ChangesetDiffFile[] = [];

    for (const file of changeset.files) {
      const diffFile = diffIndexByRepository.get(file.repositoryId)?.get(file.filePath);

      if (!diffFile) {
        continue;
      }

      files.push({
        ...diffFile,
        repositoryId: file.repositoryId,
        repositoryName: file.repositoryName,
        summary: file.summary,
        comments: file.comments,
      });
    }

    return {
      changeset: {
        id: changeset.id,
        name: changeset.name,
        description: changeset.description,
      },
      files,
    };
  }

  private static indexDiffFiles(diffFiles: DiffFileData[]): Map<string, DiffFileData> {
    const index = new Map<string, DiffFileData>();

    for (const diffFile of diffFiles) {
      for (const fileName of [diffFile.oldFileName, diffFile.newFileName]) {
        if (fileName && fileName !== "/dev/null") {
          index.set(fileName, diffFile);
        }
      }
    }

    return index;
  }
}
