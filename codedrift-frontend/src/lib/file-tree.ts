/*
 * Author: Jamius Siam
 * Since: 07/07/2026
 */
import type { ChangesetDiffFile } from "@/@types/changeset-diff.ts";
import { getDiffFileDisplayPath, getDiffFileId } from "@/lib/diff-utils.ts";

export type FileTreeItem = {
  id: string;
  name: string;
  path: string;
  children: FileTreeItem[];
  file?: ChangesetDiffFile;
};

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

const collapseSingleChildFolders = (item: FileTreeItem): FileTreeItem => {
  const children = item.children.map(collapseSingleChildFolders);
  let node: FileTreeItem = { ...item, children };

  while (!node.file && node.children.length === 1 && !node.children[0].file) {
    const [child] = node.children;
    node = {
      ...node,
      name: `${node.name}/${child.name}`,
      path: child.path,
      id: child.id,
      children: child.children,
    };
  }

  return node;
};

export const buildFileTree = (diffFiles: ChangesetDiffFile[]): FileTreeItem[] => {
  const root: FileTreeItem = createTreeItem("~", "~", "");

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

  root.children = sortFileTree(root.children.map(collapseSingleChildFolders));

  return [root];
};

const findFirstFile = (items: FileTreeItem[]): ChangesetDiffFile | null => {
  for (const item of items) {
    if (item.file) {
      return item.file;
    }

    const childFile = findFirstFile(item.children);

    if (childFile) {
      return childFile;
    }
  }

  return null;
};

// The first file as displayed in the file browser (pre-order DFS over the sorted tree).
export const getFirstTreeFile = (diffFiles: ChangesetDiffFile[]): ChangesetDiffFile | null => {
  return findFirstFile(buildFileTree(diffFiles));
};

const collectFiles = (items: FileTreeItem[], files: ChangesetDiffFile[]): void => {
  for (const item of items) {
    if (item.file) {
      files.push(item.file);
    }

    collectFiles(item.children, files);
  }
};

// All files in the order the file browser renders them (pre-order DFS over the sorted tree).
export const getTreeFilesInOrder = (diffFiles: ChangesetDiffFile[]): ChangesetDiffFile[] => {
  const files: ChangesetDiffFile[] = [];
  collectFiles(buildFileTree(diffFiles), files);

  return files;
};
