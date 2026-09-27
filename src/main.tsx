import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { APP_DISPLAY_NAME } from "./config/branding";
import { ensureInboxFolder } from "./db/database";
import { purgeSoftDeleted } from "./db/purgeSoftDeleted";
import { resetBodyScrollLock } from "./lib/scrollLock";
import "./index.css";

document.title = APP_DISPLAY_NAME;
resetBodyScrollLock();

void (async () => {
  await purgeSoftDeleted();
  await ensureInboxFolder();
})().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
