import { Request, Response, NextFunction } from "express"
import { RedisClientType } from "redis"
import { getIP } from "../utils/ipData"
import { getRedisConnection } from "../redis"
import { config } from "../config"

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

    private getRedisKey(ip: string, period: string): string {
        return `${this.prefix}:${ip}:${period}`
    }

    private async incrementCount(ip: string, period: string, limit: number, expiry: number): Promise<boolean> {
        const key = this.getRedisKey(ip, period)
        const redis = await getRedisConnection()
        const currentCount = await redis.incr(key)
        if (currentCount === 1) {
            await redis.expire(key, expiry)
        }
        return currentCount >= limit
    }

    public async checkLimit(ip: string): Promise<{
        hourLimitReached: boolean,
        dayLimitReached: boolean,
        weekLimitReached: boolean,
        allowed: boolean
    }> {
        const hourLimitReached = await this.incrementCount(ip, 'hour', this.hourlyLimit, 3600)
        const dayLimitReached = await this.incrementCount(ip, 'day', this.dailyLimit, 86400)
        const weekLimitReached = await this.incrementCount(ip, 'week', this.weeklyLimit, 604800)

        const allowed = !(hourLimitReached || dayLimitReached || weekLimitReached)

        return { allowed, hourLimitReached, dayLimitReached, weekLimitReached }
    }
}

const listensRateLimiter = new RateLimiter("listens-rate-limit", config.listensHourlyRateLimit, config.listensDailyRateLimit, config.listensWeeklyRateLimit)

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const logger = res.locals.logger
    try {
        const ip = getIP(req)
        const limit = await listensRateLimiter.checkLimit(ip)
        if (!limit.allowed) {
            logger.info({ ...limit, ip }, "rate limit hit")
            res.status(429).json({ message: "Too Many Requests" })
            return
        }
        next()
    } catch (e: unknown) {
        logger.error({ error: e }, 'error calculating rate limit')
        next(e)
    }
}
