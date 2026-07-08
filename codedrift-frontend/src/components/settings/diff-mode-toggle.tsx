/*
 * Author: Jamius Siam
 * Since: 06/07/2026
 */
import type { JSX } from "react";
import { Columns2, type LucideIcon, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { DiffMode } from "@/@types/settings.ts";

type DiffModeToggleProps = {
  value: DiffMode;
  onChange: (mode: DiffMode) => void;
};

const diffModeOptions: {
  mode: DiffMode;
  label: string;
  Icon: LucideIcon;
}[] = [
  { mode: "unified", label: "Unified", Icon: Rows3 },
  { mode: "split", label: "Side by side", Icon: Columns2 },
];

const DiffModeToggle = ({ value, onChange }: DiffModeToggleProps): JSX.Element => {
  return (
    <div>
      <div className="inline-flex items-center gap-0.5 rounded-md border border-border">
        {diffModeOptions.map(({ mode, label, Icon }) => {
          const isActive = value === mode;

          return (
            <button
              key={mode}
              type="button"
              aria-pressed={isActive}
              title={label}
              onClick={() => onChange(mode)}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
                isActive && "bg-nav-active/40 text-foreground",
              )}>
              <Icon size={12} strokeWidth={1.8} className={cn("shrink-0 relative bottom-px")} />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DiffModeToggle;
