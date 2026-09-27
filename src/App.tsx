import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  type Location,
} from "react-router-dom";
import { trackPageView } from "./lib/analytics";
import { FolderListPage } from "./pages/FolderListPage";
import { MemoEditPage } from "./pages/MemoEditPage";
import { MemoListPage } from "./pages/MemoListPage";
import { SearchPage } from "./pages/SearchPage";
import { UsageGuidePage } from "./pages/UsageGuidePage";

type LocationState = {
  backgroundLocation?: Location;
};

function AppRoutes() {
  const location = useLocation();
  const backgroundLocation = (location.state as LocationState | null)?.backgroundLocation;

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<FolderListPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/folders/:folderId" element={<MemoListPage />} />
        <Route path="/memos/new" element={<MemoEditPage />} />
        <Route path="/memos/:memoId" element={<MemoEditPage />} />
        {!backgroundLocation ? <Route path="/guide" element={<UsageGuidePage />} /> : null}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {backgroundLocation ? (
        <Routes>
          <Route path="/guide" element={<UsageGuidePage />} />
        </Routes>
      ) : null}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
