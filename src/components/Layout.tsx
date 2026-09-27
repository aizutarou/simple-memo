import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;
  /** ホーム用：左余白なし・大きめタイトル */
  headerVariant?: "default" | "home";
  action?: React.ReactNode;
  status?: React.ReactNode;
  fab?: React.ReactNode;
  children: React.ReactNode;
};

export function Layout({
  title,
  subtitle,
  backTo,
  headerVariant = "default",
  action,
  status,
  fab,
  children,
}: Props) {
  const isHome = headerVariant === "home";

  return (
    <div className="app-shell">
      <header className={`app-header${isHome ? " app-header--home" : ""}`}>
        <div className="app-header-row">
          <div className="app-header-start">
            {backTo ? (
              <Link to={backTo} className="icon-btn back-btn" aria-label="戻る">
                <ChevronLeft size={24} strokeWidth={2} />
              </Link>
            ) : isHome ? null : (
              <span className="back-spacer" aria-hidden />
            )}
            <div className={`app-heading${isHome ? " app-heading--home" : ""}`}>
              <h1 className="app-title">{title}</h1>
              {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
            </div>
          </div>
          <div className="app-header-end">
            {status ? <span className="header-status">{status}</span> : null}
            {action ? <div className="app-header-action">{action}</div> : null}
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
      {fab ? fab : null}
    </div>
  );
}
