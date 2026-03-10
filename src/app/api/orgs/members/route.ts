import {NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {getOrgMembers} from '@/lib/tickets';

export async function GET() {
    try {
        const {orgId} = await requireOrg();
        const members = await getOrgMembers(orgId);
        return NextResponse.json(members);
    } catch (error) {
        console.error('GET /api/orgs/members error:', error);
        return NextResponse.json({error: 'Failed to fetch members'}, {status: 500});
    }
}