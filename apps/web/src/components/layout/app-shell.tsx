import { Outlet } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { RouteFocusManager } from "../app/route-focus.js";
import { useI18n } from "../../i18n/index.js";
import { useNetworkStatus } from "../../lib/offline.js";
import { Footer } from "./footer.js";
import { Header } from "./header.js";

export function AppShell() {
  const { t } = useI18n();
  const offline = useNetworkStatus();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-fg"
      >
        Skip to main content
      </a>
      {offline && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-1.5 text-center text-xs font-medium text-primary"
        >
          <WifiOff className="size-3.5" />
          {t("offline.banner")}
        </div>
      )}
      <RouteFocusManager />
      <Header />
      <main id="main-content" className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
