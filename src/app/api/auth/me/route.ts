import {NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';

export async function GET() {
    try {
        const {user, role, orgId} = await requireOrg();
        return NextResponse.json({userId: user.userId, email: user.email, role, orgId});
    } catch {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
}