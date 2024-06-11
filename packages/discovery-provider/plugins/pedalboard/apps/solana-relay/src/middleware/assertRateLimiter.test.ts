import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { RateLimiter } from "./rateLimiter";
import { config } from "../config";
import { getRedisConnection } from "../redis";

beforeEach(async () => {
    // run with npm run test with audius-compose up
    config.redisUrl = "redis://0.0.0.0:6379/00"
    const redis = await getRedisConnection()
    let cursor = '0';
    do {
        for await (const key of redis.scanIterator()) {
            if (key.startsWith('listens-rate-limit')) {
                await redis.del(key)
            }
        }
    } while (cursor !== '0')
})

describe('Rate Limiter', function () {
    describe('Rate Limiter Rate Limits', function () {
        it('disallows when one limit is reached', async function () {
            const userIP = "1.2.3.4"

            const hourLimitLimiter = new RateLimiter("listens-rate-limit-hour", 1, 2, 2)
            const checkHour = await hourLimitLimiter.checkLimit(userIP)
            expect(checkHour.allowed).toBe(false)
            expect(checkHour.hourLimitReached).toBe(true)
            expect(checkHour.dayLimitReached).toBe(false)
            expect(checkHour.weekLimitReached).toBe(false)

            const dayLimitLimiter = new RateLimiter("listens-rate-limit-day", 2, 1, 2)
            const checkDay = await dayLimitLimiter.checkLimit(userIP)
            expect(checkDay.allowed).toBe(false)
            expect(checkDay.hourLimitReached).toBe(false)
            expect(checkDay.dayLimitReached).toBe(true)
            expect(checkDay.weekLimitReached).toBe(false)

            const weekLimitLimiter = new RateLimiter("listens-rate-limit-week", 2, 2, 1)
            const checkWeek = await weekLimitLimiter.checkLimit(userIP)
            expect(checkWeek.allowed).toBe(false)
            expect(checkWeek.hourLimitReached).toBe(false)
            expect(checkWeek.dayLimitReached).toBe(false)
            expect(checkWeek.weekLimitReached).toBe(true)

            const allowedRateLimiter = new RateLimiter("listens-rate-limit-allowed", 2, 2, 2)
            const checkAllowed = await allowedRateLimiter.checkLimit(userIP)
            expect(checkAllowed.allowed).toBe(true)
            expect(checkAllowed.hourLimitReached).toBe(false)
            expect(checkAllowed.dayLimitReached).toBe(false)
            expect(checkAllowed.weekLimitReached).toBe(false)
        })
        it('allows one user through while another is blocked', async function () {
            const userIP1 = "1.2.3.4"
            const userIP2 = "9.8.7.6"

            const hourLimitLimiter = new RateLimiter("listens-rate-limit-hour", 3, 5, 10)
            // reach hourly limit for user 1
            await hourLimitLimiter.checkLimit(userIP1)
            await hourLimitLimiter.checkLimit(userIP1)
            await hourLimitLimiter.checkLimit(userIP1)
            const user1check = await hourLimitLimiter.checkLimit(userIP1)
            expect(user1check.allowed).toBe(false)

            await hourLimitLimiter.checkLimit(userIP2)
            const user2check = await hourLimitLimiter.checkLimit(userIP2)
            expect(user2check.allowed).toBe(true)
        })
    })
})
