import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../email/notifications/renderEmail'
import { Processor } from '../main'
import { DMEntityType } from '../email/notifications/types'
import { DMEmailNotification } from '../types/notifications'
import {
  createTestDB,
  createUsers,
  dropTestDB,
  replaceDBName
} from '../utils/populateDB'

const initDB = async (processor: Processor) => {
  await Promise.all([
    createUsers(processor.discoveryDB, [
      {
        user_id: 1,
        profile_picture_sizes: 'SOME_CID_HASH_1',
        creator_node_endpoint: 'http://dn.co,http://dn2.co,http://dn3.co'
      },
      {
        user_id: 2,
        profile_picture_sizes: 'SOME_CID_HASH_2',
        creator_node_endpoint: 'http://dn.co,http://dn2.co,http://dn3.co'
      }
    ])
  ])
}

describe('Render email', () => {
  let processor: Processor
  // Mock current date for test result consistency
  Date.now = jest.fn(() => new Date('2020-05-13T12:33:37.000Z').getTime())

  beforeEach(async () => {
    const testName = expect
      .getState()
      .currentTestName.replace(/\s/g, '_')
      .toLocaleLowerCase()
    await Promise.all([
      createTestDB(process.env.DN_DB_URL, testName),
      createTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
    processor = new Processor()
    await processor.init({
      identityDBUrl: replaceDBName(process.env.IDENTITY_DB_URL, testName),
      discoveryDBUrl: replaceDBName(process.env.DN_DB_URL, testName)
    })
    await initDB(processor)
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await processor?.close()
    const testName = expect
      .getState()
      .currentTestName.replace(/\s/g, '_')
      .toLocaleLowerCase()
    await Promise.all([
      dropTestDB(process.env.DN_DB_URL, testName),
      dropTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
  })

  test('Render a single Message email', async () => {
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
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(notifHtml).toMatchSnapshot()
  })

  test('Render a multiple Messages email', async () => {
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
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(notifHtml).toMatchSnapshot()
  })

  test('Render a single Message Reaction email', async () => {
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
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(notifHtml).toMatchSnapshot()
  })

  test('Render a multiple Message Reactions email', async () => {
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
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(notifHtml).toMatchSnapshot()
  })
})
