import { logger } from './../logger'
import { Listener } from './../listener'
import { AppNotificationsProcessor } from './../processNotifications/indexAppNotifications'
import { RemoteConfig } from '../remoteConfig'

export async function sendAppNotifications(
  listener: Listener,
  appNotificationsProcessor: AppNotificationsProcessor
) {
  const pending = listener.takePending()
  if (pending) {
    logger.info(
      `Processing ${pending.appNotifications.length} app notification `
    )
    await Promise.all([
      appNotificationsProcessor.process(pending.appNotifications)
    ])
    logger.info('processed new app updates')
  }
}
