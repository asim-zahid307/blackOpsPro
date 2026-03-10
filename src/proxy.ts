import {NextRequest, NextResponse} from 'next/server';
import {verifyToken} from '@/lib/jwt';

const PUBLIC_ROUTES = ['/login', '/signup'];

const PUBLIC_PREFIXES = [
    '/api/login',
    '/api/signup',
    '/api/orgs',
    '/api/invites/info',
    '/api/health',
    '/invite/',
    '/_next',
    '/favicon',
];

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;

    if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return NextResponse.next();
    }

    if (PUBLIC_ROUTES.includes(pathname)) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const payload = verifyToken(token);
    if (!payload) {
        const loginUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('auth-token');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};