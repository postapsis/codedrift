/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  addChangeset,
  addReviewOverview,
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

const changesetFileCommentSchema = z.object({
  lineNumber: z
    .number()
    .int()
    .min(1)
    .describe(
      "1-based line number the comment anchors to. Use NEW-file numbering for added/changed " +
        "lines and OLD-file numbering for deleted lines. Only comment on lines that are part " +
        "of the diff — comments outside changed hunks are not displayed.",
    ),
  side: z
    .enum(["old", "new"])
    .optional()
    .describe(
      "Which file version the line number refers to. 'new' (default) = the head version; " +
        "'old' = the base version (use for deleted lines).",
    ),
  comment: z.string().describe("Code-review comment anchored at this line (markdown)."),
});

const changesetFileSchema = z.object({
  filePath: z
    .string()
    .describe(
      "ABSOLUTE filesystem path of the changed file. " +
        "Must be inside one of the review's repositories.",
    ),
  summary: z
    .string()
    .describe("Concise summary of what changed in this file and why (1-3 sentences)."),
  comments: z
    .array(changesetFileCommentSchema)
    .optional()
    .describe(
      "Line-anchored review comments for this file — potential bugs, risky patterns, " +
        "notable decisions worth pointing out.",
    ),
});

export const createChangesetMcpServer = (): McpServer => {
  const server = new McpServer({ name: "codedrift-changeset", version: "1.0.0" });

  server.registerTool(
    "get_review_info",
    {
      title: "Get review info",
      description:
        "Return a review's repositories with their id, filesystem path and base/head refs, " +
        "by review id.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
      },
    },
    ({ reviewId }) => toToolResult(() => getReviewInfo(reviewId)),
  );

  server.registerTool(
    "add_review_overview",
    {
      title: "Add review overview",
      description:
        "Set the review's overview: a comprehensive markdown summary of what the change/PR " +
        "does — its goals, architecture, and how data flows through the changed code. " +
        "Illustrate flows and structure with mermaid diagrams (```mermaid fenced blocks). " +
        "Include code snippets only briefly and only when essential; prefer prose and " +
        "diagrams. Overwrites any existing overview. Call this BEFORE adding changesets.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        overview: z
          .string()
          .describe("The overview as markdown, with mermaid diagrams in fenced code blocks."),
      },
    },
    ({ reviewId, overview }) => toToolResult(() => addReviewOverview(reviewId, overview)),
  );

  server.registerTool(
    "add_changeset",
    {
      title: "Add changeset",
      description:
        "Add a named changeset to a review. Each file carries an absolute path, a change " +
        "summary, and optional line-anchored review comments. A file may belong to only one " +
        "changeset of a review; already-grouped files are rejected.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        name: z.string().describe("Human-readable changeset name."),
        description: z.string().describe("What this changeset groups together and why."),
        files: z
          .array(changesetFileSchema)
          .min(1)
          .describe("The changed files that make up this changeset."),
      },
    },
    ({ reviewId, name, description, files }) =>
      toToolResult(() => addChangeset(reviewId, { name, description, files })),
  );

  server.registerTool(
    "get_changeset_files",
    {
      title: "Get changeset files",
      description:
        "Return the absolute paths of all files already grouped into changesets of a review.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
      },
    },
    ({ reviewId }) => toToolResult(() => getChangesetFiles(reviewId)),
  );

  return server;
};
