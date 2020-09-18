const request = require('supertest')
const assert = require('assert')
const sinon = require('sinon')
const path = require('path')
const fs = require('fs')

const models = require('../src/models')

const ipfsClient = require('../src/ipfsClient')
const config = require('../src/config')
const BlacklistManager = require('../src/blacklistManager')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')
const { sortKeys } = require('../src/apiHelpers')

describe.only('test AudiusUsers', function () {
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
    await BlacklistManager.blacklist(ipfsMock)

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  it.only('creates Audius user', async function () {
    const metadata = { test: 'field1' }
    ipfsMock.add.twice().withArgs(Buffer.from(JSON.stringify(metadata)))
    ipfsMock.pin.add.once().withArgs('testCIDLink')

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata })
      .expect(200)

    if (resp.body.metadataMultihash !== 'testCIDLink' || !resp.body.metadataFileUUID) {
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
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata })
      .expect(200)

    if (resp.body.metadataMultihash !== 'testCIDLink') {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/audius_users')
      .set('X-Session-ID', session.sessionToken)
      .send({ blockchainUserId: 1, blockNumber: 10, metadataFileUUID: resp.body.metadataFileUUID })
      .expect(200)
  })
})

// Below block uses actual ipfsClient (unlike first describe block), hence
// another describe block for this purpose
// NOTE: these tests mock ipfs client errors; otherwise, for happy path, uses actual ipfsClient
describe('tests /audius_users/metadata metadata upload with actual ipfsClient for happy path', function () {
  let app, server, session, libsMock, ipfs

  // Will need a '.' in front of storagePath to look at current dir
  // a '/' will search the root dir
  before(async () => {
    let storagePath = config.get('storagePath')
    if (storagePath.startsWith('/')) {
      storagePath = '.' + storagePath
      config.set('storagePath', storagePath)
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

  it('should fail if metadata is not found in request body', async function () {
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ dummy: 'data' })
      .expect(500)

    // Route will throw error at `Buffer.from(JSON.stringify(metadataJSON))`
    assert.deepStrictEqual(resp.body.error, 'Internal server error')
  })

  it('should throw error response if saving metadata fails', async function () {
    sinon.stub(ipfs, 'add').rejects(new Error('ipfs add failed!'))

    const metadata = { metadata: 'spaghetti' }
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send(metadata)
      .expect(500)

    assert.deepStrictEqual(resp.body.error, 'saveFileFromBufferToIPFSAndDisk op failed: Error: ipfs add failed!')
  })

  it('should successfully add metadata file to filesystem, db, and ipfs', async function () {
    const metadata = sortKeys({ spaghetti: 'spaghetti' })
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata })
      .expect(200)

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = path.join(config.get('storagePath'), resp.body.metadataMultihash)
    assert.ok(fs.existsSync(metadataPath))

    // check that the metadata file contents match the metadata specified
    let metadataFileData = fs.readFileSync(metadataPath, 'utf-8')
    metadataFileData = sortKeys(JSON.parse(metadataFileData))
    assert.deepStrictEqual(metadataFileData, metadata)

    // check that the correct metadata file properties were written to db
    const file = await models.File.findOne({ where: {
      multihash: resp.body.metadataMultihash,
      storagePath: metadataPath,
      type: 'metadata'
    } })
    assert.ok(file)

    // check that the metadata file is in IPFS
    let ipfsResp
    try {
      ipfsResp = await ipfs.cat(resp.body.metadataMultihash)
    } catch (e) {
      // If CID is not present, will throw timeout error
      assert.fail(e.message)
    }

    // check that the ipfs content matches what we expect
    const metadataBuffer = Buffer.from(JSON.stringify(metadata))
    assert.deepStrictEqual(metadataBuffer.compare(ipfsResp), 0)
  })
})
