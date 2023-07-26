import { FastifyReply, FastifyRequest } from "fastify"
import { logger } from "../logger"

export const relayRateLimiter = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
    const ip = getIp(req)
    logger.info(`incoming request from ${ip}`)

    // TODO: get entity manager action key

    // TODO: recover signer

    // TODO: check based on app/allowlist/etc

    // TODO: consume points and respond accordingly
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
