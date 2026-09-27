declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** 画面の種類だけ送る。メモIDや題名は含めない。 */
export function analyticsPagePath(pathname: string): string {
  if (pathname === "/memos/new") return pathname;
  if (pathname.startsWith("/memos/")) return "/memos/:id";
  if (pathname.startsWith("/folders/")) return "/folders/:id";
  return pathname;
}

export function trackPageView(pathname: string): void {
  const pagePath = analyticsPagePath(pathname);
  window.gtag?.("event", "page_view", {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: document.title,
  });
}
