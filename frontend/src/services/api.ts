import { buildApiUrl, apiConfig } from '../config/api';

// API response types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

export interface NameRequest {
  smiles: string | string[];
}

export interface NameResponse {
  names: string[];
}

export interface HealthResponse {
  status: string;
  startup_time: number;
  stout_loaded: boolean;
  version: string;
}

// Generic API client
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.timeout = apiConfig.timeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    const controller = new AbortController();
    
    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      return {
        data,
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<HealthResponse>> {
    return this.get<HealthResponse>('/health');
  }

  // Ping endpoint
  async ping(): Promise<ApiResponse<{ status: string }>> {
    return this.get<{ status: string }>('/ping');
  }

  // Get molecule name(s)
  async getMoleculeName(request: NameRequest): Promise<ApiResponse<NameResponse>> {
    return this.post<NameResponse>('/api/name', request);
  }

  // Test STOUT endpoint
  async testStout(): Promise<ApiResponse<any>> {
    return this.get('/test-stout');
  }

  // Test batch endpoint
  async testBatch(): Promise<ApiResponse<any>> {
    return this.get('/test-batch');
  }

  // Cache stats
  async getCacheStats(): Promise<ApiResponse<any>> {
    return this.get('/cache-stats');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Convenience functions for common operations
export const api = {
  health: () => apiClient.healthCheck(),
  ping: () => apiClient.ping(),
  name: (request: NameRequest) => apiClient.getMoleculeName(request),
  testStout: () => apiClient.testStout(),
  testBatch: () => apiClient.testBatch(),
  cacheStats: () => apiClient.getCacheStats(),
}; 