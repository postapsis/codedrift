/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { simpleGit, type SimpleGit } from "simple-git";
import type { DiffChangeType, DiffFileData } from "../@types/diff.ts";

type DiffFileMetadata = Omit<DiffFileData, "oldFileContent" | "newFileContent">;

export class DiffService {
  static async getDiffFiles(
    repoPath: string,
    baseRef: string,
    headRef: string,
  ): Promise<DiffFileData[]> {
    const git = simpleGit(repoPath);
    const diffContent = await git.diff([baseRef, headRef]);
    const diffFiles = DiffService.parseDiffFiles(diffContent);

    return Promise.all(
      diffFiles.map((diffFile) => DiffService.attachFileContent(git, baseRef, headRef, diffFile)),
    );
  }

  private static parseDiffFiles(diffContent: string): DiffFileMetadata[] {
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

  private static splitDiffBlocks(diffContent: string): string[] {
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

  private static getHeaderPath(lines: string[], prefix: string): string {
    const header = lines.find((line) => line.startsWith(prefix));

    if (!header) {
      return "";
    }

    return DiffService.normalizeDiffPath(header.slice(prefix.length).trim());
  }

  private static normalizeDiffPath(path: string): string {
    if (path === "/dev/null") {
      return path;
    }

    if (path.startsWith("a/") || path.startsWith("b/")) {
      return path.slice(2);
    }

    return path;
  }

  private static getFileLanguage(fileName: string): string {
    const segments = fileName.split(".");

    return segments.length > 1 ? (segments.at(-1) ?? "text") : "text";
  }

  private static getDiffChangeType(
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

  private static async attachFileContent(
    git: SimpleGit,
    baseRef: string,
    headRef: string,
    diffFile: DiffFileMetadata,
  ): Promise<DiffFileData> {
    const [oldFileContent, newFileContent] = await Promise.all([
      DiffService.fetchFileContent(git, baseRef, diffFile.oldFileName),
      DiffService.fetchFileContent(git, headRef, diffFile.newFileName),
    ]);

    return {
      ...diffFile,
      oldFileContent,
      newFileContent,
    };
  }

  private static async fetchFileContent(
    git: SimpleGit,
    revision: string,
    fileName: string,
  ): Promise<string> {
    if (!fileName || fileName === "/dev/null") {
      return "";
    }

    return git.raw(["show", `${revision}:${fileName}`]);
  }
}
