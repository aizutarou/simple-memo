import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, FileText, Folder } from "lucide-react";
import { Layout } from "../components/Layout";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { subscribeDataChanged } from "../lib/dataEvents";
import { formatCreatedAt, formatFolderMemoMeta } from "../lib/format";
import { searchSnippet } from "../lib/searchSnippet";
import { memoListTitle } from "../lib/validation";
import {
  searchAll,
  type FolderSearchHit,
  type SearchResults,
} from "../services/searchService";
import type { MemoSearchHit } from "../repositories/memoRepository";

const SEARCH_DEBOUNCE_MS = 300;

const emptyResults: SearchResults = { folders: [], memos: [] };

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q) {
      setResults(emptyResults);
      setSearched(false);
      return;
    }
    setResults(await searchAll(q));
    setSearched(true);
  }, []);

  const debouncedSearch = useDebouncedCallback((text: string) => {
    void runSearch(text);
  }, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    debouncedSearch.schedule(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    if (initialQuery.trim()) void runSearch(initialQuery);
  }, [initialQuery, runSearch]);

  useEffect(() => {
    return subscribeDataChanged(() => {
      if (query.trim()) void runSearch(query);
    });
  }, [query, runSearch]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const trimmed = query.trim();
  const totalCount = results.folders.length + results.memos.length;

  return (
    <Layout title="検索" subtitle="フォルダ・メモ" backTo="/">
      <label className="field search-field">
        <span className="field-label">キーワード</span>
        <input
          className="input"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="フォルダ名・タイトル・本文"
          autoFocus
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>

      {!trimmed ? (
        <p className="muted search-hint">フォルダ名、メモのタイトル・本文から検索します。</p>
      ) : !searched ? null : totalCount === 0 ? (
        <p className="muted center search-empty">「{trimmed}」に一致する結果はありません。</p>
      ) : (
        <>
          <p className="search-result-count muted">{totalCount} 件</p>

          {results.folders.length > 0 ? (
            <section className="search-section" aria-labelledby="search-folders-heading">
              <h2 id="search-folders-heading" className="search-section-title">
                フォルダ
              </h2>
              <ul className="card-list">
                {results.folders.map((folder) => (
                  <FolderResultRow key={folder.id} folder={folder} />
                ))}
              </ul>
            </section>
          ) : null}

          {results.memos.length > 0 ? (
            <section className="search-section" aria-labelledby="search-memos-heading">
              <h2 id="search-memos-heading" className="search-section-title">
                メモ
              </h2>
              <ul className="card-list">
                {results.memos.map((hit) => (
                  <MemoResultRow key={hit.memo.id} hit={hit} query={trimmed} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </Layout>
  );
}

function FolderResultRow({ folder }: { folder: FolderSearchHit }) {
  return (
    <li>
      <Link to={`/folders/${folder.id}`} className="card card--interactive memo-card">
        <span className="card-icon" aria-hidden>
          <Folder size={20} strokeWidth={1.75} />
        </span>
        <span className="card-body">
          <span className="card-title">{folder.name}</span>
          <span className="card-meta">
            {formatFolderMemoMeta(folder.memoCount, folder.lastMemoUpdatedAt)}
          </span>
        </span>
        <ChevronRight className="card-chevron" size={20} strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}

function MemoResultRow({ hit, query }: { hit: MemoSearchHit; query: string }) {
  const { memo, folderName } = hit;
  const snippet = searchSnippet(memo.body, query);

  return (
    <li>
      <Link to={`/memos/${memo.id}`} className="card card--interactive memo-card">
        <span className="card-icon card-icon--memo" aria-hidden>
          <FileText size={20} strokeWidth={1.75} />
        </span>
        <span className="card-body">
          <span className="card-title">{memoListTitle(memo.title, memo.body)}</span>
          <span className="card-meta">
            {folderName} · 更新 {formatCreatedAt(memo.updatedAt)}
          </span>
          {snippet ? <span className="card-snippet">{snippet}</span> : null}
        </span>
        <ChevronRight className="card-chevron" size={20} strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}
