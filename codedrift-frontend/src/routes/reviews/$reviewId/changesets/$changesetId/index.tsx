/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import { type JSX, useEffect, useMemo } from "react";
import { DiffModeEnum, DiffView, setEnableFastDiffTemplate } from "@git-diff-view/react";
import "@git-diff-view/react/styles/diff-view-pure.css";
import { createFileRoute } from "@tanstack/react-router";
import MarkdownContent from "@/components/markdown-content.tsx";
import DiffModeToggle from "@/components/settings/diff-mode-toggle.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { useSettingsStore } from "@/store/settings-store.ts";
import { getDiffFileDisplayPath, getDiffFileId, getSelectedDiffFile } from "@/lib/diff-utils.ts";
import type { ChangesetFileComment } from "@/@types/changeset.ts";
import type { DiffMode } from "@/@types/settings.ts";
import DiffCommentCards, {
  type CommentExtendData,
} from "@/components/review/diff-comment-card.tsx";

const DIFF_MODE_MAP: Record<DiffMode, DiffModeEnum> = {
  unified: DiffModeEnum.Unified,
  split: DiffModeEnum.SplitGitLab,
};

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
  const fileDiffModeOverrides = useDiffViewStore((state) => state.fileDiffModeOverrides);
  const setFileDiffModeOverride = useDiffViewStore((state) => state.setFileDiffModeOverride);
  const codeFontSize = useSettingsStore((state) => state.codeFontSize);
  const diffMode = useSettingsStore((state) => state.diffMode);

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

  const fileId = getDiffFileId(selectedFile);
  const effectiveDiffMode = fileDiffModeOverrides[fileId] ?? diffMode;

  return (
    <div className={`flex h-full flex-col overflow-auto ${THIN_SCROLLBAR_CLASS}`}>
      <section className="rounded border border-border mb-8">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-3 py-2">
          <span className="font-mono text-xs text-foreground font-medium">
            {getDiffFileDisplayPath(selectedFile)}
          </span>
          <DiffModeToggle
            value={effectiveDiffMode}
            onChange={(mode) => setFileDiffModeOverride(fileId, mode)}
          />
        </div>
        {selectedFile.summary && (
          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <MarkdownContent markdown={selectedFile.summary} markdownComponentClasses={{p: "text-[0.8rem]"}} />
          </div>
        )}

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
          diffViewFontSize={codeFontSize}
          diffViewMode={DIFF_MODE_MAP[effectiveDiffMode]}
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
