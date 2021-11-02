const assert = require('assert')
const sinon = require('sinon')

const models = require('../../src/models')
const processNotifications = require('../../src/notifications/processNotifications/index.js')
const sendNotifications = require('../../src/notifications/sendNotifications/index.js')
const { processTrendingTracks } = require('../../src/notifications/trendingTrackProcessing')
const { pushNotificationQueue } = require('../../src/notifications/notificationQueue')
const { clearDatabase, runMigrations } = require('../lib/app')
const notificationUtils = require('../../src/notifications/sendNotifications/utils')

// Mock Notifications
const remixCreate = require('./mockNotifications/remixCreate.json')
const remixCosign = require('./mockNotifications/remixCosign.json')
const follow = require('./mockNotifications/follow.json')
const repost = require('./mockNotifications/repost.json')
const favorite = require('./mockNotifications/favorite.json')
const create = require('./mockNotifications/create.json')
const trendingTrack = require('./mockNotifications/trendingTrack.json')

const mockAudiusLibs = require('./mockLibs')

describe('Test Send Notifications', function () {
  before(() => {
    sinon.stub(notificationUtils, 'getPendingCreateDedupeMs')
      .returns(5 * 1000) // 5 second dedupe
  })

  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
    // Clear the notifications buffer
    pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER = []
  })

  it('should have the correct remix create notifications', async function () {
    // Create a mobile notification setting, defaults to true for remixes
    await models.UserNotificationMobileSettings.create({ userId: 100 })
    await models.UserNotificationMobileSettings.create({ userId: 101, remixes: false })
    await models.UserNotificationBrowserSettings.create({ userId: 101, remixes: true })

    const tx1 = await models.sequelize.transaction()
    await processNotifications(remixCreate, tx1)
    await sendNotifications(mockAudiusLibs, remixCreate, tx1)
    await tx1.commit()
    let pushNotifications = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER

    for (const notification of pushNotifications) {
      assert.deepStrictEqual(notification.notificationParams.title, 'New Remix Of Your Track ♻️')
    }
    const user100Notifs = pushNotifications.filter(n => n.userId === 100)
    assert.deepStrictEqual(user100Notifs.length, 2)

    const user101Notifs = pushNotifications.filter(n => n.userId === 101)
    assert.deepStrictEqual(user101Notifs.length, 1)

    for (const notification of user100Notifs) {
      assert.deepStrictEqual(notification.types, ['mobile'])
    }

    for (const notification of user101Notifs) {
      assert.deepStrictEqual(notification.types, ['browser'])
    }
  })

  it('should have the correct remix cosign notifications', async function () {
    // NOTE: remix cosign will attempt to send to mobile and browser
    // 'should have the correct remix cosign notifications'
    const tx1 = await models.sequelize.transaction()
    await processNotifications(remixCosign, tx1)
    await sendNotifications(mockAudiusLibs, remixCosign, tx1)
    await tx1.commit()

    const pushNotifications = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER

    for (const notification of pushNotifications) {
      assert.deepStrictEqual(notification.notificationParams.title, 'New Track Co-Sign! 🔥')
      assert.deepStrictEqual(notification.types, ['mobile', 'browser'])
    }
    const user2Notifs = pushNotifications.filter(n => n.userId === 2)
    assert.deepStrictEqual(user2Notifs.length, 1)
    assert.deepStrictEqual(user2Notifs[0].notificationParams.message, 'user 1 Co-Signed your Remix of Title, Track id: 10')

    const user3Notifs = pushNotifications.filter(n => n.userId === 3)
    assert.deepStrictEqual(user3Notifs.length, 1)
    assert.deepStrictEqual(user3Notifs[0].notificationParams.message, 'user 1 Co-Signed your Remix of Title, Track id: 11')
  })

  it('should have the correct follow notifications', async function () {
    await models.UserNotificationMobileSettings.create({ userId: 2 })
    await models.UserNotificationBrowserSettings.create({ userId: 3 })

    const tx1 = await models.sequelize.transaction()
    await processNotifications(follow, tx1)
    await sendNotifications(mockAudiusLibs, follow, tx1)
    await tx1.commit()

    const pushNotifications = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER
    assert.deepStrictEqual(pushNotifications.length, 3)

    for (const notification of pushNotifications) {
      assert.deepStrictEqual(notification.notificationParams.title, 'New Follower')
    }

    const user2Notifs = pushNotifications.filter(n => n.userId === 2)
    assert.deepStrictEqual(user2Notifs.length, 1)
    assert.deepStrictEqual(user2Notifs[0].notificationParams.message, 'user 1 followed you')
    assert.deepStrictEqual(user2Notifs[0].types, ['mobile'])

    const user3Notifs = pushNotifications.filter(n => n.userId === 3)
    assert.deepStrictEqual(user3Notifs.length, 2)
    assert.deepStrictEqual(user3Notifs[0].notificationParams.message, 'user 1 followed you')
    assert.deepStrictEqual(user3Notifs[0].types, ['browser'])
    assert.deepStrictEqual(user3Notifs[1].notificationParams.message, 'user 2 followed you')
    assert.deepStrictEqual(user3Notifs[1].types, ['browser'])

    // NOTE: No notifications for user 4 who has no settings set.
  })

  it('should have the correct repost notifications', async function () {
    await models.UserNotificationMobileSettings.bulkCreate([1, 2, 7].map(userId => ({ userId })))

    const tx1 = await models.sequelize.transaction()
    await processNotifications(repost, tx1)
    await sendNotifications(mockAudiusLibs, repost, tx1)
    await tx1.commit()

    const pushNotifications = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER

    assert.deepStrictEqual(pushNotifications.length, 4)

    for (const notification of pushNotifications) {
      assert.deepStrictEqual(notification.notificationParams.title, 'New Repost')
      assert.deepStrictEqual(notification.types, ['mobile'])
    }

    const user2Notifs = pushNotifications.filter(n => n.userId === 2)
    assert.deepStrictEqual(user2Notifs.length, 3)
    assert.deepStrictEqual(user2Notifs[0].notificationParams.message, 'user 1 reposted your track Title, Track id: 100')
    assert.deepStrictEqual(user2Notifs[1].notificationParams.message, 'user 2 reposted your track Title, Track id: 101')
    assert.deepStrictEqual(user2Notifs[2].notificationParams.message, 'user 3 reposted your playlist PLaylist id: 100')

    const user7Notifs = pushNotifications.filter(n => n.userId === 7)
    assert.deepStrictEqual(user7Notifs.length, 1)
    assert.deepStrictEqual(user7Notifs[0].notificationParams.message, 'user 4 reposted your album PLaylist id: 104')

    // NOTE: No notifications for user 4 who has no settings set.
  })

  it('should have the correct favorite notifications', async function () {
    await models.UserNotificationMobileSettings.bulkCreate([1, 2, 7].map(userId => ({ userId })))

    const tx1 = await models.sequelize.transaction()
    await processNotifications(favorite, tx1)
    await sendNotifications(mockAudiusLibs, favorite, tx1)
    await tx1.commit()

    const pushNotifications = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER

    assert.deepStrictEqual(pushNotifications.length, 4)

    for (const notification of pushNotifications) {
      assert.deepStrictEqual(notification.notificationParams.title, 'New Favorite')
      assert.deepStrictEqual(notification.types, ['mobile'])
    }

    const user2Notifs = pushNotifications.filter(n => n.userId === 2)
    assert.deepStrictEqual(user2Notifs.length, 3)
    assert.deepStrictEqual(user2Notifs[0].notificationParams.message, 'user 1 favorited your track Title, Track id: 100')
    assert.deepStrictEqual(user2Notifs[1].notificationParams.message, 'user 2 favorited your track Title, Track id: 101')
    assert.deepStrictEqual(user2Notifs[2].notificationParams.message, 'user 3 favorited your playlist PLaylist id: 100')

    const user7Notifs = pushNotifications.filter(n => n.userId === 7)
    assert.deepStrictEqual(user7Notifs.length, 1)
    assert.deepStrictEqual(user7Notifs[0].notificationParams.message, 'user 4 favorited your album PLaylist id: 104')

    // NOTE: No notifications for user 4 who has no settings set.
  })

  it('should have the correct trending track notifications', async function () {
    await models.UserNotificationMobileSettings.bulkCreate([1, 2, 3].map(userId => ({ userId })))
    await models.UserNotificationMobileSettings.update(
      { milestonesAndAchievements: false },
      { where: { userId: 3 } }
    )

    const tx1 = await models.sequelize.transaction()
    await processTrendingTracks(mockAudiusLibs, 1, trendingTrack, tx1)
    await tx1.commit()

    const pushNotifications = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER
    console.log(pushNotifications.length)

    assert.deepStrictEqual(pushNotifications.length, 3)

    for (const notification of pushNotifications) {
      assert.deepStrictEqual(notification.notificationParams.title, 'Congrats - You’re Trending! 📈')
      assert.deepStrictEqual(notification.types, ['mobile'])
    }

    const user1Notifs = pushNotifications.filter(n => n.userId === 1)
    assert.deepStrictEqual(user1Notifs.length, 2)
    assert.deepStrictEqual(user1Notifs[0].notificationParams.message, `Your Track Title, Track id: 100 is 1st on Trending Right Now! 🍾`)
    assert.deepStrictEqual(user1Notifs[1].notificationParams.message, `Your Track Title, Track id: 101 is 2nd on Trending Right Now! 🍾`)

    const user2Notifs = pushNotifications.filter(n => n.userId === 2)
    assert.deepStrictEqual(user2Notifs.length, 1)
    assert.deepStrictEqual(user2Notifs[0].notificationParams.message, `Your Track Title, Track id: 102 is 3rd on Trending Right Now! 🍾`)
  })

  it('should have the correct create notifications', async function () {
    // User 1 creates tracks 1, 2, 3, 4
    // User 2 creates track 5
    // User 1 creates playlist 1 w/ tracks 1
    // User 1 creates album 2 w/ tracks 2

    // ======================================= Set subscribers for create notifications =======================================
    await models.Subscription.bulkCreate([
      { subscriberId: 3, userId: 1 }, // User 3 subscribes to user 1
      { subscriberId: 4, userId: 1 }, // User 4 subscribes to user 1
      { subscriberId: 4, userId: 2 } // User 4 subscribes to user 1
    ])

    const tx1 = await models.sequelize.transaction()
    await processNotifications(create, tx1)
    await sendNotifications(mockAudiusLibs, create, tx1)
    await tx1.commit()

    let pushNotifications = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER

    assert.deepStrictEqual(pushNotifications.length, 0)

    // Wait 60 seconds to debounce tracks / album notifications
    await new Promise(resolve => setTimeout(resolve, 5 * 1000))
    const tx2 = await models.sequelize.transaction()
    await sendNotifications(mockAudiusLibs, [], tx2)
    await tx2.commit()

    pushNotifications = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER
    assert.deepStrictEqual(pushNotifications.length, 9)

    for (const notification of pushNotifications) {
      assert.deepStrictEqual(notification.notificationParams.title, 'New Artist Update')
      assert.deepStrictEqual(notification.types, ['mobile', 'browser'])
    }

    const user3Messages = [
      'user 1 released a new track Title, Track id: 3',
      'user 1 released a new track Title, Track id: 4',
      'user 1 released a new playlist PLaylist id: 1',
      'user 1 released a new album PLaylist id: 2'
    ]

    const user3Notifs = pushNotifications.filter(n => n.userId === 3)
    assert.deepStrictEqual(user3Notifs.length, 4)
    for (let message of user3Messages) {
      assert.deepStrictEqual(user3Notifs.some(n => n.notificationParams.message === message), true)
    }

    const user4Messages = user3Messages.concat('user 2 released a new track Title, Track id: 5')
    const user4Notifs = pushNotifications.filter(n => n.userId === 4)
    assert.deepStrictEqual(user4Notifs.length, 5)
    for (let message of user4Messages) {
      assert.deepStrictEqual(user4Notifs.some(n => n.notificationParams.message === message), true)
    }
  })
})
