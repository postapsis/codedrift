/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import { useEffect, type JSX } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import FileBrowser from "@/components/file-browser.tsx";
import Loader from "@/components/loader.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { fetchChangesetDiff } from "@/service/changeset-service.ts";

const ChangesetDiffLayout = (): JSX.Element => {
  const { reviewId, changesetId } = Route.useParams();

  const diffQuery = useQuery({
    queryKey: ["changesetDiff", reviewId, changesetId],
    queryFn: () => fetchChangesetDiff(reviewId, changesetId),
  });

  const isLoading = diffQuery.isLoading;
  const errorMessage = diffQuery.error instanceof Error ? diffQuery.error.message : null;
  const changeset = diffQuery.data?.changeset;

  const setDiffFiles = useDiffViewStore((state) => state.setDiffFiles);

  useEffect(() => {
    setDiffFiles(diffQuery.data?.files ?? []);
  }, [diffQuery.data, setDiffFiles]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Link
          to="/dashboard/reviews/$reviewId"
          params={{ reviewId }}
          className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft size={12} />
          Back to review
        </Link>

        {changeset && (
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-lg font-semibold">{changeset.name}</h1>
            <p className="text-sm text-muted-foreground">{changeset.description}</p>
          </div>
        )}
      </div>

      {!isLoading && !errorMessage ? (
        <div className="flex min-h-0 flex-1 gap-2">
          <FileBrowser title={changeset?.name ?? "Changeset"} />
          <div className={`flex-1 overflow-auto ${THIN_SCROLLBAR_CLASS}`}>
            <Outlet />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          {isLoading && (
            <div className="flex items-center gap-1.5">
              <Loader />
              <span>Loading diff</span>
            </div>
          )}
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute("/dashboard/reviews/$reviewId/changesets/$changesetId")({
  component: ChangesetDiffLayout,
});
