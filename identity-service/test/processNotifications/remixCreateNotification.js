const assert = require('assert')
const models = require('../../src/models')
const processRemixCreateNotifications = require('../../src/notifications/processNotifications/remixCreateNotification')

const { clearDatabase, runMigrations } = require('../lib/app')

/**
 * User id 50 creates track 10 which remixes track 9 owned by user 40
 * User id 52 creates track 12 which remixes track 15 owned by user 40
 */
const initialNotifications = [
  {
    'blocknumber': 1,
    'initiator': 50,
    'metadata': {
      'entity_id': 10,
      'entity_owner_id': 50,
      'entity_type': 'track',
      'remix_parent_track_id': 9,
      'remix_parent_track_user_id': 40
    },
    'timestamp': '2020-10-24T11:45:10 Z',
    'type': 'RemixCreate'
  }, {
    'blocknumber': 1,
    'initiator': 52,
    'metadata': {
      'entity_id': 12,
      'entity_owner_id': 52,
      'entity_type': 'track',
      'remix_parent_track_id': 15,
      'remix_parent_track_user_id': 40
    },
    'timestamp': '2020-10-24T11:45:10 Z',
    'type': 'RemixCreate'
  }
]

/**
 * User id 52 creates track 13 which remixes track 9 owned by user 40
 */
const additionalNotifications = [
  {
    'blocknumber': 1,
    'initiator': 52,
    'metadata': {
      'entity_id': 13,
      'entity_owner_id': 52,
      'entity_type': 'track',
      'remix_parent_track_id': 9,
      'remix_parent_track_user_id': 40
    },
    'timestamp': '2020-10-24T11:45:10 Z',
    'type': 'RemixCreate'
  }
]

describe('Test Remix Create Notification', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should insert rows into notifications and notifications actions tables', async function () {
    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await processRemixCreateNotifications(initialNotifications, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notifications =======================================
    // User 40 should have 2 notifications
    // 1.) user 50 remixing track 40 (owned by user 9)
    // 2.) user 52 remixing track 40 (owned by user 9)
    const userNotifs = await models.Notification.findAll({ where: { userId: 40 } })
    const track10Remix = userNotifs.find(notif => notif.entityId === 10)
    const track12Remix = userNotifs.find(notif => notif.entityId === 12)

    const track10NotificationActions = await models.NotificationAction.findAll({ where: { notificationId: track10Remix.id } })
    assert.deepStrictEqual(track10NotificationActions.length, 1)
    assert.deepStrictEqual(track10NotificationActions[0].actionEntityId, 9)

    const track12NotificationActions = await models.NotificationAction.findAll({ where: { notificationId: track12Remix.id } })
    assert.deepStrictEqual(track12NotificationActions.length, 1)
    assert.deepStrictEqual(track12NotificationActions[0].actionEntityId, 15)

    // ======================================= Mark some Notifications as viewed =======================================
    track10Remix.isViewed = true
    await track10Remix.save()

    // ======================================= Process additional notifications =======================================
    const tx2 = await models.sequelize.transaction()
    await processRemixCreateNotifications(additionalNotifications, tx2)
    await tx2.commit()

    // User 40 should have 3 notifications
    // 1.) user 50 remixing track 40 (owned by user 9)
    // 2.) user 52 remixing track 40 (owned by user 9)
    // 2.) user 52 remixing track 40 (owned by user 9)
    const updatedUserNotifs = await models.Notification.findAll({ where: { userId: 40 } })
    assert.deepStrictEqual(updatedUserNotifs.length, 3)
    const track13 = updatedUserNotifs.find(notif => notif.entityId === 13)

    const track13Actions = await models.NotificationAction.findAll({ where: { notificationId: track13.id } })
    assert.deepStrictEqual(track13Actions.length, 1)
    assert.deepStrictEqual(track13Actions[0].actionEntityId, 9)
  })
})
