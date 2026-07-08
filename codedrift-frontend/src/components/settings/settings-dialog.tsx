/*
 * Author: Jamius Siam
 * Since: 06/07/2026
 */
import type { JSX } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import DiffModeToggle from "@/components/settings/diff-mode-toggle.tsx";
import { cn } from "@/lib/utils.ts";
import { useSettingsStore } from "@/store/settings-store.ts";

const CODE_FONT_SIZE_MIN = 10;
const CODE_FONT_SIZE_MAX = 20;

const SettingsDialog = (): JSX.Element => {
  const codeFontSize = useSettingsStore((state) => state.codeFontSize);
  const setCodeFontSize = useSettingsStore((state) => state.setCodeFontSize);
  const diffMode = useSettingsStore((state) => state.diffMode);
  const setDiffMode = useSettingsStore((state) => state.setDiffMode);
  const copyPathWithRepoName = useSettingsStore((state) => state.copyPathWithRepoName);
  const setCopyPathWithRepoName = useSettingsStore((state) => state.setCopyPathWithRepoName);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings" className="size-6">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <h3 className="font-medium">Diff Viewer Settings</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Code font size</span>
                <span className="text-xs text-muted-foreground">{codeFontSize}px</span>
              </div>
              <Slider
                min={CODE_FONT_SIZE_MIN}
                max={CODE_FONT_SIZE_MAX}
                step={1}
                value={[codeFontSize]}
                onValueChange={(values) => setCodeFontSize(values[0])}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">Diff style</span>
              <DiffModeToggle value={diffMode} onChange={setDiffMode} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">
                Should the Copied file path include the repository name?
              </span>
              <div className="inline-flex w-fit items-center gap-0.5 rounded-md border border-border">
                {[
                  { withRepo: true, label: "Yes" },
                  { withRepo: false, label: "No" },
                ].map(({ withRepo, label }) => {
                  const isActive = copyPathWithRepoName === withRepo;

                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={isActive}
                      title={label}
                      onClick={() => setCopyPathWithRepoName(withRepo)}
                      className={cn(
                        "rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
                        isActive && "bg-nav-active/40 text-foreground",
                      )}>
                      <span className="whitespace-nowrap">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
