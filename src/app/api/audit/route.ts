import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {getAuditLogs} from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const {orgId, role, user} = await requireOrg();

        const {searchParams} = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
        const offset = parseInt(searchParams.get('offset') ?? '0');

        const logs = await getAuditLogs(orgId, user.userId, role, limit, offset);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('GET /api/audit error:', error);
        return NextResponse.json({error: 'Failed to fetch audit logs'}, {status: 500});
    }
}