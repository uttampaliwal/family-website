import { ThemeProvider, ToastProvider } from "@family/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router.js";
import "./index.css";
import { I18nProvider } from "./i18n/index.js";
import { queryClient } from "./lib/query-client.js";
import { useAuthStore } from "./stores/auth-store.js";

const root = document.getElementById("root");
if (!root) {
  throw new Error('Root element "#root" not found');
}

// Prime the CSRF cookie and restore the session from the refresh cookie.
void useAuthStore.getState().init();

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <I18nProvider>
            <RouterProvider router={router} />
          </I18nProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
