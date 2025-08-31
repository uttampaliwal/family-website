import Joi from "joi";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from "express";

import { htmlEncode } from "../utils/sanitization.js";

// Constants for validation patterns and messages
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
const PASSWORD_ERROR_MESSAGE =
  "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";

// Joi Schemas for validation
export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    "string.pattern.base": PASSWORD_ERROR_MESSAGE,
  }),
  dob: Joi.string().isoDate().required(),
  mobileNumber: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .allow("", null),
  // Allow underscores to match frontend and controller validation
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9_]{3,30}$/)
    .required(),
  // Accept standardized lowercase values
  gender: Joi.string().valid("male", "female", "prefer not to say").required(),
  relationship: Joi.string()
    .valid(
      "self",
      "father",
      "mother",
      "son",
      "daughter",
      "brother",
      "sister",
      "husband",
      "wife",
      "grandfather",
      "grandmother",
      "uncle",
      "aunt",
      "cousin",
      "nephew",
      "niece",
      "son-in-law",
      "daughter-in-law",
      "brother-in-law",
      "sister-in-law",
      "other",
    )
    .required(),
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
  password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    "string.pattern.base": PASSWORD_ERROR_MESSAGE,
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    "string.pattern.base": PASSWORD_ERROR_MESSAGE,
  }),
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction,
  ): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const categorizedErrors = error.details.map((err) => ({
        field: htmlEncode(String(err.path?.join(".") || "")),
        message: htmlEncode(String(err.message || "")),
        type: htmlEncode(String(err.type || "")),
      }));

      res.status(400).json({
        message: "Validation failed",
        errors: categorizedErrors,
        errorCount: categorizedErrors.length,
      });
      return;
    }
    next();
  };
};
