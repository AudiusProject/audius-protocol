const assert = require('assert')
const models = require('../src/models')
const { clearDatabase, runMigrations } = require('./lib/app')
const { _insertFollowersPreRead, _insertFollowersPostRead } = require('./notifications/helpers')

describe('test notificationsData', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should insert rows into notifications and notifications actions tables', async function () {
    await _insertFollowersPreRead()
  })

  it.only('should insert new rows into notifications and notifications actions tables after read', async function () {
    const [userOne, userThree] = await _insertFollowersPreRead()
    userOne[0].isViewed = true
    await userOne[0].save()

    userThree[0].isViewed = true
    await userThree[0].save()

    await _insertFollowersPostRead()
    const userOnePostRead = await models.Notification.findAll({ where: { userId: 1 } })
    const userThreePostRead = await models.Notification.findAll({ where: { userId: 3 } })
    assert.deepStrictEqual(userOnePostRead.length, 2)
    assert.deepStrictEqual(userThreePostRead.length, 2)
  })
})
