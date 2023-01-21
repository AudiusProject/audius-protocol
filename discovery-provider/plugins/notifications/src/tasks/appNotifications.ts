import { takePending } from './../listener.ts'
import { logger } = './../logger.ts'
import { AppNotifications } from './../appNotifications'

export async function (appNotifications: AppNotifications) {
  const pending = takePending()
  if (pending) {

    await Promise.all([
      appNotifications.process(pending.appNotifications)
    ])
    logger.info('processed new app updates')
  }
}
