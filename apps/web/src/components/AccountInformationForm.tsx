import React from "react";
import { useFormContext } from "react-hook-form";
import PasswordStrength from "./PasswordStrength";

interface AccountInformationFormProps {
  loading: boolean;
}

const AccountInformationForm: React.FC<AccountInformationFormProps> = ({
  loading,
}) => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-base mb-2"
        >
          Email <span className="text-error">*</span>
        </label>
        <input
          type="email"
          id="email"
          {...register("email")}
          required
          disabled={loading}
          className="input"
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="text-error text-sm mt-1">
            {errors.email.message as string}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-base mb-2"
        >
          Username <span className="text-error">*</span>
        </label>
        <input
          type="text"
          id="username"
          {...register("username")}
          required
          disabled={loading}
          className="input"
          placeholder="Choose a username"
        />
        {errors.username && (
          <p className="text-error text-sm mt-1">
            {errors.username.message as string}
          </p>
        )}
      </div>
      <div className="relative">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-base mb-2"
        >
          Password <span className="text-error">*</span>
        </label>
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          {...register("password")}
          required
          disabled={loading}
          className="input pr-10"
          placeholder="Enter password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-muted hover:text-base focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                clipRule="evenodd"
              />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        {errors.password && (
          <p className="text-error text-sm mt-1">
            {errors.password.message as string}
          </p>
        )}
        <PasswordStrength password={watch("password") || ""} />
      </div>
      <div className="relative">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-base mb-2"
        >
          Confirm Password <span className="text-error">*</span>
        </label>
        <input
          type={showConfirmPassword ? "text" : "password"}
          id="confirmPassword"
          {...register("confirmPassword")}
          required
          disabled={loading}
          className="input pr-10"
          placeholder="Confirm your password"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-[38px] text-muted hover:text-base focus:outline-none"
          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
        >
          {showConfirmPassword ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                clipRule="evenodd"
              />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        {errors.confirmPassword && (
          <p className="text-error text-sm mt-1">
            {errors.confirmPassword.message as string}
          </p>
        )}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Password must contain at least 8 characters, one uppercase letter, one
        lowercase letter, one number, and one special character.
      </div>
    </div>
  );
};

export default AccountInformationForm;
