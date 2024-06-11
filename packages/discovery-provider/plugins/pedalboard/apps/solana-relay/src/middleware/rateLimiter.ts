import { Request, Response, NextFunction } from "express"
import { getIP } from "../utils/ipData"
import { getRedisConnection } from "../redis"
import { LISTENS_RATE_LIMIT_IP_PREFIX, LISTENS_RATE_LIMIT_TRACK_PREFIX, config } from "../config"
import { recordListenParamsSchema } from "../routes/listen/listen"

export class RateLimiter {
    private hourlyLimit: number
    private dailyLimit: number
    private weeklyLimit: number
    private prefix: string

    constructor(prefix: string, hourlyLimit: number, dailyLimit: number, weeklyLimit: number) {
        this.prefix = prefix
        this.hourlyLimit = hourlyLimit
        this.dailyLimit = dailyLimit
        this.weeklyLimit = weeklyLimit
    }

    private getRedisKey(entityKey: string, period: string): string {
        return `${this.prefix}:${entityKey}:${period}`
    }

    private async consume(entityKey: string, period: string, limit: number, expiry: number): Promise<boolean> {
        const key = this.getRedisKey(entityKey, period)
        const redis = await getRedisConnection()
        const currentCount = await redis.incr(key)
        if (currentCount === 1) {
            await redis.expire(key, expiry)
        }
        return currentCount >= limit
    }

    // track count or 
    public async checkLimit(entityKey: string): Promise<{
        hourLimitReached: boolean,
        dayLimitReached: boolean,
        weekLimitReached: boolean,
        allowed: boolean
    }> {
        const promises = [
            this.consume(entityKey, 'hour', this.hourlyLimit, 3600),
            this.consume(entityKey, 'day', this.dailyLimit, 86400),
            this.consume(entityKey, 'week', this.weeklyLimit, 604800)
        ]

        const [hourLimitReached, dayLimitReached, weekLimitReached] = await Promise.all(promises)

        const allowed = !(hourLimitReached || dayLimitReached || weekLimitReached)

        return { allowed, hourLimitReached, dayLimitReached, weekLimitReached }
    }
}
