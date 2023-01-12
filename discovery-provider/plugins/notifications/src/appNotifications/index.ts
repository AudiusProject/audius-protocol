import { logger } from '../logger'
import { NotificationRow } from '../types/dn'
import { FollowNotification } from './mappers/follow'

type EntitiesToFetch = {
  'users': Set<number>
}

export class AppNotifications {

  constructor() { }

  async process(notifications: NotificationRow[]) {
    const mappedNotifications = notifications.map(this.mapNotification).filter(Boolean)
    for (let notification of mappedNotifications) {
      await notification.pushNotification()
    }

    logger.info({ notifications })
  }


  mapNotification = (notification: NotificationRow) {
    if (notification.type == 'follow') {
      return new FollowNotification(notification)
    }
    logger.info(`Notification type: ${notification.type} has no handler`)
  }

}
