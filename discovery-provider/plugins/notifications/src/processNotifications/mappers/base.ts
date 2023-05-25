import { Knex } from 'knex'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

export abstract class BaseNotification<Type> {
  notification: Type
  dnDB: Knex
  identityDB: Knex

  constructor(dnDB: Knex, identityDB: Knex, notification: Type) {
    this.notification = notification
    this.dnDB = dnDB
    this.identityDB = identityDB
  }

  async incrementBadgeCount(userId: number) {
    await this.identityDB('PushNotificationBadgeCounts')
      .insert({
        userId,
        iosBadgeCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflict('userId')
      .merge({
        iosBadgeCount: this.identityDB.raw('?? + ?', [
          'PushNotificationBadgeCounts.iosBadgeCount',
          1
        ]),
        updatedAt: new Date()
      })
  }

  async pushNotification(params: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    return
  }

  getNotificationTimestamp() {
    const timestamp = Math.floor(
      Date.parse((this.notification as any).timestamp as string) / 1000
    )
    return timestamp
  }

  getResourcesForEmail(): ResourceIds {
    return {}
  }

  formatEmailProps(
    resources: Resources,
    additionalNotifications?: BaseNotification<Type>[]
  ) {
    return {}
  }
}
