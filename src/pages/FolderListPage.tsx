import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, CircleHelp, Folder, Pencil, Search } from "lucide-react";
import { BottomSheet } from "../components/BottomSheet";
import { HomeActions } from "../components/HomeActions";
import { IconButton } from "../components/IconButton";
import { SwipeActionsRow } from "../components/SwipeActionsRow";
import { Layout } from "../components/Layout";
import { APP_DISPLAY_NAME, APP_HOME_TAGLINE } from "../config/branding";
import { INBOX_FOLDER_ID } from "../db/database";
import { emitDataChanged, subscribeDataChanged } from "../lib/dataEvents";
import { formatFolderMemoMeta } from "../lib/format";
import { setLastFolderId } from "../lib/lastFolder";
import { folderRepository, isInboxFolder } from "../repositories/folderRepository";
import { memoRepository } from "../repositories/memoRepository";
import type { Folder as FolderType } from "../types";

type FolderRow = FolderType & { memoCount: number; lastMemoUpdatedAt: string | null };

type SheetState =
  | { kind: "closed" }
  | { kind: "create"; name: string; error: string | null }
  | { kind: "folderActions"; folder: FolderType }
  | { kind: "rename"; folder: FolderType; name: string; error: string | null }
  | { kind: "delete"; folder: FolderType; memoCount: number };

