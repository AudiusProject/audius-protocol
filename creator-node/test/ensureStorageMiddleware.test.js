const request = require('supertest')
const assert = require('assert')
const sinon = require('sinon')

const config = require('../src/config')
const BlacklistManager = require('../src/blacklistManager')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')
const { getMonitorRedisKey, MONITORS } = require('../src/monitors/monitors')

describe('test AudiusUsers with mocked IPFS', function () {
  let app, server, session, ipfsMock, libsMock, monitoringQueueMock

  // Will need a '.' in front of storagePath to look at current dir
  // a '/' will search the root dir
  before(async () => {
    const originalStoragePath = config.get('storagePath')
    if (originalStoragePath.slice(0, 1) === '/') {
      const updatedStoragePath = '.' + originalStoragePath
      config.set('storagePath', updatedStoragePath)
    }
  })

  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    libsMock = getLibsMock()

    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
    monitoringQueueMock = appInfo.mockServiceRegistry.monitoringQueue
    session = await createStarterCNodeUser()
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  it('fails with 400 when storage capacity is reached (/audius_users/metadata)', async function () {
    const metadata = { test: 'IMA STARBOY' }

    await monitoringQueueMock.setRedisValues(
      getMonitorRedisKey(MONITORS.STORAGE_PATH_USED),
      100
    )

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata })
      .expect(400)

    console.log(resp.error)
  })
})
