/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import type { JSX } from "react";
import { DiffModeEnum, DiffView } from "@git-diff-view/react";
import "@git-diff-view/react/styles/diff-view-pure.css";
import { createFileRoute } from "@tanstack/react-router";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { getDiffFileDisplayPath, getSelectedDiffFile } from "@/lib/diff-utils.ts";

const View = (): JSX.Element => {
  const diffFiles = useDiffViewStore((state) => state.diffFiles);
  const selectedFileId = useDiffViewStore((state) => state.selectedFileId);
  const isLoading = useDiffViewStore((state) => state.isLoading);
  const errorMessage = useDiffViewStore((state) => state.errorMessage);

  const selectedFile = getSelectedDiffFile(diffFiles, selectedFileId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading diff...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">{errorMessage}</div>
    );
  }

  if (!selectedFile) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No diff available.
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col overflow-auto ${THIN_SCROLLBAR_CLASS}`}>
      <section className="rounded border border-border">
        <div className="border-b border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
          {getDiffFileDisplayPath(selectedFile)}
        </div>
        <DiffView
          data={{
            oldFile: {
              fileName: selectedFile.oldFileName,
              fileLang: selectedFile.fileLanguage,
            },
            newFile: {
              fileName: selectedFile.newFileName,
              fileLang: selectedFile.fileLanguage,
            },
            hunks: [selectedFile.rawDiff],
          }}
          diffViewFontSize={13}
          diffViewHighlight
          diffViewMode={DiffModeEnum.Split}
          diffViewTheme="light"
          diffViewWrap
        />
      </section>
    </div>
  );
};

export const Route = createFileRoute("/diff/view/")({
  component: View,
});
