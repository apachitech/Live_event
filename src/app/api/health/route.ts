import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;
  let redisStatus = 'healthy';

  // 1. Check Database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbStatus = `unhealthy: ${err.message}`;
  }

  // 2. Check Redis / Memory cache status
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      redisStatus = 'connected';
    } else {
      redisStatus = 'in-memory-fallback';
    }
  } catch (err: any) {
    redisStatus = `fallback: ${err.message}`;
  }

  const isHealthy = !dbStatus.startsWith('unhealthy');
  const totalLatencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'live-stream-platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        redis: {
          status: redisStatus,
        },
      },
      latencyMs: totalLatencyMs,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
