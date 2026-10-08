import redis from '../lib/redis.js';

export async function getCached(key) {
    try {
        return (await redis.get(key)) ?? null;
    } catch (err) {
        console.error('Redis get failed, falling back to DB', err);
        return null;
    }
}

export async function setCached(key, value, ttlSeconds) {
    try {
        await redis.set(key, value, { ex: ttlSeconds });
    } catch (err) {
        console.error('Redis set failed, continuing without cache', err);
    }
}

export async function invalidate(...keys) {
    try {
        if (keys.length > 0) await redis.del(...keys);
    } catch (err) {
        console.error('Redis invalidate failed', err);
    }
}