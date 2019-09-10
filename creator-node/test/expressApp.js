const request = require('supertest')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')

describe('test expressApp', function () {
  let app, server, session
  beforeEach(async () => {
    const appInfo = await getApp()
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()
  })
  afterEach(async () => {
    await server.close()
  })

  it('responds 404 with invalid endpoint', function (done) {
    request(app)
      .get('/asdf')
      .expect(404, done)
  })

  it('returns 401 with omitted session id', function (done) {
    // logout endpoint requires login / checks session
    request(app)
      .post('/users/logout')
      .expect(401, done)
  })

  it('returns 401 with invalid session id', function (done) {
    // logout endpoint requires login / checks session
    request(app)
      .post('/users/logout')
      .set('X-Session-ID', session + '1')
      .expect(401, done)
  })

  it('succeeds health check', function (done) {
    request(app)
      .get('/health_check')
      .expect(200, done)
  })
})
