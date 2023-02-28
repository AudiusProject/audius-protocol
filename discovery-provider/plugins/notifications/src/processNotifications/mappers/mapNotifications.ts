import { Knex } from 'knex'

import { logger } from '../../logger'
import { NotificationRow } from '../../types/dn'
import { DMEntityType } from '../../email/notifications/types'
import { 
  EmailNotification,
  DMEmailNotification,
  FollowNotification,
  RepostNotification,
  SaveNotification,
  RemixNotification,
  CosignRemixNotification,
  SupporterRankUpNotification
} from '../../types/notifications'
import { Follow } from './follow'
import { Repost } from './repost'
import { Save } from './save'
import { Remix } from './remix'
import { CosignRemix } from './cosign'
import { SupporterRankUp } from './supporterRankUp'
import { MessageEmail } from './messageEmail'

export const mapNotifications = (notifications: (NotificationRow | EmailNotification)[], dnDb: Knex, identityDb: Knex) => {
  return notifications.map((notification) => mapNotification(notification, dnDb, identityDb)).filter(Boolean)
}

const mapNotification = (notification: NotificationRow | EmailNotification, dnDb: Knex, identityDb: Knex) => {
  if (notification.type == 'follow') {
    const followNotification = notification as NotificationRow & { data: FollowNotification }
    return new Follow(dnDb, identityDb, followNotification)
  }
  else if (notification.type == 'repost') {
    const repostNotification = notification as NotificationRow & { data: RepostNotification }
    return new Repost(dnDb, identityDb, repostNotification)
  }
  else if (notification.type == 'save') {
    const saveNotification = notification as NotificationRow & { data: SaveNotification }
    return new Save(dnDb, identityDb, saveNotification)
  }
  else if (notification.type == 'remix') {
    const remixNotification = notification as NotificationRow & { data: RemixNotification }
    return new Remix(dnDb, identityDb, remixNotification)
  }
  else if (notification.type == 'cosign') {
    const cosignNotification = notification as NotificationRow & { data: CosignRemixNotification }
    return new CosignRemix(dnDb, identityDb, cosignNotification)
  }
  else if (notification.type == 'supporter_rank_up') {
    const supporterRankUpNotification = notification as NotificationRow & { data: SupporterRankUpNotification }
    return new SupporterRankUp(dnDb, identityDb, supporterRankUpNotification)
  }
  else if (notification.type == DMEntityType.Message || notification.type == DMEntityType.Reaction) {
    const messageEmailNotification = notification as DMEmailNotification
    return new MessageEmail(dnDb, identityDb, messageEmailNotification)
  }
  
  logger.info(`Notification type: ${notification.type} has no handler`)
}
