/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  addChangeset,
  addComment,
  ChangesetInputError,
  deleteChangeset,
  deleteComment,
  editComment,
  getChangesetsDetails,
  getComment,
  getReviewInfo,
  removeChangesetFile,
  setChangesetFile,
  setReviewOverview,
  updateChangeset,
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
    "set_review_overview",
    {
      title: "Set review overview",
      description:
        "Set or overwrite the review's overview: a comprehensive markdown summary of what the " +
        "change/PR does — its goals, architecture, and how data flows through the changed " +
        "code. Illustrate flows and structure with mermaid diagrams (```mermaid fenced " +
        "blocks). Include code snippets only briefly and only when essential; prefer prose " +
        "and diagrams. Call this BEFORE adding changesets when creating a review; call it " +
        "again to refresh a stale overview.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        overview: z
          .string()
          .describe("The overview as markdown, with mermaid diagrams in fenced code blocks."),
      },
    },
    ({ reviewId, overview }) => toToolResult(() => setReviewOverview(reviewId, overview)),
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
        description: z
          .string()
          .describe("What this changeset groups together and why as markdown."),
        order: z
          .number()
          .int()
          .describe(
            "Position of this changeset in the review's reading order " +
              "(1-based; lower = read earlier).",
          ),
        files: z
          .array(changesetFileSchema)
          .min(1)
          .describe("The changed files that make up this changeset."),
      },
    },
    ({ reviewId, name, description, order, files }) =>
      toToolResult(() => addChangeset(reviewId, { name, description, order, files })),
  );

  server.registerTool(
    "get_changesets_details",
    {
      title: "Get changesets details",
      description:
        "Return all changesets of a review with their id, name, description, order, and files " +
        "(absolute paths, summaries, and line-anchored comments with their comment ids).",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
      },
    },
    ({ reviewId }) => toToolResult(() => getChangesetsDetails(reviewId)),
  );

  server.registerTool(
    "update_changeset",
    {
      title: "Update changeset",
      description:
        "Update a changeset's name, description and/or reading-order position. At least one " +
        "field is required; omitted fields keep their current values.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        changesetId: z.string().describe("Changeset id (36-character UUIDv7)."),
        name: z.string().optional().describe("New human-readable changeset name."),
        description: z
          .string()
          .optional()
          .describe("New description of what this changeset groups together and why."),
        order: z
          .number()
          .int()
          .optional()
          .describe("New position in the review's reading order (1-based; lower = earlier)."),
      },
    },
    ({ reviewId, changesetId, name, description, order }) =>
      toToolResult(() => updateChangeset(reviewId, changesetId, { name, description, order })),
  );

  server.registerTool(
    "set_changeset_file",
    {
      title: "Set changeset file",
      description:
        "Add a file to a changeset, or update its summary if it is already in the changeset. " +
        "Comments may only be passed when adding — for an existing file use add_comment " +
        "instead. A file may belong to only one changeset of a review.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        changesetId: z.string().describe("Changeset id (36-character UUIDv7)."),
        ...changesetFileSchema.shape,
      },
    },
    ({ reviewId, changesetId, filePath, summary, comments }) =>
      toToolResult(() => setChangesetFile(reviewId, changesetId, { filePath, summary, comments })),
  );

  server.registerTool(
    "remove_changeset_file",
    {
      title: "Remove changeset file",
      description:
        "Remove a file from a changeset, including its comments; the freed file can then be " +
        "added to another changeset. The last file of a changeset cannot be removed — use " +
        "delete_changeset instead.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        changesetId: z.string().describe("Changeset id (36-character UUIDv7)."),
        filePath: z
          .string()
          .describe("ABSOLUTE filesystem path of a file currently in the changeset."),
      },
    },
    ({ reviewId, changesetId, filePath }) =>
      toToolResult(() => removeChangesetFile(reviewId, changesetId, filePath)),
  );

  server.registerTool(
    "get_comment",
    {
      title: "Get comment",
      description:
        "Return a single review comment by id: its changeset, absolute file path, " +
        "line number, side, and text.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        commentId: z.string().describe("Comment id (36-character UUIDv7)."),
      },
    },
    ({ reviewId, commentId }) => toToolResult(() => getComment(reviewId, commentId)),
  );

  server.registerTool(
    "add_comment",
    {
      title: "Add comment",
      description:
        "Add a line-anchored review comment to a file that already belongs to a changeset " +
        "of the review.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        changesetId: z.string().describe("Changeset id (36-character UUIDv7)."),
        filePath: z
          .string()
          .describe("ABSOLUTE filesystem path of a file already in the changeset."),
        ...changesetFileCommentSchema.shape,
      },
    },
    ({ reviewId, changesetId, filePath, lineNumber, side, comment }) =>
      toToolResult(() =>
        addComment(reviewId, changesetId, filePath, { lineNumber, side, comment }),
      ),
  );

  server.registerTool(
    "edit_comment",
    {
      title: "Edit comment",
      description:
        "Update an existing review comment by id. The comment text is required; " +
        "line number and side keep their current values when omitted.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        commentId: z.string().describe("Comment id (36-character UUIDv7)."),
        lineNumber: changesetFileCommentSchema.shape.lineNumber.optional(),
        side: changesetFileCommentSchema.shape.side,
        comment: changesetFileCommentSchema.shape.comment,
      },
    },
    ({ reviewId, commentId, lineNumber, side, comment }) =>
      toToolResult(() => editComment(reviewId, commentId, { comment, lineNumber, side })),
  );

  server.registerTool(
    "delete_comment",
    {
      title: "Delete comment",
      description: "Delete a review comment by id.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        commentId: z.string().describe("Comment id (36-character UUIDv7)."),
      },
    },
    ({ reviewId, commentId }) => toToolResult(() => deleteComment(reviewId, commentId)),
  );

  server.registerTool(
    "delete_changeset",
    {
      title: "Delete changeset",
      description:
        "Delete a changeset of a review, including all its files and comments. " +
        "The freed files can then be added to new changesets.",
      inputSchema: {
        reviewId: z.string().describe("Review id (36-character UUIDv7)."),
        changesetId: z.string().describe("Changeset id (36-character UUIDv7)."),
      },
    },
    ({ reviewId, changesetId }) => toToolResult(() => deleteChangeset(reviewId, changesetId)),
  );

  return server;
};
