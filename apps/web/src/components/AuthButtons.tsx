import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import { useAuth } from "../hooks/useAuth";

// Constants for better maintainability
const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
} as const;

const EXCLUDED_PATHS = [ROUTES.LOGIN, ROUTES.REGISTER];

const AuthButtons: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn, username } = useAuth();
  const { t } = useTranslation();
  const showAuthButtons = !EXCLUDED_PATHS.includes(
    location.pathname as (typeof EXCLUDED_PATHS)[number],
  );

  const renderAuthenticatedButtons = () => (
    <Link to={ROUTES.PROFILE}>
      <Button
        label={username || t("nav.profile")}
        className="w-[120px] justify-center"
      />
    </Link>
  );

  const renderUnauthenticatedButtons = () => (
    <>
      <Link to={ROUTES.LOGIN}>
        <Button
          label={t("auth.signIn")}
          variant="ghost"
          className="w-[120px] justify-center"
        />
      </Link>
      <Link to={ROUTES.REGISTER}>
        <Button
          label={t("auth.register")}
          variant="primary"
          className="w-[120px] justify-center"
        />
      </Link>
    </>
  );

  if (!showAuthButtons) return null;

  return (
    <div className="flex items-center gap-2">
      {isLoggedIn
        ? renderAuthenticatedButtons()
        : renderUnauthenticatedButtons()}
    </div>
  );
};

export default AuthButtons;
