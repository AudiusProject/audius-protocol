import { Knex } from 'knex'

import { logger } from '../logger'
import { FollowNotification } from '../types/notifications'
import { NotificationRow } from '../types/dn'
import { Follow } from './mappers/follow'
import { Repost } from './mappers/repost'
import { Save } from './mappers/save'
import { Remix } from './mappers/remix'
import { CosignRemix } from './mappers/cosign'
import { SupporterRankUp } from './mappers/supporterRankUp'
import { SupportingRankUp } from './mappers/supportingRankUp'
import { TierChange } from './mappers/tierChange'
import { TipReceiveSend } from './mappers/tipReceive'
import { TipSend } from './mappers/tipSend'

export type NotificationProcessor =
  | Follow
  | Repost
  | Save
  | Remix
  | CosignRemix
  | SupporterRankUp
  | SupportingRankUp
  | TierChange
  | TipReceiveSend
  | TipSend

export class AppNotificationsProcessor {

  dnDB: Knex
  identityDB: Knex

  constructor(dnDB: Knex, identityDB: Knex) {
    this.dnDB = dnDB
    this.identityDB = identityDB
  }

  async process(notifications: NotificationRow[]) {
    const mappedNotifications = notifications.map(this.mapNotification).filter(Boolean)
    for (const notification of mappedNotifications) {
      await notification.pushNotification()
    }

    logger.info({ notifications })
  }


  mapNotification = (notification: NotificationRow) => {
    if (notification.type == 'follow') {
      const followNotification = notification as NotificationRow & { data: FollowNotification }
      return new Follow(this.dnDB, this.identityDB, followNotification)
    }
    logger.info(`Notification type: ${notification.type} has no handler`)
  }

}
