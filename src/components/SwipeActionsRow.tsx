import { useCallback, useEffect, useRef, useState } from "react";

const ACTION_WIDTH = 76;
const SNAP_RATIO = 0.35;
const DRAG_START_PX = 10;

export type SwipeAction = {
  label: string;
  ariaLabel?: string;
  variant?: "danger";
  onClick: () => void;
};

type Props = {
  actions: SwipeAction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
};

export function SwipeActionsRow({
  actions,
  open,
  onOpenChange,
  disabled = false,
  children,
}: Props) {
  const revealWidth = ACTION_WIDTH * actions.length;
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  const settledOffset = open ? revealWidth : 0;
  const offset = dragOffset ?? settledOffset;
  const didSwipe = useRef(false);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (target.closest(".swipe-row")) return;
      close();
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [open, close]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = false;
    startX.current = e.clientX;
    startOffset.current = open ? revealWidth : 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled) return;
    const dx = startX.current - e.clientX;
    if (!dragging.current) {
      if (Math.abs(dx) < DRAG_START_PX && Math.abs(e.movementY) > Math.abs(e.movementX)) return;
      if (Math.abs(dx) >= DRAG_START_PX) dragging.current = true;
    }
    if (!dragging.current) return;
    e.preventDefault();
    const next = Math.min(revealWidth, Math.max(0, startOffset.current + dx));
    setDragOffset(next);
  };

  const finishDrag = (e: React.PointerEvent) => {
    if (disabled) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!dragging.current) return;
    dragging.current = false;
    didSwipe.current = true;
    const current = dragOffset ?? settledOffset;
    const shouldOpen = current > revealWidth * SNAP_RATIO;
    onOpenChange(shouldOpen);
    setDragOffset(null);
  };

  const onContentClickCapture = (e: React.MouseEvent) => {
    if (!didSwipe.current) return;
    e.preventDefault();
    e.stopPropagation();
    didSwipe.current = false;
  };

  const onActionClick = (action: SwipeAction) => {
    close();
    action.onClick();
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="swipe-row">
      <div className="swipe-row-actions" style={{ width: revealWidth }} aria-hidden={!open}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`swipe-row-action${action.variant === "danger" ? " swipe-row-action--danger" : ""}`}
            aria-label={action.ariaLabel ?? action.label}
            tabIndex={open ? 0 : -1}
            onClick={() => onActionClick(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div
        className={`swipe-row-content${open ? " swipe-row-content--open" : ""}${dragOffset !== null ? " swipe-row-content--dragging" : ""}`}
        style={{ transform: `translate3d(-${offset}px, 0, 0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClickCapture={onContentClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
