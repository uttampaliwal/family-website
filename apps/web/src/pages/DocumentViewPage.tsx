import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDocumentById, deleteDocument, downloadFile } from '../api/documents';
import { useToast } from '../hooks/useToast';
import ShareDocumentModal from '../components/ShareDocumentModal';
import type { Document as DocumentType } from '../api/documents';

const DocumentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchDocument = useCallback(async () => {
    try {
      if (!id || id.trim() === '') {
        throw new Error('Document ID is missing');
      }
      
      const data = await getDocumentById(id);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid document data received');
      }
      
      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      
      let errorMessage = 'Failed to load document';
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'Document not found';
        } else if (error.message.includes('403') || error.message.includes('unauthorized')) {
          errorMessage = 'You do not have permission to view this document';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection';
        }
      }
      
      showToast(errorMessage, 'error');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    if (id) {
      fetchDocument();
    } else {
      showToast('Invalid document ID', 'error');
      navigate('/documents');
      setLoading(false);
    }
  }, [id, navigate, showToast, fetchDocument]);

  const handleDelete = async () => {
    if (!id) {
      showToast('Invalid document ID', 'error');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
        showToast('Document deleted successfully', 'success');
        navigate('/documents');
      } catch (error) {
        console.error('Error deleting document:', error);
        showToast('Failed to delete document', 'error');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-gray-600 dark:text-gray-400">Document not found</p>
        <Link to="/documents" className="mt-4 inline-block text-blue-600 hover:text-blue-800 dark:text-blue-400">
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{document.title}</h1>
          <div className="flex space-x-3">
            <Link
              to={`/documents/edit/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit
            </Link>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Share
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              <p>Last updated: {formatDate(document.updatedAt)}</p>
              <p>Created: {formatDate(document.createdAt)}</p>
              <p>Owner: {typeof document.owner === 'object' ? document.owner.name : 'You'}</p>
              
              {document.sharedWith && document.sharedWith.length > 0 && (
                <div className="mt-2">
                  <p>Shared with:</p>
                  <ul className="list-disc pl-5">
                    {document.sharedWith.map((user, index) => (
                      <li key={index}>
                        {typeof user === 'object' ? user.name : user}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{document.content}</div>
            </div>
            
            {document.fileUrl && (
              <div className="mt-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Attached File</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">{document.fileName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadFile(document._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <Link
            to="/documents"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Documents
          </Link>
        </div>
      </div>

      {/* Share Document Modal */}
      {isShareModalOpen && (
        <ShareDocumentModal
          documentId={id!}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onSuccess={() => {
            // Refresh document data to show updated shared users
            fetchDocument();
          }}
        />
      )}
    </div>
  );
};

export default DocumentViewPage;