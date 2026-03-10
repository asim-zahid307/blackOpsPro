import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {queryOne, query} from '@/lib/db';
import {createToken} from '@/lib/jwt';
import {DBUser} from '@/types/domain';

export async function POST(request: NextRequest) {
    try {
        const {email, password} = await request.json() as { email?: string; password?: string };

        if (!email || !password) {
            return NextResponse.json(
                {error: 'Email and password are required'},
                {status: 400}
            );
        }

        const user = await queryOne<DBUser>(
            'SELECT id, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (!user) {
            return NextResponse.json(
                {error: 'Invalid email or password'},
                {status: 401}
            );
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return NextResponse.json(
                {error: 'Invalid email or password'},
                {status: 401}
            );
        }

        const token = await createToken({userId: user.id, email: user.email});

        // Fetch the user's first org to set context cookie
        const orgResult = await query(
            `SELECT org_id
             FROM user_organizations
             WHERE user_id = $1
             ORDER BY created_at ASC LIMIT 1`,
            [user.id]
        );
        const orgId: string | null = orgResult.rows[0]?.org_id ?? null;

        const response = NextResponse.json(
            {message: 'Login successful'},
            {status: 200}
        );

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        // Always set org cookie on login so server components can read it
        if (orgId) {
            response.cookies.set('current_org_id', orgId, {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
            });
        }

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            {error: 'An error occurred during login'},
            {status: 500}
        );
    }
}