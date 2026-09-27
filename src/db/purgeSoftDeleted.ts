import { db } from "./database";

/** 旧データ互換: ソフトデリート済みレコードを物理削除する */
export async function purgeSoftDeleted(): Promise<void> {
  const folders = await db.folders.filter((f) => !!f.deletedAt).toArray();
  const memos = await db.memos.filter((m) => !!m.deletedAt).toArray();
  if (folders.length === 0 && memos.length === 0) return;
  await db.transaction("rw", db.folders, db.memos, async () => {
    for (const f of folders) await db.folders.delete(f.id);
    for (const m of memos) await db.memos.delete(m.id);
  });
}
