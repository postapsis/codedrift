/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import type { FastifyPluginAsync } from "fastify";
import { getRepositoryById } from "../db/repository-store.ts";
import {
  saveReview,
  listReviews,
  deleteReview,
  getReviewOverview,
  type ReviewRepositoryInput,
} from "../db/review-store.ts";
import { getChangesets } from "../db/changeset-store.ts";
import { ChangesetDiffService } from "../services/changeset-diff-service.ts";
import { GitService } from "../services/git-service.ts";
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
    "/api/addReview",
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

      const repoDetailList = repositories.map((repository) => ({
        repositoryId: repository.repositoryId?.trim() ?? "",
        baseRef: repository.baseRef?.trim() ?? "",
        headRef: repository.headRef?.trim() ?? "",
      }));

      for (const repoDetail of repoDetailList) {
        if (!repoDetail.repositoryId || !repoDetail.baseRef || !repoDetail.headRef) {
          reply.status(400);
          return {
            success: false,
            message: "Each repository needs a base and head branch",
            data: null,
          };
        }

        if (repoDetail.baseRef === repoDetail.headRef) {
          reply.status(400);
          return {
            success: false,
            message: "Base and head branches must be different",
            data: null,
          };
        }

        if (!getRepositoryById(repoDetail.repositoryId)) {
          reply.status(404);
          return { success: false, message: "Repository not found", data: null };
        }
      }

      const repositoryIds = repoDetailList.map((repoReviewDetail) => repoReviewDetail.repositoryId);

      if (new Set(repositoryIds).size !== repositoryIds.length) {
        reply.status(400);
        return { success: false, message: "A repository can only be added once", data: null };
      }

      const repoDetailWithRefType: ReviewRepositoryInput[] = [];

      for (const repoDetail of repoDetailList) {
        const repository = getRepositoryById(repoDetail.repositoryId)!;
        const baseIsBranch = await GitService.isBranch(repository.path, repoDetail.baseRef);

        if (!baseIsBranch) {
          const [baseExists, headExists] = await Promise.all([
            GitService.commitExists(repository.path, repoDetail.baseRef),
            GitService.commitExists(repository.path, repoDetail.headRef),
          ]);

          if (!baseExists || !headExists) {
            reply.status(400);
            return {
              success: false,
              message: "Base and head commits must exist in the repository.",
              data: null,
            };
          }
        } else {
          const [baseExists, headExists] = await Promise.all([
            GitService.branchExists(repository.path, repoDetail.baseRef),
            GitService.branchExists(repository.path, repoDetail.headRef),
          ]);

          if (!baseExists || !headExists) {
            reply.status(400);
            return {
              success: false,
              message:
                "Base or head branch not found. Make sure both branches are checked out locally.",
              data: null,
            };
          }
        }

        repoDetailWithRefType.push({ ...repoDetail, refType: baseIsBranch ? "branch" : "commit" });
      }

      const review = saveReview(name, repoDetailWithRefType);

      return { success: true, message: null, data: review };
    },
  );

  fastify.get("/api/reviews", async (): Promise<ApiResponse<Review[]>> => {
    return { success: true, message: null, data: listReviews() };
  });

  fastify.get<{ Params: ReviewIdParams }>(
    "/api/review/:reviewId/changesets",
    async (request): Promise<ApiResponse<Changeset[]>> => {
      return { success: true, message: null, data: getChangesets(request.params.reviewId) };
    },
  );

  fastify.get<{ Params: ReviewIdParams }>(
    "/api/review/:reviewId/overview",
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
    "/api/review/:reviewId/changeset/:changesetId/diff",
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
    "/api/review/:reviewId",
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
