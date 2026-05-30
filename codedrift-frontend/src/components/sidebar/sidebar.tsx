/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { useMemo, useState, type JSX } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePenLine,
  FilePlus,
  FileSymlink,
  FileX,
  Folder,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { cn } from "@/lib/utils.ts";
import {
  getDiffFileDisplayPath,
  getDiffFileId,
  useDiffViewContext,
} from "../../lib/diff-view-context.ts";
import type { DiffChangeType, DiffFileData } from "@/@types/diff.ts";

type FileTreeItem = {
  id: string;
  name: string;
  path: string;
  children: FileTreeItem[];
  file?: DiffFileData;
};

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

const TREE_INDENT_WIDTH = 16;

const createTreeItem = (id: string, name: string, path: string): FileTreeItem => ({
  id,
  name,
  path,
  children: [],
});

const sortFileTree = (items: FileTreeItem[]): FileTreeItem[] => {
  return items
    .map((item) => ({
      ...item,
      children: sortFileTree(item.children),
    }))
    .sort((firstItem, secondItem) => {
      if (!firstItem.file && secondItem.file) {
        return -1;
      }

      if (firstItem.file && !secondItem.file) {
        return 1;
      }

      return firstItem.name.localeCompare(secondItem.name);
    });
};

const buildFileTree = (diffFiles: DiffFileData[]): FileTreeItem[] => {
  const root: FileTreeItem = createTreeItem("repository-root", "repository-root", "");

  for (const file of diffFiles) {
    const displayPath = getDiffFileDisplayPath(file);
    const pathSegments = displayPath.split("/").filter(Boolean);
    let currentItem = root;

    pathSegments.forEach((segment, index) => {
      const path = pathSegments.slice(0, index + 1).join("/");
      const isFile = index === pathSegments.length - 1;
      let child = currentItem.children.find((item) => item.name === segment);

      if (!child) {
        child = createTreeItem(path, segment, path);
        currentItem.children.push(child);
      }

      if (isFile) {
        child.id = getDiffFileId(file);
        child.file = file;
      }

      currentItem = child;
    });
  }

  root.children = sortFileTree(root.children);

  return [root];
};

const getFileTitle = (file: DiffFileData): string => {
  if (file.changeType !== "moved") {
    return getDiffFileDisplayPath(file);
  }

  return `${file.oldFileName} -> ${file.newFileName}`;
};

const renderTreeItems = (
  items: FileTreeItem[],
  selectedFileId: string | null,
  onSelectFile: (fileId: string) => void,
  collapsedFolderIds: Set<string>,
  onToggleFolder: (folderId: string) => void,
  level = 0,
): JSX.Element[] => {
  return items.flatMap((item) => {
    const indentLines = Array.from({ length: level }, (_, index) => (
      <span
        key={`${item.id}-line-${index}`}
        className="absolute bottom-0 top-0 w-px bg-border"
        style={{ left: `${index * TREE_INDENT_WIDTH + TREE_INDENT_WIDTH / 2}px` }}
      />
    ));

    if (!item.file) {
      const isCollapsed = collapsedFolderIds.has(item.id);
      const FolderIcon = isCollapsed ? Folder : FolderOpen;
      const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown;

      return [
        <div key={item.id} className="relative w-full min-w-max">
          {indentLines}
          <button
            type="button"
            aria-expanded={!isCollapsed}
            className={cn(
              "relative flex h-7 w-full min-w-max items-center gap-1 rounded pr-3 text-left text-xs",
              "text-muted-foreground hover:bg-nav-active/40",
            )}
            style={{ paddingLeft: `${level * TREE_INDENT_WIDTH}px` }}
            onClick={() => onToggleFolder(item.id)}>
            <ChevronIcon className="size-3 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <FolderIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
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

    const config = fileChangeConfig[item.file.changeType];
    const Icon = config.Icon;
    const isSelected = selectedFileId === item.id;

    return (
      <div key={item.id} className="relative w-full min-w-max">
        {indentLines}
        <button
          type="button"
          title={getFileTitle(item.file)}
          aria-label={`${config.label}: ${getFileTitle(item.file)}`}
          aria-pressed={isSelected}
          className={cn(
            "relative flex h-7 w-full min-w-max items-center gap-1.5 rounded px-3 text-left text-xs",
            "text-foreground hover:bg-nav-active/40",
            isSelected && "bg-nav-active/40",
          )}
          style={{ paddingLeft: `${level * TREE_INDENT_WIDTH + TREE_INDENT_WIDTH}px` }}
          onClick={() => onSelectFile(item.id)}>
          <Icon strokeWidth={1.8} className={cn("size-4 shrink-0", config.className)} />
          <span className="whitespace-nowrap">{item.name}</span>
        </button>
      </div>
    );
  });
};

const Sidebar = (): JSX.Element => {
  const { diffFiles, selectedFileId, setSelectedFileId, isLoading, errorMessage } =
    useDiffViewContext();

  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => new Set());

  const fileTree = useMemo(() => buildFileTree(diffFiles), [diffFiles]);

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

  return (
    <div className="flex min-w-[300px] max-w-[300px] flex-col rounded bg-white px-4 pb-3 pt-4 shadow-md">
      <div className="border-b border-border pb-3">
        <h1 className="font-heading text-lg font-semibold">Changeset</h1>
        <p className="text-xs text-muted-foreground">{diffFiles.length} changed files</p>
      </div>

      <div className={`min-h-0 flex-1 overflow-auto pt-3 ${THIN_SCROLLBAR_CLASS}`}>
        {isLoading && <div className="text-xs text-muted-foreground">Loading diff...</div>}

        {errorMessage && <div className="text-xs text-destructive">{errorMessage}</div>}

        {!errorMessage && (
          <div className="inline-flex min-w-full flex-col pb-1 pr-1">
            {renderTreeItems(
              fileTree,
              selectedFileId,
              setSelectedFileId,
              collapsedFolderIds,
              toggleFolder,
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
