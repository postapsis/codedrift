/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { type JSX, useEffect } from "react";
import { DiffModeEnum, DiffView, setEnableFastDiffTemplate } from "@git-diff-view/react";
import "@git-diff-view/react/styles/diff-view-pure.css";
import { createFileRoute } from "@tanstack/react-router";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { getDiffFileDisplayPath, getSelectedDiffFile } from "@/lib/diff-utils.ts";

const View = (): JSX.Element => {
  const diffFiles = useDiffViewStore((state) => state.diffFiles);
  const selectedFileId = useDiffViewStore((state) => state.selectedFileId);

  const selectedFile = getSelectedDiffFile(diffFiles, selectedFileId);

  useEffect(() => {
    setEnableFastDiffTemplate(true);
  }, [selectedFileId]);

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
        <div className="border-b border-border bg-background px-3 py-2 font-mono text-xs text-foreground/80">
          {getDiffFileDisplayPath(selectedFile)}
        </div>
        {/* Please see main.css for .diff-style-root font size override */}
        <DiffView
          data={{
            oldFile: {
              fileName: selectedFile.oldFileName,
              fileLang: selectedFile.fileLanguage,
              content: selectedFile.oldFileContent,
            },
            newFile: {
              fileName: selectedFile.newFileName,
              fileLang: selectedFile.fileLanguage,
              content: selectedFile.newFileContent,
            },
            hunks: [selectedFile.rawDiff],
          }}
          diffViewHighlight
          diffViewMode={DiffModeEnum.SplitGitLab}
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
