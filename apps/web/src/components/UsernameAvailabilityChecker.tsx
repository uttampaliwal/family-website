import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/axios";

interface UsernameAvailabilityCheckerProps {
  username: string;
  currentUsername?: string;
  onAvailabilityChange: (isAvailable: boolean, isLoading: boolean) => void;
}

const UsernameAvailabilityChecker: React.FC<
  UsernameAvailabilityCheckerProps
> = ({ username, currentUsername, onAvailabilityChange }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkUsernameAvailability = useCallback(
    async (usernameToCheck: string) => {
      if (!usernameToCheck || usernameToCheck === currentUsername) {
        setIsAvailable(null);
        onAvailabilityChange(true, false);
        return;
      }

      if (usernameToCheck.length < 3) {
        setIsAvailable(false);
        onAvailabilityChange(false, false);
        return;
      }

      setIsChecking(true);
      onAvailabilityChange(false, true);

      try {
        const response = await api.get(
          `/api/auth/check-username/${encodeURIComponent(usernameToCheck)}`,
        );
        const available = response.data.available;
        setIsAvailable(available);
        onAvailabilityChange(available, false);
      } catch (error) {
        console.error("Error checking username availability:", error);
        setIsAvailable(false);
        onAvailabilityChange(false, false);
      } finally {
        setIsChecking(false);
      }
    },
    [currentUsername, onAvailabilityChange],
  );

  const debouncedCheck = useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return (value: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
    };
  }, [checkUsernameAvailability]);

  useEffect(() => {
    debouncedCheck(username);
    return () => {
      debouncedCheck.cancel();
    };
  }, [username, debouncedCheck]);

  if (!username || username === currentUsername) {
    return null;
  }

  if (isChecking) {
    return (
      <div className="flex items-center text-sm text-muted">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
        Checking availability...
      </div>
    );
  }

  if (isAvailable === null) {
    return null;
  }

  return (
    <div
      className={`flex items-center text-sm ${isAvailable ? "text-success" : "text-error"}`}
    >
      {isAvailable ? (
        <>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Username is available
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          Username is not available
        </>
      )}
    </div>
  );
};

export default UsernameAvailabilityChecker;
