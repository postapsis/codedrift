/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import { type JSX, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GitBranch, Info, RefreshCw } from "lucide-react";
import {
  fetchReviews,
  fetchReviewOverview,
  fetchReviewBaseStatus,
} from "@/service/review-service.ts";
import { fetchChangesets } from "@/service/changeset-service.ts";
import Loader from "@/components/loader.tsx";
import ReviewSetup from "@/components/review/review-setup.tsx";
import ReviewPullRequired from "@/components/review/review-pull-required.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import ReviewOverview from "@/components/review/review-overview.tsx";
import ChangesetList from "@/components/review/changeset-list.tsx";
import RedoReviewDialog from "@/components/review/redo-review-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import PageTitle from "@/components/page-title.tsx";

const ReviewDetail = (): JSX.Element => {
  const { reviewId } = Route.useParams();
  const [showRedoDialog, setShowRedoDialog] = useState(false);

  const reviewsQuery = useQuery({
    queryKey: ["reviews"],
    queryFn: fetchReviews,
  });

  const changesetsQuery = useQuery({
    queryKey: ["changesets", reviewId],
    queryFn: () => fetchChangesets(reviewId),
  });

  const changesets = changesetsQuery.data ?? [];

  const overviewQuery = useQuery({
    queryKey: ["reviewOverview", reviewId],
    queryFn: () => fetchReviewOverview(reviewId),
    enabled: changesets.length > 0,
  });

  const baseStatusQuery = useQuery({
    queryKey: ["reviewBaseStatus", reviewId],
    queryFn: () => fetchReviewBaseStatus(reviewId),
    enabled: changesetsQuery.isSuccess && changesets.length === 0,
  });

  const review = reviewsQuery.data?.find((item) => item.id === reviewId);
  const errorMessage =
    changesetsQuery.error instanceof Error ? changesetsQuery.error.message : null;

  const renderBody = (): JSX.Element => {
    if (changesetsQuery.isLoading) {
      return (
        <div className="flex items-center gap-1.5">
          <Loader />
          <span>Loading Changesets</span>
        </div>
      );
    }

    if (errorMessage) {
      return <p className="text-red-500">{errorMessage}</p>;
    }

    if (changesets.length === 0) {
      if (baseStatusQuery.isLoading) {
        return (
          <div className="flex items-center gap-1.5">
            <Loader />
            <span>Checking base branch status</span>
          </div>
        );
      }

      const baseStatuses = baseStatusQuery.data ?? [];
      const behind = baseStatuses.filter((status) => status.status === "behind");

      if (behind.length > 0) {
        return (
          <ReviewPullRequired
            repositories={behind}
            onRefresh={() => void baseStatusQuery.refetch()}
            isRefreshing={baseStatusQuery.isFetching}
          />
        );
      }

      const unverified =
        baseStatusQuery.isError ||
        baseStatuses.some((status) => status.status === "error" || status.status === "no-upstream");

      return (
        <div className="flex flex-col gap-4">
          {unverified && (
            <Alert className="mb-4">
              <Info />
              {review?.repositories.length === 1 ? (
                <AlertTitle>Couldn't verify whether the base branch is up to date</AlertTitle>
              ) : (
                <AlertTitle>Couldn't verify whether the base branches are up to date</AlertTitle>
              )}
              <AlertDescription>
                Make sure each repository's base branch is up to date with its remote before setting
                up this review.
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void baseStatusQuery.refetch()}
                    disabled={baseStatusQuery.isFetching}>
                    <RefreshCw
                      size={14}
                      className={baseStatusQuery.isFetching ? "animate-spin" : undefined}
                    />
                    {baseStatusQuery.isFetching ? "Checking..." : "Check Again"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <ReviewSetup reviewId={reviewId} />
        </div>
      );
    }

    return (
      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          {overviewQuery.isLoading ? (
            <div className="flex items-center gap-1.5">
              <Loader />
              <span>Loading Overview</span>
            </div>
          ) : (
            <ReviewOverview overview={overviewQuery.data?.overview ?? null} />
          )}
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold">Changesets</h2>
          <ChangesetList reviewId={reviewId} changesets={changesets} />
        </aside>
      </div>
    );
  };

  return (
    <div
      className={
        "mx-auto mt-10 flex w-full flex-col gap-4 " +
        (changesets.length > 0 ? "max-w-6xl" : "max-w-3xl")
      }>
      <PageTitle title={review?.name ?? "Review"} />
      <div className="flex flex-col gap-2">
        <Link
          to="/dashboard/reviews"
          className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft size={12} />
          Back to reviews
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-xl font-semibold">{review?.name ?? "Review"}</h1>
          {changesets.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowRedoDialog(true)}>
              <RefreshCw size={14} />
              Redo Review
            </Button>
          )}
        </div>
        {review && review.repositories.length > 0 && (
          <div className="flex flex-col gap-y-1">
            {review.repositories.map((repository) => (
              <div
                key={repository.repositoryId}
                className="flex items-center gap-4 text-xs text-foreground/80">
                <div className="flex gap-1.25 items-center">
                  <GitBranch size={12} className="shrink-0" strokeWidth={2.5} />
                  <span className="font-medium text-[0.8rem]">{repository.repositoryName}</span>
                </div>

                <div className="rounded border border-border px-2 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-xs">{repository.baseRef}</span>
                    <ArrowLeft size={12} className="shrink-0 relative " />
                    <span className="font-mono font-medium text-xs">{repository.headRef}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">{renderBody()}</div>

      <RedoReviewDialog
        reviewId={reviewId}
        open={showRedoDialog}
        onOpenChange={setShowRedoDialog}
      />
    </div>
  );
};

export const Route = createFileRoute("/dashboard/reviews/$reviewId/")({
  component: ReviewDetail,
});
