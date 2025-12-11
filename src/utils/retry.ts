import { ErrorType } from '../types';

/**
 * Classify error để retry strategy phù hợp
 */
export function classifyError(error: any): ErrorType {
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.code;
  
  if (status === 429 || message.includes('rate limit')) {
    return 'RATE_LIMIT';
  }
  
  if (status === 403 || message.includes('quota')) {
    return 'QUOTA_EXCEEDED';
  }
  
  if (message.includes('network') || message.includes('timeout') || message.includes('econnreset')) {
    return 'NETWORK_ERROR';
  }
  
  return 'UNKNOWN';
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Smart retry với error-specific backoff
 */
export async function retryWithSmartBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  onRetry?: (attempt: number, error: ErrorType) => void
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorType = classifyError(error);
      
      // Don't retry on quota exceeded
      if (errorType === 'QUOTA_EXCEEDED') {
        throw new Error('API quota exceeded. Please try again later.');
      }
      
      // Last attempt - throw error
      if (attempt >= maxRetries) {
        break;
      }
      
      // Calculate delay based on error type
      let delay: number;
      switch (errorType) {
        case 'RATE_LIMIT':
          delay = 30000 * attempt; // 30s, 60s, 90s
          break;
        case 'NETWORK_ERROR':
          delay = 2000 * attempt; // 2s, 4s, 6s
          break;
        default:
          delay = 5000 * Math.pow(2, attempt - 1); // 5s, 10s, 20s
      }
      
      onRetry?.(attempt, errorType);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Circuit Breaker để tránh spam API khi có vấn đề
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold: number;
  private readonly timeout: number;
  
  constructor(threshold: number = 5, timeout: number = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        // Timeout passed, try half-open
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN. Please try again later.');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
  
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

