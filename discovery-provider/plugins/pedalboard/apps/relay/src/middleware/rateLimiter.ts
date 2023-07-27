import { FastifyReply, FastifyRequest } from "fastify"
import { logger } from "../logger"
import { RelayRequestType } from "../types/relay"
import { RelayRateLimits, ValidLimits } from "./rateLimitConfig"
import { Knex } from "knex"

export const relayRateLimiter = async (req: FastifyRequest<{ Body: RelayRequestType }>, rep: FastifyReply): Promise<void> => {
    const ip = getIp(req)
    logger.info(`incoming request from ${ip}`)

    const { body: { encodedABI } } = req

    const key = getEntityManagerActionKey(encodedABI)

    // TODO: recover signer

    // TODO: check based on app/allowlist/etc

    // TODO: consume points and respond accordingly
    errorResponseRateLimited(rep)
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
    const decodedABI: any = {} // libs.decodeABI('EntityManager', encodedABI)
    return decodedABI.action + decodedABI.entityType
}

const errorResponseRateLimited = (rep: FastifyReply) => {
    rep.code(429).send('Too many requests, please try again later')
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
