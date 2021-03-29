const { _processFollowNotifications } = require('../../src/notifications/notificationProcessing')
const assert = require('assert')
const { followNotifsPreRead, followNotifsPostRead } = require('./notificationDataSeeds')
const models = require('../../src/models')

async function _insertFollowersPreRead () {
  for (let notif of followNotifsPreRead) {
    const tx = await models.sequelize.transaction()
    const notificationTarget = notif.metadata.followee_user_id
    const blocknumber = notif.blocknumber
    const timestamp = Date.parse(notif.timestamp.slice(0, -2))
    console.log(notif, notificationTarget, blocknumber, timestamp)
    await _processFollowNotifications(
      {},
      notif,
      blocknumber,
      timestamp,
      tx,
      notificationTarget,
      { notifyWeb: true, notifyMobile: false }
    )
    await tx.commit()
  }

  // Notifications - there should be 1 for user 1 and 1 for user 3
  // NotificationActions - there should be 1 for user 1 and 6 for user 3
  const userOne = await models.Notification.findAll({ where: { userId: 1 } })
  const userThree = await models.Notification.findAll({ where: { userId: 3 } })
  assert.deepStrictEqual(userOne.length, 1)
  assert.deepStrictEqual(userThree.length, 1)

  const userOneActions = await models.NotificationAction.findAll({ where: { notificationId: userOne[0].id } })
  const userThreeActions = await models.NotificationAction.findAll({ where: { notificationId: userThree[0].id } })
  assert.deepStrictEqual(userOneActions.length, 1)
  assert.deepStrictEqual(userThreeActions.length, 6)

  return [userOne, userThree]
}

async function _insertFollowersPostRead () {
  for (let notif of followNotifsPostRead) {
    const tx = await models.sequelize.transaction()
    const notificationTarget = notif.metadata.followee_user_id
    const blocknumber = notif.blocknumber
    const timestamp = Date.parse(notif.timestamp.slice(0, -2))
    console.log(notif, notificationTarget, blocknumber, timestamp)
    await _processFollowNotifications(
      {},
      notif,
      blocknumber,
      timestamp,
      tx,
      notificationTarget,
      { notifyWeb: true, notifyMobile: false }
    )
    tx.commit()
  }
}

module.exports = {
  _insertFollowersPreRead,
  _insertFollowersPostRead
}
