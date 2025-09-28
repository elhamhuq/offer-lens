/**
 * Rate limiting and error handling for Gemini API calls
 * Implements token bucket algorithm for rate limiting and exponential backoff for retries
 */

import { formatErrorMessage } from './responseFormatter'

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  maxRequests: number // Maximum requests per window
  windowMs: number // Time window in milliseconds
  maxRetries: number // Maximum retry attempts
  retryDelayMs: number // Initial retry delay
  backoffMultiplier: number // Exponential backoff multiplier
}

/**
 * Request metadata for tracking
 */
interface RequestMetadata {
  timestamp: Date
  userId?: string
  endpoint: string
  success: boolean
  errorMessage?: string
  retryCount: number
  responseTime?: number
}

/**
 * Rate limiter implementation using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private requestHistory: RequestMetadata[] = []
  
  constructor(private config: RateLimiterConfig) {
    this.tokens = config.maxRequests
    this.lastRefill = Date.now()
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest(userId?: string): boolean {
    this.refillTokens()
    
    // Check user-specific limits if userId provided
    if (userId) {
      const userRequests = this.getUserRequestCount(userId)
      if (userRequests >= Math.floor(this.config.maxRequests / 2)) {
        // User has used half the available tokens
        return false
      }
    }
    
    return this.tokens > 0
  }

  /**
   * Consume a token for a request
   */
  consumeToken(): boolean {
    this.refillTokens()
    
    if (this.tokens > 0) {
      this.tokens--
      return true
    }
    
    return false
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refillTokens(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = Math.floor(
      (timePassed / this.config.windowMs) * this.config.maxRequests
    )
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(
        this.config.maxRequests,
        this.tokens + tokensToAdd
      )
      this.lastRefill = now
    }
  }

  /**
   * Get the number of requests made by a user in the current window
   */
  private getUserRequestCount(userId: string): number {
    const windowStart = Date.now() - this.config.windowMs
    
    return this.requestHistory.filter(
      req => req.userId === userId && 
             req.timestamp.getTime() > windowStart &&
             req.success
    ).length
  }

  /**
   * Record a request for tracking
   */
  recordRequest(metadata: RequestMetadata): void {
    this.requestHistory.push(metadata)
    
    // Clean up old history
    const windowStart = Date.now() - this.config.windowMs * 2
    this.requestHistory = this.requestHistory.filter(
      req => req.timestamp.getTime() > windowStart
    )
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    availableTokens: number
    maxTokens: number
    resetTime: Date
    recentRequests: number
  } {
    this.refillTokens()
    
    const resetTime = new Date(this.lastRefill + this.config.windowMs)
    const windowStart = Date.now() - this.config.windowMs
    const recentRequests = this.requestHistory.filter(
      req => req.timestamp.getTime() > windowStart
    ).length
    
    return {
      availableTokens: this.tokens,
      maxTokens: this.config.maxRequests,
      resetTime,
      recentRequests,
    }
  }

  /**
   * Get wait time until next available token
   */
  getWaitTime(): number {
    if (this.tokens > 0) {
      return 0
    }
    
    const tokensNeeded = 1
    const timePerToken = this.config.windowMs / this.config.maxRequests
    return Math.ceil(tokensNeeded * timePerToken)
  }
}

/**
 * Error handler with retry logic
 */
