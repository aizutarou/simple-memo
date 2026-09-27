import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Trash2 } from "lucide-react";
import { BottomSheet } from "../components/BottomSheet";
import { FolderPickerSheet } from "../components/FolderPickerSheet";
import { IconButton } from "../components/IconButton";
import { Layout } from "../components/Layout";
import { INBOX_FOLDER_ID } from "../db/database";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { defaultNewMemoTitle } from "../lib/format";
import { getLastFolderId, setLastFolderId } from "../lib/lastFolder";
import { emitDataChanged } from "../lib/dataEvents";
import { parseReturnTo, returnToQuery } from "../lib/returnTo";
import { isBodyValid } from "../lib/validation";
import { folderRepository } from "../repositories/folderRepository";
import { memoRepository } from "../repositories/memoRepository";
import type { Folder } from "../types";

const AUTOSAVE_MS = 400;

type Draft = { title: string; body: string; folderId: string };

function SaveStatus({
  status,
  error,
  staleBody,
}: {
  status: string;
  error: string | null;
  staleBody: boolean;
}) {
  if (staleBody) {
    return <span className="header-status error">本文が空のため未保存</span>;
  }
  if (status === "saving") return <span className="header-status saving">保存中…</span>;
  if (status === "error") return <span className="header-status error">{error}</span>;
  return null;
}

