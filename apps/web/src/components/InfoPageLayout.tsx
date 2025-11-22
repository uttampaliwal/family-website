import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface InfoPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backTo?: string;
}

const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({
  title,
  subtitle,
  children,
  backTo = "/",
}) => {
  const { t, i18n } = useTranslation("common");
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              {title}
            </h1>
            {subtitle && <p className="text-muted text-lg">{subtitle}</p>}
            <div className="mt-4 text-sm text-muted">
              <strong>{t("lastUpdated")}:</strong>{" "}
              {new Date().toLocaleDateString(
                i18n.language === "hi" ? "hi-IN" : "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-surface rounded-2xl shadow-xl p-8 md:p-12">
            <div className="prose prose-lg max-w-none">{children}</div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12 pt-8 border-t border-border">
            <Link
              to={backTo}
              className="btn btn-primary inline-flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("backToHome")}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InfoPageLayout;
