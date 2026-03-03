import { getUserFromToken } from './jwt';
import { redirect } from 'next/navigation';

export interface User {
    userId: string;
    email: string;
}

export async function requireAuth(): Promise<User> {
    const user = await getUserFromToken();

    if (!user) {
        redirect('/login');
    }

    return {
        userId: user.userId,
        email: user.email,
    };
}

export async function getUser(): Promise<User | null> {
    return await getUserFromToken();
}

