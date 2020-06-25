const request = require('supertest')

const BlacklistManager = require('../src/blacklistManager')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

describe('test AudiusUsers', function () {
  let app, server, session, ipfsMock, libsMock

  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    libsMock = getLibsMock()

    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager)
    await BlacklistManager.blacklist(ipfsMock)

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()
  })

  afterEach(async () => {
    await server.close()
  })

  it('creates Audius user', async function () {
    const metadata = { test: 'field1' }
    ipfsMock.add.twice().withArgs(Buffer.from(JSON.stringify(metadata)))
    ipfsMock.pin.add.once().withArgs('testCIDLink')

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(200)

    if (resp.body.metadataMultihash !== 'testCIDLink') {
      throw new Error('invalid return data')
    }
  })

  it('completes Audius user creation', async function () {
    const metadata = { test: 'field1' }

    ipfsMock.add.twice().withArgs(Buffer.from(JSON.stringify(metadata)))
    ipfsMock.pin.add.once().withArgs('testCIDLink')
    libsMock.User.getUsers.exactly(2)

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session)
      .send({ metadata })
      .expect(200)

    if (resp.body.metadataMultihash !== 'testCIDLink') {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/audius_users')
      .set('X-Session-ID', session)
      .send({ blockchainUserId: 1, blockNumber: 10, metadataFileUUID: resp.body.metadataFileUUID })
      .expect(200)
  })
})
