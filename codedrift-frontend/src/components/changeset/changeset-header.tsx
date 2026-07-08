/*
 * Author: Jamius Siam
 * Since: 08/07/2026
 */
import { type JSX, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import MarkdownContent from "@/components/markdown-content.tsx";
import type { Changeset } from "@/@types/changeset.ts";
import type { ChangesetDiff } from "@/@types/changeset-diff.ts";

interface ChangesetHeaderProps {
  reviewId: string;
  changeset: ChangesetDiff["changeset"] | undefined;
  previousChangeset: Changeset | undefined;
  nextChangeset: Changeset | undefined;
}

const ChangesetHeader = ({
  reviewId,
  changeset,
  previousChangeset,
  nextChangeset,
}: ChangesetHeaderProps): JSX.Element => {
  const [showOverview, setShowOverview] = useState(true);

  return (
    <div className="flex flex-col gap-2 border-b border-muted pb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard/reviews/$reviewId"
              params={{ reviewId }}
              className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground relative top-[0.5px]">
              <ArrowLeft size={12} />
              <span className="relative top-[0.5px]">Back to review</span>
            </Link>

            {changeset?.description && (
              <button
                type="button"
                onClick={() => setShowOverview((prev) => !prev)}
                aria-expanded={showOverview}
                className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground relative top-[0.5px]">
                <span className="relative bottom-[0.5px]">
                  {showOverview ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                {showOverview ? "Hide Overview" : "Show Overview"}
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-8 pt-1">
          {previousChangeset && (
            <Link
              to="/reviews/$reviewId/changesets/$changesetId"
              params={{ reviewId, changesetId: previousChangeset.id }}
              search={{ file: undefined }}
              title={previousChangeset.name}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronLeft size={14} className="shrink-0 relative bottom-px" />
              <span className="max-w-80 truncate">
                {previousChangeset.order}. {previousChangeset.name}
              </span>
            </Link>
          )}
          {nextChangeset && (
            <Link
              to="/reviews/$reviewId/changesets/$changesetId"
              params={{ reviewId, changesetId: nextChangeset.id }}
              search={{ file: undefined }}
              title={nextChangeset.name}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <span className="max-w-80 truncate">
                {nextChangeset.order}. {nextChangeset.name}
              </span>
              <ChevronRight size={14} className="shrink-0 relative bottom-px" />
            </Link>
          )}
        </div>
      </div>

      {changeset && showOverview && (
        <div>
          <h1 className="font-heading text-base mb-1 font-semibold">
            {changeset.order}. {changeset.name}
          </h1>
          <div className="w-1/2">
            <MarkdownContent markdown={changeset.description} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangesetHeader;
