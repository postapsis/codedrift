/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import { createFileRoute } from "@tanstack/react-router";
import { type JSX, useState } from "react";
import RepositoriesList from "@/components/repository-list.tsx";
import ReviewsList from "@/components/reviews-list.tsx";

const Repositories = (): JSX.Element => {
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(null);

  return (
    <div className="flex h-full justify-center gap-20 pt-6">
      <div className="w-1/4 flex flex-col gap-4">
        <RepositoriesList
          selectedRepositoryId={selectedRepositoryId}
          setSelectedRepositoryId={setSelectedRepositoryId}
        />
      </div>
      <div className="border-l border-dashed"></div>
      <div className="w-1/4 flex flex-col gap-4">
        <ReviewsList selectedRepositoryId={selectedRepositoryId} />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/repositories/")({
  component: Repositories,
});
