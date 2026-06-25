/*
 * Author: Jamius Siam
 * Since: 31/05/2026
 */
import path from "node:path";
import { tool, type Tool } from "ai";
import { simpleGit, type SimpleGit } from "simple-git";
import { z } from "zod";

export interface Changeset {
  name: string;
  description: string;
  filesPaths: string[];
}

type EmptyToolInput = Record<string, never>;

type FilePathToolInput = {
  filePath: string;
};

export type CommitSummary = {
  message: string;
  date: string;
  changedFilePaths: string[];
};

export type FileHunk = {
  hunk: string;
};

export type FileContent = {
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

const changesetToolInputSchema = z
  .object({
    name: z.string().min(1).describe("Human-readable changeset name."),
    description: z.string().describe("What this changeset groups together."),
    filesPaths: z
      .array(z.string().min(1))
      .min(1)
      .describe("Repository file paths, relative to the configured repository root."),
  })
  .strict();

export type ChangesetToolSet = {
  allCommits: Tool<EmptyToolInput, CommitSummary[]>;
  hunkForFile: Tool<FilePathToolInput, FileHunk>;
  fileContentAtBase: Tool<FilePathToolInput, FileContent>;
  fileContentAtHead: Tool<FilePathToolInput, FileContent>;
  addChangeset: Tool<Changeset, Changeset>;
  getChangesetFiles: Tool<EmptyToolInput, string[]>;
};

export class ChangesetInputError extends Error {}

export class ChangesetTools {
  readonly repoPath: string;
  readonly baseRef: string;
  readonly headRef: string;
  readonly git: SimpleGit;
  readonly tools: ChangesetToolSet;
  private readonly changesets: Changeset[] = [];

  constructor(repoPath: string, baseRef: string, headRef: string) {
    this.repoPath = path.resolve(repoPath);
    this.baseRef = baseRef;
    this.headRef = headRef;
    this.git = simpleGit(this.repoPath);
    this.tools = {
      allCommits: tool({
        description:
          "List commits between base and head refs with message, date, and changed repository file paths. Sorted by datetime in ascending order.",
        inputSchema: emptyToolInputSchema,
        execute: (): Promise<CommitSummary[]> => this.getAllCommits(),
      }),
      hunkForFile: tool({
        description: "Return git diff hunk for a repository file path between base and head refs.",
        inputSchema: filePathToolInputSchema,
        execute: ({ filePath }): Promise<FileHunk> => this.getHunkForFile(filePath),
      }),
      fileContentAtBase: tool({
        description: "Return full file content for a repository file path at the base ref.",
        inputSchema: filePathToolInputSchema,
        execute: ({ filePath }): Promise<FileContent> => this.getFileContentAtBase(filePath),
      }),
      fileContentAtHead: tool({
        description: "Return full file content for a repository file path at the head ref.",
        inputSchema: filePathToolInputSchema,
        execute: ({ filePath }): Promise<FileContent> => this.getFileContentAtHead(filePath),
      }),
      addChangeset: tool({
        description:
          "Add a changeset (name, description, file paths) to the in-memory list. " +
          "Throws if any file path already belongs to another changeset.",
        inputSchema: changesetToolInputSchema,
        execute: (changeset): Promise<Changeset> => this.addChangeset(changeset),
      }),
      getChangesetFiles: tool({
        description: "Return the list of all file paths across all changesets.",
        inputSchema: emptyToolInputSchema,
        execute: (): Promise<string[]> => this.getChangesetFiles(),
      }),
    };
  }

  async getAllCommits(): Promise<CommitSummary[]> {
    const commits = await this.getCommitsWithChangedFiles();

    return commits
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(({ message, date, changedFilePaths }) => ({
        message,
        date,
        changedFilePaths,
      }));
  }

  async getHunkForFile(filePath: string): Promise<FileHunk> {
    const relativePath = this.getRepoRelativePath(filePath);

    const diff = await this.git.diff([this.baseRef, this.headRef, "--", relativePath]);

    return {
      hunk: diff,
    };
  }

  addChangeset(changeset: Changeset): Promise<Changeset> {
    const filesPaths = changeset.filesPaths.map((filePath) => this.getRepoRelativePath(filePath));

    const existingFilePaths = new Set(this.changesets.flatMap((existing) => existing.filesPaths));

    const seenFilePaths = new Set<string>();

    for (const filePath of filesPaths) {
      if (seenFilePaths.has(filePath)) {
        throw new ChangesetInputError(
          `File path "${filePath}" is listed more than once in the changeset`,
        );
      }

      if (existingFilePaths.has(filePath)) {
        throw new ChangesetInputError(
          `File path "${filePath}" already belongs to another changeset`,
        );
      }

      seenFilePaths.add(filePath);
    }

    const normalizedChangeset: Changeset = { ...changeset, filesPaths };
    this.changesets.push(normalizedChangeset);

    return Promise.resolve(normalizedChangeset);
  }

  getChangesetFiles(): Promise<string[]> {
    return Promise.resolve(this.changesets.flatMap((changeset) => changeset.filesPaths));
  }

  getFileContentAtBase(filePath: string): Promise<FileContent> {
    return this.getFileContentAtRef(filePath, this.baseRef);
  }

  getFileContentAtHead(filePath: string): Promise<FileContent> {
    return this.getFileContentAtRef(filePath, this.headRef);
  }

  private async getFileContentAtRef(filePath: string, revision: string): Promise<FileContent> {
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
