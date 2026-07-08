/*
 * Author: Jamius Siam
 * Since: 08/07/2026
 */
import { type JSX, useEffect, useMemo } from "react";
import { DiffModeEnum, DiffView, setEnableFastDiffTemplate } from "@git-diff-view/react";
import "@git-diff-view/react/styles/diff-view-pure.css";
import MarkdownContent from "@/components/markdown-content.tsx";
import CopyPathButton from "@/components/changeset/copy-path-button.tsx";
import DiffModeToggle from "@/components/settings/diff-mode-toggle.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { useSettingsStore } from "@/store/settings-store.ts";
import { getReviewProgressFileKey, useReviewProgressStore } from "@/store/review-progress-store.ts";
import { getDiffFileDisplayPath, getDiffFileId } from "@/lib/diff-utils.ts";
import type { ChangesetDiffFile } from "@/@types/changeset-diff.ts";
import type { ChangesetFileComment } from "@/@types/changeset.ts";
import type { DiffMode } from "@/@types/settings.ts";
import DiffCommentCards, {
  type CommentExtendData,
} from "@/components/review/diff-comment-card.tsx";

const DIFF_MODE_MAP: Record<DiffMode, DiffModeEnum> = {
  unified: DiffModeEnum.Unified,
  split: DiffModeEnum.SplitGitHub,
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

interface ChangesetFileDiffProps {
  reviewId: string;
  file: ChangesetDiffFile;
}

const ChangesetFileDiff = ({ reviewId, file }: ChangesetFileDiffProps): JSX.Element => {
  const fileDiffModeOverrides = useDiffViewStore((state) => state.fileDiffModeOverrides);
  const setFileDiffModeOverride = useDiffViewStore((state) => state.setFileDiffModeOverride);
  const codeFontSize = useSettingsStore((state) => state.codeFontSize);
  const diffMode = useSettingsStore((state) => state.diffMode);
  const copyPathWithRepoName = useSettingsStore((state) => state.copyPathWithRepoName);
  const reviewedFiles = useReviewProgressStore((state) => state.reviewedFiles);
  const setFileReviewed = useReviewProgressStore((state) => state.setFileReviewed);

  useEffect(() => {
    setEnableFastDiffTemplate(true);
  }, [file]);

  const extendData = useMemo(() => buildCommentExtendData(file.comments), [file]);

  const fileId = getDiffFileId(file);
  const effectiveDiffMode = fileDiffModeOverrides[fileId] ?? diffMode;
  const progressFileKey = getReviewProgressFileKey(
    reviewId,
    file.repositoryId,
    getDiffFileDisplayPath(file, false),
  );
  const isReviewed = reviewedFiles[progressFileKey] === true;

  return (
    <div className={`flex h-full flex-col overflow-auto ${THIN_SCROLLBAR_CLASS}`}>
      <section className="rounded border border-border mb-8">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-3 py-2">
          <div className="flex items-center gap-0.5">
            <span className="font-mono text-xs text-foreground font-medium">
              {getDiffFileDisplayPath(file)}
            </span>
            <CopyPathButton value={getDiffFileDisplayPath(file, copyPathWithRepoName)} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Checkbox
                checked={isReviewed}
                onCheckedChange={(checked) => setFileReviewed(progressFileKey, checked === true)}
              />
              Reviewed
            </label>
            <DiffModeToggle
              value={effectiveDiffMode}
              onChange={(mode) => setFileDiffModeOverride(fileId, mode)}
            />
          </div>
        </div>
        {file.summary && (
          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <MarkdownContent
              markdown={file.summary}
              markdownComponentClasses={{ p: "text-[0.8rem]" }}
            />
          </div>
        )}

        <DiffView<ChangesetFileComment[]>
          data={{
            oldFile: {
              fileName: file.oldFileName,
              fileLang: file.fileLanguage,
              content: file.oldFileContent,
            },
            newFile: {
              fileName: file.newFileName,
              fileLang: file.fileLanguage,
              content: file.newFileContent,
            },
            hunks: [file.rawDiff],
          }}
          extendData={extendData}
          renderExtendLine={({ data }) =>
            data?.length ? (
              <DiffCommentCards
                comments={data}
                reviewId={reviewId}
                filePath={getDiffFileDisplayPath(file)}
              />
            ) : null
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

export default ChangesetFileDiff;
