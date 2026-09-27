import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getOverlayContainer, lockBodyScroll, unlockBodyScroll } from "../lib/scrollLock";

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function ModalPage({ title, onClose, children }: Props) {
  useEffect(() => {
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-page" role="dialog" aria-modal="true" aria-labelledby="modal-page-title">
      <button type="button" className="modal-page-scrim" aria-label="閉じる" onClick={onClose} />
      <div className="modal-page-panel">
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
