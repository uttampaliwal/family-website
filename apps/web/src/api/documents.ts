import api from './axios';

// Constants for better maintainability
const API_ENDPOINTS = {
  DOCUMENTS: '/documents',
  DOCUMENT_BY_ID: (id: string) => `/documents/${id}`,
  DOCUMENT_DOWNLOAD: (id: string) => `/documents/${id}/download`,
  DOCUMENT_SHARE: (id: string) => `/documents/${id}/share`
} as const;

// Utility functions for validation
const validateId = (id: string): string => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Document ID is required');
  }
  // Sanitize to prevent NoSQL injection and validate ObjectId format
  const sanitized = String(id).trim().replace(/[{}$]/g, '');
  if (sanitized === '' || !/^[a-f\d]{24}$/i.test(sanitized)) {
    throw new Error('Invalid document ID format');
  }
  return sanitized;
};

const validateUsername = (username: string): string => {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    throw new Error('Username is required');
  }
  // Sanitize to prevent NoSQL injection
  const sanitized = String(username).trim().replace(/[{}$]/g, '');
  if (sanitized === '') {
    throw new Error('Invalid username format');
  }
  return sanitized;
};

export interface User {
  _id: string;
  username: string;
  name: string;
}

export interface Document {
  _id: string;
  title: string;
  content: string;
  owner: string | User;
  sharedWith: (string | User)[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

// Get all documents
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const response = await api.get(API_ENDPOINTS.DOCUMENTS);
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid documents data received');
    }
    
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch documents');
  }
};

// Get a single document
export const getDocumentById = async (id: string): Promise<Document> => {
  const validatedId = validateId(id);
  const response = await api.get(API_ENDPOINTS.DOCUMENT_BY_ID(validatedId));
  
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Invalid document data received');
  }
  
  return response.data;
};

// Create a new document
export const createDocument = async (title: string, content: string, file?: File): Promise<Document> => {
  if (!file) {
    const response = await api.post(API_ENDPOINTS.DOCUMENTS, { title, content });
    return response.data;
  }
  
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('file', file);
  
  const response = await api.post(API_ENDPOINTS.DOCUMENTS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Update a document
export const updateDocument = async (id: string, title: string, content: string): Promise<Document> => {
  const validatedId = validateId(id);
  const response = await api.put(API_ENDPOINTS.DOCUMENT_BY_ID(validatedId), { title, content });
  return response.data;
};

// Download a document file
export const downloadFile = async (id: string): Promise<void> => {
  const validatedId = validateId(id);
  window.open(`${api.defaults.baseURL}${API_ENDPOINTS.DOCUMENT_DOWNLOAD(validatedId)}`, '_blank');
};

// Delete a document
export const deleteDocument = async (id: string): Promise<void> => {
  const validatedId = validateId(id);
  await api.delete(API_ENDPOINTS.DOCUMENT_BY_ID(validatedId));
};

// Share a document
export const shareDocument = async (id: string, username: string): Promise<void> => {
  const validatedId = validateId(id);
  const validatedUsername = validateUsername(username);
  
  await api.post(API_ENDPOINTS.DOCUMENT_SHARE(validatedId), { username: validatedUsername });
};