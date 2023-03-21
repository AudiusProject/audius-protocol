import { expect, jest, test } from '@jest/globals'
import { renderEmail } from '../../email/notifications/renderEmail'
import { Processor } from '../../main'
import {
  AppEmailNotification,
  ReactionNotification
} from '../../types/notifications'

import {
  createUsers,
  insertMobileDevices,
  insertMobileSettings,
  dropTestDB,
  createUserTip,
  createReaction,
  setupTest
} from '../../utils/populateDB'

import request from 'supertest'

describe('Server Health Check Notifications', () => {
  let processor: Processor
  // Mock current date for test result consistency
  Date.now = jest.fn(() => new Date('2020-05-13T12:33:37.000Z').getTime())

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
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

  test('Process push notification for reaction', async () => {
    const res = await request(processor.server.app)
      .get('/health_check')
      .expect('Content-Type', /json/)
      .expect(200)
    console.log(res.body)
    expect(res.body.healthy).toBe(true)
  })
})
