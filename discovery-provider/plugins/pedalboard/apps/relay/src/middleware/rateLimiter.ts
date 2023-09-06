import { logger } from "../logger";
import { RelayRateLimiter, ValidLimits } from "../config/rateLimitConfig";
import { Knex } from "knex";
import { AudiusABIDecoder } from "@audius/sdk";
import { RateLimiterRes } from "rate-limiter-flexible";
import { Table, Users } from "storage/src";
import { config, discoveryDb } from "..";
import { NextFunction, Request, Response } from "express";
import { rateLimitError } from "../error";

const globalRateLimiter = new RelayRateLimiter();

export const relayRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { validatedRelayRequest, recoveredSigner } = res.locals.ctx;
  const { encodedABI } = validatedRelayRequest;

  const signer = recoveredSigner.wallet;
  if (signer === undefined || signer === null) {
    rateLimitError(next, "user record does not have wallet");
    return;
  }

  const operation = getEntityManagerActionKey(encodedABI);
  const chainId = config.acdcChainId;
  if (chainId === undefined) {
    throw new Error("chain id not defined");
  }

  const isBlockedFromRelay = config.rateLimitBlockList.includes(signer);
  if (isBlockedFromRelay) throw new Error("blocked from relay");

  const limit = await determineLimit(
    discoveryDb,
    config.rateLimitAllowList,
    signer
  );
  logger.info({ limit });

  try {
    const res = await globalRateLimiter.consume({
      operation,
      signer,
      limit,
    });
    insertReplyHeaders({}, res);
  } catch (e) {
    if (e instanceof RateLimiterRes) {
      insertReplyHeaders({}, e as RateLimiterRes);
    }
    logger.error({ msg: "rate limit internal error", e });
  }
  next();
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

const insertReplyHeaders = (rep: any, data: RateLimiterRes) => {
  const { msBeforeNext, remainingPoints, consumedPoints } = data;
  rep.header("Retry-After", msBeforeNext / 1000);
  rep.header("X-RateLimit-Remaining", remainingPoints);
  rep.header("X-RateLimit-Reset", new Date(Date.now() + msBeforeNext));
  rep.header("X-RateLimit-Consumed", consumedPoints);
};

const determineLimit = async (
  discoveryDb: Knex,
  allowList: string[],
  signer: string
): Promise<ValidLimits> => {
  const isAllowed = allowList.includes(signer);
  if (isAllowed) return "allowlist";
  const user = await discoveryDb<Users>(Table.Users)
    .where("wallet", "=", signer)
    .andWhere("is_current", "=", true)
    .first();
  logger.info({ user, signer });
  if (user !== undefined) return "owner";
  return "app";
};
