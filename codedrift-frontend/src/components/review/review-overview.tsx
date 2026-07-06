/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import type { JSX } from "react";
import MarkdownContent from "@/components/markdown-content.tsx";

interface ReviewOverviewProps {
  overview: string | null;
}

const ReviewOverview = ({ overview }: ReviewOverviewProps): JSX.Element => {
  if (!overview) {
    return (
      <p className="text-sm text-muted-foreground">
        This review has no overview yet. Run the setup instruction&apos;s overview step with an AI
        agent to create one.
      </p>
    );
  }

  return <MarkdownContent markdown={overview} prose className="prose-sm" />;
};

export default ReviewOverview;
