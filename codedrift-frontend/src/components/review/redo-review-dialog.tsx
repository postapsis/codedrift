/*
 * Author: Jamius Siam
 * Since: 06/07/2026
 */
import { type JSX, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";

interface RedoReviewDialogProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const buildRedoInstruction = (reviewId: string): string =>
  `You are redoing an existing code review using the "codedrift-changeset" MCP server. The review was created earlier, but the reviewed branches have changed since — update the review so it matches the current state of the code.

Review id: ${reviewId}

Do the following, in order:
  1. Call get_review_info({ reviewId: "${reviewId}" }) to get this review's repositories — each with its absolute filesystem path and base/head refs.
  2. For each repository, diff its base ref against its head ref and read the changed files so you understand the full, current set of changes. When the refs are branch names, use triple-dot notation (base...head) so the diff is taken against their merge-base. When the refs are commit SHAs, make both endpoints inclusive by diffing from the base's parent (base^..head) so the base commit's own changes are included.
  3. Call get_changesets_details({ reviewId: "${reviewId}" }) to see the existing changesets — each with its changesetId, name, description, order, and files (absolute paths, summaries, and line-anchored comments with their commentIds).
  4. Reconcile the review with the current diff, changing only what needs to change:
    - Update a changeset's name, description and/or reading order in place: update_changeset({ reviewId: "${reviewId}", changesetId, name, description, order }) — at least one field; omitted fields keep their current values. Keep the reading order sensible — foundational, low-level changes first (types, schema, shared utilities), then the code that builds on them, then call sites / UI / wiring, and incidental changes last. order is a 1-based integer; lower = read earlier. Do not repeat the changeset name in its description, and do not include ordering numbers in either the name or description — ordering is handled separately by the \`order\` param.
    - Add a file to a changeset, or fix its stale summary: set_changeset_file({ reviewId: "${reviewId}", changesetId, filePath, summary, comments }) — the ABSOLUTE filePath is added with a concise 1-3 sentence summary and optional line-anchored comments; if the file is already in the changeset, its summary is updated instead (pass no comments then). A file may belong to only one changeset.
    - Remove files that dropped out of the diff or belong elsewhere: remove_changeset_file({ reviewId: "${reviewId}", changesetId, filePath }) — this also deletes the file's comments and frees it for regrouping. The last file of a changeset cannot be removed.
    - Add changesets for new changes: add_changeset({ reviewId: "${reviewId}", name, description, order, files }); delete changesets that no longer fit as a whole: delete_changeset({ reviewId: "${reviewId}", changesetId }) — deleting one frees its files for regrouping.
    - Fix stale comments: line numbers may have shifted and remarks may no longer apply. Use edit_comment({ reviewId: "${reviewId}", commentId, comment, lineNumber, side }) to update one (lineNumber/side keep their current values when omitted), delete_comment({ reviewId: "${reviewId}", commentId }) to remove one, and add_comment({ reviewId: "${reviewId}", changesetId, filePath, lineNumber, side, comment }) for new findings. get_comment({ reviewId: "${reviewId}", commentId }) fetches a single comment.
  5. Finally, if the overall shape of the change has shifted, overwrite the overview: set_review_overview({ reviewId: "${reviewId}", overview }) with a comprehensive markdown summary of the change — its goals, architecture, and data flow — using mermaidjs diagrams in \`\`\`mermaid fenced code blocks. Prefer prose and diagrams over code snippets.

Review any new or changed code with the same rigor as the initial review: correctness, maintainability, readability, efficiency, security, edge cases and error handling, and testability. Comment only on lines that are part of the diff: side "new" (the default) uses new-file line numbers for added/changed lines; side "old" uses old-file line numbers for deleted lines.`;

const RedoReviewDialog = ({ reviewId, open, onOpenChange }: RedoReviewDialogProps): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const instruction = buildRedoInstruction(reviewId);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(instruction);
    setCopied(true);
    toast.success("Instruction copied to clipboard");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[680px]">
        <DialogHeader>
          <DialogTitle>Redo Review</DialogTitle>
          <DialogDescription>
            The reviewed branches have changed? Give the instruction below to an AI agent to bring
            this review up to date.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void handleCopy()}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <pre
            className={
              "max-w-[647px] overflow-auto rounded-md border border-border bg-muted/40 p-3 " +
              `font-mono text-xs leading-relaxed ${THIN_SCROLLBAR_CLASS}`
            }>
            {instruction}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RedoReviewDialog;
