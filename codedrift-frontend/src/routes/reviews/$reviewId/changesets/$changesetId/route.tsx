/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import { useEffect, type JSX } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import FileBrowser from "@/components/file-browser.tsx";
import Loader from "@/components/loader.tsx";
import ChangesetHeader from "@/components/changeset/changeset-header.tsx";
import ChangesetFileDiff from "@/components/changeset/changeset-file-diff.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { fetchChangesetDiff, fetchChangesets } from "@/service/changeset-service.ts";
import PageTitle from "@/components/page-title.tsx";
import { getDiffFileByDisplayPath, getDiffFileDisplayPath } from "@/lib/diff-utils.ts";
import { getFirstTreeFile } from "@/lib/file-tree.ts";

type ChangesetDiffSearch = { file?: string };

const ChangesetDiffPage = (): JSX.Element => {
  const { reviewId, changesetId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

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

  const setDiffFiles = useDiffViewStore((state) => state.setDiffFiles);

  useEffect(() => {
    setDiffFiles(diffQuery.data?.files ?? []);
  }, [diffQuery.data, setDiffFiles]);

  // Keep a valid file in the URL: default to the first file shown in the browser.
  useEffect(() => {
    const files = diffQuery.data?.files ?? [];

    if (files.length === 0) {
      return;
    }

    const hasValidFile =
      search.file !== undefined &&
      files.some((file) => getDiffFileDisplayPath(file) === search.file);

    if (hasValidFile) {
      return;
    }

    const firstFile = getFirstTreeFile(files);

    if (!firstFile) {
      return;
    }

    void navigate({
      to: "/reviews/$reviewId/changesets/$changesetId",
      params: { reviewId, changesetId },
      search: { file: getDiffFileDisplayPath(firstFile) },
      replace: true,
    });
  }, [diffQuery.data, search.file, navigate, reviewId, changesetId]);

  if (isLoading || errorMessage) {
    return (
      <div
        className={
          "flex flex-1 items-center justify-center overflow-auto rounded bg-white " +
          `px-4 py-3 shadow-md ${THIN_SCROLLBAR_CLASS}`
        }>
        <PageTitle title={changeset?.name ?? "Changeset"} />
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

  const files = diffQuery.data?.files ?? [];
  const selectedFile = getDiffFileByDisplayPath(files, search.file) ?? getFirstTreeFile(files);

  return (
    <div className="flex gap-2">
      <PageTitle title={`${changeset?.order}. ${changeset?.name ?? "Changeset"}`} />
      <FileBrowser />
      <div className="flex min-w-0 flex-1 flex-col rounded bg-white px-4 py-3 shadow-md">
        <ChangesetHeader
          reviewId={reviewId}
          changeset={changeset}
          previousChangeset={previousChangeset}
          nextChangeset={nextChangeset}
        />

        <div className={`min-h-0 flex-1 overflow-auto pt-3 ${THIN_SCROLLBAR_CLASS}`}>
          {selectedFile ? (
            <ChangesetFileDiff reviewId={reviewId} file={selectedFile} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No diff available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/reviews/$reviewId/changesets/$changesetId")({
  validateSearch: (search: Record<string, unknown>): ChangesetDiffSearch => ({
    file: typeof search.file === "string" ? search.file : undefined,
  }),
  component: ChangesetDiffPage,
});
