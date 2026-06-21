/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import "dotenv/config";
import Fastify, { type FastifyReply } from "fastify";
import { DiffService } from "./services/diff-service.ts";
import type { DiffFileData } from "./@types/diff.ts";
import {
  ChangesetInputError,
  ChangesetTools,
  type ChangesetCommitSummary,
  type ChangesetFileContent,
  type ChangesetFileHunk,
} from "./tools/changeset-tools.ts";
import { DIFF_BASE_REF, DIFF_HEAD_REF, REPOSITORY_PATH } from "./utils/temp-repo-info.ts";
import type { Tool, ToolExecutionOptions } from "ai";

const fastify = Fastify({
  logger: true,
});

type FilePathRequestBody = {
  filePath?: string;
};

// TODO: Temporary to check tool functionalities, will remove later
const getToolExecutionOptions = (toolCallId: string): ToolExecutionOptions => ({
  toolCallId,
  messages: [],
});

// TODO: Temporary to check tool functionalities, will remove later
const createChangesetTools = (): ChangesetTools => {
  return new ChangesetTools(REPOSITORY_PATH, DIFF_BASE_REF, DIFF_HEAD_REF);
};

// TODO: Temporary to check tool functionalities, will remove later
const getRequiredStringBodyField = (body: unknown, fieldName: string): string => {
  return (body as Record<string, string>)[fieldName]!;
};

const sendBadRequest = async (reply: FastifyReply, message: string): Promise<void> => {
  await reply.status(400).send({ message });
};

const handleChangesetError = async (reply: FastifyReply, error: unknown): Promise<void> => {
  if (error instanceof ChangesetInputError) {
    await sendBadRequest(reply, error.message);
    return;
  }

  throw error;
};

const executeChangesetTool = async <Input, Output>(
  changesetTool: Tool<Input, Output>,
  input: Input,
  toolCallId: string,
): Promise<Output> => {
  if (!changesetTool.execute) {
    throw new Error("Changeset tool must define execute");
  }

  return (await changesetTool.execute(input, getToolExecutionOptions(toolCallId))) as Output;
};

fastify.addHook("onRequest", async (request, reply): Promise<void> => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    await reply.status(204).send();
  }
});

fastify.get("/diff", async (): Promise<DiffFileData[]> => {
  return DiffService.getDiffFiles();
});

fastify.post("/tools/changeset/all-commits", async (): Promise<ChangesetCommitSummary[]> => {
  const changesetTools = createChangesetTools();

  return executeChangesetTool(changesetTools.tools.allCommits, {}, "manual-all-commits");
});

fastify.post<{ Body: FilePathRequestBody }>(
  "/tools/changeset/hunk",
  async (request, reply): Promise<ChangesetFileHunk | void> => {
    const filePath = getRequiredStringBodyField(request.body, "filePath");

    try {
      const changesetTools = createChangesetTools();

      return await executeChangesetTool(
        changesetTools.tools.hunkForFile,
        { filePath },
        "manual-hunks-for-file",
      );
    } catch (error) {
      await handleChangesetError(reply, error);
    }
  },
);

fastify.post<{ Body: FilePathRequestBody }>(
  "/tools/changeset/file-content-at-base",
  async (request, reply): Promise<ChangesetFileContent | void> => {
    const filePath = getRequiredStringBodyField(request.body, "filePath");

    try {
      const changesetTools = createChangesetTools();

      return await executeChangesetTool(
        changesetTools.tools.fileContentAtBase,
        { filePath },
        "manual-file-content-at-base",
      );
    } catch (error) {
      await handleChangesetError(reply, error);
    }
  },
);

fastify.post<{ Body: FilePathRequestBody }>(
  "/tools/changeset/file-content-at-head",
  async (request, reply): Promise<ChangesetFileContent | void> => {
    const filePath = getRequiredStringBodyField(request.body, "filePath");

    try {
      const changesetTools = createChangesetTools();

      return await executeChangesetTool(
        changesetTools.tools.fileContentAtHead,
        { filePath },
        "manual-file-content-at-head",
      );
    } catch (error) {
      await handleChangesetError(reply, error);
    }
  },
);

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
