import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingIndicator from "../components/LoadingIndicator";

const AuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        const userParam = searchParams.get("user");

        if (!userParam) {
          throw new Error("No user data received");
        }

        const user = JSON.parse(decodeURIComponent(userParam));

        // Store user data and redirect
        login(user);

        // Redirect to home page
        navigate("/", { replace: true });
      } catch (error) {
        console.error("OAuth success handling error:", error);
        navigate("/login?error=oauth_processing_failed", { replace: true });
      }
    };

    handleOAuthSuccess();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingIndicator size="large" />
        <p className="mt-4 text-text-muted">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthSuccessPage;
