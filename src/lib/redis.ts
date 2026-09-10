import Redis from 'ioredis';
import EventEmitter from 'events';

class MemoryRedisStore extends EventEmitter {
  private store = new Map<string, string>();
  private expiries = new Map<string, number>();

  async get(key: string): Promise<string | null> {
    const exp = this.expiries.get(key);
    if (exp && Date.now() > exp) {
      this.store.delete(key);
      this.expiries.delete(key);
      return null;
    }
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    this.store.set(key, value);
    if (mode === 'EX' && duration) {
      this.expiries.set(key, Date.now() + duration * 1000);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key) ? 1 : 0;
    this.expiries.delete(key);
    return deleted;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0', 10);
    const next = current + 1;
    this.store.set(key, next.toString());
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.expiries.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  async publish(channel: string, message: string): Promise<number> {
    this.emit(channel, message);
    return 1;
  }

  subscribe(channel: string, cb: (message: string) => void) {
    this.on(channel, cb);
  }
}

const memoryStore = new MemoryRedisStore();

let redisClient: Redis | null = null;
let redisPub: Redis | null = null;
let redisSub: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
    redisPub = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
    redisSub = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
  } catch (err) {
    console.warn('[Redis] Connection failed, using in-memory pub-sub fallback:', err);
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export const cache = {
  async get(key: string): Promise<string | null> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        return await redisClient.get(key);
      } catch {
        return memoryStore.get(key);
      }
    }
    return memoryStore.get(key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        if (ttlSeconds) {
          await redisClient.set(key, value, 'EX', ttlSeconds);
        } else {
          await redisClient.set(key, value);
        }
        return;
      } catch {}
    }
    await memoryStore.set(key, value, ttlSeconds ? 'EX' : undefined, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.del(key);
        return;
      } catch {}
    }
    await memoryStore.del(key);
  },

  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const current = await memoryStore.incr(key);
    if (current === 1) {
      await memoryStore.expire(key, windowSeconds);
    }
    const remaining = Math.max(0, limit - current);
    return {
      allowed: current <= limit,
      remaining,
    };
  },

  async publish(channel: string, data: any): Promise<void> {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    if (redisPub && redisPub.status === 'ready') {
      try {
        await redisPub.publish(channel, payload);
        return;
      } catch {}
    }
    await memoryStore.publish(channel, payload);
  },

  subscribe(channel: string, callback: (data: any) => void) {
    if (redisSub && redisSub.status === 'ready') {
      try {
        redisSub.subscribe(channel);
        redisSub.on('message', (chan, msg) => {
          if (chan === channel) {
            try {
              callback(JSON.parse(msg));
            } catch {
              callback(msg);
            }
          }
        });
        return;
      } catch {}
    }
    memoryStore.subscribe(channel, (msg) => {
      try {
        callback(JSON.parse(msg));
      } catch {
        callback(msg);
      }
    });
  }
};
