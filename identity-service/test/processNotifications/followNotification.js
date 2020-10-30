const assert = require('assert')
const models = require('../../src/models')
const processFollowNotifications = require('../../src/notifications/processNotifications/followNotification')

const { clearDatabase, runMigrations } = require('../lib/app')

/**
 * User id 1 follows user id 2
 * User id 1 follows user id 3
 * User id 2 follows user id 3
 */
const initialNotifications = [
  {
    'blocknumber': 1,
    'initiator': 1,
    'metadata': {
      'followee_user_id': 2,
      'follower_user_id': 1
    },
    'timestamp': '2020-10-24T19:39:45 Z',
    'type': 'Follow'
  }, {
    'blocknumber': 1,
    'initiator': 1,
    'metadata': {
      'followee_user_id': 3,
      'follower_user_id': 1
    },
    'timestamp': '2020-10-24T19:39:45 Z',
    'type': 'Follow'
  }, {
    'blocknumber': 1,
    'initiator': 2,
    'metadata': {
      'followee_user_id': 3,
      'follower_user_id': 2
    },
    'timestamp': '2020-10-24T19:39:45 Z',
    'type': 'Follow'
  }
]

/**
 * User id 4 follows user id 2
 * User id 4 follows user id 3
 */
const additionalNotifications = [
  {
    'blocknumber': 2,
    'initiator': 4,
    'metadata': {
      'followee_user_id': 2,
      'follower_user_id': 4
    },
    'timestamp': '2020-10-24T19:39:45 Z',
    'type': 'Follow'
  }, {
    'blocknumber': 2,
    'initiator': 4,
    'metadata': {
      'followee_user_id': 3,
      'follower_user_id': 4
    },
    'timestamp': '2020-10-24T19:39:45 Z',
    'type': 'Follow'
  }
]

describe('Test Follow Notification', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should insert rows into notifications and notifications actions tables', async function () {
    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await processFollowNotifications(initialNotifications, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notifications =======================================
    // User 2 should have 1 notifications (user 1 following user 2)
    const user2Notifs = await models.Notification.findAll({ where: { userId: 2 } })
    assert.deepStrictEqual(user2Notifs.length, 1)

    // For the user 2 followers, check that there is 1 notificationa actions - users 1 following
    const user2NotificationActions = await models.NotificationAction.findAll({ where: { notificationId: user2Notifs[0].id } })
    assert.deepStrictEqual(user2NotificationActions.length, 1)
    assert.deepStrictEqual(user2NotificationActions[0].actionEntityId, 1)

    // User 3 should have 1 notifications (user 1 & 2 following)
    const user3Notifs = await models.Notification.findAll({ where: { userId: 3 } })
    assert.deepStrictEqual(user3Notifs.length, 1)

    const user3NotifAction = await models.NotificationAction.findAll({ where: { notificationId: user3Notifs[0].id } })
    const userIdsThatFollowedUser3 = user3NotifAction.map(na => na.actionEntityId)
    userIdsThatFollowedUser3.sort()
    assert.deepStrictEqual(userIdsThatFollowedUser3, [1, 2])

    // ======================================= Mark some Notifications as viewed =======================================
    user3Notifs[0].isViewed = true
    await user3Notifs[0].save()

    // ======================================= Process additional notifications =======================================
    const tx2 = await models.sequelize.transaction()
    await processFollowNotifications(additionalNotifications, tx2)
    await tx2.commit()

    // User 2 Should have 1 notifications with an extra notification action: user 4 following
    const updatedUser2Notifs = await models.Notification.findAll({ where: { userId: 2 } })
    assert.deepStrictEqual(updatedUser2Notifs.length, 1)

    const user2updatedActions = await models.NotificationAction.findAll({ where: { notificationId: updatedUser2Notifs[0].id } })
    assert.deepStrictEqual(user2updatedActions.length, 2)
    const user2Followers = user2updatedActions.map(a => a.actionEntityId)
    user2Followers.sort()
    assert.deepStrictEqual(user2Followers, [1, 4])

    // User 3 Should have 2 notifications
    // 1) users 1 & 2 following track 10 (owned by user 20)
    // 2) user 4 following
    const updatedUser3Notifs = await models.Notification.findAll({ where: { userId: 3 } })
    assert.deepStrictEqual(updatedUser3Notifs.length, 2)
    const user3Prev = updatedUser3Notifs.find(notif => notif.blocknumber === 1 && notif.isViewed === true)
    const user3New = updatedUser3Notifs.find(notif => notif.blocknumber === 2 && notif.isViewed === false)

    const user3PrevActions = await models.NotificationAction.findAll({ where: { notificationId: user3Prev.id } })
    assert.deepStrictEqual(user3PrevActions.length, 2)

    const user3NewActions = await models.NotificationAction.findAll({ where: { notificationId: user3New.id } })
    assert.deepStrictEqual(user3NewActions.length, 1)
    assert.deepStrictEqual(user3NewActions[0].actionEntityId, 4)
  })
})