export class ErrorHandler {
  constructor(private config: RateLimiterConfig) {}

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context?: {
      userId?: string
      endpoint?: string
      metadata?: any
    }
  ): Promise<T> {
    let lastError: any
    let retryCount = 0
    
    while (retryCount <= this.config.maxRetries) {
      try {
        const startTime = Date.now()
        const result = await fn()
        
        // Record successful request
        if (context?.endpoint) {
          this.recordSuccess(context.endpoint, context.userId, Date.now() - startTime)
        }
        
        return result
      } catch (error) {
        lastError = error
        retryCount++
        
        // Record failed request
        if (context?.endpoint) {
          this.recordError(
            context.endpoint,
            error,
            retryCount,
            context.userId
          )
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw this.enhanceError(error, retryCount, context)
        }
        
        // If we have retries left, wait before retrying
        if (retryCount <= this.config.maxRetries) {
          const delay = this.calculateBackoffDelay(retryCount)
          console.log(`⏳ Retrying in ${delay}ms (attempt ${retryCount}/${this.config.maxRetries})`)
          await this.sleep(delay)
        }
      }
    }
    
    // All retries exhausted
    throw this.enhanceError(lastError, retryCount, context)
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || ''
    
    // Non-retryable errors
    const nonRetryablePatterns = [
      /api\s*key/i,
      /unauthorized/i,
      /forbidden/i,
      /invalid\s*credentials/i,
      /account\s*suspended/i,
      /quota\s*exceeded/i,
    ]
    
    if (nonRetryablePatterns.some(pattern => pattern.test(errorMessage))) {
      return false
    }
    
    // Retryable errors
    const retryablePatterns = [
      /rate\s*limit/i,
      /timeout/i,
      /network/i,
      /temporary/i,
      /unavailable/i,
      /5\d{2}/, // 5xx errors
      /429/, // Too many requests
    ]
    
    return retryablePatterns.some(pattern => pattern.test(errorMessage))
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = this.config.retryDelayMs
    const multiplier = Math.pow(this.config.backoffMultiplier, retryCount - 1)
    const delay = baseDelay * multiplier
    
    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1)
    
    // Cap at 30 seconds
    return Math.min(delay + jitter, 30000)
  }

  /**
   * Enhance error with additional context
   */
  private enhanceError(
    error: any,
    retryCount: number,
    context?: any
  ): Error {
    const formatted = formatErrorMessage(error)
    
    const enhancedError = new Error(
      `${formatted.title}: ${formatted.message} (after ${retryCount} retries)`
    )
    
    ;(enhancedError as any).details = {
      originalError: error,
      retryCount,
      context,
      formatted,
      timestamp: new Date().toISOString(),
    }
    
    return enhancedError
  }

  /**
   * Record successful request
   */
  private recordSuccess(
    endpoint: string,
    userId?: string,
    responseTime?: number
  ): void {
    // This would typically log to a monitoring service
    console.log(`✅ Success: ${endpoint} (${responseTime}ms)`)
  }

  /**
   * Record error
   */
  private recordError(
    endpoint: string,
    error: any,
    retryCount: number,
    userId?: string
  ): void {
    // This would typically log to an error tracking service
    console.error(`❌ Error on ${endpoint} (retry ${retryCount}):`, error?.message || error)
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Default configurations for different API endpoints
 */
export const RateLimiterConfigs = {
  gemini: {
    maxRequests: 60, // 60 requests per minute
    windowMs: 60000, // 1 minute
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
  } as RateLimiterConfig,
  
  openai: {
    maxRequests: 100, // 100 requests per minute
    windowMs: 60000,
    maxRetries: 3,
    retryDelayMs: 500,
    backoffMultiplier: 1.5,
  } as RateLimiterConfig,
  
  embedding: {
    maxRequests: 200, // Higher limit for embeddings
    windowMs: 60000,
    maxRetries: 2,
    retryDelayMs: 250,
    backoffMultiplier: 1.5,
  } as RateLimiterConfig,
}

/**
 * API call wrapper with rate limiting and error handling
 */
export class APICallManager {
  private rateLimiters: Map<string, RateLimiter> = new Map()
  private errorHandlers: Map<string, ErrorHandler> = new Map()
  
  constructor() {
    // Initialize rate limiters for each API
    for (const [key, config] of Object.entries(RateLimiterConfigs)) {
      this.rateLimiters.set(key, new RateLimiter(config))
      this.errorHandlers.set(key, new ErrorHandler(config))
    }
  }

  /**
   * Execute an API call with rate limiting and error handling
   */
  async executeAPICall<T>(
    apiName: 'gemini' | 'openai' | 'embedding',
    fn: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    const rateLimiter = this.rateLimiters.get(apiName)
    const errorHandler = this.errorHandlers.get(apiName)
    
    if (!rateLimiter || !errorHandler) {
      throw new Error(`Unknown API: ${apiName}`)
    }
    
    // Check rate limit
    if (!rateLimiter.canMakeRequest(userId)) {
      const waitTime = rateLimiter.getWaitTime()
      throw new Error(
        `Rate limit exceeded for ${apiName}. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
      )
    }
    
    // Consume token
    if (!rateLimiter.consumeToken()) {
      throw new Error(`No tokens available for ${apiName}`)
    }
    
    // Execute with retry logic
    try {
      const result = await errorHandler.executeWithRetry(fn, {
        userId,
        endpoint: apiName,
      })
      
      // Record successful request
      rateLimiter.recordRequest({
        timestamp: new Date(),
        userId,
        endpoint: apiName,
        success: true,
        retryCount: 0,
      })
      
      return result
    } catch (error) {
      // Record failed request
      rateLimiter.recordRequest({
        timestamp: new Date(),
        userId,
        endpoint: apiName,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        retryCount: (error as any)?.details?.retryCount || 0,
      })
      
      throw error
    }
  }

  /**
   * Get rate limit status for all APIs
   */
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    
    const entries = Array.from(this.rateLimiters.entries())
    for (const [key, limiter] of entries) {
      status[key] = limiter.getStatus()
    }
    
    return status
  }

  /**
   * Check if a specific API is available
   */
  isAPIAvailable(apiName: string, userId?: string): boolean {
    const rateLimiter = this.rateLimiters.get(apiName)
    return rateLimiter ? rateLimiter.canMakeRequest(userId) : false
  }
}

// Export singleton instance
export const apiCallManager = new APICallManager()

/**
 * React hook for API call management
 */
export function useAPICall() {
  return {
    executeCall: <T>(
      apiName: 'gemini' | 'openai' | 'embedding',
      fn: () => Promise<T>,
      userId?: string
    ) => apiCallManager.executeAPICall(apiName, fn, userId),
    
    getStatus: () => apiCallManager.getStatus(),
    
    isAvailable: (apiName: string, userId?: string) =>
      apiCallManager.isAPIAvailable(apiName, userId),
  }
}
