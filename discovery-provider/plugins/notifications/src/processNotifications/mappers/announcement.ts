import { Knex } from 'knex'
import { NotificationRow, TrackRow, UserRow } from '../../types/dn'
import { AnnouncementNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'

type AnnouncementNotificationRow = Omit<NotificationRow, 'data'> & {
  data: AnnouncementNotification
}
export class Announcement extends BaseNotification<AnnouncementNotificationRow> {

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: AnnouncementNotificationRow
  ) {
    super(dnDB, identityDB, notification)
  }

  async pushNotification() {
    const pushAnnouncements = false;
    if (!pushAnnouncements) {
      // TODO: ADD .env CONFIG TO SHUT OFF ANNOUNCEMENTS
      return;
    }

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

    // this will leave out a few extra people
    while (offset < count) {
      const start = new Date().getTime()
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
      const elapsed = new Date().getTime() - start
      console.log(
        `count: ${count} offset: ${offset} from: [${res[0].user_id}:${res[res.length - 1].user_id}] queried in ${elapsed} ms`
      )

      const validReceiverUserIds = res.map((user) => user.user_id)
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
    console.log(`done! in ${total_elapsed} ms`)
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
