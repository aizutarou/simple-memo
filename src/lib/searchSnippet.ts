/** 検索語の前後を含む本文の抜粋（1行相当） */
export function searchSnippet(body: string, query: string, maxLen = 96): string | null {
  const q = query.trim();
  if (!q) return null;
  const flat = body.replace(/\r?\n/g, " ").trim();
  if (!flat) return null;
  const lower = flat.toLowerCase();
  const needle = q.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx === -1) return null;
  const half = Math.floor((maxLen - needle.length) / 2);
  const start = Math.max(0, idx - half);
  const end = Math.min(flat.length, idx + needle.length + half);
  let slice = flat.slice(start, end);
  if (start > 0) slice = `…${slice}`;
  if (end < flat.length) slice = `${slice}…`;
  return slice;
}
