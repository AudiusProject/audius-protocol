import { Knex } from 'knex'
import { BaseNotification } from './base'
import { DMEmailNotification } from '../../types/notifications'
import { ResourceIds } from '../../email/notifications/renderEmail'


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

}
