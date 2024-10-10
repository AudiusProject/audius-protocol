const assert = require('assert')
const models = require('../../src/models')
const processChallengeRewardNotifications = require('../../src/notifications/processNotifications/challengeRewardNotification.js')
const { notificationTypes } = require('../../src/notifications/constants')

const { clearDatabase, runMigrations } = require('../lib/app')

/**
 * User id 142 completes profile at slot 112519144
 */
const initialNotifications = [
  {
    initiator: 142,
    metadata: {
      challenge_id: 'p'
    },
    slot: 112519144,
    type: 'ChallengeReward'
  }
]

describe('Test Challenge Rewards Notifications', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should insert rows into notifications and notifications actions tables', async function () {
    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await processChallengeRewardNotifications(initialNotifications, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notification action =======================================
    const userNotifications = await models.SolanaNotification.findAll({
      where: { userId: 142, type: notificationTypes.ChallengeReward }
    })
    assert.deepStrictEqual(userNotifications.length, 1)

    const notificationAction = await models.SolanaNotificationAction.findAll({
      where: { notificationId: userNotifications[0].id }
    })
    assert.deepStrictEqual(notificationAction.length, 1)
    assert.deepStrictEqual(notificationAction[0].actionEntityType, 'p')
  })
})
