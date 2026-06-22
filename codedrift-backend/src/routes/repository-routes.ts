/*
 * Author: Jamius Siam
 * Since: 22/06/2026
 */
import type { FastifyPluginAsync } from "fastify";
import { RepositoryService } from "../services/repository-service.ts";
import {
  saveRepository,
  getRepositoryById,
  listRepositories,
  deleteRepository,
} from "../db/repository-store.ts";
import type { ApiResponse } from "../@types/api-response.ts";
import type { Repository } from "../@types/repository.ts";

type AddRepositoryBody = {
  repositoryName?: string;
  repositoryPath?: string;
};

type RepositoryIdParams = {
  repositoryId: string;
};

export const repositoryRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: AddRepositoryBody }>(
    "/addRepository",
    async (request, reply): Promise<ApiResponse<Repository | null>> => {
      const repositoryName = request.body?.repositoryName?.trim() ?? "";
      const repositoryPath = (request.body?.repositoryPath ?? "").trim();

      if (!repositoryName) {
        reply.status(400);
        return { success: false, message: "Repository name is required", data: null };
      }

      const result = await RepositoryService.validateRepository(repositoryPath);

      if (!result.valid) {
        reply.status(400);
        return { success: false, message: result.message, data: null };
      }

      try {
        const repository = saveRepository(repositoryName, repositoryPath);
        return { success: true, message: null, data: repository };
      } catch (error) {
        if (
          error instanceof Error &&
          (error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
        ) {
          reply.status(409);
          return { success: false, message: "Repository already added", data: null };
        }

        throw error;
      }
    },
  );

  fastify.get(
    "/repositories",
    async (): Promise<ApiResponse<Repository[]>> => {
      return { success: true, message: null, data: listRepositories() };
    },
  );

  fastify.get<{ Params: RepositoryIdParams }>(
    "/repository/:repositoryId/branches",
    async (request, reply): Promise<ApiResponse<string[] | null>> => {
      const repository = getRepositoryById(request.params.repositoryId);

      if (!repository) {
        reply.status(404);
        return { success: false, message: "Repository not found", data: null };
      }

      const branches = await RepositoryService.getBranches(repository.path);

      return { success: true, message: null, data: branches };
    },
  );

  fastify.delete<{ Params: RepositoryIdParams }>(
    "/repository/:repositoryId",
    async (request, reply): Promise<ApiResponse<null>> => {
      const deleted = deleteRepository(request.params.repositoryId);

      if (!deleted) {
        reply.status(404);
        return { success: false, message: "Repository not found", data: null };
      }

      return { success: true, message: null, data: null };
    },
  );
};
