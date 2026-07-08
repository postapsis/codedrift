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
  `You are preparing a code review using the "codedrift-changeset" MCP server.

Review id: ${reviewId}

# Rules for creating the changesets

Do the following, in order:
  1. Call get_review_info({ reviewId: "${reviewId}" }) to get this review's repositories — each with its absolute filesystem path and base/head refs.
  2. For each repository, diff its base ref against its head ref and read the changed files so you understand the full set of changes. When the refs are branch names, use triple-dot notation (base...head) so the diff is taken against their merge-base. When the refs are commit SHAs, make both endpoints inclusive by diffing from the base's parent (base^..head) so the base commit's own changes are included.
  3. FIRST, create the review overview: call set_review_overview({ reviewId: "${reviewId}", overview }) with a comprehensive markdown summary of what this change is trying to do — its goals, the architecture, and how data flows through the changed code. Illustrate flows and structure with mermaidjs diagrams in \`\`\`mermaid fenced code blocks. Do not fill the overview with code: use code snippets very briefly and only when they genuinely clarify something — prefer prose and diagrams.
  4. THEN group the changed files into changesets. A changeset is a cohesive, self-contained unit of related change (one feature, refactor, fix, or concern). Give each a clear name and a description in markdown of what it groups and why. Do not repeat the changeset name in its description, and do not include ordering numbers in either the name or description — ordering is handled separately by the \`order\` param. Every changed file belongs to exactly one changeset.
  5. Order the changesets to make human review as easy as possible: foundational, low-level changes first (types, schema, shared utilities), then the code that builds on them, then call sites / UI / wiring, and incidental changes (renames, formatting, config) last — so a reviewer reads them in a logical, dependency-respecting sequence.
  6. Submit them in that order: for each changeset call add_changeset({ reviewId: "${reviewId}", name, description, order, files }). \`order\` is the changeset's 1-based position in that reading order (lower = read earlier). Each entry in files must have:
    - \`filePath\`: the ABSOLUTE path of the changed file (it must be inside one of the review's repositories),
    - \`summary\`: a concise summary of what changed in that file and why (1-3 sentences),
    - \`comments\` (optional): line-anchored review comments where you have something worth pointing out (potential bugs, risky patterns, notable decisions). Each comment has a 1-based lineNumber, the comment markdown, and a side: use "new" (the default) with new-file line numbers for added/changed lines, and "old" with old-file line numbers for deleted lines. Only comment on lines that are part of the diff. See the "Rules for reviewing the changesets" section for reviewing rules.
  
A file may belong to only one changeset; call get_changesets_details({ reviewId: "${reviewId}" }) to see the files already grouped.

# Rules for reviewing the changesets
### In-Depth Analysis

  - Analyze the code changes based on the following pillars:
  - Correctness: Does the code achieve its stated purpose without bugs or logical errors?
  - Maintainability: Is the code clean, well-structured, and easy to understand and modify in the future? Consider factors like code clarity, modularity, and adherence to established design patterns.
  - Readability: Is the code well-commented (where necessary) and consistently formatted according to our project's coding style guidelines?
  - Efficiency: Are there any obvious performance bottlenecks or resource inefficiencies introduced by the changes?
  - Security: Are there any potential security vulnerabilities or insecure coding practices?
  - Edge Cases and Error Handling: Does the code appropriately handle edge cases and potential errors?
  - Testability: Is the new or modified code adequately covered by tests (even if preflight checks pass)? Suggest additional test cases that would improve coverage or robustness.

## Provide Feedback
### Structure
  - Summary: A high-level overview of the review.
  - Findings:
    1. Critical: Bugs, security issues, or breaking changes.
    2. Improvements: Suggestions for better code quality or performance.
    3. Nitpicks: Formatting or minor style issues (optional).
  - Conclusion: Clear recommendation (Approved / Request Changes).
### Tone
  - Be constructive, professional, and friendly.
  - Explain why a change is requested.
For approvals, acknowledge the specific value of the contribution.`;

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
          `font-mono text-xs leading-relaxed  ${THIN_SCROLLBAR_CLASS}`
        }>
        {instruction}
      </pre>
    </div>
  );
};

export default ReviewSetup;
