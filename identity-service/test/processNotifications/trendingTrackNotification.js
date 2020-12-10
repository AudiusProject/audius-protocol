const moment = require('moment')
const assert = require('assert')
const models = require('../../src/models')
const {
  processTrendingTracks,
  getTimeGenreActionType,
  TRENDING_TIME,
  TRENDING_GENRE
} = require('../../src/notifications/trendingTrackProcessing')
const {
  notificationTypes
} = require('../../src/notifications/constants')

const { clearDatabase, runMigrations } = require('../lib/app')

/**
 * User id 1 reposts track 10 owned by user id 20
 * User id 2 reposts track 10 owned by user id 20
 * User id 2 reposts track 11 owned by user id 20
 * User id 3 reposts playlist 14 owned by user id 23
 * User id 4 reposts album 10 owned by user id 25
 */
const initialNotifications = [
  {
    'trackId': 100,
    'userId': 1,
    'rank': 1,
    'type': notificationTypes.TrendingTrack
  }, {
    'trackId': 101,
    'userId': 1,
    'rank': 2,
    'type': notificationTypes.TrendingTrack
  }, {
    'trackId': 102,
    'userId': 2,
    'rank': 3,
    'type': notificationTypes.TrendingTrack
  }, {
    'trackId': 103,
    'userId': 3,
    'rank': 4,
    'type': notificationTypes.TrendingTrack
  }, {
    'trackId': 104,
    'userId': 4,
    'rank': 5,
    'type': notificationTypes.TrendingTrack
  }
]

/**
 * User id 5 reposts track 10 owned by user id 20
 * User id 5 reposts album 11 owned by user id 20
 */
const additionalNotifications = [
  {
    'trackId': 103,
    'userId': 3,
    'rank': 1,
    'type': notificationTypes.TrendingTrack
  }, {
    'trackId': 104,
    'userId': 4,
    'rank': 2,
    'type': notificationTypes.TrendingTrack
  }, {
    'trackId': 100,
    'userId': 1,
    'rank': 3,
    'type': notificationTypes.TrendingTrack
  }, {
    'trackId': 110,
    'userId': 10,
    'rank': 4,
    'type': notificationTypes.TrendingTrack
  }, {
    'trackId': 101,
    'userId': 1,
    'rank': 5,
    'type': notificationTypes.TrendingTrack
  }
]

describe('Test Trending Track Notification', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should insert rows into notifications and notifications actions tables', async function () {
    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await processTrendingTracks(null, 1, initialNotifications, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notifications =======================================
    // User 20 Should have 2 notifications
    // 1.) users 1 & 2 liked track 10 (owned by user 20)
    // 2) user 2 liked track 11 (owned by user 20)
    const user1Notifs = await models.Notification.findAll({ where: { userId: 1 } })
    assert.deepStrictEqual(user1Notifs.length, 2)
    const track100Notification = user1Notifs.find(notif => notif.entityId === 100)
    assert.ok(track100Notification)
    const track101Notification = user1Notifs.find(notif => notif.entityId === 101)
    assert.ok(track101Notification)

    // For the track 100 rank 1 check that the notification action is correct
    const track100NotificationActions = await models.NotificationAction.findAll({ where: { notificationId: track100Notification.id } })
    assert.deepStrictEqual(track100NotificationActions.length, 1)
    assert.deepStrictEqual(track100NotificationActions[0].actionEntityId, 1)
    assert.deepStrictEqual(track100NotificationActions[0].actionEntityType, getTimeGenreActionType(TRENDING_TIME.WEEK, TRENDING_GENRE.ALL))

    // For the track 100 rank 1 check that the notification action is correct
    const track101NotificationActions = await models.NotificationAction.findAll({ where: { notificationId: track101Notification.id } })
    assert.deepStrictEqual(track101NotificationActions.length, 1)
    assert.deepStrictEqual(track101NotificationActions[0].actionEntityId, 2)
    assert.deepStrictEqual(track101NotificationActions[0].actionEntityType, getTimeGenreActionType(TRENDING_TIME.WEEK, TRENDING_GENRE.ALL))

    const allNotifs = await models.Notification.findAll()
    assert.deepStrictEqual(allNotifs.length, 5)
    const allNotifActions = await models.NotificationAction.findAll()
    assert.deepStrictEqual(allNotifActions.length, 5)

    // increase time

    // ======================================= Process the same trending tracks =======================================
    const tx2 = await models.sequelize.transaction()
    await processTrendingTracks(null, 2, initialNotifications, tx2)
    await tx2.commit()

    // Check that there are the same number of notifications
    const allNotifsAfter = await models.Notification.findAll()
    assert.deepStrictEqual(allNotifsAfter.length, 5)
    const allNotifActionsAfter = await models.NotificationAction.findAll()
    assert.deepStrictEqual(allNotifActionsAfter.length, 5)

    // Do some more checks
    const threeHrsAgo = moment(Date.now()).subtract(3, 'h')
    await models.Notification.update({ timestamp: threeHrsAgo }, { where: {} })

    // ======================================= Process the new trending tracks =======================================
    const tx3 = await models.sequelize.transaction()
    await processTrendingTracks(null, 3, additionalNotifications, tx3)
    await tx3.commit()

    // Check that there is one more notification
    const allNotifsAfterUpdated = await models.Notification.findAll()
    console.log({ allNotifsAfterUpdated: allNotifsAfterUpdated.map(n => ({ userId: n.userId, track: n.entityId })) })
    assert.deepStrictEqual(allNotifsAfterUpdated.length, 6)

    const user10Notifs = await models.Notification.findAll({ where: { userId: 10 } })
    assert.deepStrictEqual(user10Notifs.length, 1)
    const track110Notification = user10Notifs.find(notif => notif.entityId === 110)
    assert.ok(track110Notification)

    // Do some more checks
    const sevenHrsAgo = moment(Date.now()).subtract(7, 'h')
    await models.Notification.update({ timestamp: sevenHrsAgo }, { where: {} })

    // ======================================= Process the new trending tracks =======================================
    const tx4 = await models.sequelize.transaction()
    await processTrendingTracks(null, 4, additionalNotifications, tx4)
    await tx4.commit()

    // Check that there is one more notification
    const allNotifsAfterAll = await models.Notification.findAll()
    console.log({ allNotifsAfterAll: allNotifsAfterAll.map(n => ({ userId: n.userId, track: n.entityId, timestamp: n.timestamp, now: moment() })) })
    assert.deepStrictEqual(allNotifsAfterAll.length, 8)

    const user4Notifs = await models.Notification.findAll({ where: { userId: 4 } })
    assert.deepStrictEqual(user4Notifs.length, 2)

    const user3Notifs = await models.Notification.findAll({ where: { userId: 3 } })
    assert.deepStrictEqual(user3Notifs.length, 2)
  })
})
