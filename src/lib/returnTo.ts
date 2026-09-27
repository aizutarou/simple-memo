/** 同一オリジン内の相対パスのみ（オープンリダイレクト防止） */
export function parseReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function returnToQuery(returnTo: string | null): string {
  if (!returnTo) return "";
  return `?returnTo=${encodeURIComponent(returnTo)}`;
}
