/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  addChangeset,
  ChangesetInputError,
  getChangesetFiles,
  getReviewInfo,
} from "../tools/changeset-tools.ts";

const toToolResult = <T>(run: () => T): CallToolResult => {
  try {
    return { content: [{ type: "text", text: JSON.stringify(run()) }] };
  } catch (error) {
    if (error instanceof ChangesetInputError) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    throw error;
  }
};

export const createChangesetMcpServer = (): McpServer => {
  const server = new McpServer({ name: "codedrift-changeset", version: "1.0.0" });

  server.registerTool(
    "get_review_info",
    {
      title: "Get review info",
      description:
        "Return a review's repositories with their filesystem path and base/head refs, by review id.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
      },
    },
    ({ reviewId }) => toToolResult(() => getReviewInfo(reviewId)),
  );

  server.registerTool(
    "add_changeset",
    {
      title: "Add changeset",
      description:
        "Add a named changeset (file paths) to a review. " +
        "Rejects a file path already grouped in another changeset of that review.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        name: z.string().describe("Human-readable changeset name."),
        description: z.string().describe("What this changeset groups together."),
        filesPaths: z
          .array(z.string())
          .describe("Repository file paths, relative to the configured repository root."),
      },
    },
    ({ reviewId, name, description, filesPaths }) =>
      toToolResult(() => addChangeset(reviewId, { name, description, filesPaths })),
  );

  server.registerTool(
    "get_changeset_files",
    {
      title: "Get changeset files",
      description: "Return all file paths across the changesets of a review.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
      },
    },
    ({ reviewId }) => toToolResult(() => getChangesetFiles(reviewId)),
  );

  return server;
};
