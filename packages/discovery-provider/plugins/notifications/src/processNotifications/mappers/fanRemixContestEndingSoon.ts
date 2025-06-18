import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { FanRemixContestEndingSoonNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

export type FanRemixContestEndingSoonRow = Omit<NotificationRow, 'data'> & {
  data: FanRemixContestEndingSoonNotification
}

export class FanRemixContestEndingSoon extends BaseNotification<FanRemixContestEndingSoonRow> {
  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: FanRemixContestEndingSoonRow
  ) {
    super(dnDB, identityDB, notification)
  }

  async processNotification({
    isBrowserPushEnabled
  }: {
    isBrowserPushEnabled: boolean
  }) {
    const userIds = this.notification.user_ids ?? []
    if (!userIds.length) {
      return
    }

    // Fetch artist name
    const res: Array<{ user_id: number; name: string }> = await this.dnDB
      .select('user_id', 'name')
      .from('users')
      .where('is_current', true)
      .whereIn('user_id', [this.notification.data.entityUserId])
    const artistName = res[0]?.name ?? ''

    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      userIds
    )
    const title = 'Remix Contest'
    const body = `${artistName} has a remix contest ending in 72 hours - don't forget to submit your remix`

    for (const userId of userIds) {
      // Send browser push
      await sendBrowserNotification(
        isBrowserPushEnabled,
        userNotificationSettings,
        userId,
        title,
        body
      )

      // Send mobile push if enabled
      if (
        userNotificationSettings.shouldSendPushNotification({
          receiverUserId: userId
        })
      ) {
        const devices: Device[] = userNotificationSettings.getDevices(userId)
        const pushes = await Promise.all(
          devices.map((device) => {
            return sendPushNotification(
              {
                type: device.type,
                badgeCount: userNotificationSettings.getBadgeCount(userId) + 1,
                targetARN: device.awsARN
              },
              {
                title,
                body,
                data: {
                  id: `timestamp:${this.getNotificationTimestamp()}:group_id:${this.notification.group_id}`,
                  type: 'FanRemixContestEndingSoon',
                  entityId: this.notification.data.entityId,
                  entityUserId: this.notification.data.entityUserId
                }
              }
            )
          })
        )
        await disableDeviceArns(this.identityDB, pushes)
        await this.incrementBadgeCount(userId)
      }
    }
  }
}
