/*
 * Author: Jamius Siam
 * Since: 22/06/2026
 */
import type { FastifyPluginAsync } from "fastify";
import { RepositoryService } from "../services/repository-service.ts";
import type { ApiResponse } from "../@types/api-response.ts";

type AddRepositoryBody = {
  repositoryPath?: string;
};

export const repositoryRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: AddRepositoryBody }>(
    "/addRepository",
    async (request, reply): Promise<ApiResponse<AddRepositoryBody | null>> => {
      const result = await RepositoryService.validateRepository(request.body?.repositoryPath ?? "");

      if (!result.valid) {
        reply.status(400);
        return { success: false, message: result.message, data: null };
      }

      return { success: true, message: null, data: request.body };
    },
  );
};
