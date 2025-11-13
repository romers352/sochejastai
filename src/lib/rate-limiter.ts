import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5, // Max 5 attempts per window
  blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes after exceeding limit
};

/**
 * Get client identifier from request (IP address)
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for reverse proxy setups)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Additional common proxy headers
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Final fallback when IP cannot be determined
  return 'unknown';
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && !entry.blocked) {
      rateLimitStore.delete(key);
    } else if (entry.blocked && now > entry.resetTime + RATE_LIMIT_CONFIG.blockDurationMs) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const clientId = getClientId(request);
  const now = Date.now();
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup on each request
    cleanupExpiredEntries();
  }
  
  let entry = rateLimitStore.get(clientId);
  
  // If no entry exists, create a new one
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      blocked: false,
    };
    rateLimitStore.set(clientId, entry);
  }
  
  // Check if client is currently blocked
  if (entry.blocked) {
    const blockEndTime = entry.resetTime + RATE_LIMIT_CONFIG.blockDurationMs;
    if (now < blockEndTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((blockEndTime - now) / 1000),
      };
    } else {
      // Block period has expired, reset the entry
      entry.count = 0;
      entry.resetTime = now + RATE_LIMIT_CONFIG.windowMs;
      entry.blocked = false;
    }
  }
  
  // Check if the current window has expired
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + RATE_LIMIT_CONFIG.windowMs;
    entry.blocked = false;
  }
  
  // Increment the count
  entry.count++;
  
  // Check if limit is exceeded
  if (entry.count > RATE_LIMIT_CONFIG.maxAttempts) {
    entry.blocked = true;
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil(RATE_LIMIT_CONFIG.blockDurationMs / 1000),
    };
  }
  
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Record a successful login (reset the rate limit for this client)
 */
export function recordSuccessfulLogin(request: NextRequest): void {
  const clientId = getClientId(request);
  rateLimitStore.delete(clientId);
}

/**
 * Get rate limit status for a client without incrementing
 */
export function getRateLimitStatus(request: NextRequest): {
  remaining: number;
  resetTime: number;
  blocked: boolean;
} {
  const clientId = getClientId(request);
  const entry = rateLimitStore.get(clientId);
  const now = Date.now();
  
  if (!entry) {
    return {
      remaining: RATE_LIMIT_CONFIG.maxAttempts,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      blocked: false,
    };
  }
  
  const isBlocked = entry.blocked && now < (entry.resetTime + RATE_LIMIT_CONFIG.blockDurationMs);
  const remaining = isBlocked ? 0 : Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - entry.count);
  
  return {
    remaining,
    resetTime: entry.resetTime,
    blocked: isBlocked,
  };
}