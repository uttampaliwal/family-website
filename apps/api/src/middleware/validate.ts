import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Constants for validation patterns and messages
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
const PASSWORD_ERROR_MESSAGE = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';

// Joi Schemas for validation
export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      'string.pattern.base': PASSWORD_ERROR_MESSAGE,
    }),
  dob: Joi.string().isoDate().required(),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).allow('', null),
  username: Joi.string().alphanum().min(3).max(30).required(),
  gender: Joi.string().valid('Male', 'Female', 'Prefer not to say').required(),
});

export const loginSchema = Joi.object({
  identifier: Joi.string().required(), // Can be email or username
  password: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

export const resendVerificationSchema = Joi.object({
  identifier: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().optional(), // Make token optional in the body since it might be in the URL params
  password: Joi.string()
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      'string.pattern.base': PASSWORD_ERROR_MESSAGE,
    }),
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((err) => 
        String(err.message).replace(/[<>"'&]/g, '')
      );
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    next();
  };
};