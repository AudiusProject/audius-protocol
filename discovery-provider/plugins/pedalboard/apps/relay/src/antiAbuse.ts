import axios from "axios";
import { AntiAbuseConfig } from "./config";
import { logger } from "./logger";

type AbuseRule = {
    rule: number;
    trigger: boolean;
    action: "pass" | "fail";
  };
  

type AbuseStatus = {
    blockedFromRelay: boolean,
    blockedFromNotifications: boolean,
    blockedFromEmails: boolean,
    appliedRules: number[] | null
}
  

export const detectAbuse = async (aaoConfig: AntiAbuseConfig): Promise<void> => {
    try {
    const rules = await requestAbuseData(aaoConfig, "", "", false)
    const {
        appliedRules,
        blockedFromRelay,
        blockedFromNotifications,
        blockedFromEmails
      } = determineAbuseRules(aaoConfig, rules)
    logger.info(
        `detectAbuse: got info for user id ${user.blockchainUserId} handle ${
          user.handle
        }: ${JSON.stringify({
          appliedRules,
          blockedFromRelay,
          blockedFromNotifications,
          blockedFromEmails
        })}`
      )
    } catch (e: any) {
        logger.warn(`detectAbuse: aao request failed ${e.message}`)
        // If it failed, don't update anything
        return
    }

    if (
        !!user.isBlockedFromRelay !== blockedFromRelay ||
        !!user.isBlockedFromNotifications !== blockedFromNotifications ||
        !!user.isBlockedFromEmails !== blockedFromEmails
      ) {
        logger.info(
          `abuse: state changed for user [${user.handle}], blocked from relay: ${blockedFromRelay}, blocked from notifs: [${blockedFromNotifications}, blocked from emails: ${blockedFromEmails}]`
        )
        await user.update({
          isBlockedFromRelay: blockedFromRelay,
          isBlockedFromNotifications: blockedFromNotifications,
          isBlockedFromEmails: blockedFromEmails,
          appliedRules
        })
      }
}

// makes HTTP request to AAO
const requestAbuseData = async (aaoConfig: AntiAbuseConfig, handle: string, reqIp: string, abbreviated: boolean): Promise<AbuseRule[]> => {
    const { antiAbuseOracleUrl } = aaoConfig
    const res = await axios.get<AbuseRule[]>(
        `${antiAbuseOracleUrl}/abuse/${handle}${abbreviated ? '?abbreviated=true' : ''}`,
        {
          headers: {
            'X-Forwarded-For': reqIp
          }
        }
      )

    return res.data
}

// takes response from AAO and determines abuse status
const determineAbuseRules = (aaoConfig: AntiAbuseConfig, rules: AbuseRule[]): AbuseStatus => {
    const { allowRules, blockRelayAbuseErrorCodes, blockNotificationsErrorCodes, blockEmailsErrorCodes } = aaoConfig
    const appliedSuccessRules = rules
    .filter((r) => r.trigger && r.action === 'pass')
    .map((r) => r.rule)
    const allowed = appliedSuccessRules.some((r) => allowRules.has(r))

    if (allowed) {
        return {
        blockedFromRelay: false,
        blockedFromNotifications: false,
        blockedFromEmails: false,
        appliedRules: null
        }
    }

    const appliedFailRules = rules
        .filter((r) => r.trigger && r.action === 'fail')
        .map((r) => r.rule)

    const blockedFromRelay = appliedFailRules.some((r) =>
        blockRelayAbuseErrorCodes.has(r)
    )
    const blockedFromNotifications = appliedFailRules.some((r) =>
        blockNotificationsErrorCodes.has(r)
    )
    const blockedFromEmails = appliedFailRules.some((r) =>
        blockEmailsErrorCodes.has(r)
    )

    return {
        blockedFromRelay,
        blockedFromNotifications,
        blockedFromEmails,
        appliedRules: appliedFailRules
    }
}
