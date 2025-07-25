// API Configuration for different environments
interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// SessionToken interface removed - not used

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Configuration for different environments
const configs: Record<string, ApiConfig> = {
  development: {
    baseUrl: 'http://localhost:8000',
    timeout: 45000, // 45 seconds for development
  },
  production: {
    baseUrl: 'https://api.orgolab.ca',
    timeout: 60000, // 60 seconds for production
  },
};

// Get current configuration
const getCurrentConfig = (): ApiConfig => {
  if (isDevelopment) {
    return configs.development;
  }
  return configs.production;
};

// Export configuration
export const apiConfig = getCurrentConfig();

class ApiClient {
  private authToken: string | null = null;

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  async makeRequest(endpoint: string, data: any, signal?: AbortSignal): Promise<Response> {
    if (!this.authToken) {
      throw new Error('No authentication token available');
    }
    
    return fetch(`${apiConfig.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(data),
      signal,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = apiConfig.baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Add new function for making authenticated requests
export const makeAuthenticatedRequest = async (endpoint: string, data: any, signal?: AbortSignal): Promise<Response> => {
  return apiClient.makeRequest(endpoint, data, signal);
};

// Export environment info for debugging
export const environmentInfo = {
  isDevelopment,
  isProduction,
  baseUrl: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
}; 