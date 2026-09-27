/** 新規メモの初期タイトル（例: 20260927作業メモ） */
export function defaultNewMemoTitle(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}作業メモ`;
}

export function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFolderMemoMeta(memoCount: number, lastMemoUpdatedAt: string | null): string {
  if (memoCount === 0) return "メモなし";
  const when = lastMemoUpdatedAt ? formatCreatedAt(lastMemoUpdatedAt) : "—";
  return `${memoCount} 件 · 最終更新 ${when}`;
}
