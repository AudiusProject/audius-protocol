const request = require('supertest')
const assert = require('assert')
const sinon = require('sinon')
const fs = require('fs-extra')

const models = require('../src/models')

const BlacklistManager = require('../src/blacklistManager')
const DiskManager = require('../src/diskManager')

const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getLibsMock } = require('./lib/libsMock')
const { sortKeys } = require('../src/apiSigning')

describe('Test AudiusUsers', function () {
  let app, server, session, libsMock

  beforeEach(async () => {
    libsMock = getLibsMock()

    const userId = 1

    const { getApp } = require('./lib/app')

    const appInfo = await getApp(libsMock, BlacklistManager, null, userId)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  it('should fail if metadata is not found in request body', async function () {
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ dummy: 'data' })
      .expect(500)

    // Route will throw error at `Buffer.from(JSON.stringify(metadataJSON))`
    assert.deepStrictEqual(resp.body.error, 'Internal server error')
  })

  it('should throw 400 bad request response if metadata validation fails', async function () {
    const metadata = { metadata: 'spaghetti' }
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send(metadata)
      .expect(400)

    assert.deepStrictEqual(resp.body.error, 'Invalid User Metadata')
  })

  it('successfully creates Audius user (POST /audius_users/metadata)', async function () {
    const metadata = { test: 'field1' }
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    if (resp.body.data.metadataMultihash !== 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W' || !resp.body.data.metadataFileUUID) {
      throw new Error('invalid return data')
    }

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = await DiskManager.computeFilePath(resp.body.data.metadataMultihash)
    assert.ok(await fs.pathExists(metadataPath))

    // check that the metadata file contents match the metadata specified
    let metadataFileData = await fs.readFile(metadataPath, 'utf-8')
    metadataFileData = sortKeys(JSON.parse(metadataFileData))
    assert.deepStrictEqual(metadataFileData, metadata)

    // check that the correct metadata file properties were written to db
    const file = await models.File.findOne({ where: {
      multihash: resp.body.data.metadataMultihash,
      storagePath: metadataPath,
      type: 'metadata'
    } })
    assert.ok(file)
  })

  it('successfully completes Audius user creation (POST /audius_users/metadata -> POST /audius_users)', async function () {
    const metadata = { test: 'field1' }
    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = await DiskManager.computeFilePath(resp.body.data.metadataMultihash)
    assert.ok(await fs.pathExists(metadataPath))

    // check that the metadata file contents match the metadata specified
    let metadataFileData = await fs.readFile(metadataPath, 'utf-8')
    metadataFileData = sortKeys(JSON.parse(metadataFileData))
    assert.deepStrictEqual(metadataFileData, metadata)

    // check that the correct metadata file properties were written to db
    const file = await models.File.findOne({ where: {
      multihash: resp.body.data.metadataMultihash,
      storagePath: metadataPath,
      type: 'metadata'
    } })
    assert.ok(file)

    // Make chain recognize current session wallet as the wallet for the session user ID
    const blockchainUserId = 1
    const getUserStub = sinon.stub().callsFake((blockchainUserIdArg) => {
      let wallet = 'no wallet'
      if (blockchainUserIdArg === blockchainUserId) {
        wallet = session.walletPublicKey
      }
      return {
        wallet
      }
    })
    libsMock.contracts.UserFactoryClient = { getUser: getUserStub }

    await request(app)
      .post('/audius_users')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ blockchainUserId, blockNumber: 10, metadataFileUUID: resp.body.data.metadataFileUUID })
      .expect(200)
  })

  it('successfully completes Audius user creation when retrying an existing block number and original metadata', async function () {
    const metadata = { test: 'field1' }

    libsMock.User.getUsers.exactly(2)

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    if (resp.body.data.metadataMultihash !== 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W') {
      throw new Error('invalid return data')
    }

    // Make chain recognize current session wallet as the wallet for the session user ID
    const blockchainUserId = 1
    const getUserStub = sinon.stub().callsFake((blockchainUserIdArg) => {
      let wallet = 'no wallet'
      if (blockchainUserIdArg === blockchainUserId) {
        wallet = session.walletPublicKey
      }
      return {
        wallet
      }
    })
    libsMock.contracts.UserFactoryClient = { getUser: getUserStub }

    await request(app)
      .post('/audius_users')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ blockchainUserId, blockNumber: 10, metadataFileUUID: resp.body.data.metadataFileUUID })
      .expect(200)

    await request(app)
      .post('/audius_users')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ blockchainUserId, blockNumber: 10, metadataFileUUID: resp.body.data.metadataFileUUID })
      .expect(200)
  })

  it('successfully completes Audius user creation when retrying an existing block number and new metadata', async function () {
    const metadata1 = { test: 'field1' }

    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata: metadata1 })
      .expect(200)

    if (resp1.body.data.metadataMultihash !== 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W') {
      throw new Error('invalid return data')
    }

    const metadata2 = { test2: 'field2' }

    libsMock.User.getUsers.exactly(2)

    const resp2 = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata: metadata2 })
      .expect(200)

    if (resp2.body.data.metadataMultihash !== 'QmTiWeEp2PTedHwWbtJNUuZ3deRZgAM5TG2UWrsAN9ik1N') {
      throw new Error('invalid return data')
    }

    // Make chain recognize current session wallet as the wallet for the session user ID
    const blockchainUserId = 1
    const getUserStub = sinon.stub().callsFake((blockchainUserIdArg) => {
      let wallet = 'no wallet'
      if (blockchainUserIdArg === blockchainUserId) {
        wallet = session.walletPublicKey
      }
      return {
        wallet
      }
    })
    libsMock.contracts.UserFactoryClient = { getUser: getUserStub }

    await request(app)
      .post('/audius_users')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ blockchainUserId, blockNumber: 10, metadataFileUUID: resp2.body.data.metadataFileUUID })
      .expect(200)
  })

  it('fails Audius user creation when too low of a block number is supplied', async function () {
    const metadata = { test: 'field1' }

    libsMock.User.getUsers.exactly(2)

    const resp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    if (resp.body.data.metadataMultihash !== 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W') {
      throw new Error('invalid return data')
    }

    // Fast forward to block number 100
    const cnodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID: session.cnodeUserUUID } })
    await cnodeUser.update({ latestBlockNumber: 100 })

    // Make chain recognize current session wallet as the wallet for the session user ID
    const blockchainUserId = 1
    const getUserStub = sinon.stub().callsFake((blockchainUserIdArg) => {
      let wallet = 'no wallet'
      if (blockchainUserIdArg === blockchainUserId) {
        wallet = session.walletPublicKey
      }
      return {
        wallet
      }
    })
    libsMock.contracts.UserFactoryClient = { getUser: getUserStub }

    await request(app)
      .post('/audius_users')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ blockchainUserId, blockNumber: 10, metadataFileUUID: resp.body.data.metadataFileUUID })
      .expect(400, {
        error: 'Invalid blockNumber param 10. Must be greater or equal to previously processed blocknumber 100.'
      })
  })
})
