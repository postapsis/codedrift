/*
 * Author: Jamius Siam
 * Since: 23/06/2026
 */
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import {
  ChangesetInputError,
  ChangesetTools,
  type Changeset,
  type CommitSummary,
  type FileContent,
  type FileHunk,
} from "../tools/changeset-tools.ts";
import { DIFF_BASE_REF, DIFF_HEAD_REF, REPOSITORY_PATH } from "../utils/temp-repo-info.ts";

type FilePathBody = {
  filePath?: string;
};

const changesetTools = new ChangesetTools(REPOSITORY_PATH, DIFF_BASE_REF, DIFF_HEAD_REF);

const handleChangesetError = async (reply: FastifyReply, error: unknown): Promise<void> => {
  if (error instanceof ChangesetInputError) {
    await reply.status(400).send({ message: error.message });
    return;
  }

  throw error;
};

export const changesetRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/tools/changeset/all-commits", async (): Promise<CommitSummary[]> => {
    return changesetTools.getAllCommits();
  });

  fastify.post<{ Body: FilePathBody }>(
    "/tools/changeset/hunk",
    async (request, reply): Promise<FileHunk | void> => {
      try {
        return await changesetTools.getHunkForFile(request.body?.filePath ?? "");
      } catch (error) {
        await handleChangesetError(reply, error);
      }
    },
  );

  fastify.post<{ Body: FilePathBody }>(
    "/tools/changeset/file-content-at-base",
    async (request, reply): Promise<FileContent | void> => {
      try {
        return await changesetTools.getFileContentAtBase(request.body?.filePath ?? "");
      } catch (error) {
        await handleChangesetError(reply, error);
      }
    },
  );

  fastify.post<{ Body: FilePathBody }>(
    "/tools/changeset/file-content-at-head",
    async (request, reply): Promise<FileContent | void> => {
      try {
        return await changesetTools.getFileContentAtHead(request.body?.filePath ?? "");
      } catch (error) {
        await handleChangesetError(reply, error);
      }
    },
  );

  fastify.post<{ Body: Changeset }>(
    "/tools/changeset/add",
    async (request, reply): Promise<Changeset | void> => {
      try {
        return await changesetTools.addChangeset(request.body);
      } catch (error) {
        await handleChangesetError(reply, error);
      }
    },
  );

  fastify.post("/tools/changeset/files", async (): Promise<string[]> => {
    return changesetTools.getChangesetFiles();
  });
};
