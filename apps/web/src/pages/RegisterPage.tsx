import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import type { SubmitHandler, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { normalizeGender } from "../lib/gender";
import { registerSchema } from "../lib/validationSchemas";
import PersonalDetailsForm from "../components/PersonalDetailsForm";
import AccountInformationForm from "../components/AccountInformationForm";

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { register } = useAuth(); // Use the register function from context

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

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setLoading(true);

    try {
      const response = await register({
        ...data,
        gender: normalizeGender(data.gender),
      });

      showToast(
        response.data.message || "Registration successful! Redirecting...",
        "success",
      );
      // Redirect to profile page as user is now logged in
      navigate(`/profile/${response.data.username}`);
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
    if (isValid) {
      // react-hook-form's `isValid` is not reliable after trigger, so we check just for trigger success
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
        <div className="auth-header flex justify-center py-6 bg-primary/5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <img
              src="/family-portal-logo.svg"
              alt="Logo"
              className="w-10 h-10 text-primary"
            />
          </div>
        </div>

        <div className="auth-form px-8 pb-8 pt-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-primary">
              {t("auth.createAccount")}
            </h1>
            <p className="text-text-muted">{t("auth.joinFamilyPortal")}</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress Bar Background */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-border rounded-full -z-10"></div>

              {/* Progress Bar Active */}
              <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-300"
                style={{ width: step === 1 ? "50%" : "100%" }}
              ></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center bg-surface px-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                    step >= 1
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                      : "bg-surface border-border text-text-muted"
                  }`}
                >
                  1
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                    step >= 1 ? "text-primary" : "text-text-muted"
                  }`}
                >
                  Personal
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center bg-surface px-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                    step >= 2
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                      : "bg-surface border-border text-text-muted"
                  }`}
                >
                  2
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                    step >= 2 ? "text-primary" : "text-text-muted"
                  }`}
                >
                  Account
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
                    {t("auth.back")}
                  </button>
                )}
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="btn btn-primary w-full"
                  >
                    {t("auth.next")}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-1/2"
                  >
                    {loading ? t("auth.registering") : t("auth.register")}
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        </div>

        <div className="text-center mt-6">
          <p className="text-muted">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-secondary transition-colors"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
