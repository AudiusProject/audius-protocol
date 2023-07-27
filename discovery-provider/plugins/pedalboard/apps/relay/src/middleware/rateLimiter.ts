import { FastifyReply, FastifyRequest } from "fastify"
import { logger } from "../logger"
import { RelayRequestType } from "../types/relay"
import { RelayRateLimiter, RelayRateLimits, ValidLimits } from "./rateLimitConfig"
import { Knex } from "knex"
import { AudiusABIDecoder } from "@audius/sdk"
import { RateLimiterRes } from "rate-limiter-flexible"

// TODO: stick this into app object and pass in to handler
const globalRateLimiter = new RelayRateLimiter()

export const relayRateLimiter = async (req: FastifyRequest<{ Body: RelayRequestType }>, rep: FastifyReply): Promise<void> => {
    const ip = getIp(req)
    logger.info(`incoming request from ${ip}`)

    const { body: { encodedABI } } = req


    const operation = getEntityManagerActionKey(encodedABI)
    const signer = AudiusABIDecoder.recoverSigner({ encodedAbi: encodedABI, chainId: "", entityManagerAddress: "" })

    try {
        const res = await globalRateLimiter.consume({ operation, ip, limit: "app" })
        insertReplyHeaders(rep, res)
    } catch (e) {
        if (e instanceof RateLimiterRes) {
            insertReplyHeaders(rep, e as RateLimiterRes)
            errorResponseRateLimited(rep)
        }
        logger.error({ msg: "rate limit internal error", e })
        errorResponseInternal(rep)
    }
}

const getIp = (req: FastifyRequest): string => {
    const { socket } = req
    const { remoteAddress } = socket
    const forwardedFor = req.headers["X-Forwarded-For"]
    if (forwardedFor) {
        // could be string[] or string
        if (Array.isArray(forwardedFor)) return forwardedFor[0]
        return forwardedFor // is string
    }
    return remoteAddress!
}

const getEntityManagerActionKey = (encodedABI: string): string => {
    const decodedABI = AudiusABIDecoder.decodeAbi('EntityManager', encodedABI)
    const action = decodedABI.get("action")
    if (action === undefined) throw new Error("action not defined in encodedABI")
    const entityType = decodedABI.get("entityType")
    if (entityType === undefined) throw new Error("entityType not defined in encodedABI")
    return action + entityType
}

const errorResponseRateLimited = (rep: FastifyReply) => {
    rep.code(429).send('Too many requests, please try again later')
}

const errorResponseBadRequest = (rep: FastifyReply) => {
    rep.code(400).send()
}

const errorResponseInternal = (rep: FastifyReply) => {
    rep.code(500).send()
}

const insertReplyHeaders = (rep: FastifyReply, data: RateLimiterRes) => {
    const { msBeforeNext, remainingPoints, consumedPoints } = data
    rep.header("Retry-After", msBeforeNext / 1000)
    rep.header("X-RateLimit-Remaining", remainingPoints)
    rep.header("X-RateLimit-Reset", new Date(Date.now() + msBeforeNext))
    rep.header("X-RateLimit-Consumed", consumedPoints)
}

const determineLimit = (discoveryDb: Knex, limits: RelayRateLimits, signer: string, encodedABI: string): ValidLimits => {
    // 1. get limits based on key "CreateUser", "UpdateTrack", etc

    // 2. get user record from db

    // 3. if user check allowlist

    // 4. if allowlist, return "whitelist" limit

    // 5. if not allowlist, return "owner" limit

    // 6. if not either (user undefined) return app
    return "app"
}
