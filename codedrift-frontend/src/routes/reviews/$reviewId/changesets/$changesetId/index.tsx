/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import { type JSX, useEffect, useMemo } from "react";
import { DiffModeEnum, DiffView, setEnableFastDiffTemplate } from "@git-diff-view/react";
import "@git-diff-view/react/styles/diff-view-pure.css";
import { createFileRoute } from "@tanstack/react-router";
import MarkdownContent from "@/components/markdown-content.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { getDiffFileDisplayPath, getSelectedDiffFile } from "@/lib/diff-utils.ts";
import type { ChangesetFileComment } from "@/@types/changeset.ts";
import DiffCommentCards, {
  type CommentExtendData,
} from "@/components/review/diff-comment-card.tsx";

const buildCommentExtendData = (comments: ChangesetFileComment[]): CommentExtendData => {
  const extendData: CommentExtendData = { oldFile: {}, newFile: {} };

  for (const comment of comments) {
    const sideBucket = comment.side === "old" ? extendData.oldFile : extendData.newFile;
    const lineEntry = (sideBucket[comment.lineNumber] ??= { data: [] });
    lineEntry.data.push(comment);
  }

  return extendData;
};

const ChangesetDiffView = (): JSX.Element => {
  const diffFiles = useDiffViewStore((state) => state.diffFiles);
  const selectedFileId = useDiffViewStore((state) => state.selectedFileId);

  const selectedFile = getSelectedDiffFile(diffFiles, selectedFileId);

  useEffect(() => {
    setEnableFastDiffTemplate(true);
  }, [selectedFileId]);

  const extendData = useMemo(
    () => buildCommentExtendData(selectedFile?.comments ?? []),
    [selectedFile],
  );

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
        {selectedFile.summary && (
          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <MarkdownContent markdown={selectedFile.summary} />
          </div>
        )}
        {/* Please see main.css for .diff-style-root font size override */}
        <DiffView<ChangesetFileComment[]>
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
          extendData={extendData}
          renderExtendLine={({ data }) =>
            data?.length ? <DiffCommentCards comments={data} /> : null
          }
          diffViewHighlight
          diffViewMode={DiffModeEnum.SplitGitLab}
          diffViewTheme="light"
          diffViewWrap
        />
      </section>
    </div>
  );
};

export const Route = createFileRoute("/reviews/$reviewId/changesets/$changesetId/")({
  component: ChangesetDiffView,
});
