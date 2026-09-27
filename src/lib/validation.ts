export const MAX_FOLDER_NAME = 100;
export const MAX_TITLE = 200;
export const MAX_BODY = 10_000;
export const LIST_PREVIEW = 80;

export function isBodyValid(body: string): boolean {
  return body.trim().length > 0;
}

export function memoListTitle(title: string, body: string): string {
  if (title.trim()) return title.trim();
  const line = body.trim().split(/\r?\n/)[0] ?? "";
  if (!line) return "（無題）";
  return line.length > LIST_PREVIEW ? `${line.slice(0, LIST_PREVIEW)}…` : line;
}
