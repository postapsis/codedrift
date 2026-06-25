/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import type { JSX } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchReviews } from "@/service/review-service.ts";
import { fetchChangesets } from "@/service/changeset-service.ts";
import Loader from "@/components/loader.tsx";
import ReviewSetup from "@/components/review/review-setup.tsx";

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

  const review = reviewsQuery.data?.find((item) => item.id === reviewId);
  const changesets = changesetsQuery.data ?? [];
  const errorMessage = changesetsQuery.error instanceof Error ? changesetsQuery.error.message : null;

  const renderBody = (): JSX.Element => {
    if (changesetsQuery.isLoading) {
      return (
        <div className="flex items-center gap-1.5">
          <Loader />
          <span>Loading changesets</span>
        </div>
      );
    }

    if (errorMessage) {
      return <p className="text-red-500">{errorMessage}</p>;
    }

    if (changesets.length === 0) {
      return <ReviewSetup reviewId={reviewId} />;
    }

    return <p className="text-sm text-muted-foreground">This review already has changesets.</p>;
  };

  return (
    <div className="mx-auto mt-10 flex w-full max-w-3xl flex-col gap-4">
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

export const Route = createFileRoute("/dashboard/reviews/$reviewId")({
  component: ReviewDetail,
});
