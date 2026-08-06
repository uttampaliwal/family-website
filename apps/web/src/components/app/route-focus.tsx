import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Move focus to the main content area on every navigation for keyboard & SR users. */
export function RouteFocusManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  }, [pathname]);

  return null;
}