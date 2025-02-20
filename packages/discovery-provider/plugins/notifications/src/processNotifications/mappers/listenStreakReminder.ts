import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { ListenStreakReminderNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

type ListenStreakReminderNotificationRow = Omit<NotificationRow, 'data'> & {
  data: ListenStreakReminderNotification
}
export class ListenStreakReminder extends BaseNotification<ListenStreakReminderNotificationRow> {
  receiverUserId: number
  streak: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: ListenStreakReminderNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.streak = this.notification.data.streak
  }

  async processNotification() {
    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.receiverUserId]
    )

    const title = '🔥 Keep Your Streak Going!'
    const body = `Your ${this.streak} day streak will end in 6 hours! Keep listening to earn daily rewards!`

    if (
      userNotificationSettings.shouldSendPushNotification({
        initiatorUserId: this.receiverUserId,
        receiverUserId: this.receiverUserId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.receiverUserId
      )
      // If the user's settings for the follow notification is set to true, proceed
      const timestamp = Math.floor(
        Date.parse(this.notification.timestamp as unknown as string) / 1000
      )

      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(this.receiverUserId) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body,
              data: {
                id: `timestamp:${timestamp}:group_id:${this.notification.group_id}`,
                userIds: [this.receiverUserId],
                type: 'ListenStreakReminder',
                entityType: 'User',
                entityId: this.receiverUserId
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.receiverUserId)
    }
  }
}
