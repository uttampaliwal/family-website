import { Outlet } from "react-router-dom";
import { RouteFocusManager } from "../app/route-focus.js";
import { Footer } from "./footer.js";
import { Header } from "./header.js";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-fg"
      >
        Skip to main content
      </a>
      <RouteFocusManager />
      <Header />
      <main id="main-content" className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
