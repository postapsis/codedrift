/*
* Author: Jamius Siam
* Since: 24/06/2026
*/
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, Trash } from "lucide-react";
import type { JSX } from "react";
import Loader from "@/components/loader.tsx";
import type { Review } from "@/@types/review.ts";

interface ReviewListProps {
  isLoading: boolean;
  errorMessage: string | null;
  reviews: Review[];
  setPendingDelete: (review: Review) => void;
}

const ReviewList = ({ isLoading, errorMessage, reviews, setPendingDelete }: ReviewListProps): JSX.Element => {
  if (isLoading) {
    return (
      <div className="flex h-full items-center gap-1.5">
        <Loader />
        <span>Loading reviews</span>
      </div>
    );
  }

  if (errorMessage) {
    return <p className="text-red-500">{errorMessage}</p>;
  }

  if (reviews.length === 0) {
    return <div className="text-muted-foreground text-sm">No reviews created yet.</div>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="flex items-start justify-between rounded-md border border-border px-3 py-2">
          <div className="flex min-w-0 flex-col gap-2 py-1">
            <p className="truncate text-sm font-medium">{review.name}</p>
            <ul className="flex flex-col gap-2 mt-2">
              {review.repositories.map((repository) => (
                <li key={repository.repositoryId} className="flex flex-col gap-1">
                  <span className="truncate text-xs text-muted-foreground">
                    {repository.repositoryName}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[0.8rem]">
                    <span className="truncate">{repository.baseRef}</span>
                    <ArrowLeft
                      size={12}
                      strokeWidth={2.5}
                      className="relative bottom-px shrink-0"
                    />
                    <span className="truncate">{repository.headRef}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="truncate text-xs mt-2 text-muted-foreground">{review.createdDate}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setPendingDelete(review)}>
            <Trash size={14} />
          </Button>
        </li>
      ))}
    </ul>
  );
};

export default ReviewList;