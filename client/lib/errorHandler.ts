import { ApiDataResponse } from "@/types";

interface ValidationErrors {
  [field: string]: string[];
}

interface ErrorData {
  errors?: ValidationErrors;
  [key: string]: unknown;
}

type ApiErrorResponse = ApiDataResponse<ErrorData>;

interface RTKQueryError {
  status?: number | string;
  data?: unknown;
  error?: string;
}

export const getErrorMessage = (
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again.",
): string => {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "object") {
    const apiError = error as RTKQueryError;

    const response = apiError.data as ApiErrorResponse | undefined;

    if (response) {
      const validationErrors = response.data?.errors;

      if (validationErrors) {
        const messages = Object.values(validationErrors).flat().filter(Boolean);

        if (messages.length > 0) {
          return messages.join(" ");
        }
      }

      if (response.message) {
        return response.message;
      }
    }

    if (apiError.error) {
      return apiError.error;
    }
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallbackMessage;
};
