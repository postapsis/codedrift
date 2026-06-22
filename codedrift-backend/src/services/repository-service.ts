/*
 * Author: Jamius Siam
 * Since: 22/06/2026
 */
import path from "node:path";
import { stat } from "node:fs/promises";
import { simpleGit } from "simple-git";

export type RepositoryValidation = { valid: true } | { valid: false; message: string };

export class RepositoryService {
  static async validateRepository(repositoryPath: string): Promise<RepositoryValidation> {
    const trimmedPath = repositoryPath.trim();

    if (!trimmedPath) {
      return { valid: false, message: "Repository path is required" };
    }

    if (!path.isAbsolute(trimmedPath)) {
      return { valid: false, message: "Repository path must be absolute" };
    }

    if (!(await RepositoryService.isDirectory(trimmedPath))) {
      return { valid: false, message: "Path does not exist or is not a directory" };
    }

    if (!(await simpleGit(trimmedPath).checkIsRepo())) {
      return { valid: false, message: "Path is not a git repository" };
    }

    return { valid: true };
  }

  private static async isDirectory(targetPath: string): Promise<boolean> {
    try {
      const stats = await stat(targetPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}
