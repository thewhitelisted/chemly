// API Configuration for different environments
interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

interface SessionToken {
  token: string;
  expires_at: string;
  expires_in: number;
}

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
  private sessionToken: SessionToken | null = null;
  private tokenRefreshPromise: Promise<SessionToken> | null = null;

  async getSessionToken(): Promise<string> {
    // Check if we have a valid token
    if (this.sessionToken && new Date(this.sessionToken.expires_at) > new Date()) {
      return this.sessionToken.token;
    }

    // If already refreshing, wait for that promise
    if (this.tokenRefreshPromise) {
      const token = await this.tokenRefreshPromise;
      return token.token;
    }

    // Start new refresh
    this.tokenRefreshPromise = this.refreshSessionToken();
    try {
      const token = await this.tokenRefreshPromise;
      return token.token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async refreshSessionToken(): Promise<SessionToken> {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get session token: ${response.status}`);
      }

      const sessionData = await response.json();
      this.sessionToken = sessionData;
      return sessionData;
    } catch (error) {
      console.error('Session token refresh failed:', error);
      throw error;
    }
  }

  async makeRequest(endpoint: string, data: any, signal?: AbortSignal): Promise<Response> {
    const token = await this.getSessionToken();
    
    return fetch(`${apiConfig.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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