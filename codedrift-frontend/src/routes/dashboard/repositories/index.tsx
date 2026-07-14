/*
 * Author: Jamius Siam
 * Since: 24/06/2026
 */
import { type FormEvent, type JSX, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRepository,
  deleteRepository,
  fetchRepositories,
} from "@/service/repository-service.ts";
import type { Repository } from "@/@types/repository.ts";
import { toast } from "sonner";
import RepositoryList from "@/components/repository-list.tsx";
import PageTitle from "@/components/page-title.tsx";

const DashboardRepositories = (): JSX.Element => {
  const queryClient = useQueryClient();

  const repositoriesQuery = useQuery({
    queryKey: ["repositories"],
    queryFn: fetchRepositories,
  });

  const [showAddRepositoryDialog, setShowAddRepositoryDialog] = useState(false);
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [path, setPath] = useState("");

  const [pendingDelete, setPendingDelete] = useState<Repository | null>(null);

  const createMutation = useMutation({
    mutationFn: createRepository,
    onSuccess: async (repository: Repository): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["repositories"] });
      setShowAddRepositoryDialog(false);
      setName("");
      setNameEdited(false);
      setPath("");
      toast.success(`Repository "${repository.name}" was added`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (repository) => deleteRepository(repository.id),
    onSuccess: async (_data: void, repository: Repository): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["repositories"] });
      setPendingDelete(null);
      toast.success(`Repository "${repository.name}" was deleted`);
    },
  });

  const showDeleteRepositoryDialog = pendingDelete !== null;
  const repositories = repositoriesQuery.data ?? [];
  const errorMessage =
    repositoriesQuery.error instanceof Error ? repositoriesQuery.error.message : null;

  const handleAddOpenChange = (open: boolean): void => {
    setShowAddRepositoryDialog(open);

    if (!open) {
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
    createMutation.mutate({ repositoryName: name.trim(), repositoryPath: path.trim() });
  };

  return (
    <div className="flex flex-col w-full max-w-xl 2k:max-w-2xl mt-10 mx-auto">
      <PageTitle title="Repositories" />
      <div className="flex flex-col gap-4">
        <div className=" flex items-center justify-between">
          <h1 className="font-heading text-lg font-semibold">Repositories</h1>
          <Button onClick={() => setShowAddRepositoryDialog(true)}>Add repository</Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <RepositoryList
            isLoading={repositoriesQuery.isLoading}
            errorMessage={errorMessage}
            repositories={repositories}
            setPendingDelete={setPendingDelete}
          />
        </div>

        <Dialog open={showAddRepositoryDialog} onOpenChange={handleAddOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add repository</DialogTitle>
              <DialogDescription>
                Register a local git repository by its absolute path.
              </DialogDescription>
            </DialogHeader>

            <form className="flex flex-col gap-3" onSubmit={handleCreateSubmit}>
              <div className="flex flex-col gap-1">
                <label htmlFor="repository-name" className="text-xs font-medium">
                  Name
                </label>
                <Input
                  id="repository-name"
                  value={name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setName(value);
                    setNameEdited(value.trim().length > 0);
                  }}
                  placeholder="my-repo"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="repository-path" className="text-xs font-medium">
                  Path
                </label>
                <Input
                  id="repository-path"
                  value={path}
                  onChange={(event) => {
                    const nextPath = event.target.value;
                    setPath(nextPath);
                    if (!nameEdited) {
                      setName(nextPath.split("/").filter(Boolean).pop() ?? "");
                    }
                  }}
                  placeholder="/home/user/projects/my-repo"
                  className="font-mono"
                />
              </div>

              {createMutation.error instanceof Error && (
                <p className="text-xs text-red-500">{createMutation.error.message}</p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleAddOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !name.trim() || !path.trim()}>
                  {createMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteRepositoryDialog} onOpenChange={handleDeleteOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete repository</DialogTitle>
              <DialogDescription>
                Remove repository{" "}
                <span className="font-medium text-foreground">{pendingDelete?.name}</span>? This
                only unregisters it, the files on disk are not touched.
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

export const Route = createFileRoute("/dashboard/repositories/")({
  component: DashboardRepositories,
});
