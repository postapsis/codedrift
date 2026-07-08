/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */

import MarkdownContent from "@/components/markdown-content.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Check, Copy, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useState, type JSX } from "react";
import type { ChangesetFileComment } from "@/@types/changeset.ts";

export type CommentExtendData = {
  oldFile: Record<string, { data: ChangesetFileComment[] }>;
  newFile: Record<string, { data: ChangesetFileComment[] }>;
};

const buildCommentReference = (
  reviewId: string,
  filePath: string,
  comment: ChangesetFileComment,
): string =>
  `Regarding this code-review comment in the codedrift review ${reviewId} — fetch it with the codedrift-changeset MCP tool: get_comment({ reviewId: "${reviewId}", commentId: "${comment.id}" }) (file ${filePath}, line ${comment.lineNumber}, ${comment.side} side).

`;

const DiffCommentCards = ({
  comments,
  reviewId,
  filePath,
}: {
  comments: ChangesetFileComment[];
  reviewId: string;
  filePath: string;
}): JSX.Element => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (comment: ChangesetFileComment): Promise<void> => {
    await navigator.clipboard.writeText(buildCommentReference(reviewId, filePath, comment));
    setCopiedId(comment.id);
    toast.success("Comment reference copied to clipboard");
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-2 border-y border-border bg-muted/30 px-4 py-3 font-sans">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex items-start gap-2 rounded-md border border-border bg-white p-3  max-w-[1000px]">
          <MessageSquare
            size={14}
            className="mt-0.5 shrink-0 text-muted-foreground relative top-px"
          />
          <MarkdownContent markdown={comment.comment} />
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-6 shrink-0 text-muted-foreground"
            title="Copy reference for AI agent"
            onClick={() => void handleCopy(comment)}>
            {copiedId === comment.id ? (
              <Check size={14} className="stroke-muted-foreground" />
            ) : (
              <Copy size={14} className="stroke-muted-foreground" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default DiffCommentCards;
