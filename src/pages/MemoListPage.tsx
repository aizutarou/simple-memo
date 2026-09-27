import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, FileText, Search } from "lucide-react";
import { BottomSheet } from "../components/BottomSheet";
import { EmptyState } from "../components/EmptyState";
import { Fab } from "../components/Fab";
import { IconButton } from "../components/IconButton";
import { Layout } from "../components/Layout";
import { SwipeActionsRow } from "../components/SwipeActionsRow";
import { emitDataChanged, subscribeDataChanged } from "../lib/dataEvents";
import { formatCreatedAt } from "../lib/format";
import { setLastFolderId } from "../lib/lastFolder";
import { memoListTitle } from "../lib/validation";
import { folderRepository, isInboxFolder } from "../repositories/folderRepository";
import { memoRepository } from "../repositories/memoRepository";
import type { Folder, Memo } from "../types";

export function MemoListPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSwipeMemoId, setOpenSwipeMemoId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memo | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    const f = await folderRepository.getActive(folderId);
    if (!f) {
      navigate("/", { replace: true });
      return;
    }
    setFolder(f);
    setLastFolderId(folderId);
    const list = await memoRepository.listByFolder(folderId);
    setMemos(list);
    setLoading(false);
  }, [folderId, navigate]);

  useEffect(() => {
    setSearchOpen(false);
    setQuery("");
  }, [folderId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeDataChanged(() => void load()), [load]);

  const closeDeleteSheet = useCallback(() => setDeleteTarget(null), []);

  const submitDelete = async () => {
    if (!deleteTarget) return;
    try {
      await memoRepository.delete(deleteTarget.id);
      setDeleteTarget(null);
      setOpenSwipeMemoId(null);
      emitDataChanged();
    } catch {
      setDeleteTarget(null);
    }
  };

  if (!folderId) return null;

  const newMemo = () => navigate(`/memos/new?folderId=${folderId}`);

  const inbox = folder ? isInboxFolder(folder) : false;
  const needle = query.trim().toLowerCase();
  const visibleMemos = needle
    ? memos.filter(
        (memo) => memo.title.toLowerCase().includes(needle) || memo.body.toLowerCase().includes(needle),
      )
    : memos;

  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) setQuery("");
      return !open;
    });
    setOpenSwipeMemoId(null);
  };

  return (
    <Layout
      title={folder?.name ?? "…"}
      subtitle="メモ一覧"
      backTo="/"
      action={
        !loading && memos.length > 0 ? (
          <IconButton
            icon={Search}
            label="このフォルダ内を検索"
            variant={searchOpen ? "accent" : "default"}
            onClick={toggleSearch}
          />
        ) : null
      }
      fab={loading ? null : <Fab label="新規メモ" onClick={newMemo} />}
    >
      {loading ? (
        <p className="muted center">読み込み中…</p>
      ) : memos.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={inbox ? "メモを書いてみましょう" : "まだメモがありません"}
          description={
            inbox
              ? "思いついた内容をそのまま書けます。保存後、編集画面の「フォルダ」から作業フォルダへ移せます。"
              : "右下の ＋ から、この作業に関するメモを追加できます。"
          }
          action={
            <button type="button" className="btn-primary" onClick={newMemo}>
              メモを書く
            </button>
          }
        />
      ) : (
        <>
          {searchOpen ? (
            <label className="field list-filter">
              <span className="field-label">このフォルダ内</span>
              <input
                className="input"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpenSwipeMemoId(null);
                }}
                placeholder="タイトル・本文"
                autoFocus
                enterKeyHint="search"
                autoComplete="off"
              />
            </label>
          ) : null}
          {visibleMemos.length === 0 ? (
            <p className="muted center">一致するメモはありません。</p>
          ) : (
            <ul className="card-list">
              {visibleMemos.map((memo) => (
                <li key={memo.id} className="card-list-item">
                  <SwipeActionsRow
                    open={openSwipeMemoId === memo.id}
                    onOpenChange={(open) => setOpenSwipeMemoId(open ? memo.id : null)}
                    actions={[
                      {
                        label: "削除",
                        variant: "danger",
                        onClick: () => setDeleteTarget(memo),
                      },
                    ]}
                  >
                    <Link
                      to={`/memos/${memo.id}`}
                      className="card card--interactive memo-card"
                      onClick={() => setOpenSwipeMemoId(null)}
                    >
                      <span className="card-icon card-icon--memo" aria-hidden>
                        <FileText size={20} strokeWidth={1.75} />
                      </span>
                      <span className="card-body">
                        <span className="card-title">{memoListTitle(memo.title, memo.body)}</span>
                        <span className="card-meta">作成 {formatCreatedAt(memo.createdAt)}</span>
                      </span>
                      <ChevronRight className="card-chevron" size={20} strokeWidth={2} aria-hidden />
                    </Link>
                  </SwipeActionsRow>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <BottomSheet
        open={deleteTarget !== null}
        title="メモを削除"
        onClose={closeDeleteSheet}
        footer={
          <div className="sheet-actions">
            <button type="button" className="btn-ghost" onClick={closeDeleteSheet}>
              キャンセル
            </button>
            <button type="button" className="btn-danger-fill" onClick={() => void submitDelete()}>
              削除する
            </button>
          </div>
        }
      >
        <p className="sheet-message">このメモを削除します。取り消せません。</p>
      </BottomSheet>
    </Layout>
  );
}
