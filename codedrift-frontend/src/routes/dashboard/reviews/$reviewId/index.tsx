/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import type { JSX } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchReviews, fetchReviewOverview } from "@/service/review-service.ts";
import { fetchChangesets } from "@/service/changeset-service.ts";
import Loader from "@/components/loader.tsx";
import ReviewSetup from "@/components/review/review-setup.tsx";
import ReviewOverview from "@/components/review/review-overview.tsx";
import ChangesetList from "@/components/review/changeset-list.tsx";

const ReviewDetail = (): JSX.Element => {
  const { reviewId } = Route.useParams();

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
      return <ReviewSetup reviewId={reviewId} />;
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

        <aside className="flex w-80 shrink-0 flex-col gap-2">
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
      <div className="flex flex-col gap-2">
        <Link
          to="/dashboard/reviews"
          className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft size={12} />
          Back to reviews
        </Link>
        <h1 className="font-heading text-lg font-semibold">{review?.name ?? "Review"}</h1>
      </div>

      {renderBody()}
    </div>
  );
};

export const Route = createFileRoute("/dashboard/reviews/$reviewId/")({
  component: ReviewDetail,
});
