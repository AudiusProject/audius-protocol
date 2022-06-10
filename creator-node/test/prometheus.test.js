const assert = require('assert')
const request = require('supertest')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

describe('test Prometheus metrics', async function () {
  let app, server, libsMock

  /** Setup app + global test vars */
  beforeEach(async () => {
    libsMock = getLibsMock()

    const appInfo = await getApp(libsMock)

    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async () => {
    await server.close()
  })

  it('checks for a healthy prometheus metrics endpoint', async function () {
    const resp = await request(app)
      .get('/prometheus_metrics')
      .expect(200)
    assert.ok(resp.text.includes('audius_cn_process_cpu_user_seconds_total'))
  })
})
