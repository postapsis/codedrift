/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import "dotenv/config";
import Fastify, { type FastifyReply } from "fastify";
import { DiffService } from "./services/diff-service.ts";
import type { DiffFileData } from "./@types/diff.ts";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  ChangesetInputError,
  ChangesetTools,
  type ChangesetAssociatedCommit,
  type ChangesetCommitSummary,
} from "./tools/changeset-tools.ts";
import { DIFF_BASE_REF, DIFF_HEAD_REF, REPOSITORY_PATH } from "./utils/temp-repo-info.ts";
import type { Tool, ToolExecutionOptions } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// const { text } = await generateText({
//   model: openai("gpt-5.4"),
//   prompt: "What is love?",
// });
//
// console.log(`AI response: ${text}`);

const fastify = Fastify({
  logger: true,
});

type FilePathRequestBody = {
  filePath?: unknown;
};

type FileContentAtRevisionRequestBody = FilePathRequestBody & {
  revision?: unknown;
};

const getToolExecutionOptions = (toolCallId: string): ToolExecutionOptions => ({
  toolCallId,
  messages: [],
});

const createChangesetTools = (): ChangesetTools => {
  return new ChangesetTools(REPOSITORY_PATH, DIFF_BASE_REF, DIFF_HEAD_REF);
};

const getRequiredStringBodyField = (body: unknown, fieldName: string): string | null => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const value = (body as Record<string, unknown>)[fieldName];

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return value;
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

fastify.get("/", async function handler() {
  return { hello: "world" };
});

fastify.get("/diff", async (): Promise<DiffFileData[]> => {
  return DiffService.getDiffFiles();
});

fastify.post("/tools/changeset/all-commits", async (): Promise<ChangesetCommitSummary[]> => {
  const changesetTools = createChangesetTools();

  return executeChangesetTool(changesetTools.tools.allCommits, {}, "manual-all-commits");
});

fastify.post<{ Body: FilePathRequestBody }>(
  "/tools/changeset/associated-commits",
  async (request, reply): Promise<ChangesetAssociatedCommit[] | void> => {
    const filePath = getRequiredStringBodyField(request.body, "filePath");

    if (!filePath) {
      await sendBadRequest(reply, "filePath is required");
      return;
    }

    try {
      const changesetTools = createChangesetTools();

      return await executeChangesetTool(
        changesetTools.tools.associatedCommitsForFile,
        { filePath },
        "manual-associated-commits-for-file",
      );
    } catch (error) {
      await handleChangesetError(reply, error);
    }
  },
);

fastify.post<{ Body: FilePathRequestBody }>(
  "/tools/changeset/raw-hunk",
  async (request, reply): Promise<string | void> => {
    const filePath = getRequiredStringBodyField(request.body, "filePath");

    if (!filePath) {
      await sendBadRequest(reply, "filePath is required");
      return;
    }

    try {
      const changesetTools = createChangesetTools();

      return await executeChangesetTool(
        changesetTools.tools.rawHunkForFile,
        { filePath },
        "manual-raw-hunk",
      );
    } catch (error) {
      await handleChangesetError(reply, error);
    }
  },
);

fastify.post<{ Body: FileContentAtRevisionRequestBody }>(
  "/tools/changeset/file-content-at-revision",
  async (request, reply): Promise<string | void> => {
    const filePath = getRequiredStringBodyField(request.body, "filePath");
    const revision = getRequiredStringBodyField(request.body, "revision");

    if (!filePath) {
      await sendBadRequest(reply, "filePath is required");
      return;
    }

    if (!revision) {
      await sendBadRequest(reply, "revision is required");
      return;
    }

    try {
      const changesetTools = createChangesetTools();

      return await executeChangesetTool(
        changesetTools.tools.fileContentAtRevision,
        { filePath, revision },
        "manual-file-content-at-revision",
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
