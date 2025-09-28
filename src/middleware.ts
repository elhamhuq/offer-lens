import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  // Only check authentication for protected routes to reduce API calls
  const { pathname } = request.nextUrl
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient<Database>({ req: request, res })
    
    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()
    
    // Log session info for debugging
    console.log('Middleware session check:', session ? `User ${session.user.id} authenticated` : 'No session')
    
    // If accessing a protected route without a session, redirect to login
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  return res
}

// Apply this middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

