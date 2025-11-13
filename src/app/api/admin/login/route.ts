import { NextRequest, NextResponse } from "next/server";
import { validateAdminPassword, generateAdminToken, validateLoginInput } from "@/lib/auth";
import { checkRateLimit, recordSuccessfulLogin } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // Check rate limiting first
    const rateLimitResult = checkRateLimit(req);
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { 
          error: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter 
        }, 
        { status: 429 }
      );
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', '5');
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
      }
      
      return response;
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { password } = body;
    
    // Validate input
    const validation = validateLoginInput(password);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if admin credentials are configured (accept hash or plaintext)
    if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
      console.error('Admin password env not set (ADMIN_PASSWORD or ADMIN_PASSWORD_HASH)');
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Verify password
    const isValidPassword = await validateAdminPassword(password);
    
    if (isValidPassword) {
      // Generate JWT token
      const token = generateAdminToken();
      
      // Record successful login (reset rate limit)
      recordSuccessfulLogin(req);
      
      // Create response with secure cookie
      const response = NextResponse.json({ 
        success: true,
        message: "Login successful" 
      });
      
      // Determine TTL for cookie to match token
      const ttlMinutes = Number(process.env.ADMIN_TOKEN_TTL_MINUTES || 0);
      const ttlHours = Number(process.env.ADMIN_TOKEN_TTL_HOURS || 3);
      const cookieMaxAgeSeconds = ttlMinutes > 0 ? ttlMinutes * 60 : Math.max(1, ttlHours) * 60 * 60;

      // Set secure JWT cookie
      response.cookies.set("admin-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: "/",
        // Align cookie maxAge with token TTL
        maxAge: cookieMaxAgeSeconds,
      });
      
      // Keep legacy cookie for backward compatibility
      response.cookies.set("admin", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: "/",
        maxAge: cookieMaxAgeSeconds,
      });
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      
      return response;
    }
    
    // Invalid password
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}