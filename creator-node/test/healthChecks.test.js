const request = require('supertest')
const assert = require('assert')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const BlacklistManager = require('../src/blacklistManager')
const config = require('../src/config')

describe('Test health checks', () => {
  let app, server

  beforeEach(async () => {
    const libsMock = getLibsMock()

    await BlacklistManager.init()
    const appInfo = await getApp(libsMock, BlacklistManager)

    app = appInfo.app
    server = appInfo.server
  })

  afterEach(async () => {
    await server.close()
  })

  it('Ensure /health_check and /health_check/verbose both work, and return identical responses', async () => {
    const healthCheckResp = await request(app).get('/health_check')
      .expect(200)
      .expect(resp => {
        assert.strictEqual(resp.body.data.creatorNodeEndpoint, config.get('creatorNodeEndpoint'))
      })
    
    const healthCheckVerboseResp = await request(app).get('/health_check/verbose')
      .expect(200)

    assert.deepStrictEqual(
      healthCheckResp.body.data,
      healthCheckVerboseResp.body.data
    )
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