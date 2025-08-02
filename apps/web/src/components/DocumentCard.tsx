import React from 'react';
import { Link } from 'react-router-dom';
import type { Document } from '../api/documents';

interface DocumentCardProps {
  doc: Document & { formattedDate: string };
  onDelete: (id: string) => void;
}

const MAX_CONTENT_PREVIEW_LENGTH = 150;

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onDelete }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white truncate">
            {doc.title}
          </h2>
          {doc.fileUrl && (
            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              File
            </span>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
          Last updated: {doc.formattedDate}
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          Owner: {typeof doc.owner === 'object' ? doc.owner.name : 'You'}
        </p>
        <div className="h-24 overflow-hidden text-gray-600 dark:text-gray-400 text-sm mb-4">
          {doc.content.substring(0, MAX_CONTENT_PREVIEW_LENGTH)}
          {doc.content.length > MAX_CONTENT_PREVIEW_LENGTH && '...'}
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-between">
        <Link
          to={`/documents/${doc._id}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          View
        </Link>
        <Link
          to={`/documents/edit/${doc._id}`}
          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(doc._id)}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
