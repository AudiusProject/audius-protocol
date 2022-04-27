const request = require('supertest')

const BlacklistManager = require('../src/blacklistManager')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

describe('test Users', async function () {
  let app, server, libsMock

  /** Setup app + global test vars */
  beforeEach(async () => {
    libsMock = getLibsMock()

    const appInfo = await getApp(libsMock, BlacklistManager)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async () => {
    await server.close()
  })

  it('checks for a healthy prometheus metrics endpoint', async function () {
    request(app)
      .post('/prometheus_metrics')
      .expect(200)
  })
})
