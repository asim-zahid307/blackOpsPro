import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { createToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await queryOne(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already in use' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const result = await query(
            'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id, email',
            [email, hashedPassword]
        );

        const newUser = result.rows[0];

        // Create JWT token
        const token = await createToken({
            userId: newUser.id,
            email: newUser.email,
        });

        // Set token in httpOnly cookie
        const response = NextResponse.json(
            { message: 'Signup successful' },
            { status: 201 }
        );

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'An error occurred during signup' },
            { status: 500 }
        );
    }
}

