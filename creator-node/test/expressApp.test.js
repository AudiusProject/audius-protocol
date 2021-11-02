const request = require('supertest')

const BlacklistManager = require('../src/blacklistManager')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

describe('test expressApp', async function () {
  let app, server, session

  beforeEach(async () => {
    const ipfsLatestMock = getIPFSMock(true)
    const ipfsMock = getIPFSMock()
    const libsMock = getLibsMock()

    await BlacklistManager.init()

    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager, ipfsLatestMock)

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()
  })

  afterEach(async function () {
    await server.close()
  })

  it('responds 404 with invalid endpoint', async function () {
    await request(app)
      .get('/asdf')
      .expect(404)
  })

  it('returns 401 with omitted session id', async function () {
    // logout endpoint requires login / checks session
    await request(app)
      .post('/users/logout')
      .expect(401)
  })

  it('returns 401 with invalid session id', async function () {
    // logout endpoint requires login / checks session
    await request(app)
      .post('/users/logout')
      .set('X-Session-ID', session.sessionToken + '1')
      .expect(401)
  })

  it('succeeds health check', async function () {
    await request(app)
      .get('/health_check')
      .expect(200)
  })
})
