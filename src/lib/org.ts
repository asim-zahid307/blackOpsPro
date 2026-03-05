import { query } from './db';
import { Org } from '@/types/domain';

export async function getUserOrgs(userId: string): Promise<Org[]> {
    try {
        const result = await query(
            'SELECT id, name, created_at FROM organizations WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows as Org[];
    } catch (error) {
        console.error('Error fetching orgs:', error);
        return [];
    }
}
