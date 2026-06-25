/*
 * Author: Jamius Siam
 * Since: 24/06/2026
 */
import { type FormEvent, type JSX, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReview, deleteReview, fetchReviews } from "@/service/review-service.ts";
import { fetchRepositories } from "@/service/repository-service.ts";
import type { ReviewEntry } from "@/@types/review-entry.ts";
import type { Review } from "@/@types/review.ts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import ReviewList from "@/components/review/review-list.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import ReviewRepositoryEntry from "@/components/review/review-repository-entry.tsx";
import { Plus } from "lucide-react";

const createEntry = (): ReviewEntry => ({
  key: crypto.randomUUID(),
  repositoryId: "",
  baseRef: "",
  headRef: "",
});

const DashboardReviews = (): JSX.Element => {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ["reviews"],
    queryFn: fetchReviews,
  });

  const repositoriesQuery = useQuery({
    queryKey: ["repositories"],
    queryFn: fetchRepositories,
  });

  const [showAddReviewDialog, setShowAddReviewDialog] = useState(false);
  const [name, setName] = useState("");
  const [entries, setEntries] = useState<ReviewEntry[]>(() => [createEntry()]);

  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);

  const createMutation = useMutation({
    mutationFn: createReview,
    onSuccess: async (review: Review): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setShowAddReviewDialog(false);
      setName("");
      setEntries([createEntry()]);
      toast.success(`Review "${review.name}" was added`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (review: Review) => deleteReview(review.id),
    onSuccess: async (_data: void, review: Review): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setPendingDelete(null);
      toast.success(`Review "${review.name}" was deleted`);
    },
  });

  const showDeleteReviewDialog = pendingDelete !== null;
  const reviews = reviewsQuery.data ?? [];
  const repositories = repositoriesQuery.data ?? [];
  const errorMessage = reviewsQuery.error instanceof Error ? reviewsQuery.error.message : null;

  const repositoryIds = entries.map((entry) => entry.repositoryId).filter(Boolean);
  const hasDuplicateRepositories = new Set(repositoryIds).size !== repositoryIds.length;

  const canSubmit =
    name.trim().length > 0 &&
    entries.length > 0 &&
    !hasDuplicateRepositories &&
    entries.every(
      (entry) =>
        entry.repositoryId !== "" &&
        entry.baseRef !== "" &&
        entry.headRef !== "" &&
        entry.baseRef !== entry.headRef,
    );

  const handleAddOpenChange = (open: boolean): void => {
    setShowAddReviewDialog(open);

    if (!open) {
      setName("");
      setEntries([createEntry()]);
      createMutation.reset();
    }
  };

  const handleDeleteOpenChange = (open: boolean): void => {
    if (!open) {
      setPendingDelete(null);
      deleteMutation.reset();
    }
  };

  const updateEntry = (key: string, patch: Partial<ReviewEntry>): void => {
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  };

  const removeEntry = (key: string): void => {
    setEntries((current) => current.filter((entry) => entry.key !== key));
  };

  const addEntry = (): void => {
    setEntries((current) => [...current, createEntry()]);
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      repositories: entries.map(({ repositoryId, baseRef, headRef }) => ({
        repositoryId,
        baseRef,
        headRef,
      })),
    });
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mt-10 mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-lg font-semibold">Reviews</h1>
          <Button disabled={repositories.length === 0} onClick={() => setShowAddReviewDialog(true)}>
            Add review
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <ReviewList
            isLoading={reviewsQuery.isLoading}
            errorMessage={errorMessage}
            reviews={reviews}
            setPendingDelete={setPendingDelete}
          />
        </div>

        <Dialog open={showAddReviewDialog} onOpenChange={handleAddOpenChange}>
          <DialogContent className="min-w-[514px]">
            <DialogHeader>
              <DialogTitle>Add review</DialogTitle>
              <DialogDescription>
                Name the review and add one or more connected repositories, each with its own
                branches.
              </DialogDescription>
            </DialogHeader>

            <form className="flex flex-col gap-4" onSubmit={handleCreateSubmit}>
              <div className="flex flex-col gap-1">
                <label htmlFor="review-name" className="text-xs font-medium">
                  Name
                </label>
                <Input
                  id="review-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="My review"
                />
              </div>

              <div className="flex flex-col gap-3">
                {entries.map((entry) => (
                  <ReviewRepositoryEntry
                    key={entry.key}
                    entry={entry}
                    repositories={repositories}
                    canRemove={entries.length > 1}
                    onChange={updateEntry}
                    onRemove={removeEntry}
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={addEntry}>
                <Plus size={14} />
                Add repository
              </Button>

              {hasDuplicateRepositories && (
                <p className="text-xs text-red-500">A repository can only be added once</p>
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
                <span className="font-medium text-foreground">{pendingDelete?.name}</span>?
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
    </div>
  );
};

export const Route = createFileRoute("/dashboard/reviews/")({
  component: DashboardReviews,
});
