import { Knex } from 'knex'

import { logger } from '../logger'
import { mapNotifications } from '../processNotifications/mappers/mapNotifications'
import { NotificationRow } from '../types/dn'
import { Follow } from './mappers/follow'
import { Repost } from './mappers/repost'
import { RepostOfRepost } from './mappers/repostOfRepost'
import { Save } from './mappers/save'
import { Remix } from './mappers/remix'
import { CosignRemix } from './mappers/cosign'
import { SupporterRankUp } from './mappers/supporterRankUp'
import { SupportingRankUp } from './mappers/supportingRankUp'
import { TierChange } from './mappers/tierChange'
import { TipReceive } from './mappers/tipReceive'
import { TipSend } from './mappers/tipSend'
import { Milestone } from './mappers/milestone'

export type NotificationProcessor =
  | Follow
  | Repost
  | Save
  | Remix
  | CosignRemix
  | Milestone
  | RepostOfRepost
  | SupporterRankUp
  | SupportingRankUp
  | TierChange
  | TipReceive
  | TipSend

export class AppNotificationsProcessor {

  dnDB: Knex
  identityDB: Knex

  constructor(dnDB: Knex, identityDB: Knex) {
    this.dnDB = dnDB
    this.identityDB = identityDB
  }

  async process(notifications: NotificationRow[]) {
    const mappedNotifications = mapNotifications(notifications, this.dnDB, this.identityDB)
    for (const notification of mappedNotifications) {
      await notification.pushNotification()
    }

    logger.info({ notifications })
  }

}
