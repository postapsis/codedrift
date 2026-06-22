/*
 * Author: Jamius Siam
 * Since: 22/06/2026
 */
import type { FastifyPluginAsync } from "fastify";
import { RepositoryService } from "../services/repository-service.ts";
import { saveRepository } from "../db/repository-store.ts";
import type { ApiResponse } from "../@types/api-response.ts";
import type { Repository } from "../@types/repository.ts";

type AddRepositoryBody = {
  repositoryName?: string;
  repositoryPath?: string;
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
};
