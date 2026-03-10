import {NextRequest, NextResponse} from 'next/server';
import {verifyToken} from '@/lib/jwt';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup'];

// Routes that are always public (API, static files)
const PUBLIC_PREFIXES = ['/api/login', '/api/signup', '/api/orgs', '/_next', '/favicon'];

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;

    // Allow public prefixes through
    if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return NextResponse.next();
    }

    // Allow public pages through
    if (PUBLIC_ROUTES.includes(pathname)) {
        return NextResponse.next();
    }

    // Check for auth token
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Verify the token is valid
    const payload = verifyToken(token);
    if (!payload) {
        const loginUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        // Clear the invalid token
        response.cookies.delete('auth-token');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};