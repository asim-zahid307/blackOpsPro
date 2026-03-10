import {query} from './db';
import {Org} from '@/types/domain';

export async function getUserOrgs(userId: string): Promise<Org[]> {
    try {
        const result = await query(
            `SELECT o.id, o.name, o.created_at
             FROM organizations o
                      INNER JOIN user_organizations uo ON uo.org_id = o.id
             WHERE uo.user_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );
        return result.rows as Org[];
    } catch (error) {
        console.error('Error fetching orgs:', error);
        return [];
    }
}