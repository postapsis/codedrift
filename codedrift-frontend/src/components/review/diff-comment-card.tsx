/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */

import MarkdownContent from "@/components/markdown-content.tsx";
import { MessageSquare } from "lucide-react";
import type { JSX } from "react";
import type { ChangesetFileComment } from "@/@types/changeset.ts";

export type CommentExtendData = {
  oldFile: Record<string, { data: ChangesetFileComment[] }>;
  newFile: Record<string, { data: ChangesetFileComment[] }>;
};

const DiffCommentCards = ({
  comments,
}: {
  comments: ChangesetFileComment[];
}): JSX.Element => {
  return (
    <div className="flex flex-col gap-2 border-y border-border bg-muted/30 px-4 py-3 font-sans">
      {comments.map((comment, index) => (
        <div
          key={`${comment.lineNumber}-${index}`}
          className="flex items-start gap-2 rounded-md border border-border bg-white p-3  max-w-[1000px]">
          <MessageSquare
            size={14}
            className="mt-0.5 shrink-0 text-muted-foreground relative top-px"
          />
          <MarkdownContent markdown={comment.comment} />
        </div>
      ))}
    </div>
  );
};

export default DiffCommentCards;
