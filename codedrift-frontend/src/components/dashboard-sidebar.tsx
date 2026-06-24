/*
 * Author: Jamius Siam
 * Since: 24/06/2026
 */
import type { JSX } from "react";
import { Link } from "@tanstack/react-router";
import { FolderGit2, GitPullRequestArrow, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
};

const navItems: NavItem[] = [
  { to: "/dashboard/repositories", label: "Repositories", Icon: FolderGit2 },
  { to: "/dashboard/reviews", label: "Reviews", Icon: GitPullRequestArrow },
];

const DashboardSidebar = (): JSX.Element => {
  return (
    <div className="flex flex-none flex-col rounded px-2 py-2 w-[200px]">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "px-3 py-1 flex items-center gap-2 rounded text-xs",
              "text-foreground/70 hover:bg-nav-active/60",
            )}
            activeProps={{ className: "bg-nav-active/60 text-foreground/90!" }}>
            <Icon className="shrink-0" size={14} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default DashboardSidebar;
