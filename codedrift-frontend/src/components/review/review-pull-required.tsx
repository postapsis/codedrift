/*
 * Author: Jamius Siam
 * Since: 14/07/2026
 */
import type { JSX } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import type { ReviewRepositoryBaseStatus } from "@/@types/review.ts";

interface ReviewPullRequiredProps {
  repositories: ReviewRepositoryBaseStatus[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

const ReviewPullRequired = ({
  repositories,
  onRefresh,
  isRefreshing,
}: ReviewPullRequiredProps): JSX.Element => {
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>Pull the latest changes before setting up this review</AlertTitle>
      <AlertDescription>
        <p>
          The base branch is behind its remote. Setting up the review now would diff against a stale
          baseline. Pull the repositories below, then check again.
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {repositories.map((repository) => (
            <li key={repository.repositoryId} className="font-mono">
              <span className="font-semibold me-2">{repository.repositoryName}:</span>
              <span className="font-semibold">{repository.baseRef}</span> is behind{" "}
              <span className="font-semibold">{repository.upstream}</span> by <span className="font-semibold">{repository.behindBy}</span>{" "}
              {repository.behindBy === 1 ? "commit" : "commits"}
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : undefined} />
            {isRefreshing ? "Checking..." : "Check Again"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ReviewPullRequired;
