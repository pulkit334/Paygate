import { isAxiosError } from "axios";

export function handleError(err: unknown): never {
  throw new Error(getErrorMessage(err));
}

export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    if (err.code === "ERR_NETWORK")
      return "Network error. Check your connection.";

    if (err.code === "ECONNABORTED")
      return "Request timed out.";

    return (
      err.response?.data?.message ??
      getHttpMessage(err.response?.status)
    );
  }

  if (err instanceof Error) return err.message;

  return "Something went wrong.";
}

export function getErrorCode(err: unknown): string {
  if (isAxiosError(err)) {
    return (
      err.response?.data?.code ??
      (err.response?.status
        ? `HTTP_${err.response.status}`
        : err.code ?? "UNKNOWN_ERROR")
    );
  }

  return "UNKNOWN_ERROR";
}

function getHttpMessage(status?: number): string {
  if (!status) return "Something went wrong.";

  const messages: Record<number, string> = {
    400: "Bad request.",
    401: "Authentication failed.",
    403: "Permission denied.",
    404: "Not found.",
    409: "Conflict.",
    422: "Invalid data.",
    429: "Too many requests.",
    500: "Server error.",
    502: "Bad gateway.",
    503: "Service unavailable.",
    504: "Gateway timeout.",
  };

  return messages[status] || "Request failed.";
}
