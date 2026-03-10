import {NextResponse} from 'next/server';

export async function POST() {
    const response = NextResponse.json({message: 'Logged out successfully'});

    // Clear auth token
    response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    // Clear org context
    response.cookies.set('current_org_id', '', {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    return response;
}