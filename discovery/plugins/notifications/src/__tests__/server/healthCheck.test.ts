import { expect, test } from '@jest/globals'
import { Processor } from '../../main'

import { resetTests, setupTest } from '../../utils/populateDB'

import request from 'supertest'

describe('Server Health Check Notifications', () => {
  let processor: Processor

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for reaction', async () => {
    const res = await request(processor.server.app)
      .get('/health_check')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(res.body.healthy).toBe(true)
  })
})
