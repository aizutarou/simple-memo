import { useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getOverlayContainer, lockBodyScroll, unlockBodyScroll } from "../lib/scrollLock";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** 開いたときから最大の高さを確保し、中だけスクロールする */
  fill?: boolean;
};

const FOCUS_DELAY_MS = 320;
const DRAG_START_PX = 6;

type ViewportFrame = {
  top: string;
  left: string;
  width: string;
  height: string;
};

function readViewportFrame(): ViewportFrame | null {
  const vv = window.visualViewport;
  if (!vv) return null;
  return {
    top: `${vv.offsetTop}px`,
    left: `${vv.offsetLeft}px`,
    width: `${vv.width}px`,
    height: `${vv.height}px`,
  };
}

function applyViewportFrame(el: HTMLElement): void {
  const frame = readViewportFrame();
  if (!frame) return;
  if (
    el.style.top === frame.top &&
    el.style.left === frame.left &&
    el.style.width === frame.width &&
    el.style.height === frame.height
  ) {
    return;
  }
  el.style.top = frame.top;
  el.style.left = frame.left;
  el.style.width = frame.width;
  el.style.height = frame.height;
}

function clearSheetViewportStyles(el: HTMLElement): void {
  el.style.top = "";
  el.style.left = "";
  el.style.width = "";
  el.style.height = "";
  el.classList.remove("is-settled");
}

type DragState = {
  pointerId: number;
  startY: number;
  dy: number;
};

export function BottomSheet({ open, title, onClose, children, footer, fill = false }: Props) {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  onCloseRef.current = onClose;

  const onGrabPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onGrabPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel || drag.pointerId !== event.pointerId) return;
    const dy = Math.max(0, event.clientY - drag.startY);
    drag.dy = dy;
    if (dy < DRAG_START_PX) return;
    panel.classList.remove("is-settling");
    panel.classList.add("is-dragging");
    panel.style.transform = `translateY(${dy}px)`;
  };

  const onGrabPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.dy < DRAG_START_PX) {
      panel.classList.remove("is-dragging");
      panel.style.transform = "";
      return;
    }

    const threshold = Math.max(64, Math.min(120, panel.offsetHeight * 0.22));
    panel.classList.remove("is-dragging");
    if (drag.dy >= threshold) {
      panel.classList.add("is-dismissing");
      window.requestAnimationFrame(() => {
        panel.style.transform = "translateY(110%)";
      });
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        onCloseRef.current();
      };
      const timer = window.setTimeout(close, 260);
      panel.addEventListener(
        "transitionend",
        (transitionEvent) => {
          if (transitionEvent.propertyName !== "transform") return;
          window.clearTimeout(timer);
          close();
        },
        { once: true },
      );
      return;
    }

    panel.classList.add("is-settling");
    window.requestAnimationFrame(() => {
      panel.style.transform = "translateY(0)";
    });
    panel.addEventListener(
      "transitionend",
      (transitionEvent) => {
        if (transitionEvent.propertyName !== "transform") return;
        panel.classList.remove("is-settling");
        panel.style.transform = "";
      },
      { once: true },
    );
  };

  useLayoutEffect(() => {
    if (!open) return;

    lockBodyScroll();

    const el = rootRef.current;
    if (el) applyViewportFrame(el);

    let frame = 0;
    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (el) applyViewportFrame(el);
      });
    };

    const settleId = window.requestAnimationFrame(() => {
      el?.classList.add("is-settled");
    });

    const vv = window.visualViewport;
    vv?.addEventListener("resize", scheduleSync);
    vv?.addEventListener("scroll", scheduleSync);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    const focusId = window.setTimeout(() => {
      el?.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
    }, FOCUS_DELAY_MS);

    return () => {
      window.cancelAnimationFrame(settleId);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", onKey);
      vv?.removeEventListener("resize", scheduleSync);
      vv?.removeEventListener("scroll", scheduleSync);
      if (el) clearSheetViewportStyles(el);
      unlockBodyScroll();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div ref={rootRef} className="sheet-root" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={`sheet-panel${fill ? " sheet-panel--fill" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sheet-grab"
          onPointerDown={onGrabPointerDown}
          onPointerMove={onGrabPointerMove}
          onPointerUp={onGrabPointerEnd}
          onPointerCancel={onGrabPointerEnd}
        >
          <div className="sheet-handle" aria-hidden />
          <div className="sheet-header">
            <h2 id={titleId} className="sheet-title">
              {title}
            </h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">
              <X size={22} strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
        {footer ? <div className="sheet-footer">{footer}</div> : null}
      </div>
    </div>,
    getOverlayContainer(),
  );
}
