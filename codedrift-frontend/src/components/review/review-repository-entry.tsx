/*
 * Author: Jamius Siam
 * Since: 24/06/2026
 */
import { type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches } from "@/service/review-service.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import type { Repository } from "@/@types/repository.ts";
import type { RefMode, ReviewEntry } from "@/@types/review-entry.ts";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils.ts";

interface ReviewRepositoryEntryPropType {
  entry: ReviewEntry;
  repositories: Repository[];
  canRemove: boolean;
  onChange: (key: string, patch: Partial<ReviewEntry>) => void;
  onRemove: (key: string) => void;
}

const refModeOptions: { mode: RefMode; label: string }[] = [
  { mode: "branch", label: "Branch" },
  { mode: "commit", label: "Commit" },
];

const ReviewRepositoryEntry = ({
  entry,
  repositories,
  canRemove,
  onChange,
  onRemove,
}: ReviewRepositoryEntryPropType): JSX.Element => {
  const branchesQuery = useQuery({
    queryKey: ["branches", entry.repositoryId],
    queryFn: () => fetchBranches(entry.repositoryId),
    enabled: entry.repositoryId !== "" && entry.refMode === "branch",
  });

  const branches = branchesQuery.data ?? [];
  const branchesDisabled = entry.repositoryId === "" || branchesQuery.isLoading;
  const sameRef = entry.baseRef !== "" && entry.baseRef === entry.headRef;

  const branchPlaceholder = (): string => {
    if (entry.repositoryId === "") {
      return "Select repository first";
    }

    return branchesQuery.isLoading ? "Loading branches..." : "Select branch";
  };

  const commitPlaceholder = (): string =>
    entry.repositoryId === "" ? "Select repository first" : "Commit hash";

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      <div className="flex items-center gap-2">
        <Select
          value={entry.repositoryId}
          onValueChange={(value) =>
            onChange(entry.key, { repositoryId: value, baseRef: "", headRef: "" })
          }>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select repository" />
          </SelectTrigger>
          <SelectContent>
            {repositories.map((repository) => (
              <SelectItem key={repository.id} value={repository.id}>
                {repository.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!canRemove}
          onClick={() => onRemove(entry.key)}>
          <X size={14} />
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <div className="inline-flex items-center gap-0.5 self-start rounded-md border border-border">
            {refModeOptions.map(({ mode, label }) => {
              const isActive = entry.refMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onChange(entry.key, { refMode: mode, baseRef: "", headRef: "" })}
                  className={cn(
                    "rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
                    isActive && "bg-nav-active/40 text-foreground",
                  )}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            Base {entry.refMode === "commit" ? "Commit" : "Branch"}
          </label>
          {entry.refMode === "branch" ? (
            <Select
              value={entry.baseRef}
              onValueChange={(value) => onChange(entry.key, { baseRef: value })}>
              <SelectTrigger disabled={branchesDisabled} className="w-[460px]">
                <SelectValue placeholder={branchPlaceholder()} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={entry.baseRef}
              disabled={entry.repositoryId === ""}
              placeholder={commitPlaceholder()}
              onChange={(event) => onChange(entry.key, { baseRef: event.target.value })}
              className="w-[460px]"
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            Head {entry.refMode === "commit" ? "Commit" : "Branch"}
          </label>
          {entry.refMode === "branch" ? (
            <Select
              value={entry.headRef}
              onValueChange={(value) => onChange(entry.key, { headRef: value })}>
              <SelectTrigger disabled={branchesDisabled} className="w-[460px]">
                <SelectValue placeholder={branchPlaceholder()} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={entry.headRef}
              disabled={entry.repositoryId === ""}
              placeholder={commitPlaceholder()}
              onChange={(event) => onChange(entry.key, { headRef: event.target.value })}
              className="w-[460px]"
            />
          )}
        </div>
      </div>

      {sameRef && <p className="text-xs text-red-500">Base and head must be different</p>}

      {branchesQuery.error instanceof Error && (
        <p className="text-xs text-red-500">{branchesQuery.error.message}</p>
      )}
    </div>
  );
};

export default ReviewRepositoryEntry;
