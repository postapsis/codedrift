/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import type { FastifyPluginAsync } from "fastify";
import { getRepositoryById } from "../db/repository-store.ts";
import { saveReview, listReviews, deleteReview, getReviewOverview } from "../db/review-store.ts";
import { getChangesets } from "../db/changeset-store.ts";
import { ChangesetDiffService } from "../services/changeset-diff-service.ts";
import type { ApiResponse } from "../@types/api-response.ts";
import type { Review, ReviewOverview } from "../@types/review.ts";
import type { Changeset } from "../@types/changeset.ts";
import type { ChangesetDiff } from "../@types/changeset-diff.ts";

type AddReviewRepositoryBody = {
  repositoryId?: string;
  baseRef?: string;
  headRef?: string;
};

type AddReviewBody = {
  name?: string;
  repositories?: AddReviewRepositoryBody[];
};

type ReviewIdParams = {
  reviewId: string;
};

type ChangesetDiffParams = {
  reviewId: string;
  changesetId: string;
};

export const reviewRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: AddReviewBody }>(
    "/addReview",
    async (request, reply): Promise<ApiResponse<Review | null>> => {
      const name = request.body?.name?.trim() ?? "";
      const repositories = request.body?.repositories ?? [];

      if (!name) {
        reply.status(400);
        return { success: false, message: "Review name is required", data: null };
      }

      if (repositories.length === 0) {
        reply.status(400);
        return { success: false, message: "At least one repository is required", data: null };
      }

      const items = repositories.map((repository) => ({
        repositoryId: repository.repositoryId?.trim() ?? "",
        baseRef: repository.baseRef?.trim() ?? "",
        headRef: repository.headRef?.trim() ?? "",
      }));

      for (const item of items) {
        if (!item.repositoryId || !item.baseRef || !item.headRef) {
          reply.status(400);
          return {
            success: false,
            message: "Each repository needs a base and head branch",
            data: null,
          };
        }

        if (item.baseRef === item.headRef) {
          reply.status(400);
          return {
            success: false,
            message: "Base and head branches must be different",
            data: null,
          };
        }

        if (!getRepositoryById(item.repositoryId)) {
          reply.status(404);
          return { success: false, message: "Repository not found", data: null };
        }
      }

      const repositoryIds = items.map((item) => item.repositoryId);

      if (new Set(repositoryIds).size !== repositoryIds.length) {
        reply.status(400);
        return { success: false, message: "A repository can only be added once", data: null };
      }

      const review = saveReview(name, items);

      return { success: true, message: null, data: review };
    },
  );

  fastify.get("/reviews", async (): Promise<ApiResponse<Review[]>> => {
    return { success: true, message: null, data: listReviews() };
  });

  fastify.get<{ Params: ReviewIdParams }>(
    "/review/:reviewId/changesets",
    async (request): Promise<ApiResponse<Changeset[]>> => {
      return { success: true, message: null, data: getChangesets(request.params.reviewId) };
    },
  );

  fastify.get<{ Params: ReviewIdParams }>(
    "/review/:reviewId/overview",
    async (request, reply): Promise<ApiResponse<ReviewOverview | null>> => {
      const overview = getReviewOverview(request.params.reviewId);

      if (!overview) {
        reply.status(404);
        return { success: false, message: "Review not found", data: null };
      }

      return { success: true, message: null, data: overview };
    },
  );

  fastify.get<{ Params: ChangesetDiffParams }>(
    "/review/:reviewId/changeset/:changesetId/diff",
    async (request, reply): Promise<ApiResponse<ChangesetDiff | null>> => {
      const diff = await ChangesetDiffService.getChangesetDiff(
        request.params.reviewId,
        request.params.changesetId,
      );

      if (!diff) {
        reply.status(404);
        return { success: false, message: "Changeset not found", data: null };
      }

      return { success: true, message: null, data: diff };
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
