import { db, ensureInboxFolder, INBOX_FOLDER_NAME, isInboxFolder } from "../db/database";
import { newId } from "../lib/id";
import type { Folder } from "../types";

export interface FolderRepository {
  listActive(): Promise<Folder[]>;
  getActive(id: string): Promise<Folder | undefined>;
  create(name: string): Promise<Folder>;
  rename(id: string, name: string): Promise<void>;
  deleteWithMemos(id: string): Promise<{ memoCount: number }>;
}

export { isInboxFolder };

export const folderRepository: FolderRepository = {
  async listActive() {
    await ensureInboxFolder();
    const folders = await db.folders.filter((f) => !f.deletedAt).toArray();
    return folders.sort((a, b) => {
      if (isInboxFolder(a)) return -1;
      if (isInboxFolder(b)) return 1;
      return a.name.localeCompare(b.name, "ja");
    });
  },

  async getActive(id) {
    await ensureInboxFolder();
    const f = await db.folders.get(id);
    if (!f || f.deletedAt) return undefined;
    return f;
  },

  async create(name) {
    await ensureInboxFolder();
    const trimmed = name.trim();
    if (!trimmed) throw new Error("フォルダ名を入力してください");
    if (trimmed === INBOX_FOLDER_NAME) {
      throw new Error(`「${INBOX_FOLDER_NAME}」と同じ名前は使えません`);
    }
    const now = new Date().toISOString();
    const folder: Folder = {
      id: newId(),
      name: trimmed.slice(0, 100),
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(folder);
    return folder;
  },

  async rename(id, name) {
    const folder = await db.folders.get(id);
    if (!folder || folder.deletedAt) throw new Error("フォルダが見つかりません");
    if (isInboxFolder(folder)) {
      throw new Error("このフォルダの名前は変更できません");
    }
    const trimmed = name.trim();
    if (!trimmed) throw new Error("フォルダ名を入力してください");
    await db.folders.update(id, {
      name: trimmed.slice(0, 100),
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteWithMemos(id) {
    const folder = await db.folders.get(id);
    if (!folder || folder.deletedAt) throw new Error("フォルダが見つかりません");
    if (isInboxFolder(folder)) {
      throw new Error("このフォルダは削除できません");
    }
    const memos = await db.memos
      .where("folderId")
      .equals(id)
      .filter((m) => !m.deletedAt)
      .toArray();
    await db.transaction("rw", db.folders, db.memos, async () => {
      await db.folders.delete(id);
      for (const memo of memos) {
        await db.memos.delete(memo.id);
      }
    });
    return { memoCount: memos.length };
  },
};
