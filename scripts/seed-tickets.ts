import {Pool} from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {fileURLToPath} from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path: path.resolve(__dirname, '../.env.local')});

const pool = new Pool({connectionString: process.env.DATABASE_URL});

const TITLES = [
    'API gateway returning 503 on high load',
    'Database connection pool exhausted',
    'Memory leak in worker process',
    'SSL certificate expiring soon',
    'Login page blank for Safari users',
    'Webhook delivery failing silently',
    'Cron job not running on schedule',
    'S3 bucket permissions misconfigured',
    'Redis cache hit rate dropping',
    'Email notifications delayed by 2 hours',
    'Dashboard charts not loading',
    'Search indexing falling behind',
    'CDN serving stale assets',
    'Rate limiter blocking legitimate users',
    'Background job queue backing up',
    'OAuth token refresh failing',
    'Payment gateway timeout errors',
    'DNS resolution slow in EU region',
    'Mobile app crashing on startup',
    'Report generation timing out',
    'File upload failing for large files',
    'Two-factor auth codes not arriving',
    'Audit log not capturing admin actions',
    'Session expiry too aggressive',
    'CI pipeline failing on deploy step',
    'Metrics dashboard showing stale data',
    'Slack integration stopped posting',
    'PDF export producing blank pages',
    'CSV import silently dropping rows',
    'Invite emails landing in spam',
];

const DESCRIPTIONS = [
    'Users are reporting intermittent failures. Started around 14:00 UTC. Possibly related to the deploy from earlier today.',
    'Seeing elevated error rates in production logs. P99 latency has spiked significantly in the last hour.',
    'Monitoring alerts triggered. On-call engineer is investigating. No customer impact confirmed yet.',
    'Multiple users reported this via support tickets. Reproduction steps are unclear so far.',
    'Automated health check flagged this. Manual review needed to confirm severity.',
    'Started after the latest dependency upgrade. Rolling back is being considered.',
    'Intermittent — affects roughly 5% of requests. Hard to reproduce locally.',
    'First reported by an enterprise customer. Prioritising due to SLA commitments.',
    null,
    null,
];

const STATUSES = ['open', 'investigating', 'mitigated', 'resolved'] as const;
const SEVERITIES = [1, 2, 3, 4, 5];

const TAGS = [
    'production',
    'database',
    'auth',
    'performance',
    'security',
    'billing',
    'api',
    'frontend',
    'infra',
    'urgent',
];

// FIX: allow readonly arrays
function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickOrNull<T>(arr: readonly T[], nullChance = 0.3): T | null {
    if (Math.random() < nullChance) return null;
    return pick(arr);
}

function randomDate(daysBack: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
    d.setHours(Math.floor(Math.random() * 24));
    d.setMinutes(Math.floor(Math.random() * 60));
    return d;
}

async function main() {
    const client = await pool.connect();
    console.log('Connected to database');

    try {
        const orgsRes = await client.query(`SELECT id
                                            FROM organizations`);
        const orgs = orgsRes.rows as { id: string }[];

        if (orgs.length === 0) {
            console.error('No organizations found. Run seed-admins.ts first.');
            process.exit(1);
        }

        const usersRes = await client.query(
            `SELECT uo.user_id, uo.org_id
             FROM user_organizations uo`
        );
        const memberships = usersRes.rows as { user_id: string; org_id: string }[];

        if (memberships.length === 0) {
            console.error('No org memberships found.');
            process.exit(1);
        }

        const tagIds: Record<string, Record<string, string>> = {};

        for (const org of orgs) {
            tagIds[org.id] = {};

            for (const tag of TAGS) {
                const res = await client.query(
                    `INSERT INTO tags (org_id, name)
                     VALUES ($1, $2) ON CONFLICT (org_id, name) DO
                    UPDATE SET name = EXCLUDED.name
                        RETURNING id`,
                    [org.id, tag]
                );

                tagIds[org.id][tag] = res.rows[0].id;
            }
        }

        console.log('Tags ensured for all orgs');

        const TOTAL = 10000;
        const BATCH = 100;
        let inserted = 0;

        for (let i = 0; i < TOTAL; i += BATCH) {
            await client.query('BEGIN');

            for (let j = 0; j < BATCH && inserted < TOTAL; j++) {
                const org = pick(orgs);
                const orgMembers = memberships.filter((m) => m.org_id === org.id);

                if (orgMembers.length === 0) continue;

                const creator = pick(orgMembers);
                const assignee = pickOrNull(orgMembers, 0.2);

                const status = pick(STATUSES);
                const severity = pick(SEVERITIES);
                const title = pick(TITLES);
                const description = pickOrNull(DESCRIPTIONS, 0.2) as string | null;

                const createdAt = randomDate(180);
                const updatedAt = new Date(
                    createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
                );

                const deletedAt = Math.random() < 0.03 ? updatedAt : null;

                const ticketRes = await client.query(
                    `INSERT INTO tickets
                     (org_id, title, description, status, severity, assignee_id, created_by, created_at, updated_at,
                      deleted_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                    [
                        org.id,
                        title,
                        description,
                        status,
                        severity,
                        assignee?.user_id ?? null,
                        creator.user_id,
                        createdAt,
                        updatedAt,
                        deletedAt,
                    ]
                );

                const ticketId = ticketRes.rows[0].id;

                const numTags = Math.floor(Math.random() * 4);
                const shuffled = Object.values(tagIds[org.id]).sort(
                    () => Math.random() - 0.5
                );

                for (let t = 0; t < numTags; t++) {
                    await client.query(
                        `INSERT INTO ticket_tags (ticket_id, tag_id)
                         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [ticketId, shuffled[t]]
                    );
                }

                await client.query(
                    `INSERT INTO ticket_events (ticket_id, org_id, actor_id, event_type, new_value, created_at)
                     VALUES ($1, $2, $3, 'ticket_created', $4, $5)`,
                    [ticketId, org.id, creator.user_id, title, createdAt]
                );

                inserted++;
            }

            await client.query('COMMIT');
            process.stdout.write(`\rInserted ${inserted}/${TOTAL} tickets...`);
        }

        console.log(
            `\nDone! Inserted ${inserted} tickets across ${orgs.length} orgs.`
        );
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\nError:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();