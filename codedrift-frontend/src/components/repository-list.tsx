/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import { useState, type FormEvent, type JSX } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Loader from "@/components/loader/loader";
import type { Repository } from "@/@types/repository.ts";
import {
  createRepository,
  deleteRepository,
  fetchRepositories,
} from "@/service/repository-service.ts";
import { cn } from "@/lib/utils.ts";
import { Trash } from "lucide-react";

interface RepositoriesListPropType {
  selectedRepositoryId: string | null;
  setSelectedRepositoryId: (id: string | null) => void;
}

const RepositoriesList = ({
  selectedRepositoryId,
  setSelectedRepositoryId,
}: RepositoriesListPropType): JSX.Element => {
  const queryClient = useQueryClient();

  const repositoriesQuery = useQuery({
    queryKey: ["repositories"],
    queryFn: fetchRepositories,
  });

  const [showAddRepositoryDialog, setShowAddRepositoryDialog] = useState(false);
  const [name, setName] = useState("");
  const [path, setPath] = useState("");

  const [pendingDelete, setPendingDelete] = useState<Repository | null>(null);

  const createMutation = useMutation({
    mutationFn: createRepository,
    onSuccess: async (repository: Repository): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["repositories"] });
      setShowAddRepositoryDialog(false);
      setName("");
      setPath("");
      toast.success(`Repository "${repository.name}" was added`);
      setSelectedRepositoryId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (repository) => deleteRepository(repository.id),
    onSuccess: async (_data: void, repository: Repository): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ["repositories"] });
      setPendingDelete(null);
      toast.success(`Repository "${repository.name}" was deleted`);
      setSelectedRepositoryId(null);
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

  const renderRepositoryList = (): JSX.Element => {
    if (repositoriesQuery.isLoading) {
      return (
        <div className="flex h-full items-center gap-1.5">
          <Loader />
          <span>Loading repositories</span>
        </div>
      );
    }

    if (errorMessage) {
      return <p className="text-red-500">{errorMessage}</p>;
    }

    if (repositories.length === 0) {
      return <div className="text-muted-foreground flex items-center">No repositories yet.</div>;
    }

    return (
      <ul className="flex flex-col gap-3">
        {repositories.map((repository) => (
          <li
            key={repository.id}
            className={cn(
              "flex items-center justify-between rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted/50",
              selectedRepositoryId === repository.id && "bg-muted/50",
            )}
            onClick={() => setSelectedRepositoryId(repository.id)}>
            <div className="py-1 flex flex-col gap-1">
              <p className="truncate text-sm font-medium">{repository.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{repository.path}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setPendingDelete(repository)}>
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
        <h1 className="font-heading text-lg font-semibold">Repositories</h1>
        <Button onClick={() => setShowAddRepositoryDialog(true)}>Add repository</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">{renderRepositoryList()}</div>

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
                onChange={(event) => setName(event.target.value)}
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
                onChange={(event) => setPath(event.target.value)}
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
              <span className="font-medium text-foreground">{pendingDelete?.name}</span>? This only
              unregisters it, the files on disk are not touched.
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

export default RepositoriesList;
