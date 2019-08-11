const request = require('supertest')

const { getApp } = require('./lib/app')

describe('test expressApp', function () {
  let app, server
  beforeEach(async () => {
    const appInfo = await getApp(null)
    app = appInfo.app
    server = appInfo.server
  })
  afterEach(async () => {
    await server.close()
  })

  it('responds 404 with invalid endpoint', function (done) {
    request(app)
      .get('/test')
      .expect(404, done)
  })

  it('succeeds health check', function (done) {
    request(app)
      .get('/health_check')
      .expect(200, done)
  })
})
