import {NextResponse} from 'next/server';
import {query} from '@/lib/db';

export async function GET() {
    const start = Date.now();

    try {
        // Ping the database
        await query('SELECT 1');
        const dbLatency = Date.now() - start;

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            db: {
                status: 'ok',
                latency_ms: dbLatency,
            },
        });
    } catch (err) {
        console.error('[health] DB check failed:', err);
        return NextResponse.json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            db: {
                status: 'error',
                error: err instanceof Error ? err.message : 'Unknown error',
            },
        }, {status: 503});
    }
}