import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function GuideDisclosure({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details className="guide-disclosure" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="guide-disclosure-summary">
        <span className="guide-disclosure-title">{title}</span>
        <ChevronDown className="guide-disclosure-chevron" size={20} strokeWidth={2} aria-hidden />
      </summary>
      <div className="guide-disclosure-panel">{children}</div>
    </details>
  );
}
