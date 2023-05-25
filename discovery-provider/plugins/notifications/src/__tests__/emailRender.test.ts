import { expect, test } from '@jest/globals'
import { renderEmail } from '../email/notifications/renderEmail'
import { Processor } from '../main'
import { DMEntityType } from '../email/notifications/types'
import { DMEmailNotification } from '../types/notifications'
import { createUsers, resetTests, setupTest } from '../utils/populateDB'

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

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
    await initDB(processor)
  })

  afterEach(async () => {
    await resetTests(processor)
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

  test('Render a live email', async () => {
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
      frequency: 'live',
      notifications,
      dnDb: processor.discoveryDB,
      identityDb: processor.identityDB
    })
    expect(notifHtml).toMatchSnapshot()
  })

  test('Render a weekly email', async () => {
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
      frequency: 'weekly',
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
