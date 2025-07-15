/**
 * API Client for Partisipro Backend Integration
 * Configured to work with the NestJS backend API
 */

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    // Use environment variables for API configuration
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return this.defaultHeaders['Authorization']?.replace('Bearer ', '') || null;
  }

  /**
   * Generic request method
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const apiError: ApiError = {
          message: data.message || 'Request failed',
          statusCode: response.status,
          error: data.error,
          timestamp: data.timestamp,
          path: data.path,
        };
        throw apiError;
      }

      return data;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        // Re-throw API errors
        throw error;
      }

      // Handle network errors
      throw new Error(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    const headers = { ...this.defaultHeaders };
    // Remove Content-Type header for FormData (browser will set it automatically)
    delete headers['Content-Type'];

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }

  /**
   * Get API base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Update base URL (useful for development/testing)
   */
  setBaseURL(url: string): void {
    this.baseURL = url;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export the class for potential custom instances
export { ApiClient };

// Helper function for handling API errors in components
export function isApiError(error: any): error is ApiError {
  return (
    error &&
    typeof error.statusCode === 'number' &&
    typeof error.message === 'string'
  );
}

// Helper function to get error message
export function getErrorMessage(error: any): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
