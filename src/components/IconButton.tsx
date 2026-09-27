import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger" | "accent";
  type?: "button" | "submit";
};

export function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  type = "button",
}: Props) {
  return (
    <button
      type={type}
      className={`icon-btn icon-btn--${variant}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon size={22} strokeWidth={2} />
    </button>
  );
}
