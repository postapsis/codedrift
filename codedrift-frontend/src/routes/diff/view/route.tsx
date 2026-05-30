/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { useMemo, useState, type JSX } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar/sidebar.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { DiffViewContext, getDiffFileId } from "../../../lib/diff-view-context.ts";
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
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const diffFiles = useMemo(() => diffQuery.data ?? [], [diffQuery.data]);
  const selectedFile = useMemo(() => {
    return diffFiles.find((file) => getDiffFileId(file) === selectedFileId) ?? diffFiles.at(0);
  }, [diffFiles, selectedFileId]);
  const activeSelectedFileId = selectedFile ? getDiffFileId(selectedFile) : null;
  const errorMessage = diffQuery.error instanceof Error ? diffQuery.error.message : null;

  const contextValue = useMemo(
    () => ({
      diffFiles,
      selectedFile,
      selectedFileId: activeSelectedFileId,
      setSelectedFileId,
      isLoading: diffQuery.isLoading,
      errorMessage,
    }),
    [diffFiles, selectedFile, activeSelectedFileId, diffQuery.isLoading, errorMessage],
  );

  return (
    <DiffViewContext.Provider value={contextValue}>
      <Sidebar />
      <div
        className={`flex-1 overflow-auto px-4 py-3 bg-white rounded shadow-md ${THIN_SCROLLBAR_CLASS}`}>
        <Outlet />
      </div>
    </DiffViewContext.Provider>
  );
};

export const Route = createFileRoute("/diff/view")({
  component: DiffViewLayout,
});
