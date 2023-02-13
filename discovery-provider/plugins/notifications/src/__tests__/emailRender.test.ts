import { expect, test } from '@jest/globals'
import { renderEmail } from '../email/notifications/renderEmail'
import { Processor } from '../main'
import { reposttype } from '../types/dn'
import { DMEntityType } from '../email/notifications/types'
import { DMEmailNotification, AppEmailNotification } from '../types/notifications'
import { createTestDB, createTracks, createUsers, dropTestDB, insertFollows, replaceDBName } from '../utils/populateDB'


const initDB = async (dbName: string) => {
  const processor = new Processor()
  await processor.init({
    identityDBUrl: replaceDBName(process.env.IDENTITY_DB_URL, dbName),
    discoveryDBUrl: replaceDBName(process.env.DN_DB_URL, dbName),
  })
  await Promise.all([
    createUsers(processor.discoveryDB, [{
      user_id: 1,
      profile_picture_sizes: 'SOME_CID_HASH_1',
      creator_node_endpoint: 'http://dn.co,http://dn2.co,http://dn3.co'
    }, {
      user_id: 2,
      profile_picture_sizes: 'SOME_CID_HASH_2',
      creator_node_endpoint: 'http://dn.co,http://dn2.co,http://dn3.co'
    }])
  ])
  return processor
}


describe('Render email', () => {

  beforeEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      createTestDB(process.env.DN_DB_URL, testName),
      createTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
  })

  afterEach(async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
      dropTestDB(process.env.DN_DB_URL, testName),
      dropTestDB(process.env.IDENTITY_DB_URL, testName),
    ])
  })

  test("Render a single Follow email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      await insertFollows(processor.discoveryDB, [
        { follower_user_id: 1, followee_user_id: 2 }
      ])
      await new Promise(resolve => setTimeout(resolve, 10))

      const notifications: AppEmailNotification[] = [
        {
          type: 'follow',
          timestamp: new Date(),
          specifier: '1',
          group_id: 'follow:1',
          data: {
            follower_user_id: 1,
            followee_user_id: 2
          },
          user_ids: [2],
          receiver_user_id: 2
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot()
    } finally {
      await processor?.close()
    }
  })


  test("Render a single Repost Track email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)


      await createTracks(processor.discoveryDB, [{
        track_id: 1,
        owner_id: 1
      }])

      await new Promise(resolve => setTimeout(resolve, 10))

      const notifications: AppEmailNotification[] = [
        {
          type: 'repost',
          timestamp: new Date(),
          specifier: '2',
          group_id: 'repost:track:1',
          data: {
            user_id: 2,
            repost_item_id: 1,
            type: reposttype.track
          },
          user_ids: [2],
          receiver_user_id: 2,
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot()

    } finally {
      await processor?.close()
    }
  })

  test("Render a single Save Track Email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      await createTracks(processor.discoveryDB, [{
        track_id: 1,
        owner_id: 1
      }])

      await new Promise(resolve => setTimeout(resolve, 10))

      const notifications: AppEmailNotification[] = [
        {
          type: 'save',
          timestamp: new Date(),
          specifier: '2',
          group_id: 'save:track:1',
          data: {
            user_id: 2,
            save_item_id: 1,
            type: savetype.track
          },
          receiver_user_id: 1
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot()
    } finally {
      await processor?.close()
    }
  })

  test("Render a single Remix Track Email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      await createTracks(processor.discoveryDB, [
        { track_id: 1, owner_id: 1 },
        { track_id: 2, owner_id: 2, remix_of: { tracks: [{ parent_track_id: 1 }] } },
      ])

      await new Promise(resolve => setTimeout(resolve, 10))

      const notifications: AppEmailNotification[] = [
        {
          type: 'remix',
          timestamp: new Date(),
          specifier: '2',
          user_ids: [1],
          group_id: 'remix:track:2:parent_track:1:blocknumber:1',
          data: {
            'track_id': 2,
            'parent_track_id': 1
          },
          receiver_user_id: 1
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot()

    } finally {
      await processor?.close()
    }
  })

  test("Render a single Remix Cosign Track Email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      await createTracks(processor.discoveryDB, [
        { track_id: 1, owner_id: 1 },
        { track_id: 2, owner_id: 2, remix_of: { tracks: [{ parent_track_id: 1 }] } },
      ])

      await new Promise(resolve => setTimeout(resolve, 10))

      const notifications: AppEmailNotification[] = [
        {
          type: 'cosign',
          timestamp: new Date(),
          specifier: '1',
          user_ids: [2],
          group_id: 'remix:track:2:parent_track:1:blocknumber:1',
          data: {
            'track_id': 2,
            'parent_track_id': 1
          },
          receiver_user_id: 1
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot()

    } finally {
      await processor?.close()
    }
  })

  test("Render a single Supporter Rank Up Email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      await new Promise(resolve => setTimeout(resolve, 10))

      const notifications: AppEmailNotification[] = [
        {
          type: 'supporter_rank_up',
          timestamp: new Date(),
          specifier: '1',
          user_ids: [1],
          group_id: 'supporter_rank_up:1:slot:1',
          data: {
            'sender_user_id': 1,
            'receiver_user_id': 2,
            'rank': 1
          },
          receiver_user_id: 1
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      console.log(notifHtml)
      expect(notifHtml).toMatchSnapshot()

    } finally {
      await processor?.close()
    }
  })

  test("Render a single Message email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      const notifications: DMEmailNotification[] = [
        {
          type: DMEntityType.Message,
          sender_user_id: 2,
          receiver_user_id: 1
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot();

    } finally {
      await processor?.close()
    }
  })

  test("Render a multiple Messages email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      const notifications: DMEmailNotification[] = [
        {
          type: DMEntityType.Message,
          sender_user_id: 2,
          receiver_user_id: 1,
          multiple: true
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot();

    } finally {
      await processor?.close()
    }
  })

  test("Render a single Message Reaction email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      const notifications: DMEmailNotification[] = [
        {
          type: DMEntityType.Reaction,
          sender_user_id: 2,
          receiver_user_id: 1
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot();

    } finally {
      await processor?.close()
    }
  })

  test("Render a multiple Message Reactions email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      const notifications: DMEmailNotification[] = [
        {
          type: DMEntityType.Reaction,
          sender_user_id: 2,
          receiver_user_id: 1,
          multiple: true
        }
      ]
      const notifHtml = await renderEmail({
        userId: 1,
        email: 'joey@audius.co',
        frequency: 'daily',
        notifications,
        dnDb: processor.discoveryDB
      })
      expect(notifHtml).toMatchSnapshot();

    } finally {
      await processor?.close()
    }
  })

})
