const assert = require('assert')
const fs = require('fs')
const moment = require('moment')
const path = require('path')

const models = require('../../src/models')
const processNotifications = require('../../src/notifications/processNotifications/index.js')

const { clearDatabase, runMigrations } = require('../lib/app')
const getEmailNotifications = require('../../src/notifications/fetchNotificationMetadata')
const renderNotificationsEmail = require('../../src/notifications/renderEmail')
const notifications = [
  {
    // User id 2 reposts track 1 owner by user id 1
    blocknumber: 2,
    initiator: 2,
    metadata: {
      entity_id: 1,
      entity_owner_id: 1,
      entity_type: 'track'
    },
    timestamp: '2020-10-01T19:39:45 Z',
    type: 'Repost'
  },
  {
    // User id 2 follows user id 1
    blocknumber: 3,
    initiator: 2,
    metadata: {
      followee_user_id: 1,
      follower_user_id: 2
    },
    timestamp: '2020-10-03T19:39:45 Z',
    type: 'Follow'
  },
  {
    // User id 3 follows user id 1
    blocknumber: 3,
    initiator: 3,
    metadata: {
      followee_user_id: 1,
      follower_user_id: 3
    },
    timestamp: '2020-10-03T19:39:45 Z',
    type: 'Follow'
  },
  {
    // User id 2 favorites tracks id 1 owned by user id 1
    blocknumber: 4,
    initiator: 2,
    metadata: {
      entity_id: 1,
      entity_owner_id: 1,
      entity_type: 'track'
    },
    timestamp: '2020-10-04T19:39:45 Z',
    type: 'Favorite'
  },
  {
    // User id 4 follows user id 1
    blocknumber: 5,
    initiator: 4,
    metadata: {
      followee_user_id: 1,
      follower_user_id: 4
    },
    timestamp: '2020-10-05T19:39:45 Z',
    type: 'Follow'
  },
  {
    // User id 4 follows user id 1
    blocknumber: 5,
    initiator: 4,
    metadata: {
      followee_user_id: 1,
      follower_user_id: 4
    },
    timestamp: '2020-10-05T19:39:45 Z',
    type: 'Follow'
  }
]

const mockAudiusLibs = {
  Track: {
    getTracks: (limit, offset, ids) => {
      return ids.map((id) => ({
        track_id: id,
        owner_id: id,
        title: `TRACK_${id}`
      }))
    }
  },
  Playlist: {
    getPlaylists: (limit, offset, ids) => {
      return ids.map((id) => ({
        playlist_id: id,
        playlist_owner_id: id
      }))
    }
  },
  User: {
    getUsers: (limit, offset, ids) => {
      return ids.map((id) => ({
        name: `User name ${id}`,
        handle: `user_handle_${id}`,
        user_id: id,
        profile_picture_sizes: 'SOME_CID',
        creator_node_endpoint: 'https://creator_node_endpoint.com'
      }))
    }
  }
}

const challengeNotifications = [
  {
    initiator: 1,
    metadata: {
      challenge_id: 'listen-streak'
    },
    slot: 112519141,
    type: 'ChallengeReward'
  },
  {
    initiator: 1,
    metadata: {
      challenge_id: 'track-upload'
    },
    slot: 112519142,
    type: 'ChallengeReward'
  },
  {
    initiator: 1,
    metadata: {
      challenge_id: 'referrals'
    },
    slot: 112519143,
    type: 'ChallengeReward'
  }
]

