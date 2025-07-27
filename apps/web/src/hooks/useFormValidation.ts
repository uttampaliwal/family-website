import { useCallback } from 'react';

export const useFormValidation = () => {
  const validateEmail = useCallback((email: string) => {
    try {
      if (!email || typeof email !== 'string') {
        return false;
      }
      const trimmedEmail = email.trim();
      if (trimmedEmail.length === 0 || trimmedEmail.length > 254) {
        return false;
      }
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    } catch (error) {
      console.error('Error validating email:', error);
      return false;
    }
  }, []);

  const validatePassword = useCallback((password: string) => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('at least one special character');
    }
    return errors;
  }, []);

  return { validateEmail, validatePassword };
};