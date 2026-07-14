/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */

import path from "node:path";
import { stat } from "node:fs/promises";
import { simpleGit } from "simple-git";
import type { RefType, ReviewRepositoryBaseStatus } from "../@types/review.ts";

export type RepositoryValidation = { valid: true } | { valid: false; message: string };

export type BaseSyncResult = Pick<
  ReviewRepositoryBaseStatus,
  "status" | "behindBy" | "upstream" | "message"
>;

export class GitService {
  static async validateRepository(repositoryPath: string): Promise<RepositoryValidation> {
    const trimmedPath = repositoryPath.trim();

    if (!trimmedPath) {
      return { valid: false, message: "Repository path is required" };
    }

    if (!path.isAbsolute(trimmedPath)) {
      return { valid: false, message: "Repository path must be absolute" };
    }

    if (!(await GitService.isDirectory(trimmedPath))) {
      return { valid: false, message: "Path does not exist or is not a directory" };
    }

    if (!(await simpleGit(trimmedPath).checkIsRepo())) {
      return { valid: false, message: "Path is not a git repository" };
    }

    return { valid: true };
  }

  static async getBranches(repositoryPath: string): Promise<string[]> {
    const branchSummary = await simpleGit(repositoryPath).branchLocal();

    return branchSummary.all;
  }

  static async isBranch(repositoryPath: string, ref: string): Promise<boolean> {
    const branchSummary = await simpleGit(repositoryPath).branchLocal();

    return branchSummary.all.includes(ref);
  }

  static async branchExists(repositoryPath: string, ref: string): Promise<boolean> {
    try {
      await simpleGit(repositoryPath).raw(["cat-file", "-e", ref]);
      return true;
    } catch {
      return false;
    }
  }

  static async commitExists(repositoryPath: string, ref: string): Promise<boolean> {
    try {
      await simpleGit(repositoryPath).raw(["cat-file", "-e", `${ref}^{commit}`]);
      return true;
    } catch {
      return false;
    }
  }

  static async getBaseBranchSyncStatus(
    repositoryPath: string,
    baseRef: string,
    refType: RefType,
  ): Promise<BaseSyncResult> {
    if (refType === "commit") {
      return { status: "not-applicable", behindBy: 0, upstream: null, message: null };
    }

    let upstream: string;

    try {
      upstream = (
        await simpleGit(repositoryPath).revparse([
          "--abbrev-ref",
          "--symbolic-full-name",
          `${baseRef}@{upstream}`,
        ])
      ).trim();
    } catch {
      return { status: "no-upstream", behindBy: 0, upstream: null, message: null };
    }

    const separatorIndex = upstream.indexOf("/");
    const remote = upstream.slice(0, separatorIndex);
    const remoteBranch = upstream.slice(separatorIndex + 1);

    try {
      await simpleGit(repositoryPath, { timeout: { block: 10000 } })
        .env({ ...process.env, GIT_TERMINAL_PROMPT: "0" })
        .fetch(remote, remoteBranch);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch from remote";
      return { status: "error", behindBy: 0, upstream, message };
    }

    const behindOutput = await simpleGit(repositoryPath).raw([
      "rev-list",
      "--count",
      `${baseRef}..${upstream}`,
    ]);
    const behindBy = Number.parseInt(behindOutput.trim(), 10) || 0;

    if (behindBy === 0) {
      return { status: "up-to-date", behindBy: 0, upstream, message: null };
    }

    return { status: "behind", behindBy, upstream, message: null };
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
