const models = require('../models')
const { logger } = require('../logging')
const axios = require('axios')
const config = require('../config.js')

async function pushAnnouncementNotifications () {
  try {
    logger.info('pushAnnouncementNotifications')
    const audiusNotificationUrl = config.get('audiusNotificationUrl')
    logger.info(audiusNotificationUrl)
    const response = await axios.get(`${audiusNotificationUrl}/index.json`)
    logger.info(response.data)
  } catch (e) {
    logger.error(`pushAnnouncementNotifications ${e}`)
  }
}

module.exports = { pushAnnouncementNotifications }
