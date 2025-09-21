import React from "react";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { useForm, FieldValues, Path, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

// Generic form props
interface FormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: Partial<T>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

// Enhanced Form component with Zod validation
export function Form<T extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className = "",
  isLoading = false,
}: FormProps<T>) {
  const { logError } = useErrorHandler();
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange", // Validate on change for better UX
  });

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      logError(error as Error, {
        operation: "form_submission",
        metadata: { formSchema: schema._def.typeName || "unknown" },
      });
    }
  };

  return (
    <form
      onSubmit={methods.handleSubmit(handleSubmit)}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {children(methods)}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </form>
  );
}

// Input field component
interface InputFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "date" | "number";
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  methods: UseFormReturn<T>;
  className?: string;
}

export function InputField<T extends FieldValues>({
  name,
  label,
  type = "text",
  placeholder,
  description,
  required = false,
  disabled = false,
  autoComplete,
  methods,
  className = "",
}: InputFieldProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    register,
    formState: { errors },
  } = methods;

  const error = errors[name];
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-base"
      >
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          {...register(name)}
          id={name}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm
            placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            disabled:bg-surface disabled:text-muted disabled:cursor-not-allowed
            ${
              error
                ? "border-error focus:ring-error focus:border-error"
                : "border-border hover:border-border-hover"
            }
            ${isPassword ? "pr-10" : ""}
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-base"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {description && !error && (
        <p className="text-sm text-text-muted">{description}</p>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-1 text-sm text-error"
        >
          <ExclamationCircleIcon className="h-4 w-4" />
          <span>{error.message as string}</span>
        </motion.div>
      )}
    </div>
  );
}

// Textarea field component
interface TextareaFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  methods: UseFormReturn<T>;
  className?: string;
}

export function TextareaField<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  rows = 4,
  methods,
  className = "",
}: TextareaFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = methods;

  const error = errors[name];

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-base"
      >
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      <textarea
        {...register(name)}
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm resize-vertical
          placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed
          ${
            error
              ? "border-error focus:ring-error focus:border-error"
              : "border-border hover:border-border-hover"
          }
        `}
      />

      {description && !error && (
        <p className="text-sm text-text-muted">{description}</p>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-1 text-sm text-error"
        >
          <ExclamationCircleIcon className="h-4 w-4" />
          <span>{error.message as string}</span>
        </motion.div>
      )}
    </div>
  );
}

// Select field component
interface SelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  methods: UseFormReturn<T>;
  className?: string;
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  options,
  placeholder = "Select an option",
  description,
  required = false,
  disabled = false,
  methods,
  className = "",
}: SelectFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = methods;

  const error = errors[name];

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-base"
      >
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      <select
        {...register(name)}
        id={name}
        disabled={disabled}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed
          ${
            error
              ? "border-error focus:ring-error focus:border-error"
              : "border-border hover:border-border-hover"
          }
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {description && !error && (
        <p className="text-sm text-text-muted">{description}</p>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-1 text-sm text-error"
        >
          <ExclamationCircleIcon className="h-4 w-4" />
          <span>{error.message as string}</span>
        </motion.div>
      )}
    </div>
  );
}

// Checkbox field component
interface CheckboxFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  methods: UseFormReturn<T>;
  className?: string;
}

export function CheckboxField<T extends FieldValues>({
  name,
  label,
  description,
  required = false,
  disabled = false,
  methods,
  className = "",
}: CheckboxFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = methods;

  const error = errors[name];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            {...register(name)}
            id={name}
            type="checkbox"
            disabled={disabled}
            className={`
              h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? "border-error" : ""}
            `}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={name} className="font-medium text-text-base">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
          {description && <p className="text-text-muted">{description}</p>}
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-1 text-sm text-error ml-7"
        >
          <ExclamationCircleIcon className="h-4 w-4" />
          <span>{error.message as string}</span>
        </motion.div>
      )}
    </div>
  );
}

// Submit button component
interface SubmitButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SubmitButton({
  children,
  isLoading = false,
  disabled = false,
  className = "",
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={`
        w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm
        text-sm font-medium text-white bg-primary hover:bg-primary/90
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
