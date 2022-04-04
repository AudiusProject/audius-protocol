const assert = require('assert')
const models = require('../src/models')
const { clearDatabase, runMigrations } = require('./lib/app')
const { followNotifsPreRead, followNotifsPostRead } = require('./notifications/notificationDataSeeds')
const { _insertFollowers } = require('./notifications/helpers')

describe('test notificationsData', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should insert rows into notifications and notifications actions tables', async function () {
    await _insertFollowers(followNotifsPreRead)

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
  })

  it('should insert new rows into notifications and notifications actions tables after read', async function () {
    await _insertFollowers(followNotifsPreRead)

    const userOne = await models.Notification.findAll({ where: { userId: 1 } })
    const userThree = await models.Notification.findAll({ where: { userId: 3 } })

    userOne[0].isViewed = true
    await userOne[0].save()

    userThree[0].isViewed = true
    await userThree[0].save()

    await _insertFollowers(followNotifsPostRead)
    const userOnePostRead = await models.Notification.findAll({ where: { userId: 1 } })
    const userThreePostRead = await models.Notification.findAll({ where: { userId: 3 } })
    assert.deepStrictEqual(userOnePostRead.length, 2)
    assert.deepStrictEqual(userThreePostRead.length, 2)
  })
})
