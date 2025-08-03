import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, deleteDocument } from '../api/documents';
import type { Document } from '../api/documents';
import { useToast } from '../hooks/useToast';
import DocumentCard from '../components/DocumentCard';

// Utility function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Utility function to handle document operation errors
const getErrorMessage = (error: unknown, operation: 'fetch' | 'delete'): string => {
  if (!(error instanceof Error)) return `Failed to ${operation} document${operation === 'fetch' ? 's' : ''}`;
  
  const message = error.message.toLowerCase();
  if (message.includes('404')) {
    return operation === 'fetch' 
      ? 'Documents service not available. Please try again later.'
      : 'Document not found or already deleted.';
  }
  if (message.includes('403') || message.includes('unauthorized')) {
    return `You do not have permission to ${operation} ${operation === 'fetch' ? 'documents' : 'this document'}.`;
  }
  if (message.includes('network')) {
    return 'Network error. Please check your connection.';
  }
  if (message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  return `Failed to ${operation} document${operation === 'fetch' ? 's' : ''}`;
};

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
        console.error('Error fetching documents:', JSON.stringify({
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          operation: 'fetchDocuments'
        }));
        showToast(getErrorMessage(error, 'fetch'), 'error');
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Error deleting document:', JSON.stringify({
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            operation: 'deleteDocument'
          }));
        }
        showToast(getErrorMessage(error, 'delete'), 'error');
      }
    }
  }, [showToast]);



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
            <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;