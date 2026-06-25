/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import {
  addChangeset,
  ChangesetInputError,
  getChangesetFiles,
  getReviewInfo,
} from "../tools/changeset-tools.ts";
import type { Changeset } from "../@types/changeset.ts";
import type { ReviewInfo } from "../@types/review.ts";

type ReviewIdBody = {
  reviewId?: string;
};

type AddChangesetBody = ReviewIdBody & {
  name?: string;
  description?: string;
  filesPaths?: string[];
};

const handleChangesetError = async (reply: FastifyReply, error: unknown): Promise<void> => {
  if (error instanceof ChangesetInputError) {
    await reply.status(400).send({ message: error.message });
    return;
  }

  throw error;
};

export const changesetRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: ReviewIdBody }>(
    "/tools/changeset/review-info",
    async (request, reply): Promise<ReviewInfo | void> => {
      try {
        return getReviewInfo(request.body?.reviewId ?? "");
      } catch (error) {
        await handleChangesetError(reply, error);
      }
    },
  );

  fastify.post<{ Body: AddChangesetBody }>(
    "/tools/changeset/add",
    async (request, reply): Promise<Changeset | void> => {
      try {
        const { reviewId, name, description, filesPaths } = request.body ?? {};

        return addChangeset(reviewId ?? "", {
          name: name ?? "",
          description: description ?? "",
          filesPaths: filesPaths ?? [],
        });
      } catch (error) {
        await handleChangesetError(reply, error);
      }
    },
  );

  fastify.post<{ Body: ReviewIdBody }>(
    "/tools/changeset/files",
    async (request, reply): Promise<string[] | void> => {
      try {
        return getChangesetFiles(request.body?.reviewId ?? "");
      } catch (error) {
        await handleChangesetError(reply, error);
      }
    },
  );
};