export function MemoEditPage() {
  const { memoId } = useParams<{ memoId: string }>();
  const [searchParams] = useSearchParams();
  const isNewRoute = memoId === undefined || memoId === "new";
  const navigate = useNavigate();
  const returnTo = parseReturnTo(searchParams.get("returnTo"));

  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [persistedMemoId, setPersistedMemoId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [staleBody, setStaleBody] = useState(false);

  const closeDeleteSheet = useCallback(() => setDeleteOpen(false), []);
  const closeFolderPicker = useCallback(() => setFolderPickerOpen(false), []);

  const draftRef = useRef<Draft>({ title: "", body: "", folderId: "" });
  const dirtyRef = useRef(false);
  const skipSaveRef = useRef(true);
  const saveSeqRef = useRef(0);
  const createPromiseRef = useRef<Promise<string> | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const syncBodyTextareaHeight = useCallback(() => {
    const el = bodyTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const editMemoId = isNewRoute ? persistedMemoId : memoId;
  const isNewMemo = isNewRoute && !persistedMemoId;

  useEffect(() => {
    draftRef.current = { title, body, folderId };
  }, [title, body, folderId]);

  useEffect(() => {
    if (loading) return;
    syncBodyTextareaHeight();
  }, [body, loading, syncBodyTextareaHeight]);

  useEffect(() => {
    void folderRepository.listActive().then(setFolders);
  }, []);

  useEffect(() => {
    if (isNewRoute) {
      setLoading(true);
      skipSaveRef.current = true;
      dirtyRef.current = false;
      void (async () => {
        const paramFolder = searchParams.get("folderId");
        const last = getLastFolderId();
        const candidate = paramFolder ?? last ?? INBOX_FOLDER_ID;
        const folder = await folderRepository.getActive(candidate);
        if (!folder) {
          navigate("/", { replace: true });
          return;
        }
        setPersistedMemoId(null);
        setFolderId(folder.id);
        setTitle(defaultNewMemoTitle());
        setBody("");
        setLastFolderId(folder.id);
        setLoading(false);
      })();
      return;
    }
    if (!memoId) return;
    setLoading(true);
    skipSaveRef.current = true;
    dirtyRef.current = false;
    void (async () => {
      const memo = await memoRepository.getActive(memoId);
      if (!memo) {
        navigate("/", { replace: true });
        return;
      }
      const folder = await folderRepository.getActive(memo.folderId);
      if (!folder) {
        navigate("/", { replace: true });
        return;
      }
      setFolderId(memo.folderId);
      setTitle(memo.title);
      setBody(memo.body);
      setPersistedMemoId(memo.id);
      setLastFolderId(memo.folderId);
      setStaleBody(false);
      setLoading(false);
    })();
  }, [isNewRoute, memoId, navigate, searchParams]);

  const persist = useCallback(
    async (draft: Draft, seq: number) => {
      if (!isBodyValid(draft.body)) {
        if (editMemoId) {
          setStaleBody(true);
        }
        setStatus("idle");
        return;
      }
      setStaleBody(false);
      setStatus("saving");
      setError(null);

      try {
        let targetId = editMemoId;

        if (isNewMemo) {
          if (!createPromiseRef.current) {
            createPromiseRef.current = (async () => {
              const memo = await memoRepository.create(draft.folderId, draft.title, draft.body);
              return memo.id;
            })();
          }
          targetId = await createPromiseRef.current;
          createPromiseRef.current = null;
          setPersistedMemoId(targetId);
          setLastFolderId(draft.folderId);
          navigate(`/memos/${targetId}${returnToQuery(returnTo)}`, { replace: true });
        } else if (targetId) {
          await memoRepository.update(targetId, {
            title: draft.title,
            body: draft.body,
            folderId: draft.folderId,
          });
          setLastFolderId(draft.folderId);
        } else {
          return;
        }

        if (seq !== saveSeqRef.current) return;
        setStatus("saved");
        dirtyRef.current = false;
      } catch (e) {
        createPromiseRef.current = null;
        if (seq !== saveSeqRef.current) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    },
    [editMemoId, isNewMemo, navigate, returnTo],
  );

  const flushSave = useCallback(() => {
    if (skipSaveRef.current || !dirtyRef.current) return;
    if (!isBodyValid(draftRef.current.body)) return;
    saveSeqRef.current += 1;
    const seq = saveSeqRef.current;
    void persist(draftRef.current, seq);
  }, [persist]);

  const debouncedSave = useDebouncedCallback(() => {
    if (skipSaveRef.current || !dirtyRef.current) return;
    saveSeqRef.current += 1;
    const seq = saveSeqRef.current;
    void persist(draftRef.current, seq);
  }, AUTOSAVE_MS);

  useEffect(() => {
    if (loading) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    setStaleBody(false);
    debouncedSave.schedule();
  }, [title, body, folderId, loading, debouncedSave]);

  useEffect(() => {
    return () => {
      debouncedSave?.cancel?.();
      flushSave();
    };
  }, [debouncedSave, flushSave]);

  useEffect(() => {
    const onPageHide = () => {
      debouncedSave.flush();
      flushSave();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [debouncedSave, flushSave]);

  const markDirty = () => {
    dirtyRef.current = true;
  };

  const handleDelete = async () => {
    if (!editMemoId) {
      navigate(-1);
      return;
    }
    try {
      await memoRepository.delete(editMemoId);
      emitDataChanged();
      setDeleteOpen(false);
      dirtyRef.current = false;
      navigate(folderId ? `/folders/${folderId}` : "/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
      setStatus("error");
      setDeleteOpen(false);
    }
  };

  const backTo = returnTo ?? `/folders/${folderId}`;

  if (loading) {
    return (
      <Layout title="メモ" subtitle="編集" backTo="/">
        <p className="muted center">読み込み中…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title={isNewMemo ? "新規メモ" : "メモ"}
      subtitle="編集"
      backTo={backTo}
      status={<SaveStatus status={status} error={error} staleBody={staleBody} />}
      action={
        editMemoId ? (
          <IconButton
            icon={Trash2}
            label="メモを削除"
            variant="danger"
            onClick={() => setDeleteOpen(true)}
          />
        ) : null
      }
    >
      <div className="edit-form">
        <p className="edit-form-notice muted" role="note">
          {staleBody
            ? "本文が空のため、いまの変更は保存されていません。入力すると自動保存が再開します。"
            : "本文を入力すると自動保存されます。"}
        </p>

        <div className="field">
          <span className="field-label" id="memo-folder-label">
            フォルダ
          </span>
          <button
            type="button"
            className="input folder-picker-trigger"
            aria-labelledby="memo-folder-label"
            onClick={() => setFolderPickerOpen(true)}
          >
            <span className="folder-picker-trigger-name">
              {folders.find((folder) => folder.id === folderId)?.name ?? "フォルダを選択"}
            </span>
            <ChevronDown size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <label className="field">
          <span className="field-label">タイトル（任意）</span>
          <input
            className="input"
            value={title}
            onChange={(e) => {
              markDirty();
              setTitle(e.target.value);
            }}
            placeholder="タイトル"
            maxLength={200}
          />
        </label>

        <label className="field">
          <span className="field-label">本文</span>
          <textarea
            ref={bodyTextareaRef}
            className="input textarea"
            value={body}
            onChange={(e) => {
              markDirty();
              setBody(e.target.value);
            }}
            placeholder="作業内容をメモ…"
            rows={5}
            maxLength={10_000}
          />
        </label>
      </div>

      <FolderPickerSheet
        open={folderPickerOpen}
        folders={folders}
        selectedId={folderId}
        onClose={closeFolderPicker}
        onSelect={(id) => {
          markDirty();
          setFolderId(id);
          setFolderPickerOpen(false);
        }}
      />

      <BottomSheet
        open={deleteOpen}
        title="メモを削除"
        onClose={closeDeleteSheet}
        footer={
          <div className="sheet-actions">
            <button type="button" className="btn-ghost" onClick={() => setDeleteOpen(false)}>
              キャンセル
            </button>
            <button type="button" className="btn-danger-fill" onClick={() => void handleDelete()}>
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
