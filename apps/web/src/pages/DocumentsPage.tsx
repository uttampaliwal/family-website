import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDocuments, deleteDocument } from '../api/documents';
import type { Document } from '../api/documents';
import { useToast } from '../hooks/useToast';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await getDocuments();
        setDocuments(data);
      } catch (error) {
        // Structured error logging with context
        const errorInfo = {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          operation: 'fetchDocuments'
        };
        console.error('Error fetching documents:', JSON.stringify(errorInfo));
        
        let errorMessage = 'Failed to load documents';
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            errorMessage = 'Documents service not available. Please try again later.';
          } else if (error.message.includes('403') || error.message.includes('unauthorized')) {
            errorMessage = 'You do not have permission to view documents.';
          } else if (error.message.includes('network') || error.message.includes('Network')) {
            errorMessage = 'Network error. Please check your connection.';
          } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
          }
        }
        
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [showToast]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
        setDocuments(prev => prev.filter(doc => doc._id !== id));
        showToast('Document deleted successfully', 'success');
      } catch (error) {
        // Log error without exposing sensitive information
        const errorInfo = {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          operation: 'deleteDocument'
        };
        if (process.env.NODE_ENV === 'development') {
          console.error('Error deleting document:', JSON.stringify(errorInfo));
        }
        
        let errorMessage = 'Failed to delete document';
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            errorMessage = 'Document not found or already deleted.';
          } else if (error.message.includes('403') || error.message.includes('unauthorized')) {
            errorMessage = 'You do not have permission to delete this document.';
          } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.message.includes('network') || error.message.includes('Network')) {
            errorMessage = 'Network error. Please check your connection.';
          }
        }
        
        showToast(errorMessage, 'error');
      }
    }
  }, [showToast]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }, []);

  const handleNewDocument = useCallback(() => {
    navigate('/documents/new');
  }, [navigate]);

  const documentsWithFormattedDates = useMemo(() => {
    return documents.map(doc => ({
      ...doc,
      formattedDate: formatDate(doc.updatedAt)
    }));
  }, [documents, formatDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Documents</h1>
        <button
          onClick={handleNewDocument}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">You don't have any documents yet.</p>
          <button
            onClick={handleNewDocument}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Create Your First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentsWithFormattedDates.map((doc) => (
            <div key={doc._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
                  {doc.content.substring(0, 150)}
                  {doc.content.length > 150 && '...'}
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
                  onClick={() => handleDelete(doc._id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;