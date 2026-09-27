import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import type { Folder } from "../types";

type Props = {
  open: boolean;
  folders: Folder[];
  selectedId: string;
  onClose: () => void;
  onSelect: (folderId: string) => void;
};

export function FolderPickerSheet({ open, folders, selectedId, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const needle = query.trim().toLowerCase();
  const visible = needle ? folders.filter((folder) => folder.name.toLowerCase().includes(needle)) : folders;

  return (
    <BottomSheet open={open} title="フォルダ" onClose={onClose} fill>
      <div className="folder-picker">
        <label className="field folder-picker-search">
          <span className="field-label">フォルダ名</span>
          <input
            className="input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="フォルダ名で絞り込み"
            enterKeyHint="search"
            autoComplete="off"
          />
        </label>
        <div className="folder-picker-scroll">
          {visible.length === 0 ? (
            <p className="muted folder-picker-empty">一致するフォルダはありません。</p>
          ) : (
            <ul className="folder-picker-list">
              {visible.map((folder) => {
                const selected = folder.id === selectedId;
                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      className={`folder-picker-option${selected ? " is-selected" : ""}`}
                      onClick={() => onSelect(folder.id)}
                      aria-current={selected ? "true" : undefined}
                    >
                      <span className="folder-picker-name">{folder.name}</span>
                      {selected ? <Check size={20} strokeWidth={2.25} aria-hidden /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
