import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['get', 'head', 'options']);

/** Read a cookie value client-side (the CSRF cookie is deliberately not httpOnly). */
function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// API Client class
class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  /** Single-flight refresh: concurrent 401s share one rotation request. */
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies (refresh token + CSRF)
    });

    // Request interceptor: attach access token + CSRF double-submit header
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        if (!SAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
          const csrf = readCookie(CSRF_COOKIE);
          if (csrf) {
            config.headers[CSRF_HEADER] = csrf;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: on 401, rotate the refresh token once and replay
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined;

        if (
          error.response?.status !== 401 ||
          !originalRequest ||
          originalRequest._retry ||
          originalRequest.url === '/auth/refresh' ||
          originalRequest.url === '/auth/login' ||
          originalRequest.url === '/auth/signup'
        ) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        const hadSession = this.accessToken !== null;

        try {
          const token = await this.refreshSession();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return this.client(originalRequest);
        } catch (refreshError) {
          this.accessToken = null;
          // Only force re-login when an actual session expired mid-use;
          // anonymous visitors just get the 401 back.
          if (hadSession && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    );
  }

  /**
   * Rotate the session via POST /auth/refresh (Refresh Token Rotation on the
   * server). Deduplicated so a burst of parallel 401s performs exactly one
   * rotation — with RTR, a second concurrent refresh would present an
   * already-consumed token and trip the server's reuse alarm.
   */
  private refreshSession(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.client
        .post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh')
        .then((response) => {
          const token = response.data.data.accessToken;
          this.accessToken = token;
          return token;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  // GET
  async get<T>(url: string, config?: object): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST
  async post<T>(url: string, data?: unknown, config?: object): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT
  async put<T>(url: string, data?: unknown, config?: object): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH
  async patch<T>(url: string, data?: unknown, config?: object): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE
  async delete<T>(url: string, config?: object): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | { message?: string; details?: Record<string, unknown> }
        | undefined;
      return {
        code: error.response?.status.toString() || 'UNKNOWN_ERROR',
        message: data?.message || error.message,
        details: data?.details,
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export helper functions for backward compatibility
export const api = {
  get: <T>(url: string) => apiClient.get<T>(url),
  post: <T>(url: string, data: unknown) => apiClient.post<T>(url, data),
  put: <T>(url: string, data: unknown) => apiClient.put<T>(url, data),
  patch: <T>(url: string, data: unknown) => apiClient.patch<T>(url, data),
  delete: <T>(url: string) => apiClient.delete<T>(url),
  setToken: (token: string) => apiClient.setAccessToken(token),
  clearToken: () => apiClient.clearAccessToken(),
};
