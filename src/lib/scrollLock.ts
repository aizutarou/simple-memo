const LOCK_CLASS = "scroll-lock";

function clearLegacyBodyFixed(): void {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.style.overflow = "";
}

/** モーダル / ボトムシート表示中に背景スクロールを止める（body fixed は使わない — iOS で fixed シートがずれる） */
let lockCount = 0;

export function lockBodyScroll(): void {
  if (lockCount === 0) {
    clearLegacyBodyFixed();
    document.documentElement.classList.add(LOCK_CLASS);
  }
  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (lockCount <= 0) {
    lockCount = 0;
    document.documentElement.classList.remove(LOCK_CLASS);
    clearLegacyBodyFixed();
    return;
  }
  lockCount -= 1;
  if (lockCount > 0) return;
  document.documentElement.classList.remove(LOCK_CLASS);
  clearLegacyBodyFixed();
}

/** 起動時など異常状態の復旧 */
export function resetBodyScrollLock(): void {
  lockCount = 0;
  document.documentElement.classList.remove(LOCK_CLASS);
  clearLegacyBodyFixed();
}

export function getOverlayContainer(): HTMLElement {
  return document.getElementById("overlay-root") ?? document.body;
}
