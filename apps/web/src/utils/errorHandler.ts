import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown): string {
  let errorMessage = "An unexpected error occurred. Please try again.";

  if (isAxiosError(error)) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const responseData = error.response.data;
      if (typeof responseData === "string" && responseData.length > 0) {
        errorMessage = responseData;
      } else if (
        responseData &&
        typeof responseData === "object" &&
        "message" in responseData
      ) {
        errorMessage = (responseData as { message: string }).message;
      } else {
        errorMessage = `Request failed with status code ${error.response.status}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage =
        "Network error. Please check your internet connection and try again.";
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message || errorMessage;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return errorMessage;
}
