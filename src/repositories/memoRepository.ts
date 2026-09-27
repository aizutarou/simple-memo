import { db } from "../db/database";
import { folderRepository } from "./folderRepository";
import { newId } from "../lib/id";
import type { Memo } from "../types";

export type MemoSearchHit = {
  memo: Memo;
  folderName: string;
};
import { isBodyValid } from "../lib/validation";

export interface MemoRepository {
  listByFolder(folderId: string): Promise<Memo[]>;
  getActive(id: string): Promise<Memo | undefined>;
  create(folderId: string, title: string, body: string): Promise<Memo>;
  update(
    id: string,
    patch: { title?: string; body?: string; folderId?: string },
  ): Promise<void>;
  delete(id: string): Promise<void>;
  countActiveByFolder(folderId: string): Promise<number>;
  getActiveStatsByFolder(
    folderId: string,
  ): Promise<{ memoCount: number; lastMemoUpdatedAt: string | null }>;
  searchActive(query: string): Promise<MemoSearchHit[]>;
}

export const memoRepository: MemoRepository = {
  async listByFolder(folderId) {
    const memos = await db.memos
      .where("folderId")
      .equals(folderId)
      .filter((m) => !m.deletedAt)
      .toArray();
    return memos.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getActive(id) {
    const memo = await db.memos.get(id);
    if (!memo || memo.deletedAt) return undefined;
    return memo;
  },

  async create(folderId, title, body) {
    const folder = await folderRepository.getActive(folderId);
    if (!folder) throw new Error("フォルダを選択してください");
    if (!isBodyValid(body)) throw new Error("本文を入力してください");
    const now = new Date().toISOString();
    const memo: Memo = {
      id: newId(),
      folderId,
      title: title.slice(0, 200),
      body: body.slice(0, 10_000),
      createdAt: now,
      updatedAt: now,
    };
    await db.memos.add(memo);
    return memo;
  },

  async update(id, patch) {
    const memo = await db.memos.get(id);
    if (!memo || memo.deletedAt) throw new Error("メモが見つかりません");
    const nextBody = patch.body !== undefined ? patch.body : memo.body;
    if (!isBodyValid(nextBody)) throw new Error("本文を入力してください");
    if (patch.folderId !== undefined) {
      const folder = await folderRepository.getActive(patch.folderId);
      if (!folder) throw new Error("フォルダを選択してください");
    }
    const now = new Date().toISOString();
    await db.memos.update(id, {
      ...(patch.title !== undefined && { title: patch.title.slice(0, 200) }),
      ...(patch.body !== undefined && { body: patch.body.slice(0, 10_000) }),
      ...(patch.folderId !== undefined && { folderId: patch.folderId }),
      updatedAt: now,
    });
  },

  async delete(id) {
    const memo = await db.memos.get(id);
    if (!memo || memo.deletedAt) throw new Error("メモが見つかりません");
    await db.memos.delete(id);
  },

  async countActiveByFolder(folderId) {
    const { memoCount } = await this.getActiveStatsByFolder(folderId);
    return memoCount;
  },

  async getActiveStatsByFolder(folderId) {
    const memos = await db.memos
      .where("folderId")
      .equals(folderId)
      .filter((m) => !m.deletedAt)
      .toArray();
    if (memos.length === 0) {
      return { memoCount: 0, lastMemoUpdatedAt: null };
    }
    let lastMemoUpdatedAt = memos[0].updatedAt;
    for (const m of memos) {
      if (new Date(m.updatedAt).getTime() > new Date(lastMemoUpdatedAt).getTime()) {
        lastMemoUpdatedAt = m.updatedAt;
      }
    }
    return { memoCount: memos.length, lastMemoUpdatedAt };
  },

  async searchActive(query) {
    const q = query.trim();
    if (!q) return [];
    const needle = q.toLowerCase();
    const folders = await folderRepository.listActive();
    const folderNameById = new Map(folders.map((f) => [f.id, f.name]));
    const memos = await db.memos.filter((m) => !m.deletedAt).toArray();
    return memos
      .filter(
        (m) =>
          m.title.toLowerCase().includes(needle) || m.body.toLowerCase().includes(needle),
      )
      .filter((m) => folderNameById.has(m.folderId))
      .map((memo) => ({
        memo,
        folderName: folderNameById.get(memo.folderId)!,
      }))
      .sort(
        (a, b) =>
          new Date(b.memo.updatedAt).getTime() - new Date(a.memo.updatedAt).getTime(),
      );
  },
};
