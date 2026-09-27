import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GuideDisclosure } from "../components/GuideDisclosure";
import { ModalPage } from "../components/ModalPage";
import { APP_DISPLAY_NAME } from "../config/branding";

type GuideLocationState = {
  backgroundLocation?: unknown;
};

export function UsageGuidePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasBackground = Boolean((location.state as GuideLocationState | null)?.backgroundLocation);

  const close = useCallback(() => {
    if (hasBackground) navigate(-1);
    else navigate("/", { replace: true });
  }, [hasBackground, navigate]);

  return (
    <ModalPage title="使い方" onClose={close}>
      <p className="guide-lead">
        <strong>{APP_DISPLAY_NAME}</strong>
        は、作業ごとのフォルダにメモを残せる、自分用のメモアプリです。データはこの端末に保存されます。
      </p>

      <div className="guide-disclosure-list">
        <GuideDisclosure title="基本の流れ" defaultOpen>
          <ol className="guide-steps">
            <li>
              <strong>メモを書く</strong>で、そのままメモを作成できます（最初は「あとで振り分け」に入ります）。
            </li>
            <li>
              <strong>フォルダ作成</strong>で作業用のフォルダを追加し、メモ画面のフォルダ選択で振り分けられます。
            </li>
            <li>フォルダをタップするとメモ一覧が開きます。メモをタップして編集できます。</li>
            <li>
              <strong>検索</strong>で、フォルダ名・メモのタイトル・本文を横断して探せます。
            </li>
          </ol>
        </GuideDisclosure>

        <GuideDisclosure title="保存について">
          <ul className="guide-list">
            <li>本文を入力すると<strong>自動保存</strong>されます（タイトルは任意です）。</li>
            <li>本文が空のメモは保存されません。</li>
          </ul>
        </GuideDisclosure>

        <GuideDisclosure title="削除について">
          <ul className="guide-list">
            <li>メモ・フォルダの削除は<strong>取り消せません</strong>。確認のあと削除されます。</li>
            <li>フォルダを削除すると、中のメモもまとめて削除されます。</li>
            <li>「あとで振り分け」フォルダは削除・名前変更できません。</li>
          </ul>
        </GuideDisclosure>

        <GuideDisclosure title="日常的にご利用の方へ">
          <p className="guide-panel-text">
            ホーム画面に追加するかお気に入りに登録しておくと、次回からワンタップで開けます。
          </p>
          <ul className="guide-list">
            <li>
              <strong>iPhone（Safari）</strong>：共有 →「ホーム画面に追加」
            </li>
            <li>
              <strong>Android（Chrome など）</strong>：メニュー →「ホーム画面に追加」または「アプリをインストール」
            </li>
            <li>
              <strong>パソコン</strong>：お気に入り（ブックマーク）に登録
            </li>
          </ul>
          <p className="guide-note muted">
            データは端末ごとに保存されます。別の端末やブラウザでは、内容は自動的に同期されません。
          </p>
        </GuideDisclosure>
      </div>
    </ModalPage>
  );
}
