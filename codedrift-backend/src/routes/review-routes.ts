/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import type { FastifyPluginAsync } from "fastify";
import { getRepositoryById } from "../db/repository-store.ts";
import { saveReview, listReviewsByRepository, deleteReview } from "../db/review-store.ts";
import type { ApiResponse } from "../@types/api-response.ts";
import type { Review } from "../@types/review.ts";

type AddReviewBody = {
  repositoryId?: string;
  baseBranch?: string;
  headBranch?: string;
};

type RepositoryIdParams = {
  repositoryId: string;
};

type ReviewIdParams = {
  reviewId: string;
};

export const reviewRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: AddReviewBody }>(
    "/addReview",
    async (request, reply): Promise<ApiResponse<Review | null>> => {
      const repositoryId = request.body?.repositoryId?.trim() ?? "";
      const baseBranch = request.body?.baseBranch?.trim() ?? "";
      const headBranch = request.body?.headBranch?.trim() ?? "";

      if (!baseBranch || !headBranch) {
        reply.status(400);
        return { success: false, message: "Base and head branches are required", data: null };
      }

      if (baseBranch === headBranch) {
        reply.status(400);
        return {
          success: false,
          message: "Base and head branches must be different",
          data: null,
        };
      }

      if (!getRepositoryById(repositoryId)) {
        reply.status(404);
        return { success: false, message: "Repository not found", data: null };
      }

      const review = saveReview(repositoryId, baseBranch, headBranch);

      return { success: true, message: null, data: review };
    },
  );

  fastify.get<{ Params: RepositoryIdParams }>(
    "/repository/:repositoryId/reviews",
    async (request, reply): Promise<ApiResponse<Review[] | null>> => {
      if (!getRepositoryById(request.params.repositoryId)) {
        reply.status(404);
        return { success: false, message: "Repository not found", data: null };
      }

      return {
        success: true,
        message: null,
        data: listReviewsByRepository(request.params.repositoryId),
      };
    },
  );

  fastify.delete<{ Params: ReviewIdParams }>(
    "/review/:reviewId",
    async (request, reply): Promise<ApiResponse<null>> => {
      const deleted = deleteReview(request.params.reviewId);

      if (!deleted) {
        reply.status(404);
        return { success: false, message: "Review not found", data: null };
      }

      return { success: true, message: null, data: null };
    },
  );
};
