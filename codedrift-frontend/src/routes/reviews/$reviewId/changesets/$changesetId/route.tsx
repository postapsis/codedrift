/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import { useEffect, useState, type JSX } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import FileBrowser from "@/components/file-browser.tsx";
import Loader from "@/components/loader.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { fetchChangesetDiff, fetchChangesets } from "@/service/changeset-service.ts";
import MarkdownContent from "@/components/markdown-content.tsx";

const ChangesetDiffLayout = (): JSX.Element => {
  const { reviewId, changesetId } = Route.useParams();

  const diffQuery = useQuery({
    queryKey: ["changesetDiff", reviewId, changesetId],
    queryFn: () => fetchChangesetDiff(reviewId, changesetId),
  });

  const changesetsQuery = useQuery({
    queryKey: ["changesets", reviewId],
    queryFn: () => fetchChangesets(reviewId),
  });

  const isLoading = diffQuery.isLoading;
  const errorMessage = diffQuery.error instanceof Error ? diffQuery.error.message : null;
  const changeset = diffQuery.data?.changeset;

  const changesets = changesetsQuery.data ?? [];
  const changesetIndex = changesets.findIndex((item) => item.id === changesetId);
  const previousChangeset = changesetIndex > 0 ? changesets[changesetIndex - 1] : undefined;
  const nextChangeset =
    changesetIndex >= 0 && changesetIndex < changesets.length - 1
      ? changesets[changesetIndex + 1]
      : undefined;

  const [showOverview, setShowOverview] = useState(true);

  const setDiffFiles = useDiffViewStore((state) => state.setDiffFiles);

  useEffect(() => {
    setDiffFiles(diffQuery.data?.files ?? []);
  }, [diffQuery.data, setDiffFiles]);

  if (isLoading || errorMessage) {
    return (
      <div
        className={
          "flex flex-1 items-center justify-center overflow-auto rounded bg-white " +
          `px-4 py-3 shadow-md ${THIN_SCROLLBAR_CLASS}`
        }>
        {isLoading && (
          <div className="flex items-center gap-1.5">
            <Loader />
            <span>Loading diff</span>
          </div>
        )}
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <FileBrowser />
      <div className="flex min-w-0 flex-1 flex-col rounded bg-white px-4 py-3 shadow-md">
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

        <div className={`min-h-0 flex-1 overflow-auto pt-3 ${THIN_SCROLLBAR_CLASS}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/reviews/$reviewId/changesets/$changesetId")({
  component: ChangesetDiffLayout,
});
