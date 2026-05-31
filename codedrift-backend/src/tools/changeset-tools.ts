/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */
import path from "node:path";
import { tool, type Tool } from "ai";
import { simpleGit, type SimpleGit } from "simple-git";
import { z } from "zod";

type EmptyToolInput = Record<string, never>;

type FilePathToolInput = {
  filePath: string;
};

type FileContentAtRevisionToolInput = FilePathToolInput & {
  revision: string;
};

export type ChangesetCommitSummary = {
  shortHash: string;
  message: string;
  date: string;
  changedFilePaths: string[];
};

export type ChangesetAssociatedCommit = {
  shortHash: string;
  message: string;
  date: string;
};

export type ChangesetFileHunk = {
  hunk: string;
};

type CommitMetadata = {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
};

type CommitWithChangedFiles = CommitMetadata & {
  changedFilePaths: string[];
};

const emptyToolInputSchema = z.object({}).strict();

const filePathToolInputSchema = z
  .object({
    filePath: z
      .string()
      .min(1)
      .describe("Repository file path, relative to the configured repository root."),
  })
  .strict();

const fileContentAtRevisionToolInputSchema = filePathToolInputSchema
  .extend({
    revision: z.string().min(1).describe("Git revision to read from."),
  })
  .strict();

export type ChangesetToolSet = {
  allCommits: Tool<EmptyToolInput, ChangesetCommitSummary[]>;
  associatedCommitsForFile: Tool<FilePathToolInput, ChangesetAssociatedCommit[]>;
  hunksForFile: Tool<FilePathToolInput, ChangesetFileHunk[]>;
  fileContentAtRevision: Tool<FileContentAtRevisionToolInput, string>;
};

export class ChangesetInputError extends Error {}

export class ChangesetTools {
  readonly repoPath: string;
  readonly baseRef: string;
  readonly headRef: string;
  readonly git: SimpleGit;
  readonly tools: ChangesetToolSet;

  constructor(repoPath: string, baseRef: string, headRef: string) {
    this.repoPath = path.resolve(repoPath);
    this.baseRef = baseRef;
    this.headRef = headRef;
    this.git = simpleGit(this.repoPath);
    this.tools = {
      allCommits: tool({
        description:
          "List commits between base and head refs with message, date, and changed repository file paths.",
        inputSchema: emptyToolInputSchema,
        execute: (): Promise<ChangesetCommitSummary[]> => this.getAllCommits(),
      }),
      associatedCommitsForFile: tool({
        description: "List commits between base and head refs that changed a repository file path.",
        inputSchema: filePathToolInputSchema,
        execute: ({ filePath }): Promise<ChangesetAssociatedCommit[]> => {
          return this.getAssociatedCommitsForFile(filePath);
        },
      }),
      hunksForFile: tool({
        description: "Return git diff hunks for a repository file path between base and head refs.",
        inputSchema: filePathToolInputSchema,
        execute: ({ filePath }): Promise<ChangesetFileHunk[]> => this.getHunksForFile(filePath),
      }),
      fileContentAtRevision: tool({
        description: "Return full file content for a repository file path at a git revision.",
        inputSchema: fileContentAtRevisionToolInputSchema,
        execute: ({ filePath, revision }): Promise<string> => {
          return this.getFileContentAtRevision(filePath, revision);
        },
      }),
    };
  }

  async getAllCommits(): Promise<ChangesetCommitSummary[]> {
    const commits = await this.getCommitsWithChangedFiles();

    return commits.map(({ shortHash, message, date, changedFilePaths }) => ({
      shortHash,
      message,
      date,
      changedFilePaths,
    }));
  }

  async getAssociatedCommitsForFile(filePath: string): Promise<ChangesetAssociatedCommit[]> {
    const relativePath = this.getRepoRelativePath(filePath);
    const commits = await this.getCommitsForFile(relativePath);

    return commits.map(({ shortHash, message, date }) => ({
      shortHash,
      message,
      date,
    }));
  }

