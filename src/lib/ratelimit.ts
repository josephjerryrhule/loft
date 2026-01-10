import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory rate limiting for development
// For production, use Upstash Redis or similar
class InMemoryRatelimit {
  private requests: Map<string, number[]> = new Map();
  private maxTokens: number;
  private windowMs: number;

  constructor(tokens: number, window: string) {
    this.maxTokens = tokens;
    // Convert window string to milliseconds
    const windowMatch = window.match(/(\d+)(\w)/);
    if (!windowMatch) throw new Error("Invalid window format");
    const value = parseInt(windowMatch[1]);
    const unit = windowMatch[2];
    this.windowMs = unit === 's' ? value * 1000 : unit === 'm' ? value * 60000 : value * 3600000;
  }

  async limit(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    
    // Remove expired timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    if (validTimestamps.length >= this.maxTokens) {
      const oldestTimestamp = validTimestamps[0];
      return {
        success: false,
        remaining: 0,
        reset: oldestTimestamp + this.windowMs,
      };
    }
    
    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);
    
    return {
      success: true,
      remaining: this.maxTokens - validTimestamps.length,
      reset: now + this.windowMs,
    };
  }
}

// Create rate limiters
function createRateLimiter(tokens: number, window: string) {
  // Use Upstash Redis if configured, otherwise use in-memory
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Convert window format to milliseconds for Upstash
    const windowMatch = window.match(/(\d+)(\w)/);
    if (!windowMatch) throw new Error("Invalid window format");
    const value = parseInt(windowMatch[1]);
    const unit = windowMatch[2];
    const windowMs = unit === 's' ? value * 1000 : unit === 'm' ? value * 60000 : value * 3600000;

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, `${windowMs}ms`),
      analytics: true,
    });
  }
  
  // Fallback to in-memory for development
  return new InMemoryRatelimit(tokens, window);
}

// Rate limiters for different use cases
export const loginRateLimit = createRateLimiter(5, "15m"); // 5 attempts per 15 minutes
export const apiRateLimit = createRateLimiter(100, "1m"); // 100 requests per minute
export const passwordResetRateLimit = createRateLimiter(3, "1h"); // 3 requests per hour
export const emailVerificationRateLimit = createRateLimiter(5, "1h"); // 5 requests per hour
