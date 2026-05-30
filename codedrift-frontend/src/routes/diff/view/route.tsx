/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { useEffect, useMemo, type JSX } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar/sidebar.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import type { DiffFileData } from "@/@types/diff.ts";

const diffApiUrl = import.meta.env.VITE_DIFF_API_URL;

const fetchDiffFiles = async (): Promise<DiffFileData[]> => {
  if (!diffApiUrl) {
    throw new Error("VITE_DIFF_API_URL is not configured");
  }

  const response = await fetch(diffApiUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch diff (${response.status})`);
  }

  return response.json();
};

const DiffViewLayout = (): JSX.Element => {
  const diffQuery = useQuery({
    queryKey: ["diff"],
    queryFn: fetchDiffFiles,
  });

  const diffFiles = useMemo(() => diffQuery.data ?? [] as DiffFileData[], [diffQuery.data]);
  const errorMessage = diffQuery.error instanceof Error ? diffQuery.error.message : null;
  const setFromDiffQueryState = useDiffViewStore((state) => state.setFromDiffQueryState);

  useEffect(() => {
    setFromDiffQueryState({
      diffFiles,
      isLoading: diffQuery.isLoading,
      errorMessage,
    });
  }, [diffFiles, diffQuery.isLoading, errorMessage, setFromDiffQueryState]);

  return (
    <>
      <Sidebar />
      <div
        className={`flex-1 overflow-auto px-4 py-3 bg-white rounded shadow-md ${THIN_SCROLLBAR_CLASS}`}>
        <Outlet />
      </div>
    </>
  );
};

export const Route = createFileRoute("/diff/view")({
  component: DiffViewLayout,
});
