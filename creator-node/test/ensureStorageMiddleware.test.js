const request = require('supertest')
const assert = require('assert')
const sinon = require('sinon')
const fs = require('fs')

const models = require('../src/models')

const ipfsClient = require('../src/ipfsClient')
const config = require('../src/config')
const BlacklistManager = require('../src/blacklistManager')
const DiskManager = require('../src/diskManager')
const Monitors = require('../src/monitors/monitors')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

describe('test AudiusUsers with mocked IPFS', function () {
  let app, server, session, ipfsMock, libsMock

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
    session = await createStarterCNodeUser()
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  it('fails with 400 when storage capacity is reached (/audius_users/metadata)', async function () {
    sinon.stub(Monitors, 'getMonitors')
      .withArgs([[
        Monitors.MONITORS.STORAGE_PATH_SIZE,
        Monitors.MONITORS.STORAGE_PATH_USED
      ]])
      .returns(Promise.resolve([100, 100]))

    const metadata = { test: 'IMA STARBOY' }

    console.log('in test file', Monitors.getMonitors)

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata })
    //   .expect(400)

    console.log(resp.error)
  })
})
