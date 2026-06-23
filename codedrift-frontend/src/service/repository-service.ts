/*
* Author: Jamius Siam
* Since: 23/06/2026
*/
import type {Repository} from "@/@types/repository.ts";
import type {ApiResponse} from "@/@types/api-response.ts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const fetchRepositories = async (): Promise<Repository[]> => {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}/repositories`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repositories (${response.status})`);
  }

  const body: ApiResponse<Repository[]> = await response.json();

  return body.data;
};

export const createRepository = async (input: {
  repositoryName: string;
  repositoryPath: string;
}): Promise<Repository> => {
  const response = await fetch(`${apiBaseUrl}/addRepository`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });

  const body: ApiResponse<Repository | null> = await response.json();

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.message ?? `Failed to add repository (${response.status})`);
  }

  return body.data;
};

export const deleteRepository = async (id: string): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}/repository/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiResponse<null> | null;
    throw new Error(body?.message ?? `Failed to delete repository (${response.status})`);
  }
};
