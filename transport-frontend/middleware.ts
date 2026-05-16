import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';
  const adminAuthCookie = request.cookies.get('admin_token')?.value;

  const isStaffRoute = pathname.startsWith('/staff');
  const isStaffLoginPage = pathname === '/staff/login';
  const staffAuthCookie = request.cookies.get('staff_token')?.value;

  const isProtectedApi = (pathname === '/api/bookings' || pathname === '/api/summary') && request.method === 'GET';

  // Admin Auth Check
  if (isAdminRoute && !isAdminLoginPage) {
    if (!adminAuthCookie || adminAuthCookie !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (isAdminLoginPage && adminAuthCookie === 'authenticated') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Staff Auth Check
  if (isStaffRoute && !isStaffLoginPage) {
    if (!staffAuthCookie) { // staff token will contain the staffNumber
      return NextResponse.redirect(new URL('/staff/login', request.url));
    }
  }

  if (isStaffLoginPage && staffAuthCookie) {
    return NextResponse.redirect(new URL('/staff', request.url));
  }

  // API Auth Check
  if (isProtectedApi) {
    // Both admin and staff might need API access depending on the route, 
    // but right now only admin was accessing these GET routes.
    // For safety, require either admin or staff token.
    if ((!adminAuthCookie || adminAuthCookie !== 'authenticated') && !staffAuthCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin', '/staff/:path*', '/staff', '/api/bookings', '/api/summary'],
};
