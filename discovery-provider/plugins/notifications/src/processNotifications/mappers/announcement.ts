import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import {
  AnnouncementNotification,
  AppEmailNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { MappingFeatureName, MappingVariable, RemoteConfig } from '../../remoteConfig'

type AnnouncementNotificationRow = Omit<NotificationRow, 'data'> & {
  data: AnnouncementNotification
}
export class Announcement extends BaseNotification<AnnouncementNotificationRow> {
  remoteConfig: RemoteConfig

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: AnnouncementNotificationRow,
    remoteConfig: RemoteConfig
  ) {
    super(dnDB, identityDB, notification)
    this.remoteConfig = remoteConfig
  }

  async pushNotification() {
    const res_count = await this.dnDB('users')
      .count('user_id')
      .where('is_current', true)
      .where('is_deactivated', false)
      .first()

    // this isn't good if the res is a string
    const count = res_count.count as number
    let offset = 0 // let binding because we re-assign
    const page_count = 10000

    const total_start = new Date().getTime()

    // naive but it works
    // adds extra page to total count so we get the last page of trailing users
    while (offset < (count + page_count)) {
      // query next page
      const res: Array<{
        user_id: number
        name: string
        is_deactivated: boolean
      }> = await this.dnDB
        .select('user_id', 'name', 'is_deactivated')
        .from<UserRow>('users')
        // query by last id seen
        .where('user_id', '>', offset)
        .andWhere('is_current', true)
        .andWhere('is_deactivated', false)
        .orWhere((inner) =>
          inner.where('user_id', '=', offset).andWhere('is_current', true)
        )
        .andWhere('is_deactivated', false)
        // order by established index, this keeps perf constant
        .orderBy(['user_id', 'is_current', 'txhash'])
        .limit(page_count)

      offset = res[res.length - 1].user_id + 1
      const validReceiverUserIds = res.map((user) => user.user_id)
      if (!this.remoteConfig.getFeatureVariableEnabled(MappingFeatureName, MappingVariable.PushAnnouncement)) {
        // dry run
        continue
      }
      for (const userId of validReceiverUserIds) {
          const userNotificationSettings = await buildUserNotificationSettings(
            this.identityDB,
            [userId]
          )
          // If the user has devices to the notification to, proceed
          if (
            userNotificationSettings.shouldSendPushNotification({
              receiverUserId: userId
            })
          ) {
            const devices: Device[] = userNotificationSettings.getDevices(userId)
            // If the user's settings for the follow notification is set to true, proceed

            await Promise.all(
              devices.map((device) => {
                // this may get rate limited by AWS
                return sendPushNotification(
                  {
                    type: device.type,
                    badgeCount: userNotificationSettings.getBadgeCount(userId) + 1,
                    targetARN: device.awsARN
                  },
                  {
                    title: this.notification.data.title,
                    body: this.notification.data.short_description,
                    data: {
                      id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                        this.notification.group_id
                      }`,
                      type: 'Announcement'
                    }
                  }
                )
              })
            )
            await this.incrementBadgeCount(userId)
          }
          if (
            userNotificationSettings.shouldSendEmail({ receiverUserId: userId })
          ) {
            // TODO: Send out email
          }
      }
    }
    const total_elapsed = new Date().getTime() - total_start
    console.log(`announcement complete in ${total_elapsed} ms`)
  }

  getResourcesForEmail(): ResourceIds {
    return {}
  }

  formatEmailProps(resources: Resources) {
    return {
      type: this.notification.type,
      title: this.notification.data.title,
      text: this.notification.data.short_description
    }
  }
}
