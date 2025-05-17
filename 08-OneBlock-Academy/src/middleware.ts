import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  console.log('Middleware triggered for:', req.nextUrl.pathname);
  const token = await auth(req);
  const pathname = req.nextUrl.pathname;
  
  // Check if the route is protected
  const isProtectedApi = pathname.startsWith('/api/admin') || 
                          pathname.startsWith('/api/teacher') || 
                          pathname.startsWith('/api/student');
                          
  const isProtectedWeb = pathname.startsWith('/admin') || 
                         pathname.startsWith('/teacher') || 
                         pathname.startsWith('/student');

  // Authentication check - no token means unauthorized
  if (!token) {
    // For protected API routes, return 401 Unauthorized
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For protected web routes, redirect to home page
    if (isProtectedWeb) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    // For non-protected routes, allow access
    return NextResponse.next();
  }
  
  // User is authenticated, now check authorization based on role
  const role = token.role;
  
  // Admin routes - only admin role can access
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Redirect to appropriate role-based page
      const url = req.nextUrl.clone();
      url.pathname = role === 'teacher' || role === 'assistant' ? '/teacher' : '/student';
      return NextResponse.redirect(url);
    }
  }
  
  // Teacher routes - only admin and teacher/assistant roles can access
  if (pathname.startsWith('/teacher') || pathname.startsWith('/api/teacher')) {
    if (role !== 'admin' && role !== 'teacher' && role !== 'assistant') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Redirect students to student page
      const url = req.nextUrl.clone();
      url.pathname = role === 'student' ? '/student' : '/';
      return NextResponse.redirect(url);
    }
  }
  
  // Student routes - admin, teacher/assistant, and student roles can access
  if (pathname.startsWith('/student') || pathname.startsWith('/api/student')) {
    if (role !== 'admin' && role !== 'teacher' && role !== 'assistant' && role !== 'student') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Redirect to home page
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }
  
  // If authenticated and authorized, add authorization header for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('Authorization', `Bearer ${token.accessToken}`);
    return NextResponse.next({ headers: requestHeaders });
  }
  
  // Allow access to the route
  return NextResponse.next();
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
   
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/api/admin/:path*',
    '/api/teacher/:path*',
    '/api/student/:path*'
  ],
};
