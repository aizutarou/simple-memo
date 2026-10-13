import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getOverlayContainer, lockBodyScroll, unlockBodyScroll } from "../lib/scrollLock";

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ModalPage({ title, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
        (node) => node.offsetParent !== null,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus({ preventScroll: true });
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
      previousFocus?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-page" role="dialog" aria-modal="true" aria-labelledby="modal-page-title">
      <button type="button" className="modal-page-scrim" aria-label="閉じる" onClick={onClose} />
      <div ref={panelRef} className="modal-page-panel">
        <header className="modal-page-header">
          <h1 id="modal-page-title" className="modal-page-title">
            {title}
          </h1>
          <button type="button" className="icon-btn modal-page-close" aria-label="閉じる" onClick={onClose}>
            <X size={22} strokeWidth={2} />
          </button>
        </header>
        <div className="modal-page-body">{children}</div>
      </div>
    </div>,
    getOverlayContainer(),
  );
}
