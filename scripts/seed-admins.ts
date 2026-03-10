import bcrypt from 'bcryptjs';
import {Pool} from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({path: '.env.local'});

const pool = new Pool({connectionString: process.env.DATABASE_URL});

const admins = [
    {email: 'alphaadmin@gmail.com', password: 'alpha123', org: 'Alpha'},
    {email: 'betaadmin@gmail.com', password: 'beta123', org: 'Beta'},
    {email: 'gammaadmin@gmail.com', password: 'gamma123', org: 'Gamma'},
    {email: 'deltaadmin@gmail.com', password: 'delta123', org: 'Delta'},
];

async function seedAdmins() {
    const client = await pool.connect();
    try {
        for (const admin of admins) {
            const existing = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [admin.email]
            );

            let userId: string;

            if (existing.rows.length > 0) {
                userId = existing.rows[0].id as string;
                console.log(`↺ User already exists: ${admin.email}`);
            } else {
                const hash = await bcrypt.hash(admin.password, 10);
                const result = await client.query(
                    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
                    [admin.email, hash]
                );
                userId = result.rows[0].id as string;
                console.log(`✓ Created user: ${admin.email}`);
            }

            const orgResult = await client.query(
                'SELECT id FROM organizations WHERE name = $1',
                [admin.org]
            );

            if (orgResult.rows.length === 0) {
                console.log(`✗ Org not found: ${admin.org}`);
                continue;
            }

            const orgId = orgResult.rows[0].id as string;

            await client.query(
                `INSERT INTO user_organizations (user_id, org_id, role)
                 VALUES ($1, $2, 'admin') ON CONFLICT (user_id, org_id) DO
                UPDATE SET role = 'admin'`,
                [userId, orgId]
            );

            console.log(`✓ Linked ${admin.email} to ${admin.org} as admin`);
        }

        console.log('\n✅ Admin seeding complete!');
    } finally {
        client.release();
        await pool.end();
    }
}

seedAdmins().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});