// API Configuration for different environments
interface ApiConfig {
  baseUrl: string;
  timeout: number;
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
    baseUrl: 'https://orgodraw-154315492861.us-east4.run.app',
    timeout: 45000, // 45 seconds for production
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

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = apiConfig.baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Export environment info for debugging
export const environmentInfo = {
  isDevelopment,
  isProduction,
  baseUrl: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
}; 