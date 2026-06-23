/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import { useState, type FormEvent, type JSX } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loader from "@/components/loader/loader";
import type { Review } from "@/@types/review.ts";
import {
  createReview,
  deleteReview,
  fetchBranches,
  fetchReviews,
} from "@/service/review-service.ts";
import { ArrowRight, Trash } from "lucide-react";

interface ReviewsListPropType {
  selectedRepositoryId: string | null;
}

const ReviewsList = ({ selectedRepositoryId }: ReviewsListPropType): JSX.Element => {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ["reviews", selectedRepositoryId],
    queryFn: () => fetchReviews(selectedRepositoryId!),
    enabled: selectedRepositoryId !== null,
  });

  const [showAddReviewDialog, setShowAddReviewDialog] = useState(false);
  const [baseBranch, setBaseBranch] = useState("");
  const [headBranch, setHeadBranch] = useState("");

  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);

  const branchesQuery = useQuery({
    queryKey: ["branches", selectedRepositoryId],
    queryFn: () => fetchBranches(selectedRepositoryId!),
    enabled: showAddReviewDialog && selectedRepositoryId !== null,
  });

  const createMutation = useMutation({
    mutationFn: createReview,
    onSuccess: async (review: Review): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", selectedRepositoryId] });
      setShowAddReviewDialog(false);
      setBaseBranch("");
      setHeadBranch("");
      toast.success(`Review "${review.baseBranch} → ${review.headBranch}" was added`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (review: Review) => deleteReview(review.id),
    onSuccess: async (_data: void, review: Review): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", selectedRepositoryId] });
      setPendingDelete(null);
      toast.success(`Review "${review.baseBranch} → ${review.headBranch}" was deleted`);
    },
  });

  const showDeleteReviewDialog = pendingDelete !== null;
  const reviews = reviewsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const errorMessage = reviewsQuery.error instanceof Error ? reviewsQuery.error.message : null;

  const canSubmit = baseBranch.length > 0 && headBranch.length > 0 && baseBranch !== headBranch;

  const handleAddOpenChange = (open: boolean): void => {
    setShowAddReviewDialog(open);

    if (!open) {
      setBaseBranch("");
      setHeadBranch("");
      createMutation.reset();
    }
  };

  const handleDeleteOpenChange = (open: boolean): void => {
    if (!open) {
      setPendingDelete(null);
      deleteMutation.reset();
    }
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!selectedRepositoryId || !canSubmit) {
      return;
    }

    createMutation.mutate({ repositoryId: selectedRepositoryId, baseBranch, headBranch });
  };

  const renderReviewList = (): JSX.Element => {
    if (selectedRepositoryId === null) {
      return <div className="text-muted-foreground">Select a repository to see reviews.</div>;
    }

    if (reviewsQuery.isLoading) {
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
      return <div className="text-muted-foreground">No reviews yet.</div>;
    }

    return (
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted/50">
            <div className="py-1 flex flex-col gap-1">
              <div className="font-mono text-[0.8rem] font-medium flex gap-1 items-center">
                <p className="truncate">{review.baseBranch}</p>
                <ArrowRight size={12} strokeWidth={2.5} className="relative bottom-px" />
                <p className="truncate">{review.headBranch}</p>
              </div>
              <p className="truncate text-xs text-muted-foreground">{review.createdDate}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setPendingDelete(review)}>
              <Trash size={14} />
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className=" flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold">Reviews</h1>
        <Button
          disabled={selectedRepositoryId === null}
          onClick={() => setShowAddReviewDialog(true)}>
          Add review
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">{renderReviewList()}</div>

      <Dialog open={showAddReviewDialog} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add review</DialogTitle>
            <DialogDescription>
              Create a review for a base branch against a head branch in this repository.
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-3" onSubmit={handleCreateSubmit}>
            <div className="flex flex-col gap-1">
              <label className="flex-1 text-xs font-medium">Head branch</label>
              <Select value={headBranch} onValueChange={setHeadBranch}>
                <SelectTrigger disabled={branchesQuery.isLoading} className="w-full">
                  <SelectValue
                    placeholder={branchesQuery.isLoading ? "Loading branches..." : "Select branch"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium">Base branch</label>
              <Select value={baseBranch} onValueChange={setBaseBranch}>
                <SelectTrigger disabled={branchesQuery.isLoading} className="w-full">
                  <SelectValue
                    placeholder={branchesQuery.isLoading ? "Loading branches..." : "Select branch"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {baseBranch.length > 0 && baseBranch === headBranch && (
              <p className="text-xs text-red-500">Base and head branches must be different</p>
            )}

            {branchesQuery.error instanceof Error && (
              <p className="text-xs text-red-500">{branchesQuery.error.message}</p>
            )}

            {createMutation.error instanceof Error && (
              <p className="text-xs text-red-500">{createMutation.error.message}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleAddOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !canSubmit}>
                {createMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteReviewDialog} onOpenChange={handleDeleteOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete review</DialogTitle>
            <DialogDescription>
              Remove review{" "}
              <span className="font-medium text-foreground">
                {pendingDelete?.baseBranch} → {pendingDelete?.headBranch}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          {deleteMutation.error instanceof Error && (
            <p className="text-xs text-red-500">{deleteMutation.error.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsList;
