/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import type { JSX } from "react";
import { Link } from "@tanstack/react-router";
import { FileDiff } from "lucide-react";
import type { Changeset } from "@/@types/changeset.ts";

interface ChangesetListProps {
  reviewId: string;
  changesets: Changeset[];
}

const ChangesetList = ({ reviewId, changesets }: ChangesetListProps): JSX.Element => {
  return (
    <div className="flex flex-col gap-3">
      {changesets.map((changeset) => (
        <Link
          key={changeset.id}
          to="/reviews/$reviewId/changesets/$changesetId"
          params={{ reviewId, changesetId: changeset.id }}
          className={
            "flex flex-col gap-1 rounded-md border border-border p-3 " +
            "transition-colors hover:border-foreground/30 hover:bg-nav-active/20"
          }>
          <span className="text-sm font-semibold text-foreground">{changeset.name}</span>
          <span className="line-clamp-3 text-xs text-muted-foreground">
            {changeset.description}
          </span>
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <FileDiff size={12} />
            {changeset.files.length} {changeset.files.length === 1 ? "file" : "files"}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default ChangesetList;
