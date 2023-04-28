import { logger } from './../logger'
import { Listener } from './../listener'
import { AppNotificationsProcessor } from './../processNotifications/indexAppNotifications'
import { RemoteConfig } from '../remoteConfig'

export async function sendAppNotifications(
  listener: Listener,
  appNotificationsProcessor: AppNotificationsProcessor,
  remoteConfig: RemoteConfig
) {
  const pending = listener.takePending()
  if (pending) {
    logger.info(
      `Processing ${pending.appNotifications.length} app notification `
    )
    await Promise.all([
      appNotificationsProcessor.process(pending.appNotifications, remoteConfig)
    ])
    logger.info('processed new app updates')
  }
}
