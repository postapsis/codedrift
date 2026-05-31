/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { simpleGit, type SimpleGit } from "simple-git";
import type { DiffChangeType, DiffFileData } from "../@types/diff.ts";

export const REPOSITORY_PATH = "K:\\projects\\flightdrift";
export const DIFF_BASE_REF = "main";
export const DIFF_HEAD_REF = "feature/integrating-auth";

type DiffFileMetadata = Omit<DiffFileData, "oldFileContent" | "newFileContent">;

export class DiffService {
  static normalizeDiffPath(path: string): string {
    if (path === "/dev/null") {
      return path;
    }

    if (path.startsWith("a/") || path.startsWith("b/")) {
      return path.slice(2);
    }

    return path;
  }

  static getHeaderPath(lines: string[], prefix: string): string {
    const header = lines.find((line) => line.startsWith(prefix));

    if (!header) {
      return "";
    }

    return DiffService.normalizeDiffPath(header.slice(prefix.length).trim());
  }

  static getFileLanguage(fileName: string): string {
    const segments = fileName.split(".");

    return segments.length > 1 ? (segments.at(-1) ?? "text") : "text";
  }

  static getDiffChangeType(
    oldFileName: string,
    newFileName: string,
    rawDiff: string,
  ): DiffChangeType {
    if (rawDiff.includes("\nnew file mode ") || oldFileName === "/dev/null") {
      return "added";
    }

    if (rawDiff.includes("\ndeleted file mode ") || newFileName === "/dev/null") {
      return "deleted";
    }

    if (rawDiff.includes("\nrename from ") || rawDiff.includes("\nrename to ")) {
      return "moved";
    }

    if (oldFileName && newFileName && oldFileName !== newFileName) {
      return "moved";
    }

    return "changed";
  }

  static splitDiffBlocks(diffContent: string): string[] {
    const normalizedDiff = diffContent.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
    const blocks: string[] = [];
    let currentBlock: string[] = [];

    if (!normalizedDiff) {
      return [];
    }

    for (const line of normalizedDiff.split("\n")) {
      if (line.startsWith("diff --git ") && currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }

      currentBlock.push(line);
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join("\n"));
    }

    return blocks;
  }

  static parseDiffFiles(diffContent: string): DiffFileMetadata[] {
    return DiffService.splitDiffBlocks(diffContent).map((rawDiff) => {
      const lines = rawDiff.split("\n");
      const oldFileName = DiffService.getHeaderPath(lines, "--- ");
      const newFileName = DiffService.getHeaderPath(lines, "+++ ");
      const fileName = newFileName === "/dev/null" ? oldFileName : newFileName || oldFileName;

      return {
        oldFileName,
        newFileName,
        fileLanguage: DiffService.getFileLanguage(fileName),
        rawDiff,
        changeType: DiffService.getDiffChangeType(oldFileName, newFileName, rawDiff),
      };
    });
  }

  static async fetchDiffContent(repoPath: string): Promise<string> {
    const git = simpleGit(repoPath);

      return git.diff([DIFF_BASE_REF, DIFF_HEAD_REF]);
  }

  static async fetchFileContent(
    git: SimpleGit,
    revision: string,
    fileName: string,
  ): Promise<string> {
    if (!fileName || fileName === "/dev/null") {
      return "";
    }

    return git.raw(["show", `${revision}:${fileName}`]);
  }

  static async attachFileContent(
    git: SimpleGit,
    diffFile: DiffFileMetadata,
  ): Promise<DiffFileData> {
    const [oldFileContent, newFileContent] = await Promise.all([
      DiffService.fetchFileContent(git, DIFF_BASE_REF, diffFile.oldFileName),
      DiffService.fetchFileContent(git, DIFF_HEAD_REF, diffFile.newFileName),
    ]);

    return {
      ...diffFile,
      oldFileContent,
      newFileContent,
    };
  }

  static async fetchDiffFiles(repoPath: string): Promise<DiffFileData[]> {
    const git = simpleGit(repoPath);
    const diffContent = await git.diff([DIFF_BASE_REF, DIFF_HEAD_REF]);
    const diffFiles = DiffService.parseDiffFiles(diffContent);

    return Promise.all(diffFiles.map((diffFile) => DiffService.attachFileContent(git, diffFile)));
  }

  static getDiffContent(): Promise<string> {
    return DiffService.fetchDiffContent(REPOSITORY_PATH);
  }

  static getDiffFiles(): Promise<DiffFileData[]> {
    return DiffService.fetchDiffFiles(REPOSITORY_PATH);
  }
}