const additionalChallengeNotificaitons = [
  {
    initiator: 1,
    metadata: {
      challenge_id: 'ref-v'
    },
    slot: 112519144,
    type: 'ChallengeReward'
  },
  {
    initiator: 1,
    metadata: {
      challenge_id: 'referred'
    },
    slot: 112519145,
    type: 'ChallengeReward'
  },
  {
    initiator: 1,
    metadata: {
      challenge_id: 'connect-verified'
    },
    slot: 112519146,
    type: 'ChallengeReward'
  },
  {
    initiator: 1,
    metadata: {
      challenge_id: 'mobile-install'
    },
    slot: 112519147,
    type: 'ChallengeReward'
  },
  {
    initiator: 1,
    metadata: {
      challenge_id: 'send-first-tip'
    },
    slot: 112519148,
    type: 'ChallengeReward'
  },
  {
    initiator: 1,
    metadata: {
      challenge_id: 'first-playlist'
    },
    slot: 112519149,
    type: 'ChallengeReward'
  }
]

describe('Test Render Email Notification', function () {
  beforeEach(async () => {
    await clearDatabase()
    await runMigrations()
  })

  it('should render poa actions to an email', async function () {
    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await processNotifications(notifications, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notifications =======================================
    const timeBeforeEmailNotifications = moment('2020-10-01T00:00:00 Z')
    const userId = 1
    const [notificationProps, notificationCount] = await getEmailNotifications(
      mockAudiusLibs,
      userId,
      [],
      timeBeforeEmailNotifications,
      5
    )

    assert.deepStrictEqual(notificationCount, 3)
    // assert some notification props

    const renderProps = {
      title: 'Email Title',
      notifications: notificationProps,
      subject: 'Email Subject',
      copyrightYear: '2022'
    }

    const testEmailPath = path.join(__dirname, './renderedEmails/testEmail.html')

    const emailRendered = fs.readFileSync(testEmailPath, 'utf-8')
    const notifHtml = renderNotificationsEmail(renderProps)

    // If updating the template, re-save the rendered html to compare with
    // fs.writeFileSync(testEmailPath, notifHtml)

    assert.deepStrictEqual(notifHtml, emailRendered)
  })

  it('should render challenge notifications emails', async function () {
    const timeBeforeEmailNotifications = moment()
    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await processNotifications(challengeNotifications, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notifications =======================================
    const userId = 1
    const [notificationProps, notificationCount] = await getEmailNotifications(
      mockAudiusLibs,
      userId,
      [],
      timeBeforeEmailNotifications,
      5
    )

    assert.deepStrictEqual(notificationCount, 3)
    // assert some notification props

    const renderProps = {
      title: 'Email Title',
      notifications: notificationProps,
      subject: 'Email Subject',
      copyrightYear: '2022'
    }

    const testEmailPath = path.join(__dirname, './renderedEmails/challengeEmail.html')

    const emailRendered = fs.readFileSync(testEmailPath, 'utf-8')
    const notifHtml = renderNotificationsEmail(renderProps)

    // If updating the template, re-save the rendered html to compare with
    // fs.writeFileSync(testEmailPath, notifHtml)

    assert.deepStrictEqual(notifHtml, emailRendered)
  })

  it('should render additional challenge notifications emails', async function () {
    const timeBeforeEmailNotifications = moment()
    // ======================================= Process initial Notifications =======================================
    const tx1 = await models.sequelize.transaction()
    await processNotifications(additionalChallengeNotificaitons, tx1)
    await tx1.commit()

    // ======================================= Run checks against the Notifications =======================================
    const userId = 1
    const [notificationProps, notificationCount] = await getEmailNotifications(
      mockAudiusLibs,
      userId,
      [],
      timeBeforeEmailNotifications,
      5
    )

    assert.deepStrictEqual(notificationCount, 6)
    // assert some notification props

    const renderProps = {
      title: 'Email Title',
      notifications: notificationProps,
      subject: 'Email Subject',
      copyrightYear: '2022'
    }

    const testEmailPath = path.join(__dirname, './renderedEmails/additionalChallengeEmail.html')

    const emailRendered = fs.readFileSync(testEmailPath, 'utf-8')
    const notifHtml = renderNotificationsEmail(renderProps)

    // If updating the template, re-save the rendered html to compare with
    // fs.writeFileSync(testEmailPath, notifHtml)

    assert.deepStrictEqual(notifHtml, emailRendered)
  })
})
