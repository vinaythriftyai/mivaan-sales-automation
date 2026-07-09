import axios from "axios";
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) return error.response?.data?.error?.message ?? error.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
}
