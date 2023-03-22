import { Knex } from 'knex'
import { BaseNotification } from './base'
import { DMEmailNotification } from '../../types/notifications'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'

export class MessageEmail extends BaseNotification<DMEmailNotification> {
  receiverUserId: number
  senderUserId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: DMEmailNotification) {
    super(dnDB, identityDB, notification)
    this.receiverUserId = this.notification.receiver_user_id
    this.senderUserId = this.notification.sender_user_id
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.receiverUserId, this.senderUserId])
    }
  }

  formatEmailProps(resources: Resources) {
    const sendingUser = resources.users[this.senderUserId]
    return {
      type: this.notification.type,
      multiple: this.notification.multiple,
      sendingUser: { name: sendingUser.name }
    }
  }
}
