import { Knex } from "knex";
import { SendPushNotificationResult } from "../sns";
import { logger } from "../logger";

/// Accepts a list of SendPushNotificationResults and disables the endpoint if necessary
export const disableDeviceArns = async (identityDb: Knex, pushResults: SendPushNotificationResult<boolean>[]) => 
    pushResults.forEach(async (result) => {
        if (!result.endpointDisabled) return
        try {
            // mark endpoint as disabled in identity db
            await identityDb('NotificationDeviceTokens')
            .where('awsARN', '=', result.arn)
            .update('enabled', false)
            } catch (e) {
            logger.error(
                'Error updating an outdated record from the NotificationDeviceToken table',
                e, result.arn
            )
        }
    })
