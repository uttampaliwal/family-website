import React, { useState } from "react";
import { useToast } from "../hooks/useToast";

export interface FormField {
  name: string;
  type: "text" | "email" | "password" | "select" | "checkbox" | "textarea";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
  };
}

export interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
  isLoading?: boolean;
  initialValues?: Record<string, unknown>;
  className?: string;
}

/**
 * Legacy Form component that matches the test expectations
 * Uses fields array instead of render props pattern
 */
export const FormLegacy: React.FC<FormProps> = ({
  fields,
  onSubmit,
  submitLabel = "Submit",
  isLoading = false,
  initialValues = {},
  className = "",
}) => {
  const [formData, setFormData] =
    useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const validateField = (field: FormField, value: unknown): string | null => {
    if (field.required && (!value || value.toString().trim() === "")) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const { minLength, maxLength, pattern, custom } = field.validation;

      if (minLength && value && value.toString().length < minLength) {
        return `${field.label} must be at least ${minLength} characters`;
      }

      if (maxLength && value && value.toString().length > maxLength) {
        return `${field.label} must be no more than ${maxLength} characters`;
      }

      if (pattern && value && !pattern.test(value.toString())) {
        return `${field.label} format is invalid`;
      }

      if (custom && value) {
        return custom(value);
      }
    }

    // Email validation
    if (field.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Invalid email format";
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      showToast("Form submitted successfully", "success");
    } catch (error) {
      console.error("Form submission error:", error);
      showToast("Form submission failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || "";
    const error = errors[field.name];
    const isFieldLoading = isLoading || isSubmitting;

    const baseInputClasses = `
      w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      ${error ? "border-red-500" : "border-gray-300"}
      ${isFieldLoading ? "opacity-50 cursor-not-allowed" : ""}
    `;

    switch (field.type) {
      case "select":
        return (
          <div key={field.name} className="mb-4">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              id={field.name}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              disabled={isFieldLoading}
              className={baseInputClasses}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.name} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) =>
                  handleInputChange(field.name, e.target.checked)
                }
                disabled={isFieldLoading}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="mb-4">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={field.name}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={isFieldLoading}
              rows={4}
              className={baseInputClasses}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.name} className="mb-4">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              id={field.name}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={isFieldLoading}
              className={baseInputClasses}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {fields.map(renderField)}

      <button
        type="submit"
        disabled={isLoading || isSubmitting}
        className={`
          w-full px-4 py-2 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${
            isLoading || isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }
        `}
      >
        {isSubmitting ? "Submitting..." : submitLabel}
      </button>
    </form>
  );
};

// Export as both named and default for compatibility
export { FormLegacy as Form };
export default FormLegacy;
