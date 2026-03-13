import axios, { AxiosError } from 'axios';

export type ApiErrorCode =
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR';

export interface ApiErrorResponse {
  message: string;
  code?: ApiErrorCode;
  details?: unknown;
}

const REDIRECT_AUTH_CODES = new Set<ApiErrorCode>(['SESSION_EXPIRED']);

function shouldRedirectToLogin(status?: number, code?: ApiErrorCode) {
  return status === 401 && !!code && REDIRECT_AUTH_CODES.has(code);
}

export const http = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (shouldRedirectToLogin(status, code)) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        const loginUrl = `/login?reason=session_expired&redirect=${encodeURIComponent(currentPath)}`;
        window.location.href = loginUrl;
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred.') {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  return error.response?.data?.message || error.message || fallback;
}

export function getApiErrorCode(error: unknown): ApiErrorCode | undefined {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return undefined;
  }

  return error.response?.data?.code;
}

export function isApiError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError<ApiErrorResponse>(error);
}
