import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/app-shell.js";
import { HealthPage } from "../pages/health.js";
import { HomePage } from "../pages/home.js";
import { NotFoundPage } from "../pages/not-found.js";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/health", element: <HealthPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
