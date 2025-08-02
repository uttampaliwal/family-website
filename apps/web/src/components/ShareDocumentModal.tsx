import React, { useState } from 'react';
import { shareDocument } from '../api/documents';
import { useToast } from '../hooks/useToast';

interface ShareDocumentModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Simple client-side log sanitization
const sanitizeClientLog = (input: unknown): string => {
  return String(input ?? '').replace(/[\n\r\t\x00-\x1f\x7f-\x9f<>"'&]/g, '');
};

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({ 
  documentId, 
  isOpen, 
  onClose,
  onSuccess
}) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleShareError = (error: unknown) => {
    const errorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error',
      documentId: sanitizeClientLog(documentId),
      username: sanitizeClientLog(username),
      timestamp: new Date().toISOString(),
      operation: 'shareDocument'
    };
    console.error('Error sharing document:', JSON.stringify(errorInfo));
    
    let errorMessage = 'Failed to share document';
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'User not found. Please check the username.';
      } else if (error.message.includes('403') || error.message.includes('unauthorized')) {
        errorMessage = 'You do not have permission to share this document.';
      } else if (error.message.includes('400') || error.message.includes('already shared')) {
        errorMessage = 'Document is already shared with this user.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
    }
    
    showToast(errorMessage, 'error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      showToast('Please enter a username', 'error');
      return;
    }

    setLoading(true);
    
    try {
      await shareDocument(documentId, username);
      showToast('Document shared successfully', 'success');
      setUsername('');
      onSuccess();
      onClose();
    } catch (error) {
      handleShareError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Share Document</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter username to share with"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareDocumentModal;