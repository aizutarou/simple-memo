import Dexie, { type EntityTable } from "dexie";
import type { Folder, Memo } from "../types";

/** 旧仕様の未分類フォルダ ID（マイグレーション用） */
const LEGACY_DEFAULT_FOLDER_ID = "folder-uncategorized";

export const INBOX_FOLDER_ID = "folder-inbox";
export const INBOX_FOLDER_NAME = "あとで振り分け";

class SimpleMemoDb extends Dexie {
  folders!: EntityTable<Folder, "id">;
  memos!: EntityTable<Memo, "id">;

  constructor() {
    super("SimpleMemoDb");
    this.version(1).stores({
      folders: "id, deletedAt, updatedAt",
      memos: "id, folderId, deletedAt, createdAt",
    });
  }
}

export const db = new SimpleMemoDb();

export function isInboxFolder(folder: Folder): boolean {
  return folder.id === INBOX_FOLDER_ID || folder.isDefault === true;
}

/** サクッと書いて後から振り分ける用の固定フォルダを保証する */
export async function ensureInboxFolder(): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.folders.get(INBOX_FOLDER_ID);

  if (!existing || existing.deletedAt) {
    await db.folders.put({
      id: INBOX_FOLDER_ID,
      name: INBOX_FOLDER_NAME,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      isDefault: true,
    });
  } else if (existing.name !== INBOX_FOLDER_NAME) {
    await db.folders.update(INBOX_FOLDER_ID, {
      name: INBOX_FOLDER_NAME,
      isDefault: true,
      updatedAt: now,
    });
  }

  const legacy = await db.folders.get(LEGACY_DEFAULT_FOLDER_ID);
  if (legacy && !legacy.deletedAt) {
    const legacyMemos = await db.memos
      .where("folderId")
      .equals(LEGACY_DEFAULT_FOLDER_ID)
      .filter((m) => !m.deletedAt)
      .toArray();
    for (const memo of legacyMemos) {
      await db.memos.update(memo.id, { folderId: INBOX_FOLDER_ID, updatedAt: now });
    }
    await db.folders.delete(LEGACY_DEFAULT_FOLDER_ID);
  }

  const activeMemos = await db.memos.filter((m) => !m.deletedAt).toArray();
  for (const memo of activeMemos) {
    const folder = await db.folders.get(memo.folderId);
    if (!folder || folder.deletedAt) {
      await db.memos.update(memo.id, { folderId: INBOX_FOLDER_ID, updatedAt: now });
    }
  }
}
