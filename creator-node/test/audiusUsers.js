const request = require('supertest')
const assert = require('assert')
const sinon = require('sinon')

const fileManager = require('../src/fileManager')
const BlacklistManager = require('../src/blacklistManager')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')
const { save } = require('../src/redis')

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
    sinon.restore()
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

  it('should fail if metadatda is not found in request body', async function () {
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session)
      .send({ dummy: 'data' })
      .expect(500)

    assert.deepStrictEqual(resp.body.error, 'Internal server error') // should be specific?
  })

  it.only('should fail if metadata was not properly saved to filesystem', async function () {
    sinon.stub(fileManager, 'saveFileFromBuffer').rejects(new Error('saveFileFromBuffer failed'))
    require('../src/routes/audiusUsers')

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session)
      .send({ metadata: 'spaghetti' })
      .expect(500)

    assert.ok(resp.body.error.includes('Could not save file to disk, ipfs, and/or db'))
  })

  it('successfully adds metadata to filesystem', async function () {

  })
})
