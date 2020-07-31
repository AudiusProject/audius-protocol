const request = require('supertest')
const assert = require('assert')
const sinon = require('sinon')
const path = require('path')
const fs = require('fs')

const ipfsClient = require('../src/ipfsClient')
const config = require('../src/config')
const fileManager = require('../src/fileManager')
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
})

describe('tests /audius_users/metadata metadata upload with actual ipfsClient', async function () {
  let app, server, session, libsMock, ipfs

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
    ipfs = ipfsClient.ipfs
    libsMock = getLibsMock()

    const appInfo = await getApp(ipfs, libsMock, BlacklistManager)
    await BlacklistManager.blacklist(ipfs)

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  it('should fail if metadatda is not found in request body', async function () {
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session)
      .send({ dummy: 'data' })
      .expect(500)

    assert.deepStrictEqual(resp.body.error, 'Internal server error') // should be specific?
  })

  it('should throw error response if metadata route fails', async function () {
    sinon.stub(ipfs, 'add').rejects(new Error('ipfs add failed!'))

    const metadata = { metadata: 'spaghetti' }
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session)
      .send(metadata)
      .expect(500)

    assert.deepStrictEqual(resp.body.error, 'Could not save file to disk, ipfs, and/or db: Error: ipfs add failed!')
  })

  it('successfully adds metadata to filesystem', async function () {
    const metadata = { metadata: 'spaghetti' }
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session)
      .send(metadata)
      .expect(200)

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = path.join(config.get('storagePath'), resp.body.metadataMultihash)
    assert.ok(fs.existsSync(metadataPath))

    // check that the metadata file contents match the metadata specified
    const metadataFileData = fs.readFileSync(metadataPath, 'utf-8')
    assert.ok(metadataFileData, 'spaghetti')
  })
})
