interface DebounceOptions {
  immediate?: boolean;
  leading?: boolean;
  trailing?: boolean;
}

interface SmartDebounceConfig {
  fastDelay: number;     // Initial delay for first request
  normalDelay: number;   // Delay after first request
  maxDelay: number;      // Maximum delay for rapid changes
  resetThreshold: number; // Time after which to reset to fast delay
}

class SmartDebouncer<T extends (...args: any[]) => any> {
  private timeoutId: number | null = null;
  private lastCallTime = 0;
  private consecutiveCalls = 0;
  private hasBeenCalled = false;
  private func: T;
  private config: SmartDebounceConfig;
  private options: DebounceOptions;

  constructor(
    func: T,
    config: SmartDebounceConfig,
    options: DebounceOptions = {}
  ) {
    this.func = func;
    this.config = config;
    this.options = options;
  }

  execute(...args: Parameters<T>): void {
    const now = Date.now();
    
    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Check if we should reset to fast delay
    if (now - this.lastCallTime > this.config.resetThreshold) {
      this.consecutiveCalls = 0;
      this.hasBeenCalled = false;
    }

    this.lastCallTime = now;
    this.consecutiveCalls++;

    // Determine delay based on call pattern
    let delay: number;
    
    if (!this.hasBeenCalled) {
      // First call ever or after reset period - use fast delay
      delay = this.config.fastDelay;
    } else if (this.consecutiveCalls <= 3) {
      // Recent calls - use normal delay
      delay = this.config.normalDelay;
    } else {
      // Many rapid calls - use max delay to prevent spam
      delay = Math.min(
        this.config.normalDelay * Math.pow(1.5, this.consecutiveCalls - 3),
        this.config.maxDelay
      );
    }

    // Execute immediately if leading option is true and it's the first call
    if (this.options.leading && !this.hasBeenCalled) {
      this.func(...args);
      this.hasBeenCalled = true;
      return;
    }

    // Schedule execution
    this.timeoutId = window.setTimeout(() => {
      if (this.options.trailing !== false) {
        this.func(...args);
      }
      this.hasBeenCalled = true;
      this.timeoutId = null;
    }, delay);
  }

  // Cancel pending execution
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // Execute immediately and cancel pending
  flush(...args: Parameters<T>): void {
    this.cancel();
    this.func(...args);
    this.hasBeenCalled = true;
  }

  // Check if there's a pending execution
  isPending(): boolean {
    return this.timeoutId !== null;
  }

  // Reset the debouncer state
  reset(): void {
    this.cancel();
    this.lastCallTime = 0;
    this.consecutiveCalls = 0;
    this.hasBeenCalled = false;
  }

  // Get current delay that would be used
  getCurrentDelay(): number {
    if (!this.hasBeenCalled) {
      return this.config.fastDelay;
    } else if (this.consecutiveCalls <= 3) {
      return this.config.normalDelay;
    } else {
      return Math.min(
        this.config.normalDelay * Math.pow(1.5, this.consecutiveCalls - 3),
        this.config.maxDelay
      );
    }
  }
}

// Factory function for creating smart debouncers
export function createSmartDebouncer<T extends (...args: any[]) => any>(
  func: T,
  config: Partial<SmartDebounceConfig> = {},
  options: DebounceOptions = {}
): SmartDebouncer<T> {
  const defaultConfig: SmartDebounceConfig = {
    fastDelay: 600,        // Fast delay for responsive UX
    normalDelay: 1200,     // Normal delay for subsequent requests
    maxDelay: 3000,        // Maximum delay for rapid changes
    resetThreshold: 8000   // Reset to fast after 8s of inactivity
  };

  const finalConfig = { ...defaultConfig, ...config };
  return new SmartDebouncer(func, finalConfig, options);
}

// Specialized debouncer for naming requests (simplified)
export function createNamingDebouncer<T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions = {}
): SmartDebouncer<T> {
  return createSmartDebouncer(
    func,
    {
      fastDelay: 500,       // Very fast initial naming (models are pre-cached)
      normalDelay: 1000,    // Fast delay for subsequent requests
      maxDelay: 2500,       // Lower max delay since responses are faster
      resetThreshold: 6000  // Reset to fast after 6s of inactivity
    },
    options
  );
} 