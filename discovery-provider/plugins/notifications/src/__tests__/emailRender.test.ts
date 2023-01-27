import fs from 'fs'
import path from 'path'
import { expect, test } from '@jest/globals';
import { renderEmail } from '../email/appNotifications/renderEmail';
import { Processor } from '../main';
import { NotificationRow, reposttype } from '../types/dn';
import { createReposts, createTestDB, createTracks, createUsers, dropTestDB, insertFollows, replaceDBName } from '../utils/populateDB';
import { Knex } from 'knex';


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


describe('Render Email', () => {

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

  test("Render Single Follow Email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)

      await insertFollows(processor.discoveryDB, [
        { follower_user_id: 1, followee_user_id: 2 }
      ])
      await new Promise(resolve => setTimeout(resolve, 10))

      const notifications: NotificationRow[] = [
        {
          type: 'follow',
          timestamp: new Date(),
          specifier: '1',
          group_id: 'follow:1',
          data: {
            follower_user_id: 1,
            followee_user_id: 2
          }
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


  test("Render a single Repost Track Email", async () => {
    let processor
    try {
      const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
      processor = await initDB(testName)


      await createTracks(processor.discoveryDB, [{
        track_id: 1,
        owner_id: 1
      }])


      // await createReposts(processor.discoveryDB, [{
      //   user_id: 2,
      //   repost_item_id: 1,
      //   repost_type: reposttype.track
      // }])
      await new Promise(resolve => setTimeout(resolve, 10))

      const notifications: NotificationRow[] = [
        {
          type: 'repost',
          timestamp: new Date(),
          specifier: '2',
          group_id: 'repost:track:1',
          data: {
            user_id: 2,
            repost_item_id: 1,
            type: reposttype.track
          }
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

      // const htmlPath = path.join(__dirname, 'test.html')
      // fs.writeFileSync(htmlPath, notifHtml);
    } finally {
      await processor?.close()
    }
  })

})
