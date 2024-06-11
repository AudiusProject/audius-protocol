import { beforeEach, describe, expect, it } from "vitest";
import { LISTENS_RATE_LIMIT_IP_PREFIX, LISTENS_RATE_LIMIT_TRACK_PREFIX, config } from "../../config";
import { getRedisConnection } from "../../redis";
import { listenRouteRateLimiter } from "./listen";

beforeEach(async () => {
    // run with npm run test with audius-compose up
    config.redisUrl = "redis://0.0.0.0:6379/00"
    const redis = await getRedisConnection()
    let cursor = '0';
    do {
        for await (const key of redis.scanIterator()) {
            if (key.startsWith(LISTENS_RATE_LIMIT_IP_PREFIX) || key.startsWith(LISTENS_RATE_LIMIT_TRACK_PREFIX)) {
                await redis.del(key)
            }
        }
    } while (cursor !== '0')

    // reset config to defaults between each test
    config.listensIpHourlyRateLimit = 10
})

describe('Listens Route Rate Limiter', function () {
    it('limits independent tracks and users by ip hourly', async function () {
        const track1 = "track1"
        const ipOne = "1.2.3.4"

        const track2 = "track2"
        const ipTwo = "2.3.4.5"

        // set config so ip is only hit
        config.listensIpHourlyRateLimit = 10
        config.listensTrackHourlyRateLimit = 11

        // ten listens for user one with track one
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        const trackOneAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneAllowed.allowed).toBe(true)
        const trackOneNotAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneNotAllowed.allowed).toBe(false)

        // ten listens for another track with same user
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        const trackTwoAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoAllowed.allowed).toBe(true)
        const trackTwoNotAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoNotAllowed.allowed).toBe(false)

        // ten listens for second user and track one, first user is blocked on this one
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        const trackOneAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        expect(trackOneAllowedUserTwo.allowed).toBe(true)

        // assert both users now blocked on both tracks
        const trackOneNotAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        expect(trackOneNotAllowedUserTwo.allowed).toBe(false)
        const trackOneNotAllowedUserOne = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneNotAllowedUserOne.allowed).toBe(false)

        // ten listens for second track from second user
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        const trackTwoAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        expect(trackTwoAllowedUserTwo.allowed).toBe(true)

        // assert both users now blocked on both tracks
        const trackTwoNotAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        expect(trackTwoNotAllowedUserTwo.allowed).toBe(false)
        const trackTwoNotAllowedUserOne = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoNotAllowedUserOne.allowed).toBe(false)
    })

    it('limits independent tracks and users by track and ip hourly', async function () {
        const track1 = "track1"
        const ipOne = "1.2.3.4"

        const track2 = "track2"
        const ipTwo = "2.3.4.5"

        // set config so hourly track and ip is the lowest
        config.listensIpHourlyRateLimit = 11
        config.listensTrackHourlyRateLimit = 10

        // ten listens for user one with track one
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        const trackOneAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneAllowed.allowed).toBe(true)
        const trackOneNotAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneNotAllowed.allowed).toBe(false)

        // ten listens for another track with same user
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        const trackTwoAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoAllowed.allowed).toBe(true)
        const trackTwoNotAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoNotAllowed.allowed).toBe(false)

        // ten listens for second user and track one, first user is blocked on this one
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        const trackOneAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        expect(trackOneAllowedUserTwo.allowed).toBe(true)

        // assert both users now blocked on both tracks
        const trackOneNotAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        expect(trackOneNotAllowedUserTwo.allowed).toBe(false)
        const trackOneNotAllowedUserOne = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneNotAllowedUserOne.allowed).toBe(false)

        // ten listens for second track from second user
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        const trackTwoAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        expect(trackTwoAllowedUserTwo.allowed).toBe(true)

        // assert both users now blocked on both tracks
        const trackTwoNotAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        expect(trackTwoNotAllowedUserTwo.allowed).toBe(false)
        const trackTwoNotAllowedUserOne = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoNotAllowedUserOne.allowed).toBe(false)
    })

    it('limits independent tracks and users by track and ip weekly', async function () {
        const track1 = "track1"
        const ipOne = "1.2.3.4"

        const track2 = "track2"
        const ipTwo = "2.3.4.5"

        // set config so weekly track and ip is the lowest
        config.listensIpHourlyRateLimit = 100
        config.listensTrackHourlyRateLimit = 100
        config.listensTrackWeeklyRateLimit = 10

        // ten listens for user one with track one
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        const trackOneAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneAllowed.allowed).toBe(true)
        const trackOneNotAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneNotAllowed.allowed).toBe(false)

        // ten listens for another track with same user
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        const trackTwoAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoAllowed.allowed).toBe(true)
        const trackTwoNotAllowed = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoNotAllowed.allowed).toBe(false)

        // ten listens for second user and track one, first user is blocked on this one
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        const trackOneAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        expect(trackOneAllowedUserTwo.allowed).toBe(true)

        // assert both users now blocked on both tracks
        const trackOneNotAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track1 })
        expect(trackOneNotAllowedUserTwo.allowed).toBe(false)
        const trackOneNotAllowedUserOne = await listenRouteRateLimiter({ ip: ipOne, trackId: track1 })
        expect(trackOneNotAllowedUserOne.allowed).toBe(false)

        // ten listens for second track from second user
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        const trackTwoAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        expect(trackTwoAllowedUserTwo.allowed).toBe(true)

        // assert both users now blocked on both tracks
        const trackTwoNotAllowedUserTwo = await listenRouteRateLimiter({ ip: ipTwo, trackId: track2 })
        expect(trackTwoNotAllowedUserTwo.allowed).toBe(false)
        const trackTwoNotAllowedUserOne = await listenRouteRateLimiter({ ip: ipOne, trackId: track2 })
        expect(trackTwoNotAllowedUserOne.allowed).toBe(false)
    })
})
