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

export type ChangesetCommitSummary = {
  message: string;
  date: string;
  changedFilePaths: string[];
};

export type ChangesetFileHunk = {
  hunk: string;
};

export type ChangesetFileContent = {
  filePath: string;
  content: string;
};

type CommitMetadata = {
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

export type ChangesetToolSet = {
  allCommits: Tool<EmptyToolInput, ChangesetCommitSummary[]>;
  hunkForFile: Tool<FilePathToolInput, ChangesetFileHunk>;
  fileContentAtBase: Tool<FilePathToolInput, ChangesetFileContent>;
  fileContentAtHead: Tool<FilePathToolInput, ChangesetFileContent>;
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
      hunkForFile: tool({
        description: "Return git diff hunk for a repository file path between base and head refs.",
        inputSchema: filePathToolInputSchema,
        execute: ({ filePath }): Promise<ChangesetFileHunk> => this.getHunkForFile(filePath),
      }),
      fileContentAtBase: tool({
        description: "Return full file content for a repository file path at the base ref.",
        inputSchema: filePathToolInputSchema,
        execute: ({ filePath }): Promise<ChangesetFileContent> =>
          this.getFileContentAtBase(filePath),
      }),
      fileContentAtHead: tool({
        description: "Return full file content for a repository file path at the head ref.",
        inputSchema: filePathToolInputSchema,
        execute: ({ filePath }): Promise<ChangesetFileContent> =>
          this.getFileContentAtHead(filePath),
      }),
    };
  }

  async getAllCommits(): Promise<ChangesetCommitSummary[]> {
    const commits = await this.getCommitsWithChangedFiles();

    return commits.map(({ message, date, changedFilePaths }) => ({
      message,
      date,
      changedFilePaths,
    }));
  }

  async getHunkForFile(filePath: string): Promise<ChangesetFileHunk> {
    const relativePath = this.getRepoRelativePath(filePath);

    const diff = await this.git.diff([this.baseRef, this.headRef, "--", relativePath]);

    return {
      hunk: diff,
    };
  }

  getFileContentAtBase(filePath: string): Promise<ChangesetFileContent> {
    return this.getFileContentAtRef(filePath, this.baseRef);
  }

  getFileContentAtHead(filePath: string): Promise<ChangesetFileContent> {
    return this.getFileContentAtRef(filePath, this.headRef);
  }

  private async getFileContentAtRef(
    filePath: string,
    revision: string,
  ): Promise<ChangesetFileContent> {
    const relativePath = this.getRepoRelativePath(filePath);
    const content = await this.git.raw(["show", `${revision}:${relativePath}`]);

    return {
      filePath: relativePath,
      content,
    };
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
      "--pretty=format:%s%x1f%cI",
    ]);

    return this.parseCommitLog(logOutput);
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

  private static parseCommitMetadataLine(line: string): CommitMetadata | null {
    const [message, date] = line.split("\u001f");

    if (!message || !date) {
      return null;
    }

    return {
      message,
      date,
    };
  }
}
