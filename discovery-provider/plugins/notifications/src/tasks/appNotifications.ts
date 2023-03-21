import { logger } from './../logger'
import { Listener } from './../listener'
import { AppNotificationsProcessor } from './../processNotifications/indexAppNotifications'

export async function sendAppNotifications(
  listener: Listener,
  appNotificationsProcessor: AppNotificationsProcessor
) {
  const pending = listener.takePending()
  if (pending) {
    await Promise.all([
      appNotificationsProcessor.process(pending.appNotifications)
    ])
    logger.info('processed new app updates')
  }
}
