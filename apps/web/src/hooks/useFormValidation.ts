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
    const validationRules = [
      { test: (p: string) => p.length >= 8, message: 'At least 8 characters long' },
      { test: (p: string) => /[A-Z]/.test(p), message: 'At least one uppercase letter' },
      { test: (p: string) => /[a-z]/.test(p), message: 'At least one lowercase letter' },
      { test: (p: string) => /[0-9]/.test(p), message: 'At least one number' },
      { test: (p: string) => /[^A-Za-z0-9]/.test(p), message: 'At least one special character' }
    ];
    
    const errors = validationRules
      .filter(rule => !rule.test(password))
      .map(rule => rule.message);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return { validateEmail, validatePassword };
};