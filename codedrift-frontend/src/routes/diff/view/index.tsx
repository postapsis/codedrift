/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { useMemo, type JSX } from "react";
import { DiffModeEnum, DiffView } from "@git-diff-view/react";
import "@git-diff-view/react/styles/diff-view-pure.css";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";

type DiffFileData = {
  oldFileName: string;
  newFileName: string;
  fileLanguage: string;
  rawDiff: string;
};

const diffApiUrl = import.meta.env.VITE_DIFF_API_URL;

const fetchDiff = async (): Promise<string> => {
  if (!diffApiUrl) {
    throw new Error("VITE_DIFF_API_URL is not configured");
  }

  const response = await fetch(diffApiUrl, {
    headers: {
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch diff (${response.status})`);
  }

  return response.text();
};

const normalizeDiffPath = (path: string): string => {
  if (path === "/dev/null") {
    return path;
  }

  if (path.startsWith("a/") || path.startsWith("b/")) {
    return path.slice(2);
  }

  return path;
};

const getHeaderPath = (lines: string[], prefix: string): string => {
  const header = lines.find((line) => line.startsWith(prefix));

  if (!header) {
    return "";
  }

  return normalizeDiffPath(header.slice(prefix.length).trim());
};

const getFileLanguage = (fileName: string): string => {
  const segments = fileName.split(".");

  return segments.length > 1 ? (segments.at(-1) ?? "text") : "text";
};

const parseDiffFiles = (diff: string): DiffFileData[] => {
  const normalizedDiff = diff.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
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

  return blocks.map((rawDiff) => {
    const lines = rawDiff.split("\n");
    const oldFileName = getHeaderPath(lines, "--- ");
    const newFileName = getHeaderPath(lines, "+++ ");
    const fileName = newFileName || oldFileName;

    return {
      oldFileName,
      newFileName,
      fileLanguage: getFileLanguage(fileName),
      rawDiff,
    };
  });
};

const View = (): JSX.Element => {
  const diffQuery = useQuery({
    queryKey: ["diff"],
    queryFn: fetchDiff,
  });
  const diffFiles = useMemo(() => parseDiffFiles(diffQuery.data ?? ""), [diffQuery.data]);

  if (diffQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading diff...
      </div>
    );
  }

  if (diffQuery.isError) {
    const errorMessage =
      diffQuery.error instanceof Error ? diffQuery.error.message : "Unknown error";

    return (
      <div className="flex h-full items-center justify-center text-destructive">{errorMessage}</div>
    );
  }

  if (diffFiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No diff available.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="font-heading text-lg font-semibold">Diff</h1>
          <p className="text-xs text-muted-foreground">{diffFiles.length} changed files</p>
        </div>
      </div>

      <div className={`flex-1 flex flex-col gap-2 overflow-auto ${THIN_SCROLLBAR_CLASS}`}>
        {diffFiles.map((file) => (
          <section key={file.rawDiff} className="rounded border border-border">
            <div className="border-b border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              {file.newFileName || file.oldFileName}
            </div>
            <DiffView
              data={{
                oldFile: {
                  fileName: file.oldFileName,
                  fileLang: file.fileLanguage,
                },
                newFile: {
                  fileName: file.newFileName,
                  fileLang: file.fileLanguage,
                },
                hunks: [file.rawDiff],
              }}
              diffViewFontSize={13}
              diffViewHighlight
              diffViewMode={DiffModeEnum.Split}
              diffViewTheme="light"
              diffViewWrap
            />
          </section>
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/diff/view/")({
  component: View,
});
