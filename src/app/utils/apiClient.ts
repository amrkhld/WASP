import { retryOperation, isRetryableError } from './retryOperation';
import { logger } from './logger';

interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.defaultTimeout = config.timeout || 10000;
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig = {}
  ): Promise<Response> {
    const timeout = config.timeout || this.defaultTimeout;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') 
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'API request failed',
        response.status,
        data
      );
    }

    return data;
  }

  async request<T>(
    path: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    return retryOperation(
      async () => {
        try {
          const response = await this.fetchWithTimeout(url, config);
          return await this.handleResponse(response);
        } catch (error) {
          logger.error('API request failed', {
            url,
            method: config.method || 'GET',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      {
        maxAttempts: 3,
        shouldRetry: isRetryableError
      }
    );
  }

  async get<T>(path: string, config: RequestConfig = {}): Promise<T> {
    return this.request(path, { ...config, method: 'GET' });
  }

  async post<T>(
    path: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request(path, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    path: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request(path, {
      ...config,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(data),
    });
  }

  async delete<T>(path: string, config: RequestConfig = {}): Promise<T> {
    return this.request(path, { ...config, method: 'DELETE' });
  }
}

export const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
});