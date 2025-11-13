import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const TOKEN_TTL_MINUTES = Number(process.env.ADMIN_TOKEN_TTL_MINUTES || 0);
const TOKEN_TTL_HOURS = Number(process.env.ADMIN_TOKEN_TTL_HOURS || 3);
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export interface AdminPayload {
  isAdmin: boolean;
  iat: number;
  exp: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for admin authentication
 */
export function generateAdminToken(): string {
  const payload = {
    isAdmin: true,
  };
  
  const expiresInSeconds = TOKEN_TTL_MINUTES > 0
    ? TOKEN_TTL_MINUTES * 60
    : Math.max(1, TOKEN_TTL_HOURS) * 60 * 60;

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresInSeconds,
    issuer: 'sochejastai-admin',
    audience: 'sochejastai-admin'
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'sochejastai-admin',
      audience: 'sochejastai-admin'
    }) as AdminPayload;
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract admin token from request cookies
 */
export function getAdminTokenFromRequest(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['admin-token'] || null;
}

/**
 * Check admin authentication using a raw Cookie header (for Route Handlers using Request)
 */
export function isAuthenticatedAdminFromCookieHeader(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  const token = cookies['admin-token'] || null;
  if (token) {
    const payload = verifyAdminToken(token);
    if (payload?.isAdmin) return true;
  }
  // Legacy fallback
  return cookies['admin'] === '1';
}

/**
 * Check if request is from authenticated admin
 */
export function isAuthenticatedAdmin(request: NextRequest): boolean {
  const token = getAdminTokenFromRequest(request);
  if (!token) return false;
  
  const payload = verifyAdminToken(token);
  return payload?.isAdmin === true;
}

/**
 * Validate admin password against environment variable
 */
export async function validateAdminPassword(password: string): Promise<boolean> {
  // Prefer plaintext password if provided (user opted for non-hash)
  if (ADMIN_PASSWORD) {
    return password === ADMIN_PASSWORD;
  }

  // Fallback to bcrypt hash if configured
  if (ADMIN_PASSWORD_HASH) {
    return verifyPassword(password, ADMIN_PASSWORD_HASH);
  }

  console.error('No admin password configured (set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH)');
  return false;
}

/**
 * Input validation for login attempts
 */
export function validateLoginInput(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (typeof password !== 'string') {
    return { isValid: false, error: 'Invalid password format' };
  }
  
  if (password.length < 1) {
    return { isValid: false, error: 'Password cannot be empty' };
  }
  
  if (password.length > 1000) {
    return { isValid: false, error: 'Password too long' };
  }
  
  return { isValid: true };
}