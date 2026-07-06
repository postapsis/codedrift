/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { useMemo, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePenLine,
  FilePlus,
  FileSymlink,
  FileX,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { cn } from "@/lib/utils.ts";
import { useDiffViewStore } from "@/store/diff-view-store.ts";
import { useRuntimeSettingsStore } from "@/store/runtime-settings-store.ts";
import type { DiffChangeType } from "@/@types/diff.ts";
import type { ChangesetDiffFile } from "@/@types/changeset-diff.ts";
import {
  getDiffFileByDisplayPath,
  getDiffFileDisplayPath,
  getDiffFileId,
} from "@/lib/diff-utils.ts";
import { buildFileTree, getFirstTreeFile, type FileTreeItem } from "@/lib/file-tree.ts";

type FileChangeConfig = {
  Icon: LucideIcon;
  className: string;
  label: string;
};

const fileChangeConfig: Record<DiffChangeType, FileChangeConfig> = {
  changed: {
    Icon: FilePenLine,
    className: "text-amber-600",
    label: "Changed",
  },
  added: {
    Icon: FilePlus,
    className: "text-emerald-600",
    label: "Added",
  },
  moved: {
    Icon: FileSymlink,
    className: "text-blue-600",
    label: "Moved",
  },
  deleted: {
    Icon: FileX,
    className: "text-red-600",
    label: "Deleted",
  },
};

const TREE_INDENT_WIDTH = 8;
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_DEFAULT_WIDTH = 300;
const SIDEBAR_MAX_WIDTH = 1200;
const SIDEBAR_RESIZE_STEP = 16;
const SIDEBAR_COLLAPSED_WIDTH = 36;
const CHANGESET_DIFF_ROUTE = "/reviews/$reviewId/changesets/$changesetId";

type SidebarResizeState = {
  startX: number;
  startWidth: number;
};

const clampSidebarWidth = (width: number): number => {
  return Math.min(Math.max(width, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);
};

const getFileTitle = (file: ChangesetDiffFile): string => {
  if (file.changeType !== "moved") {
    return getDiffFileDisplayPath(file);
  }

  return `${file.oldFileName} -> ${file.newFileName}`;
};

const renderTreeItems = (
  items: FileTreeItem[],
  selectedFileId: string | null,
  onSelectFile: (filePath: string) => void,
  collapsedFolderIds: Set<string>,
  onToggleFolder: (folderId: string) => void,
  level = 0,
): JSX.Element[] => {
  return items.flatMap((item) => {
    if (!item.file) {
      const isCollapsed = collapsedFolderIds.has(item.id);
      const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown;

      return [
        <div key={item.id} className="relative w-full min-w-max">
          <button
            type="button"
            aria-expanded={!isCollapsed}
            className={cn(
              "relative flex h-6 w-full min-w-max items-center gap-1 rounded pr-3 text-left text-xs",
              "text-muted-foreground hover:bg-nav-active/40",
            )}
            style={{ paddingLeft: `${level * TREE_INDENT_WIDTH}px` }}
            onClick={() => onToggleFolder(item.id)}>
            <ChevronIcon className="size-3 shrink-0 text-foreground/90" strokeWidth={1.8} />
            <span className="whitespace-nowrap">{item.name}</span>
          </button>
        </div>,
        ...(!isCollapsed
          ? renderTreeItems(
              item.children,
              selectedFileId,
              onSelectFile,
              collapsedFolderIds,
              onToggleFolder,
              level + 1,
            )
          : []),
      ];
    }

    const file = item.file;
    const config = fileChangeConfig[file.changeType];
    const Icon = config.Icon;
    const isSelected = selectedFileId === item.id;

    return (
      <div key={item.id} className="relative w-full min-w-max">
        <button
          type="button"
          title={getFileTitle(file)}
          aria-label={`${config.label}: ${getFileTitle(file)}`}
          aria-pressed={isSelected}
          className={cn(
            "relative flex h-6 w-full min-w-max items-center gap-1.5 rounded px-3 text-left text-xs",
            "text-foreground hover:bg-nav-active/40",
            isSelected && "bg-nav-active/40",
          )}
          style={{ paddingLeft: `${level * TREE_INDENT_WIDTH + TREE_INDENT_WIDTH}px` }}
          onClick={() => onSelectFile(getDiffFileDisplayPath(file))}>
          <Icon strokeWidth={1.8} className={cn("size-4 shrink-0", config.className)} />
          <span className="whitespace-nowrap">{item.name}</span>
        </button>
      </div>
    );
  });
};

const FileBrowser = (): JSX.Element => {
  const diffFiles = useDiffViewStore((state) => state.diffFiles);
  const params = useParams({ from: CHANGESET_DIFF_ROUTE });
  const search = useSearch({ from: CHANGESET_DIFF_ROUTE });
  const navigate = useNavigate();

  const isCollapsed = useRuntimeSettingsStore((state) => state.isFileBrowserCollapsed);
  const setIsCollapsed = useRuntimeSettingsStore((state) => state.setIsFileBrowserCollapsed);

  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => new Set());
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const resizeStateRef = useRef<SidebarResizeState | null>(null);

  const fileTree = useMemo(() => buildFileTree(diffFiles), [diffFiles]);

  const selectedFile =
    getDiffFileByDisplayPath(diffFiles, search.file) ?? getFirstTreeFile(diffFiles);
  const selectedFileId = selectedFile ? getDiffFileId(selectedFile) : null;

  const selectFile = (filePath: string): void => {
    void navigate({
      to: CHANGESET_DIFF_ROUTE,
      params,
      search: { file: filePath },
    });
  };

  const startSidebarResize = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);

    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };
  };

  const resizeSidebar = (event: PointerEvent<HTMLDivElement>): void => {
    if (!resizeStateRef.current) {
      return;
    }

    const nextWidth =
      resizeStateRef.current.startWidth + event.clientX - resizeStateRef.current.startX;
    setSidebarWidth(clampSidebarWidth(nextWidth));
  };

  const stopSidebarResize = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resizeStateRef.current = null;
  };

  const resizeSidebarWithKeyboard = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();

      const direction = event.key === "ArrowRight" ? 1 : -1;
      setSidebarWidth((currentWidth) =>
        clampSidebarWidth(currentWidth + SIDEBAR_RESIZE_STEP * direction),
      );
    }
  };

  const toggleFolder = (folderId: string): void => {
    setCollapsedFolderIds((currentFolderIds) => {
      const nextFolderIds = new Set(currentFolderIds);

      if (nextFolderIds.has(folderId)) {
        nextFolderIds.delete(folderId);
      } else {
        nextFolderIds.add(folderId);
      }

      return nextFolderIds;
    });
  };

  if (isCollapsed) {
    return (
      <div
        className="flex flex-none flex-col items-center rounded bg-white py-3 shadow-md"
        style={{ width: SIDEBAR_COLLAPSED_WIDTH }}>
        <button
          type="button"
          aria-label="Expand file browser"
          title="Expand file browser"
          onClick={() => setIsCollapsed(false)}
          className="flex size-6 items-center justify-center rounded text-foreground hover:bg-nav-active/40">
          <PanelLeftOpen className="size-4" strokeWidth={1.8} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-none flex-col rounded bg-white px-3 py-3 shadow-md"
      style={{ width: sidebarWidth, minWidth: SIDEBAR_MIN_WIDTH, maxWidth: SIDEBAR_MAX_WIDTH }}>
      <div className="border-b border-muted pb-3 flex flex-col gap-0">
        <div className="flex items-center justify-between gap-2">
          <h6 className="font-semibold text-xs">File Browser</h6>
          <button
            type="button"
            aria-label="Collapse file browser"
            title="Collapse file browser"
            onClick={() => setIsCollapsed(true)}
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-nav-active/40 hover:text-foreground">
            <PanelLeftClose className="size-4" strokeWidth={1.8} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{diffFiles.length} changed files</p>
      </div>

      <div className={`min-h-0 flex-1 overflow-auto pt-3 ${THIN_SCROLLBAR_CLASS}`}>
        <div className="inline-flex min-w-full flex-col pb-1 pr-1">
          {renderTreeItems(fileTree, selectedFileId, selectFile, collapsedFolderIds, toggleFolder)}
        </div>
      </div>

      <div
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        aria-valuemin={SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        className="absolute bottom-0 right-0 top-0 w-2 cursor-col-resize touch-none rounded-r outline-none transition-colors hover:bg-nav-active/50 focus-visible:bg-nav-active/50"
        onKeyDown={resizeSidebarWithKeyboard}
        onPointerDown={startSidebarResize}
        onPointerMove={resizeSidebar}
        onPointerUp={stopSidebarResize}
        onPointerCancel={stopSidebarResize}
      />
    </div>
  );
};

export default FileBrowser;
