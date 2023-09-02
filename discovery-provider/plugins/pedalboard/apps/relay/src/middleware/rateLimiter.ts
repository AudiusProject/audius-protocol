import { logger } from "../logger";
import { RelayRateLimiter, ValidLimits } from "../config/rateLimitConfig";
import { Knex } from "knex";
import { AudiusABIDecoder } from "@audius/sdk";
import { RateLimiterRes } from "rate-limiter-flexible";
import { Table, Users } from "storage/src";
import { config, discoveryDb } from "..";

const globalRateLimiter = new RelayRateLimiter();

export const relayRateLimiter = async (): Promise<void> => {
  const encodedABI = "FIX ME"

  const operation = getEntityManagerActionKey(encodedABI);
  const chainId = config.acdcChainId;
  if (chainId === undefined) {
    throw new Error("chain id not defined");
  }
  const signer = AudiusABIDecoder.recoverSigner({
    encodedAbi: encodedABI,
    chainId,
    entityManagerAddress: config.entityManagerContractAddress,
  });

  const isBlockedFromRelay = config.rateLimitBlockList.includes(signer);
  if (isBlockedFromRelay) throw new Error("blocked from relay")

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
      errorResponseRateLimited({});
    }
    logger.error({ msg: "rate limit internal error", e });
    errorResponseInternal({});
  }
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

const errorResponseUnauthorized = (rep: any) => {
  rep.code(403).send();
};

const errorResponseRateLimited = (rep: any) => {
  rep.code(429).send("Too many requests, please try again later");
};

const errorResponseInternal = (rep: any) => {
  rep.code(500).send();
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
