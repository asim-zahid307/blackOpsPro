import { getUserFromToken, createToken, setTokenCookie, clearTokenCookie } from './jwt';
import { query, queryOne } from './db';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export interface User {
    userId: string;
    email: string;
}

export async function requireAuth(): Promise<User> {
    const user = await getUserFromToken();
    if (!user) redirect('/login');
    return { userId: user.userId, email: user.email };
}

export async function getUser(): Promise<User | null> {
    return await getUserFromToken();
}

export async function loginUser(email: string, password: string): Promise<string> {
    const user = await queryOne('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error('Invalid password');

    const token = await createToken({ userId: user.id, email: user.email });
    await setTokenCookie(token);
    return token;
}

export async function signupUser(email: string, password: string, orgId: string): Promise<string> {
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) throw new Error('User already exists');

    const hashed = await bcrypt.hash(password, 10);

    const result = await query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email', [email, hashed]);
    const newUser = result.rows[0];

    // Link user to selected org
    await query('INSERT INTO user_organizations (user_id, org_id) VALUES ($1, $2)', [newUser.id, orgId]);

    const token = await createToken({ userId: newUser.id, email: newUser.email });
    await setTokenCookie(token);
    return token;
}

export async function logoutUser() {
    await clearTokenCookie();
}