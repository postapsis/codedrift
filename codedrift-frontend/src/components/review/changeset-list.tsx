/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import type { JSX } from "react";
import { Link } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
import type { Changeset, ChangesetFile } from "@/@types/changeset.ts";
import { getReviewProgressFileKey, useReviewProgressStore } from "@/store/review-progress-store.ts";
import { cn } from "@/lib/utils.ts";

interface ChangesetListProps {
  reviewId: string;
  changesets: Changeset[];
}

const ChangesetList = ({ reviewId, changesets }: ChangesetListProps): JSX.Element => {
  const reviewedFiles = useReviewProgressStore((state) => state.reviewedFiles);

  const countReviewedFiles = (files: ChangesetFile[]): number => {
    return files.filter(
      (file) => reviewedFiles[getReviewProgressFileKey(reviewId, file.repositoryId, file.filePath)],
    ).length;
  };

  return (
    <div className="flex flex-col gap-3">
      {changesets.map((changeset) => (
        <Link
          key={changeset.id}
          to="/reviews/$reviewId/changesets/$changesetId"
          params={{ reviewId, changesetId: changeset.id }}
          className={
            "flex flex-col gap-1 rounded-md border border-border p-3 " +
            "transition-colors hover:border-foreground/30 hover:bg-nav-active/20"
          }>
          <span className="text-sm font-semibold text-foreground">
            {changeset.order}. {changeset.name}
          </span>
          <span className="line-clamp-3 text-[0.8rem] text-muted-foreground">
            {changeset.description}
          </span>
          <span className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span
              className={cn(
                "flex items-center gap-1.5",
                countReviewedFiles(changeset.files) === changeset.files.length &&
                  "text-emerald-600",
              )}>
              <CircleCheck size={12} className="relative bottom-px"/>
              {countReviewedFiles(changeset.files)}/{changeset.files.length} files reviewed
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
};

export default ChangesetList;
