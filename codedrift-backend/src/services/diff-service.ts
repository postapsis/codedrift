/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { simpleGit } from "simple-git";
import type { DiffChangeType, DiffFileData } from "../@types/diff.ts";

const REPOSITORY_PATH = "K:\\projects\\flightdrift";

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

  static parseDiffFiles(diffContent: string): DiffFileData[] {
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

    return git.diff(["HEAD~5", "HEAD"]);
  }

  static getDiffContent(): Promise<string> {
    return DiffService.fetchDiffContent(REPOSITORY_PATH);
  }
}
