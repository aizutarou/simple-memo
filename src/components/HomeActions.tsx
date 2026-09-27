import { FileText, FolderPlus } from "lucide-react";

type Props = {
  onWriteMemo: () => void;
  onCreateFolder: () => void;
};

export function HomeActions({ onWriteMemo, onCreateFolder }: Props) {
  return (
    <div className="home-actions">
      <button type="button" className="home-action home-action--primary" onClick={onWriteMemo}>
        <FileText size={22} strokeWidth={2} aria-hidden />
        メモを書く
      </button>
      <button type="button" className="home-action home-action--secondary" onClick={onCreateFolder}>
        <FolderPlus size={22} strokeWidth={2} aria-hidden />
        フォルダ作成
      </button>
    </div>
  );
}
