const { takePending } = require('./../src/listener.ts')
const { logger } = require('./../src/logger.ts')

module.exports = async (payload) => {
  const { appNotifications } = payload
  const pending = takePending()
  if (pending) {

    await Promise.all([
      appNotifications.process(pending.appNotifications)
    ])
    logger.info('processed new app updates')
  }
}
