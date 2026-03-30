import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

// In-memory fallback when Redis is not available
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) return null; // Stop retrying
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
    connectTimeout: 3000,
  });

  redis.on('error', () => {
    // Silently ignore errors - we'll use memory fallback
  });
} catch {
  console.warn('⚠️ Redis not available — using in-memory store');
}

// Redis-like wrapper that falls back to in-memory
export const cache = {
  async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
    try {
      if (redis && redis.status === 'ready') {
        if (mode === 'EX' && duration) {
          await redis.set(key, value, 'EX', duration);
        } else {
          await redis.set(key, value);
        }
        return;
      }
    } catch {}
    // Fallback to in-memory
    const expiresAt = duration ? Date.now() + duration * 1000 : Infinity;
    memoryStore.set(key, { value, expiresAt });
  },

  async get(key: string): Promise<string | null> {
    try {
      if (redis && redis.status === 'ready') {
        return await redis.get(key);
      }
    } catch {}
    // Fallback to in-memory
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },

  async del(key: string): Promise<void> {
    try {
      if (redis && redis.status === 'ready') {
        await redis.del(key);
        return;
      }
    } catch {}
    memoryStore.delete(key);
  },

  async ping(): Promise<boolean> {
    try {
      if (redis && redis.status === 'ready') {
        await redis.ping();
        return true;
      }
    } catch {}
    return false;
  },

  async connect(): Promise<void> {
    try {
      if (redis) {
        await redis.connect();
        console.log('✅ Redis connected');
        return;
      }
    } catch {
      console.warn('⚠️ Redis not available — using in-memory store (OTPs will not persist across restarts)');
    }
  },

  disconnect(): void {
    try {
      if (redis && redis.status === 'ready') {
        redis.disconnect();
      }
    } catch {}
  },
};

export default cache;
