import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocumentById, createDocument, updateDocument } from '../api/documents';
import { useToast } from '../hooks/useToast';

const LoadingSpinner = memo(() => (
  <span className="flex items-center">
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Saving...
  </span>
));

const DocumentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNewDocument = id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(!isNewDocument);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (isNewDocument) return;
      
      try {
        const document = await getDocumentById(id!);
        setTitle(document.title);
        setContent(document.content);
      } catch (error) {
        console.error('Error fetching document:', error);
        showToast('Failed to load document', 'error');
        navigate('/documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, isNewDocument, navigate, showToast]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files ? e.target.files[0] : null);
  }, []);

  const handleCancel = useCallback(() => {
    navigate('/documents');
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    setSaving(true);
    
    try {
      if (isNewDocument) {
        await createDocument(title, content, file || undefined);
        showToast('Document created successfully', 'success');
      } else {
        await updateDocument(id!, title, content);
        showToast('Document updated successfully', 'success');
      }
      navigate('/documents');
    } catch (error) {
      // Structured error logging with context
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        documentId: isNewDocument ? 'new' : id,
        title: title,
        timestamp: new Date().toISOString(),
        operation: isNewDocument ? 'createDocument' : 'updateDocument'
      };
      console.error('Error saving document:', JSON.stringify(errorInfo));
      
      let errorMessage = 'Failed to save document';
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('unauthorized')) {
          errorMessage = 'You do not have permission to save this document.';
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          errorMessage = 'File is too large. Please choose a smaller file.';
        } else if (error.message.includes('400') || error.message.includes('validation')) {
          errorMessage = 'Invalid document data. Please check your input.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          {isNewDocument ? 'Create New Document' : 'Edit Document'}
        </h1>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={handleTitleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Document Title"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="content" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={handleContentChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white h-64"
              placeholder="Document Content"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="file" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Attach File (Optional)
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supported formats: PDF, Word, Excel, Text, CSV, ZIP, Images
            </p>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? <LoadingSpinner /> : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentEditPage;