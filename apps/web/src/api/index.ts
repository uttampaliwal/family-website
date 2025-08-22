// Re-export all API modules for easier imports
export * from './auth';
export * from './documents';
export * from './axios';

// Create centralized API object
import * as authApi from './auth';
import * as documentsApi from './documents';

export { authApi, documentsApi };