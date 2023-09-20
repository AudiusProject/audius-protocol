import { logger } from './../logger'
import { Listener } from './../listener'
import { AppNotificationsProcessor } from './../processNotifications/indexAppNotifications'

export async function sendAppNotifications(
  listener: Listener,
  appNotificationsProcessor: AppNotificationsProcessor
) {
  const pending = listener.takePending()
  if (pending) {
    logger.info(
      `Processing ${pending.appNotifications.length} app notifications`
    )
    
    appNotificationsProcessor.process(pending.appNotifications)
    logger.info('Processed new app updates')
  }
}
