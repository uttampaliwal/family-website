import React, { useState } from "react";
import { shareDocument } from "../services/documents";
import { useToast } from "../hooks/useToast";

interface ShareDocumentModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Enhanced client-side log sanitization to prevent log injection
const sanitizeClientLog = (input: unknown): string => {
  return String(input ?? "")
    .replace(/[\n\r\t]/g, "") // Remove newlines, carriage returns, tabs
    .replace(/[<>&"'/]/g, "") // Remove HTML/XML characters
    .replace(/[[\]{}]/g, "") // Remove JSON structure characters
    .substring(0, 200); // Limit length to prevent log flooding
};

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  documentId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleShareError = (error: unknown) => {
    try {
      const errorInfo = {
        message: error instanceof Error ? error.message : "Unknown error",
        documentId: sanitizeClientLog(documentId),
        username: sanitizeClientLog(username),
        timestamp: new Date().toISOString(),
        operation: "shareDocument",
      };
      console.error("Error sharing document:", JSON.stringify(errorInfo));
    } catch (logError) {
      console.error("Failed to log share error:", logError);
    }

    let errorMessage = "Failed to share document";
    try {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes("404") || message.includes("not found")) {
          errorMessage = "User not found. Please check the username.";
        } else if (
          message.includes("403") ||
          message.includes("unauthorized")
        ) {
          errorMessage = "You do not have permission to share this document.";
        } else if (
          message.includes("400") ||
          message.includes("already shared")
        ) {
          errorMessage = "Document is already shared with this user.";
        } else if (message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else if (message.includes("network")) {
          errorMessage = "Network error. Please check your connection.";
        }
      }
    } catch (parseError) {
      console.error("Failed to parse error message:", parseError);
    }

    try {
      showToast(errorMessage, "error");
    } catch (toastError) {
      console.error("Failed to show error toast:", toastError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      showToast("Please enter a username", "error");
      return;
    }

    setLoading(true);

    try {
      await shareDocument(documentId, username);
      showToast("Document shared successfully", "success");
      setUsername("");
      onSuccess();
      onClose();
    } catch (error) {
      handleShareError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50">
      <div className="auth-card w-full max-w-md">
        <div className="auth-header"></div>
        <div className="auth-form">
          <h2 className="headline text-on-surface mb-4">Share Document</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-base mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Enter username to share with"
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? "Sharing..." : "Share"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentModal;