  async getHunksForFile(filePath: string): Promise<ChangesetFileHunk[]> {
    const relativePath = this.getRepoRelativePath(filePath);
    const diff = await this.git.diff([this.baseRef, this.headRef, "--", relativePath]);

    return ChangesetTools.parseDiffHunks(diff);
  }

  getFileContentAtRevision(filePath: string, revision: string): Promise<string> {
    const relativePath = this.getRepoRelativePath(filePath);

    return this.git.raw(["show", `${revision}:${relativePath}`]);
  }

  private getRange(): string {
    return `${this.baseRef}..${this.headRef}`;
  }

  private getRepoRelativePath(filePath: string): string {
    const normalizedPath = filePath.trim().replaceAll("\\", "/");

    if (
      !normalizedPath ||
      path.isAbsolute(filePath) ||
      path.win32.isAbsolute(filePath) ||
      path.posix.isAbsolute(normalizedPath)
    ) {
      throw new ChangesetInputError(
        "filePath must be a repository file path relative to the configured repository root",
      );
    }

    const repoRelativePath = path.posix.normalize(normalizedPath);

    if (
      repoRelativePath === "." ||
      repoRelativePath === ".." ||
      repoRelativePath.startsWith("../")
    ) {
      throw new ChangesetInputError(
        "filePath must be a repository file path relative to the configured repository root",
      );
    }

    return repoRelativePath;
  }

  private async getCommitsWithChangedFiles(): Promise<CommitWithChangedFiles[]> {
    const logOutput = await this.git.raw([
      "log",
      this.getRange(),
      "--name-only",
      "--pretty=format:%H%x1f%h%x1f%s%x1f%cI",
    ]);

    return this.parseCommitLog(logOutput);
  }

  private async getCommitsForFile(relativePath: string): Promise<CommitMetadata[]> {
    const logOutput = await this.git.raw([
      "log",
      this.getRange(),
      "--pretty=format:%H%x1f%h%x1f%s%x1f%cI",
      "--",
      relativePath,
    ]);

    return this.parseCommitLog(logOutput).map(({ hash, shortHash, message, date }) => ({
      hash,
      shortHash,
      message,
      date,
    }));
  }

  private parseCommitLog(logOutput: string): CommitWithChangedFiles[] {
    const commits: CommitWithChangedFiles[] = [];
    let currentCommit: CommitWithChangedFiles | null = null;

    for (const line of logOutput.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n")) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        continue;
      }

      const commitMetadata = ChangesetTools.parseCommitMetadataLine(trimmedLine);

      if (commitMetadata) {
        currentCommit = {
          ...commitMetadata,
          changedFilePaths: [],
        };
        commits.push(currentCommit);
        continue;
      }

      currentCommit?.changedFilePaths.push(trimmedLine);
    }

    return commits;
  }

  private static parseDiffHunks(diffContent: string): ChangesetFileHunk[] {
    const normalizedDiff = diffContent.replaceAll("\r\n", "\n").replaceAll("\r", "\n");

    if (!normalizedDiff) {
      return [];
    }

    const lines = normalizedDiff.endsWith("\n")
      ? normalizedDiff.slice(0, -1).split("\n")
      : normalizedDiff.split("\n");
    const hunks: ChangesetFileHunk[] = [];
    let currentHunkLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("@@ ")) {
        if (currentHunkLines.length > 0) {
          hunks.push({ hunk: currentHunkLines.join("\n") });
        }

        currentHunkLines = [line];
        continue;
      }

      if (currentHunkLines.length > 0) {
        currentHunkLines.push(line);
      }
    }

    if (currentHunkLines.length > 0) {
      hunks.push({ hunk: currentHunkLines.join("\n") });
    }

    return hunks;
  }

  private static parseCommitMetadataLine(line: string): CommitMetadata | null {
    const [hash, shortHash, message, date] = line.split("\u001f");

    if (!hash || !shortHash || !message || !date) {
      return null;
    }

    return {
      hash,
      shortHash,
      message,
      date,
    };
  }
}
