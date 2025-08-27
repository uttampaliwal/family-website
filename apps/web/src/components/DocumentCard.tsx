import React from "react";
import { Link } from "react-router-dom";
import type { Document } from "../services/documents";

interface DocumentCardProps {
  doc: Document & { formattedDate: string };
  onDelete: (id: string) => void;
}

const MAX_CONTENT_PREVIEW_LENGTH = 150;

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onDelete }) => {
  const ownerName = typeof doc.owner === "object" ? doc.owner.name : "You";

  return (
    <div className="card overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-2">
          <h2 className="subheadline text-on-surface truncate">{doc.title}</h2>
          {doc.fileUrl && <span className="ml-2 badge badge-info">File</span>}
        </div>
        <p className="text-readable-muted text-sm mb-2">
          Last updated: {doc.formattedDate}
        </p>
        <p className="text-readable-muted text-sm mb-4">Owner: {ownerName}</p>
        <div className="h-24 overflow-hidden text-readable-muted text-sm mb-4">
          {doc.content.substring(0, MAX_CONTENT_PREVIEW_LENGTH)}
          {doc.content.length > MAX_CONTENT_PREVIEW_LENGTH && "..."}
        </div>
      </div>
      <div className="bg-surface px-6 py-3 flex justify-between">
        <Link
          to={`/documents/${doc._id}`}
          className="text-primary hover:text-secondary font-medium"
        >
          View
        </Link>
        <Link
          to={`/documents/edit/${doc._id}`}
          className="text-success hover:opacity-80 font-medium"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(doc._id)}
          className="text-error hover:opacity-80 font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
