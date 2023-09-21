import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { TierChangeNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

type TierChangeNotificationRow = Omit<NotificationRow, 'data'> & {
  data: TierChangeNotification
}
export class TierChange extends BaseNotification<TierChangeNotificationRow> {
  newTier: number
  receiverUserId: number
  rank: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: TierChangeNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
  }

  async processNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    // NOTE: there is no current tier change push notification
    return
  }
  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.receiverUserId])
    }
  }

  formatEmailProps(resources: Resources) {
    const sendingUser = resources.users[this.receiverUserId]
    return {
      type: this.notification.type,
      sendingUser: sendingUser,
      rank: this.rank
    }
  }
}
