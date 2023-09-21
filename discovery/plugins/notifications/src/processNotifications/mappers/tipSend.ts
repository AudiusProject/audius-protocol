import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { TipSendNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

type TipSendNotificationRow = Omit<NotificationRow, 'data'> & {
  data: TipSendNotification
}
export class TipSend extends BaseNotification<TipSendNotificationRow> {
  senderUserId: number
  receiverUserId: number
  amount: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: TipSendNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.amount = this.notification.data.amount
    this.receiverUserId = this.notification.data.receiver_user_id
    this.senderUserId = this.notification.data.receiver_user_id
  }

  async processNotification() {
    // There is no current push notification for tip send
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.senderUserId, this.receiverUserId])
    }
  }

  formatEmailProps(resources: Resources) {
    const receiverUser = resources.users[this.receiverUserId]
    return {
      type: this.notification.type,
      receiverUser,
      amount: this.amount
    }
  }
}
