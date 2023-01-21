import { logger } from './../logger'
import { Listener } from './../listener'
import { AppNotifications } from './../appNotifications'

export async function sendAppNotifications(listener: Listener, appNotificationsProcessor: AppNotifications) {
  const pending = listener.takePending()
  if (pending) {

    await Promise.all([
      appNotificationsProcessor.process(pending.appNotifications)
    ])
    logger.info('processed new app updates')
  }
}
