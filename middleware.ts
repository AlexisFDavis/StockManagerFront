import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas públicas (no requieren autenticación)
const publicRoutes = ['/login']

// Rutas de API públicas
const publicApiRoutes = ['/api/auth/login', '/api/auth/logout']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Permitir API públicas
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/logout')) {
    return NextResponse.next()
  }

  // Verificar autenticación para rutas protegidas
  const sessionCookie = request.cookies.get('stock-manager-session')

  // Si no hay sesión y es una ruta protegida, redirigir a login
  if (!sessionCookie && !pathname.startsWith('/api')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si no hay sesión y es una API protegida, retornar 401
  if (!sessionCookie && pathname.startsWith('/api')) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

