import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm, FormProvider } from "react-hook-form";
import type { SubmitHandler, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import api from "../services/axios";
import { useToast } from "../hooks/useToast";
import { ensureCsrfToken } from "../utils/csrf";
import { normalizeGender } from "../lib/gender";
import { registerSchema } from "../lib/validationSchemas";
import PersonalDetailsForm from "../components/PersonalDetailsForm";
import AccountInformationForm from "../components/AccountInformationForm";

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const methods = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      dob: "",
      mobileNumber: "",
      username: "",
      gender: "",
      relationship: "",
    },
  });

  const { errors } = methods.formState;

  React.useEffect(() => {
    const errorValues = Object.values(errors);
    if (errorValues.length > 0) {
      showToast(
        (errorValues[0] as FieldError)?.message || "An error occurred",
        "error",
      );
    }
  }, [errors, showToast]);

  const onSubmit: SubmitHandler<RegisterFormValues> = async () => {
    setLoading(true);
    const isValid = await methods.trigger();
    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      await ensureCsrfToken();
      const allData = methods.getValues();
      const response = await api.post(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/auth/register`,
        {
          ...allData,
          gender: normalizeGender(allData.gender),
        },
      );

      if (response.status === 201) {
        showToast(
          "Registration successful! Please check your email for verification.",
          "success",
        );
        setTimeout(() => navigate("/login"), 3000);
      } else {
        showToast(
          response.data.message || "An unexpected error occurred.",
          "error",
        );
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const isValid = await methods.trigger([
      "name",
      "dob",
      "gender",
      "relationship",
      "mobileNumber",
    ]);
    if (isValid && methods.formState.isValid) {
      setStep(2);
    }
  };

  const handlePrevious = () => {
    setStep(1);
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
            Create Account
          </h1>
          <p className="text-muted">Join our family portal today</p>
        </div>

        <div className="auth-form">
          <div className="auth-header"></div>

          <div className="p-4 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div
                  className={
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm " +
                    (step === 1
                      ? "bg-primary text-on-primary"
                      : "bg-surface text-muted")
                  }
                >
                  1
                </div>
                <span
                  className={
                    "ml-2 text-xs sm:text-sm " +
                    (step === 1
                      ? "text-sm sm:text-base font-medium"
                      : "text-muted")
                  }
                >
                  Personal Details
                </span>
              </div>
              <div className="flex-1 mx-2 sm:mx-4 h-0.5 sm:h-1 bg-border"></div>
              <div className="flex items-center">
                <div
                  className={
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm " +
                    (step === 2
                      ? "bg-primary text-on-primary"
                      : "bg-surface text-muted")
                  }
                >
                  2
                </div>
                <span
                  className={
                    "ml-2 text-xs sm:text-sm " +
                    (step === 2
                      ? "text-sm sm:text-base font-medium"
                      : "text-muted")
                  }
                >
                  Account Info
                </span>
              </div>
            </div>
          </div>

          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="p-4 sm:p-8 pt-2"
            >
              {step === 1 && <PersonalDetailsForm loading={loading} />}
              {step === 2 && <AccountInformationForm loading={loading} />}

              <div className="flex space-x-4 pt-4">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={loading}
                    className="btn btn-secondary w-1/2"
                  >
                    Back
                  </button>
                )}
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="btn btn-primary w-full"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-1/2"
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        </div>

        <div className="text-center mt-6">
          <p className="text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-secondary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
