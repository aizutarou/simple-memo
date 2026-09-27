const KEY = "simple-memo:lastFolderId";

export function getLastFolderId(): string | null {
  return localStorage.getItem(KEY);
}

export function setLastFolderId(folderId: string): void {
  localStorage.setItem(KEY, folderId);
}
