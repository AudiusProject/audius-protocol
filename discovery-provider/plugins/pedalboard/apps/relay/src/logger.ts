import { DoneFuncWithErrOrRes, FastifyReply, FastifyRequest } from "fastify";
import pino, { stdTimeFunctions } from "pino";

// set config for logger here
export const logger = pino({
  name: `relay`,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime,
});

export const logRequest = (request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes) => {
  request.log.info({
    req: request
  }, 'incoming request')
  done()
}

export const logResponse = (request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes) => {
  const responseTime = reply.getResponseTime()
  reply.log.info({
    res: reply,
    req: request,
    responseTime
  }, 'request completed')
  done()
}
