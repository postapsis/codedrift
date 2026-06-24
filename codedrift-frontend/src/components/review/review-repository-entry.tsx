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
import type { ReviewEntry } from "@/@types/review-entry.ts";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

interface ReviewRepositoryEntryPropType {
  entry: ReviewEntry;
  repositories: Repository[];
  canRemove: boolean;
  onChange: (key: string, patch: Partial<ReviewEntry>) => void;
  onRemove: (key: string) => void;
}

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
    enabled: entry.repositoryId !== "",
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

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
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

      <div className="flex gap-3 items-center">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium">Base Branch</label>
          <Select
            value={entry.baseRef}
            onValueChange={(value) => onChange(entry.key, { baseRef: value })}>
            <SelectTrigger disabled={branchesDisabled} className="w-full">
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
        </div>

        <ArrowLeft size={14} className="relative top-2.5" />

        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium">Head Branch</label>
          <Select
            value={entry.headRef}
            onValueChange={(value) => onChange(entry.key, { headRef: value })}>
            <SelectTrigger disabled={branchesDisabled} className="w-full">
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
        </div>
      </div>

      {sameRef && <p className="text-xs text-red-500">Base and head refs must be different</p>}

      {branchesQuery.error instanceof Error && (
        <p className="text-xs text-red-500">{branchesQuery.error.message}</p>
      )}
    </div>
  );
};

export default ReviewRepositoryEntry;