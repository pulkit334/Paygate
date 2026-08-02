export interface CircuitBreakerConfig {
  threshold: number;         
  duration: number;     
  minimumRps?: number;    
  halfOpenAfter: number;    
  halfOpenSampling?: {
    calls: number;
    threshold: number;
  };
}
export interface TimeoutConfig {
duration : number
}
export interface RetryConfig {
  maxAttempts: number;

  initialDelay: number;

  maxDelay: number;

  shouldRetry: (error: unknown) => boolean;
}

export interface BulkHeadConif {
  maxConcurrency : number;
  maxQueueSize : number
}
