/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import { type JSX, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";

interface ReviewSetupProps {
  reviewId: string;
}

const buildInstruction = (reviewId: string): string =>
  `You are preparing changesets from git diff(s) for a human code review using the "codedrift-changeset" MCP server.

Review id: ${reviewId}

Do the following:
1. Call get_review_info({ reviewId: "${reviewId}" }) to get this review's repositories — each with its filesystem path and base/head refs.
2. For each repository, diff its base ref against its head ref and read the changed files so you understand the full set of changes.
3. Group the changed files into changesets. A changeset is a cohesive, self-contained unit of related change (one feature, refactor, fix, or concern). Give each a clear name and a description of what it groups and why. Every changed file belongs to exactly one changeset.
4. Order the changesets to make human review as easy as possible: foundational, low-level changes first (types, schema, shared utilities), then the code that builds on them, then call sites / UI / wiring, and incidental changes (renames, formatting, config) last — so a reviewer reads them in a logical, dependency-respecting sequence.
5. Submit them in that order: for each changeset call add_changeset({ reviewId: "${reviewId}", name, description, filesPaths }), where filesPaths are repository-relative. A file may belong to only one changeset; call get_changeset_files({ reviewId: "${reviewId}" }) to see what's already been grouped.`;

const ReviewSetup = ({ reviewId }: ReviewSetupProps): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const instruction = buildInstruction(reviewId);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(instruction);
    setCopied(true);
    toast.success("Instruction copied to clipboard");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          This review has no changesets yet. Give the instruction below to an AI agent to populate
          it.
        </p>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => void handleCopy()}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <pre
        className={
          "max-h-[60vh] overflow-auto rounded-md border border-border bg-muted/40 p-3 " +
          `font-mono text-xs leading-relaxed whitespace-pre-wrap ${THIN_SCROLLBAR_CLASS}`
        }>
        {instruction}
      </pre>
    </div>
  );
};

export default ReviewSetup;
