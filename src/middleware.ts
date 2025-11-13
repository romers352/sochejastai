import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply middleware to admin routes
  if (pathname.startsWith('/admin')) {
    // Check for JWT token first (new method)
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (adminToken) {
      const payload = verifyAdminToken(adminToken);
      if (payload?.isAdmin) {
        return NextResponse.next();
      }
    }
    
    // Fallback to legacy cookie for backward compatibility
    const legacyAdmin = request.cookies.get('admin')?.value;
    if (legacyAdmin === '1') {
      return NextResponse.next();
    }
    
    // No valid authentication found, redirect to login
    const loginUrl = new URL('/admin-login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Apply security headers to all admin API routes
  if (pathname.startsWith('/api/admin')) {
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};