import { Plus } from "lucide-react";

type Props = {
  label: string;
  onClick: () => void;
};

export function Fab({ label, onClick }: Props) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label={label}>
      <Plus size={26} strokeWidth={2.25} />
    </button>
  );
}
