const request = require('supertest')
const assert = require('assert')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')

describe('Test health checks', () => {
  let app, server

  beforeEach(async () => {
    const libsMock = getLibsMock()

    const appInfo = await getApp(libsMock)

    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async () => {
    await server.close()
  })

  it('Ensure GET /config_check works, and hides sensitive configs', async () => {
    await request(app).get('/config_check')
      .expect(200)
      .expect(resp => {
        const configs = resp.body.data
        assert.strictEqual(configs.dbUrl, '[Sensitive]')
        assert.strictEqual(configs.delegatePrivateKey, '[Sensitive]')
      })
  })
})