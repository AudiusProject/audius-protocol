const assert = require('assert')
const models = require('../../src/models')
const processRemixCosignNotifications = require('../../src/notifications/processNotifications/remixCosignNotification')
const { clearDatabase, runMigrations } = require('../lib/app')

/**
 * User id 1 cosigns track id 12 owned by user 2
 * User id 1 cosigns track id 13 owned by user 3
 */
const initialNotifications = [
  {
    'blocknumber': 1,
    'initiator': 1,
    'metadata': {
      'entity_id': 12,
      'entity_owner_id': 2,
      'entity_type': 'track'
    },
    'timestamp': '2020-10-24T11:45:10 Z',
    'type': 'RemixCosign'
  }, {
    'blocknumber': 1,
    'initiator': 1,
    'metadata': {
      'entity_id': 13,
      'entity_owner_id': 3,
      'entity_type': 'track'
    },
    'timestamp': '2020-10-24T11:45:10 Z',
    'type': 'RemixCosign'
  }
]

/**
 * User id 1 cosigns track id 12 owned by user 2
 */
const additionalNotifications = [
  {
    'blocknumber': 1,
    'initiator': 1,
    'metadata': {
      'entity_id': 12,
      'entity_owner_id': 2,
      'entity_type': 'track'
    },
    'timestamp': '2020-10-24T11:45:10 Z',
    'type': 'RemixCosign'
  }
]

describe('Test Remix Cosign Notification', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should insert rows into notifications and notifications actions tables', async function () {
    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await processRemixCosignNotifications(initialNotifications, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notifications =======================================
    // User 2 should have 1 notification for user 1 cosigning track 12
    const user2Notifs = await models.Notification.findAll({ where: { userId: 2 } })
    assert.deepStrictEqual(user2Notifs.length, 1)
    assert.deepStrictEqual(user2Notifs[0].entityId, 12)
    const cosign12 = user2Notifs.find(notif => notif.entityId === 12)

    const cosign12Actions = await models.NotificationAction.findAll({ where: { notificationId: cosign12.id } })
    assert.deepStrictEqual(cosign12Actions[0].actionEntityId, 1)

    // User 3 should have 1 notification for user 1 cosigning track 12
    const user3Notifs = await models.Notification.findAll({ where: { userId: 3 } })
    assert.deepStrictEqual(user3Notifs.length, 1)
    assert.deepStrictEqual(user3Notifs[0].entityId, 13)
    const cosign13 = user3Notifs.find(notif => notif.entityId === 13)

    const cosign13Actions = await models.NotificationAction.findAll({ where: { notificationId: cosign13.id } })
    assert.deepStrictEqual(cosign13Actions[0].actionEntityId, 1)

    // ======================================= Mark some Notifications as viewed =======================================
    cosign12.isViewed = true
    await cosign12.save()

    // ======================================= Process additional notifications =======================================
    const tx2 = await models.sequelize.transaction()
    await processRemixCosignNotifications(additionalNotifications, tx2)
    await tx2.commit()

    // No additional notifications should be created
    const updatedUserNotifs = await models.Notification.findAll({ where: { userId: 2 } })
    assert.deepStrictEqual(updatedUserNotifs.length, 1)
  })
})
