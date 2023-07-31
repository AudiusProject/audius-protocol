import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../logger";
import { RelayRequestType } from "../types/relay";
import {
  RelayRateLimiter,
  ValidLimits,
} from "./rateLimitConfig";
import { Knex } from "knex";
import { AudiusABIDecoder } from "@audius/sdk";
import { RateLimiterRes } from "rate-limiter-flexible";
import { Table, Users } from "storage/src";
import { app, config } from "..";

const globalRateLimiter = new RelayRateLimiter();

export const relayRateLimiter = async (
  req: FastifyRequest<{ Body: RelayRequestType }>,
  rep: FastifyReply
): Promise<void> => {
  const ip = getIp(req);
  logger.info(`incoming request from ${ip}`);

  const {
    body: { encodedABI },
  } = req;

  logger.info({ config })

  const operation = getEntityManagerActionKey(encodedABI);
  const signer = AudiusABIDecoder.recoverSigner({
    encodedAbi: encodedABI,
    chainId: config.acdcChainId,
    entityManagerAddress: config.entityManagerContractAddress,
  });

  const discoveryDb = app.getDnDb();
  const limit = await determineLimit(discoveryDb, [], signer)
  logger.info({ limit })

  try {
    const res = await globalRateLimiter.consume({
      operation,
      ip,
      limit,
    });
    insertReplyHeaders(rep, res);
  } catch (e) {
    if (e instanceof RateLimiterRes) {
      insertReplyHeaders(rep, e as RateLimiterRes);
      errorResponseRateLimited(rep);
    }
    logger.error({ msg: "rate limit internal error", e });
    errorResponseInternal(rep);
  }
};

const getIp = (req: FastifyRequest): string => {
  const { socket } = req;
  const { remoteAddress } = socket;
  const forwardedFor = req.headers["X-Forwarded-For"];
  if (forwardedFor) {
    // could be string[] or string
    if (Array.isArray(forwardedFor)) return forwardedFor[0];
    return forwardedFor; // is string
  }
  return remoteAddress!;
};

const getEntityManagerActionKey = (encodedABI: string): string => {
  const decodedABI = AudiusABIDecoder.decodeAbi("EntityManager", encodedABI);
  const action = decodedABI.get("action");
  if (action === undefined) throw new Error("action not defined in encodedABI");
  const entityType = decodedABI.get("entityType");
  if (entityType === undefined)
    throw new Error("entityType not defined in encodedABI");
  return action + entityType;
};

const errorResponseRateLimited = (rep: FastifyReply) => {
  rep.code(429).send("Too many requests, please try again later");
};

const errorResponseBadRequest = (rep: FastifyReply) => {
  rep.code(400).send();
};

const errorResponseInternal = (rep: FastifyReply) => {
  rep.code(500).send();
};

const insertReplyHeaders = (rep: FastifyReply, data: RateLimiterRes) => {
  const { msBeforeNext, remainingPoints, consumedPoints } = data;
  rep.header("Retry-After", msBeforeNext / 1000);
  rep.header("X-RateLimit-Remaining", remainingPoints);
  rep.header("X-RateLimit-Reset", new Date(Date.now() + msBeforeNext));
  rep.header("X-RateLimit-Consumed", consumedPoints);
};

const determineLimit = async (
  discoveryDb: Knex,
  allowlist: string[],
  signer: string,
): Promise<ValidLimits> => {
    const isAllowed = allowlist.includes(signer)
    if (isAllowed) return "whitelist"
    const user = await discoveryDb<Users>(Table.Users)
        .where('wallet', '=', signer)
        .andWhere('is_current', '=', true)
        .first()
    logger.info({ user, signer })
    if (user !== undefined) return "owner"
    return "app"
};
