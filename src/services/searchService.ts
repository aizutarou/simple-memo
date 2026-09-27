import { folderRepository } from "../repositories/folderRepository";
import { memoRepository, type MemoSearchHit } from "../repositories/memoRepository";
import type { Folder } from "../types";

export type FolderSearchHit = Folder & {
  memoCount: number;
  lastMemoUpdatedAt: string | null;
};

export type SearchResults = {
  folders: FolderSearchHit[];
  memos: MemoSearchHit[];
};

export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { folders: [], memos: [] };

  const needle = q.toLowerCase();
  const [allFolders, memos] = await Promise.all([
    folderRepository.listActive(),
    memoRepository.searchActive(q),
  ]);

  const matchedFolders = allFolders.filter((f) => f.name.toLowerCase().includes(needle));
  const folders = await Promise.all(
    matchedFolders.map(async (folder) => ({
      ...folder,
      ...(await memoRepository.getActiveStatsByFolder(folder.id)),
    })),
  );

  folders.sort((a, b) => a.name.localeCompare(b.name, "ja"));

  return { folders, memos };
}
