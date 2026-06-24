/*
 * Author: Jamius Siam
 * Since: 24/06/2026
 */
import type { JSX } from "react";
import Loader from "@/components/loader.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash } from "lucide-react";
import type { Repository } from "@/@types/repository.ts";

interface RepositoryListProps {
  isLoading: boolean;
  errorMessage: string | null;
  repositories: Repository[];
  setPendingDelete: (repository: Repository) => void;
}

const RepositoryList = ({
  isLoading,
  errorMessage,
  repositories,
  setPendingDelete,
}: RepositoryListProps): JSX.Element => {
  if (isLoading) {
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
    return <div className="text-muted-foreground text-sm">No repositories yet.</div>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {repositories.map((repository) => (
        <li
          key={repository.id}
          className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div className="py-1 flex flex-col gap-1.5">
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

export default RepositoryList;
