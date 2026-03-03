import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
    } as Parameters<typeof jwt.sign>[2]);
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

export async function setTokenCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
    });
}

export async function getTokenFromCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    return token || null;
}

export async function clearTokenCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
}

export async function getUserFromToken(): Promise<JWTPayload | null> {
    const token = await getTokenFromCookie();
    if (!token) return null;
    return verifyToken(token);
}






