import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import axios from "axios";
import "./index.css";
import "./styles/themes.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { queryClient } from "./lib/queryClient";
import logger from "./utils/logger";

// Configure axios to send credentials with every request
axios.defaults.withCredentials = true;

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure there is a div with id="root" in your HTML.',
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      {/* Show React Query DevTools in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
);

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        logger.info("SW registered: ", registration);
      })
      .catch((registrationError) => {
        logger.error("SW registration failed: ", registrationError);
      });
  });
}
