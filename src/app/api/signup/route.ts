import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {query, queryOne} from '@/lib/db';
import {createToken} from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        const {email, password, orgId} = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                {error: 'Email and password are required'},
                {status: 400}
            );
        }

        if (!orgId) {
            return NextResponse.json(
                {error: 'Organization selection is required'},
                {status: 400}
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                {error: 'Password must be at least 6 characters'},
                {status: 400}
            );
        }

        // Check email not already used
        const existingUser = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser) {
            return NextResponse.json(
                {error: 'Email already in use'},
                {status: 409}
            );
        }

        // Verify org exists
        const org = await queryOne('SELECT id FROM organizations WHERE id = $1', [orgId]);
        if (!org) {
            return NextResponse.json(
                {error: 'Selected organization does not exist'},
                {status: 400}
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );
        const newUser = result.rows[0];

        // Link user to org as 'member' by default
        await query(
            `INSERT INTO user_organizations (user_id, org_id, role)
             VALUES ($1, $2, 'member')`,
            [newUser.id, orgId]
        );

        const token = await createToken({userId: newUser.id, email: newUser.email});

        const response = NextResponse.json(
            {message: 'Signup successful'},
            {status: 201}
        );

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        // Also set the current org cookie right away
        response.cookies.set('current_org_id', orgId, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            {error: 'An error occurred during signup'},
            {status: 500}
        );
    }
}