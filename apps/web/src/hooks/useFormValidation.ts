import { useCallback } from 'react';

export const useFormValidation = () => {
  const validateEmail = useCallback((email: string) => {
    if (!email || typeof email !== 'string') {
      return false;
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0 || trimmedEmail.length > 254) {
      return false;
    }
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(trimmedEmail);
  }, []);

  const validatePassword = useCallback((password: string) => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('At least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('At least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('At least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('At least one special character');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return { validateEmail, validatePassword };
};