export function FolderListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<SheetState>({ kind: "closed" });
  const [toastError, setToastError] = useState<string | null>(null);
  const [openSwipeFolderId, setOpenSwipeFolderId] = useState<string | null>(null);

  const closeSheet = useCallback(() => setSheet({ kind: "closed" }), []);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await folderRepository.listActive();
    const withCounts = await Promise.all(
      list.map(async (f) => {
        const stats = await memoRepository.getActiveStatsByFolder(f.id);
        return { ...f, ...stats };
      }),
    );
    setFolders(withCounts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeDataChanged(() => void load()), [load]);

  useEffect(() => {
    if (!toastError) return;
    const t = window.setTimeout(() => setToastError(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastError]);

  const submitCreate = async () => {
    if (sheet.kind !== "create") return;
    try {
      await folderRepository.create(sheet.name);
      setSheet({ kind: "closed" });
      await load();
    } catch (e) {
      setSheet({
        ...sheet,
        error: e instanceof Error ? e.message : "作成に失敗しました",
      });
    }
  };

  const submitRename = async () => {
    if (sheet.kind !== "rename") return;
    try {
      await folderRepository.rename(sheet.folder.id, sheet.name);
      setSheet({ kind: "closed" });
      await load();
    } catch (e) {
      setSheet({
        ...sheet,
        error: e instanceof Error ? e.message : "変更に失敗しました",
      });
    }
  };

  const submitDelete = async () => {
    if (sheet.kind !== "delete") return;
    try {
      await folderRepository.deleteWithMemos(sheet.folder.id);
      emitDataChanged();
      setSheet({ kind: "closed" });
      await load();
    } catch (e) {
      setToastError(e instanceof Error ? e.message : "削除に失敗しました");
      setSheet({ kind: "closed" });
    }
  };

  const openFolderActions = (folder: FolderType) => {
    setSheet({ kind: "folderActions", folder });
  };

  const openDeleteSheet = async (folder: FolderType) => {
    const memoCount = await memoRepository.countActiveByFolder(folder.id);
    setSheet({ kind: "delete", folder, memoCount });
  };

  const openCreateSheet = () => setSheet({ kind: "create", name: "", error: null });

  const quickMemoInInbox = () =>
    navigate(`/memos/new?folderId=${INBOX_FOLDER_ID}&returnTo=${encodeURIComponent("/")}`);

  const renderFolderRow = (folder: FolderRow) => {
    const inbox = isInboxFolder(folder);
    const row = (
      <div className="card card--row">
        <Link
          to={`/folders/${folder.id}`}
          className="card-link-area"
          onClick={() => {
            setOpenSwipeFolderId(null);
            setLastFolderId(folder.id);
          }}
        >
          <span className="card-icon" aria-hidden>
            <Folder size={22} strokeWidth={1.75} />
          </span>
          <span className="card-body">
            <span className="card-title">{folder.name}</span>
            <span className="card-meta">
              {formatFolderMemoMeta(folder.memoCount, folder.lastMemoUpdatedAt)}
            </span>
          </span>
          <ChevronRight className="card-chevron" size={20} strokeWidth={2} aria-hidden />
        </Link>
        {!inbox ? (
          <div className="card-toolbar">
            <IconButton
              icon={Pencil}
              label="編集"
              onClick={() => {
                setOpenSwipeFolderId(null);
                openFolderActions(folder);
              }}
            />
          </div>
        ) : null}
      </div>
    );

    return (
      <li key={folder.id} className="card-list-item">
        {inbox ? (
          row
        ) : (
          <SwipeActionsRow
            open={openSwipeFolderId === folder.id}
            onOpenChange={(open) => setOpenSwipeFolderId(open ? folder.id : null)}
            actions={[
              {
                label: "削除",
                variant: "danger",
                onClick: () => void openDeleteSheet(folder),
              },
            ]}
          >
            {row}
          </SwipeActionsRow>
        )}
      </li>
    );
  };

  return (
    <Layout
      title={APP_DISPLAY_NAME}
      subtitle={APP_HOME_TAGLINE}
      headerVariant="home"
      action={
        <>
          <IconButton
            icon={CircleHelp}
            label="使い方"
            onClick={() => navigate("/guide", { state: { backgroundLocation: location } })}
          />
          <IconButton icon={Search} label="検索" onClick={() => navigate("/search")} />
        </>
      }
    >
      {toastError ? <div className="inline-toast error">{toastError}</div> : null}

      {loading ? (
        <p className="muted center">読み込み中…</p>
      ) : (
        <>
          <HomeActions onWriteMemo={quickMemoInInbox} onCreateFolder={openCreateSheet} />

          <section className="home-folder-section" aria-labelledby="home-folder-heading">
            <h2 id="home-folder-heading" className="home-section-title">
              フォルダ一覧
            </h2>
            <p className="home-section-desc">フォルダを開くと、その中のメモを見たり追加できます。</p>
            <ul className="card-list">
              {folders.map(renderFolderRow)}
            </ul>
          </section>
        </>
      )}

      <BottomSheet
        open={sheet.kind !== "closed"}
        title={
          sheet.kind === "create"
            ? "新しい作業フォルダ"
            : sheet.kind === "folderActions"
              ? sheet.folder.name
            : sheet.kind === "rename"
              ? "フォルダ名を変更"
              : sheet.kind === "delete"
                ? "フォルダを削除"
                : ""
        }
        onClose={closeSheet}
        footer={
          sheet.kind === "folderActions" ? null : sheet.kind === "create" ? (
            <div className="sheet-actions">
              <button type="button" className="btn-ghost" onClick={closeSheet}>
                キャンセル
              </button>
              <button type="button" className="btn-primary btn-primary--inline" onClick={() => void submitCreate()}>
                作成
              </button>
            </div>
          ) : sheet.kind === "rename" ? (
            <div className="sheet-actions">
              <button type="button" className="btn-ghost" onClick={closeSheet}>
                キャンセル
              </button>
              <button type="button" className="btn-primary btn-primary--inline" onClick={() => void submitRename()}>
                保存
              </button>
            </div>
          ) : sheet.kind === "delete" ? (
            <div className="sheet-actions">
              <button type="button" className="btn-ghost" onClick={closeSheet}>
                キャンセル
              </button>
              <button type="button" className="btn-danger-fill" onClick={() => void submitDelete()}>
                削除する
              </button>
            </div>
          ) : null
        }
      >
        {sheet.kind === "folderActions" ? (
          <div className="sheet-menu">
            <button
              type="button"
              className="btn-secondary sheet-menu-btn"
              onClick={() =>
                setSheet({
                  kind: "rename",
                  folder: sheet.folder,
                  name: sheet.folder.name,
                  error: null,
                })
              }
            >
              名前を変更
            </button>
            <button
              type="button"
              className="btn-danger-outline sheet-menu-btn"
              onClick={() => void openDeleteSheet(sheet.folder)}
            >
              フォルダを削除
            </button>
          </div>
        ) : null}
        {sheet.kind === "create" ? (
          <>
            <label className="field">
              <span className="field-label">作業名</span>
              <input
                className="input"
                value={sheet.name}
                onChange={(e) => setSheet({ kind: "create", name: e.target.value, error: null })}
                placeholder="例: サイト制作"
                maxLength={100}
              />
            </label>
            {sheet.error ? <p className="field-error">{sheet.error}</p> : null}
          </>
        ) : null}
        {sheet.kind === "rename" ? (
          <>
            <label className="field">
              <span className="field-label">作業名</span>
              <input
                className="input"
                value={sheet.name}
                onChange={(e) => setSheet({ ...sheet, name: e.target.value, error: null })}
                maxLength={100}
              />
            </label>
            {sheet.error ? <p className="field-error">{sheet.error}</p> : null}
          </>
        ) : null}
        {sheet.kind === "delete" ? (
          <p className="sheet-message">
            「{sheet.folder.name}」
            {sheet.memoCount > 0
              ? ` とメモ ${sheet.memoCount} 件を削除します。取り消せません。`
              : " を削除します。取り消せません。"}
          </p>
        ) : null}
      </BottomSheet>
    </Layout>
  );
}
