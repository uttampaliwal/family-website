import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDocuments, deleteDocument } from "../services/documents";
import type { Document } from "../services/documents";
import { useToast } from "../hooks/useToast";
import { getApiErrorMessage } from "../utils/errorHandler";
import DocumentCard from "../components/DocumentCard";
import DocumentCardSkeleton from "../components/DocumentCardSkeleton";

// Utility function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

const DocumentsPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: documents = [],
    isLoading,
    isError,
    error,
  } = useQuery<Document[], Error>({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      showToast("Document deleted successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err) => {
      const errorMessage = getApiErrorMessage(err);
      showToast(errorMessage, "error");
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("Are you sure you want to delete this document?")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleNewDocument = useCallback(() => {
    navigate("/documents/new");
  }, [navigate]);

  const documentsWithFormattedDates = useMemo(() => {
    return documents.map((doc) => ({
      ...doc,
      formattedDate: formatDate(doc.updatedAt),
    }));
  }, [documents]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <DocumentCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="card text-center">
          <h2 className="text-xl font-semibold text-error mb-2">
            Error Fetching Documents
          </h2>
          <p className="text-readable-muted mb-4">
            {getApiErrorMessage(error)}
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["documents"] })
            }
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="card text-center">
          <p className="text-readable-muted mb-4">
            You don't have any documents yet.
          </p>
          <button onClick={handleNewDocument} className="btn btn-primary">
            Create Your First Document
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentsWithFormattedDates.map((doc) => (
          <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="headline text-text-base">My Documents</h1>
        <button
          onClick={handleNewDocument}
          className="btn btn-primary flex items-center"
          disabled={deleteMutation.isPending}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          New Document
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default DocumentsPage;
