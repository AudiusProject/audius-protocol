const assert = require('assert')
const models = require('../../src/models')
const {
  indexMilestones
} = require('../../src/notifications/milestoneProcessing')

const { clearDatabase, runMigrations } = require('../lib/app')

describe('Test Milestone Notifications', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should insert rows into notifications and notifications actions tables', async function () {
    const milestones1 = {
      follower_counts: {
        1: 10,
        2: 25
      },
      favorite_counts: {
        albums: {
          6: 10
        },
        playlists: {
          12: 10
        },
        tracks: {
          5: 10
        }
      },
      repost_counts: {
        albums: {
          1: 10
        },
        playlists: {
          2: 10
        },
        tracks: {
          3: 10
        }
      }
    }

    const mockAudiusLibs = {
      Track: {
        getTracks: () => {}
      },
      Playlist: {
        getPlaylists: () => {}
      },
      User: {
        getUsers: () => {}
      }
    }
    const owners = {
      tracks: {
        5: 1,
        3: 2
      },
      playlists: {
        2: 3,
        12: 2
      },
      albums: {
        1: 1,
        6: 3
      }
    }
    const metadata = { max_block_number: 1 }

    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await indexMilestones(milestones1, owners, metadata, mockAudiusLibs, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notifications =======================================
    // User 1 should have 3 notifications (follower milestone at 10 and album 1 repost 10 milestone, and track 5 favorit count)
    const user1Notifs = await models.Notification.findAll({
      where: { userId: 1 },
      include: [{
        model: models.NotificationAction,
        as: 'actions'
      }]
    })
    assert.ok(user1Notifs.find(n => (n.type === 'MilestoneFavorite' && n.entityId === 5 && n.actions[0].actionEntityType === 'Track')))
    assert.ok(user1Notifs.find(n => (n.type === 'MilestoneRepost' && n.entityId === 1 && n.actions[0].actionEntityType === 'Album')))
    assert.ok(user1Notifs.find(n => (n.type === 'MilestoneFollow' && n.entityId === 10)))

    assert.deepStrictEqual(user1Notifs.length, 3)

    const user2Notifs = await models.Notification.findAll({
      where: { userId: 2 },
      include: [{
        model: models.NotificationAction,
        as: 'actions'
      }]
    })

    assert.ok(user2Notifs.find(n => (n.type === 'MilestoneFavorite' && n.entityId === 12 && n.actions[0].actionEntityType === 'Playlist')))
    assert.ok(user2Notifs.find(n => (n.type === 'MilestoneRepost' && n.entityId === 3 && n.actions[0].actionEntityType === 'Track')))
    assert.ok(user2Notifs.find(n => (n.type === 'MilestoneFollow' && n.entityId === 25)))
    assert.deepStrictEqual(user2Notifs.length, 3)

    const user3Notifs = await models.Notification.findAll({
      where: { userId: 3 },
      include: [{
        model: models.NotificationAction,
        as: 'actions'
      }]
    })
    assert.ok(user3Notifs.find(n => (n.type === 'MilestoneFavorite' && n.entityId === 6 && n.actions[0].actionEntityType === 'Album')))
    assert.ok(user3Notifs.find(n => (n.type === 'MilestoneRepost' && n.entityId === 2 && n.actions[0].actionEntityType === 'Playlist')))
    assert.deepStrictEqual(user3Notifs.length, 2)
  })
})
