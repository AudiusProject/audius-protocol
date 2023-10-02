const processFollowNotifications = require('../../src/notifications/processNotifications/followNotification')
const models = require('../../src/models')

async function _insertFollowers (followNotifs) {
  const tx = await models.sequelize.transaction()
  await processFollowNotifications(followNotifs, tx)
  await tx.commit()
}

module.exports = {
  _insertFollowers
}
