import axios from "axios";
import { AntiAbuseConfig } from "./config/config";
import { logger } from "./logger";
import { Table, Users } from "storage/src";
import { Knex } from "knex";

type AbuseRule = {
  rule: number;
  trigger: boolean;
  action: "pass" | "fail";
};

type AbuseStatus = {
  blockedFromRelay: boolean;
  blockedFromNotifications: boolean;
  blockedFromEmails: boolean;
  appliedRules: number[] | null;
};

/// @return true = abuse detected, false = allowed to relay
export const detectAbuse = async (
  aaoConfig: AntiAbuseConfig,
  discoveryDb: Knex,
  senderAddress: string,
  reqIp: string,
  abbreviated: boolean = false
): Promise<boolean> => {
  // if aao turned off, never detect abuse
  if (!aaoConfig.useAao) return false;
  try {
    const user = await discoveryDb<Users>(Table.Users)
      .where("wallet", "=", senderAddress)
      .andWhere("is_current", "=", true)
      .first();
    if (user === undefined)
      throw new Error(
        `user for sender ${senderAddress} is undefined or has no is_current row`
      );
    if (user.handle === null)
      throw new Error(
        `user with sender address ${senderAddress} has no handle`
      );
    const rules = await requestAbuseData(aaoConfig, user.handle, reqIp, false);
    const {
      appliedRules,
      blockedFromRelay,
      blockedFromNotifications,
      blockedFromEmails,
    } = determineAbuseRules(aaoConfig, rules);
    logger.info(
      `detectAbuse: got info for user id ${user.user_id} handle ${
        user.handle
      }: ${JSON.stringify({
        appliedRules,
        blockedFromRelay,
        blockedFromNotifications,
        blockedFromEmails,
      })}`
    );
    return blockedFromRelay;
  } catch (e: any) {
    logger.warn(`detectAbuse: aao request failed ${e.message}`);
    // on issues with AAO block all writes
    return true;
  }
};

// makes HTTP request to AAO
const requestAbuseData = async (
  aaoConfig: AntiAbuseConfig,
  handle: string,
  reqIp: string,
  abbreviated: boolean
): Promise<AbuseRule[]> => {
  const { antiAbuseOracleUrl } = aaoConfig;
  const res = await axios.get<AbuseRule[]>(
    `${antiAbuseOracleUrl}/abuse/${handle}${
      abbreviated ? "?abbreviated=true" : ""
    }`,
    {
      headers: {
        "X-Forwarded-For": reqIp,
      },
    }
  );

  return res.data;
};

// takes response from AAO and determines abuse status
const determineAbuseRules = (
  aaoConfig: AntiAbuseConfig,
  rules: AbuseRule[]
): AbuseStatus => {
  const {
    allowRules,
    blockRelayAbuseErrorCodes,
    blockNotificationsErrorCodes,
    blockEmailsErrorCodes,
  } = aaoConfig;
  const appliedSuccessRules = rules
    .filter((r) => r.trigger && r.action === "pass")
    .map((r) => r.rule);
  const allowed = appliedSuccessRules.some((r) => allowRules.has(r));

  if (allowed) {
    return {
      blockedFromRelay: false,
      blockedFromNotifications: false,
      blockedFromEmails: false,
      appliedRules: null,
    };
  }

  const appliedFailRules = rules
    .filter((r) => r.trigger && r.action === "fail")
    .map((r) => r.rule);

  const blockedFromRelay = appliedFailRules.some((r) =>
    blockRelayAbuseErrorCodes.has(r)
  );
  const blockedFromNotifications = appliedFailRules.some((r) =>
    blockNotificationsErrorCodes.has(r)
  );
  const blockedFromEmails = appliedFailRules.some((r) =>
    blockEmailsErrorCodes.has(r)
  );

  return {
    blockedFromRelay,
    blockedFromNotifications,
    blockedFromEmails,
    appliedRules: appliedFailRules,
  };
};
