const request = require('supertest')
const path = require('path')
const assert = require('assert')
const fs = require('fs-extra')

const models = require('../src/models')

const BlacklistManager = require('../src/blacklistManager')
const DiskManager = require('../src/diskManager')

const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getLibsMock } = require('./lib/libsMock')
const { sortKeys } = require('../src/apiSigning')

describe('Test Playlists', function () {
  let app, server, session, libsMock

  beforeEach(async () => {
    libsMock = getLibsMock()

    const userId = 1
    const spId = 1

    const { getApp } = require('./lib/app')

    const appInfo = await getApp(libsMock, BlacklistManager, null, spId)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)
  })

  afterEach(async () => {
    await server.close()
  })

  it('should fail if metadata is not found in request body', async function () {
    const resp = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ dummy: 'data' })
      .expect(500)

    // Route will throw error at `Buffer.from(JSON.stringify(metadataJSON))`
    assert.deepStrictEqual(resp.body.error, 'Internal server error')
  })

  it('should throw 400 bad request response if metadata validation fails', async function () {
    const metadata = { metadata: 'spaghetti' }
    const resp = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send(metadata)
      .expect(400)

    assert.deepStrictEqual(resp.body.error, 'Invalid Playlist Metadata')
  })

  it('successfully creates Audius playlist (POST /playlists/metadata)', async function () {
    const metadata = { test: 'field1' }
    const resp = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    if (
      resp.body.data.metadataMultihash !==
        'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W' ||
      !resp.body.data.metadataFileUUID
    ) {
      throw new Error('invalid return data')
    }

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = await DiskManager.computeFilePath(
      resp.body.data.metadataMultihash
    )
    assert.ok(await fs.pathExists(metadataPath))

    // check that the metadata file contents match the metadata specified
    let metadataFileData = await fs.readFile(metadataPath, 'utf-8')
    metadataFileData = sortKeys(JSON.parse(metadataFileData))
    assert.deepStrictEqual(metadataFileData, metadata)

    // check that the correct metadata file properties were written to db
    const file = await models.File.findOne({
      where: {
        multihash: resp.body.data.metadataMultihash,
        storagePath: metadataPath,
        type: 'metadata'
      }
    })
    assert.ok(file)
  })

  it('successfully completes Audius playlist creation (POST /playlists/metadata -> POST /playlists)', async function () {
    const metadata = { test: 'field1' }
    const resp = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = await DiskManager.computeFilePath(
      resp.body.data.metadataMultihash
    )
    assert.ok(await fs.pathExists(metadataPath))

    // check that the metadata file contents match the metadata specified
    let metadataFileData = await fs.readFile(metadataPath, 'utf-8')
    metadataFileData = sortKeys(JSON.parse(metadataFileData))
    assert.deepStrictEqual(metadataFileData, metadata)

    // check that the correct metadata file properties were written to db
    const file = await models.File.findOne({
      where: {
        multihash: resp.body.data.metadataMultihash,
        storagePath: metadataPath,
        type: 'metadata'
      }
    })
    assert.ok(file)

    await request(app)
      .post('/playlists')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({
        blockchainId: 1,
        blockNumber: 10,
        metadataFileUUID: resp.body.data.metadataFileUUID
      })
      .expect(200)
  })

  it('successfully completes Audius playlist creation with imageDirCID', async function () {
    const testPicture = path.resolve(__dirname, 'testTrackWrongFormat.jpg')
    const file = await fs.readFile(testPicture)
    // Upload test cover image
    const resp = await request(app)
      .post('/image_upload')
      .attach('file', file, { filename: 'abel.jpg' })
      .field('square', true)
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)

    const imageDirCID = resp.body.data.dirCID
    const playlistImagePath = await DiskManager.computeFilePath(imageDirCID)
    assert.ok(await fs.pathExists(playlistImagePath))
    const fileRecord = await models.File.findOne({
      where: {
        multihash: imageDirCID,
        storagePath: playlistImagePath,
        type: 'dir'
      }
    })
    assert.ok(fileRecord)
    const metadata = {
      test: 'field1',
      playlist_image_sizes_multihash: imageDirCID
    }

    // Upload playlist metadata with valid image dirCID
    const resp2 = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = await DiskManager.computeFilePath(
      resp2.body.data.metadataMultihash
    )
    assert.ok(await fs.pathExists(metadataPath))

    // check that the metadata file contents match the metadata specified
    let metadataFileData = await fs.readFile(metadataPath, 'utf-8')
    metadataFileData = sortKeys(JSON.parse(metadataFileData))
    assert.deepStrictEqual(metadataFileData, metadata)
    const metadataFileRecord = await models.File.findOne({
      where: {
        multihash: resp2.body.data.metadataMultihash,
        storagePath: metadataPath,
        type: 'metadata'
      }
    })
    assert.ok(metadataFileRecord)

    // Associate playlist object with blockchain ID
    await request(app)
      .post('/playlists')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({
        blockchainId: 1,
        blockNumber: 10,
        metadataFileUUID: resp2.body.data.metadataFileUUID
      })
      .expect(200)
  })

  it('successfully completes Audius playlist creation when retrying an existing block number and original metadata', async function () {
    const metadata = { test: 'field1' }

    libsMock.Playlist.getPlaylists.exactly(2)

    const resp = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    if (
      resp.body.data.metadataMultihash !==
      'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W'
    ) {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/playlists')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({
        blockchainId: 1,
        blockNumber: 10,
        metadataFileUUID: resp.body.data.metadataFileUUID
      })
      .expect(200)
  })

  it('successfully completes Audius playlist creation when retrying an existing block number and new metadata', async function () {
    const metadata1 = { test: 'field1' }

    libsMock.Playlist.getPlaylists.exactly(2)

    const resp1 = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata: metadata1 })
      .expect(200)

    if (
      resp1.body.data.metadataMultihash !==
      'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W'
    ) {
      throw new Error('invalid return data')
    }

    const metadata2 = { test2: 'field2' }

    libsMock.Playlist.getPlaylists.exactly(2)

    const resp2 = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata: metadata2 })
      .expect(200)

    if (
      resp2.body.data.metadataMultihash !==
      'QmTiWeEp2PTedHwWbtJNUuZ3deRZgAM5TG2UWrsAN9ik1N'
    ) {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/playlists')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({
        blockchainId: 1,
        blockNumber: 10,
        metadataFileUUID: resp2.body.data.metadataFileUUID
      })
      .expect(200)
  })

  it('fails Audius playlist creation when too low of a block number is supplied', async function () {
    const metadata = { test: 'field1' }

    libsMock.Playlist.getPlaylists.exactly(2)

    const resp = await request(app)
      .post('/playlists/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata })
      .expect(200)

    if (
      resp.body.data.metadataMultihash !==
      'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W'
    ) {
      throw new Error('invalid return data')
    }

    // Fast forward to block number 100
    const cnodeUser = await models.CNodeUser.findOne({
      where: { cnodeUserUUID: session.cnodeUserUUID }
    })
    await cnodeUser.update({ latestBlockNumber: 100 })

    await request(app)
      .post('/playlists')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({
        blockchainId: 1,
        blockNumber: 10,
        metadataFileUUID: resp.body.data.metadataFileUUID
      })
      .expect(400, {
        error:
          'Invalid blockNumber param 10. Must be greater or equal to previously processed blocknumber 100.'
      })
  })
})
