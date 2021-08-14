const request = require('supertest')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const sinon = require('sinon')
const uuid = require('uuid/v4')
const proxyquire = require('proxyquire')

const defaultConfig = require('../default-config.json')
const ipfsClient = require('../src/ipfsClient')
const BlacklistManager = require('../src/blacklistManager')
const TranscodingQueue = require('../src/TranscodingQueue')
const models = require('../src/models')
const DiskManager = require('../src/diskManager')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')
const { sortKeys } = require('../src/apiSigning')
const { saveFileToStorage } = require('./lib/helpers')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')
const testAudioFileWrongFormatPath = path.resolve(__dirname, 'testTrackWrongFormat.jpg')

const testAudiusFileNumSegments = 32
const TRACK_CONTENT_POLLING_ROUTE = '/track_content_async'

const logContext = {
  logContext: {
    requestID: uuid(),
    requestMethod: 'POST',
    requestHostname: '127.0.0.1',
    requestUrl: TRACK_CONTENT_POLLING_ROUTE
  }
}

describe('test Tracks with mocked IPFS', function () {
  let app, server, session, ipfsMock, libsMock, handleTrackContentRoute, mockServiceRegistry, userId

  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    libsMock = getLibsMock()
    libsMock.useTrackContentPolling = true

    userId = 1

    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager, null, null, userId)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
    mockServiceRegistry = appInfo.mockServiceRegistry
    session = await createStarterCNodeUser(userId)

    handleTrackContentRoute = require('../src/components/tracks/tracksComponentService').handleTrackContentRoute
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  // Testing middleware -- leave as /track_content_async
  it('fails to upload when format is not accepted', async function () {
    const file = fs.readFileSync(testAudioFileWrongFormatPath)

    await request(app)
      .post(TRACK_CONTENT_POLLING_ROUTE)
      .attach('file', file, { filename: 'fname.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(400)
  })

  // Testing middleware -- leave as /track_content_async
  it('fails to upload when maxAudioFileSizeBytes exceeded', async function () {
    // Configure extremely small file size
    process.env.maxAudioFileSizeBytes = 10

    // Reset app
    await server.close()

    ipfsMock = getIPFSMock()
    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager, null, null, userId)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)

    ipfsMock.add.exactly(64)
    ipfsMock.pin.add.exactly(32)

    // Confirm max audio file size is respected by multer
    let file = fs.readFileSync(testAudioFilePath)
    await request(app)
      .post(TRACK_CONTENT_POLLING_ROUTE)
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(400)

    // Reset max file limits
    process.env.maxAudioFileSizeBytes = defaultConfig['maxAudioFileSizeBytes']
  })

  it('fails to upload when maxMemoryFileSizeBytes exceeded', async function () {
    // Configure extremely small file size
    process.env.maxMemoryFileSizeBytes = 10

    // Reset app
    await server.close()
    ipfsMock = getIPFSMock()
    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager, null, null, userId)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)

    ipfsMock.add.exactly(64)
    ipfsMock.pin.add.exactly(32)

    // Confirm max audio file size is respected by multer
    let file = fs.readFileSync(testAudioFileWrongFormatPath)
    await request(app)
      .post('/image_upload')
      .attach('file', file, { filename: 'fname.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(500)

    // Reset max file limits
    process.env.maxMemoryFileSizeBytes = defaultConfig['maxMemoryFileSizeBytes']
  })

  it('uploads /track_content_async', async function () {
    ipfsMock.addFromFs.exactly(33)
    ipfsMock.pin.add.exactly(33)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    let resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )

    const { track_segments: trackSegments, source_file: sourceFile, transcodedTrackCID, transcodedTrackUUID } = resp

    assert.deepStrictEqual(trackSegments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackSegments.length, 32)
    assert.deepStrictEqual(sourceFile.includes('.mp3'), true)
    assert.deepStrictEqual(transcodedTrackCID, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(typeof transcodedTrackUUID, 'string')
  })

  // depends on "uploads /track_content_async"; if that test fails, this test will fail to due to similarity
  it('creates Audius track using application logic for /track_content_async', async function () {
    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )

    const { track_segments: trackSegments, source_file: sourceFile } = resp
    assert.deepStrictEqual(trackSegments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackSegments.length, 32)
    assert.deepStrictEqual(sourceFile.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: trackSegments
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile })
      .expect(200)

    assert.deepStrictEqual(trackMetadataResp.body.data.metadataMultihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
  })

  // depends on "uploads /track_content_async"
  it('fails to create Audius track when segments not provided', async function () {
    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )

    const { track_segments: trackSegments, source_file: sourceFile } = resp

    assert.deepStrictEqual(trackSegments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackSegments.length, 32)
    assert.deepStrictEqual(sourceFile.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile })
      .expect(400)
  })

  // depends on "uploads /track_content_async"
  it('fails to create Audius track when invalid segment multihashes are provided', async function () {
    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )

    const { track_segments: trackSegments, source_file: sourceFile } = resp

    assert.deepStrictEqual(trackSegments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackSegments.length, 32)
    assert.deepStrictEqual(sourceFile.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'incorrectCIDLink', 'duration': 1000 }],
      owner_id: 1
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile })
      .expect(400)
  })

  // depends on "uploads /track_content_async"
  it('fails to create Audius track when owner_id is not provided', async function () {
    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )

    const { source_file: sourceFile } = resp

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6', 'duration': 1000 }]
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile })
      .expect(400)
  })

  // depends on "uploads /track_content_async" and "creates Audius track" tests
  it('completes Audius track creation', async function () {
    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(4)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )
    const { track_segments: trackSegments, source_file: sourceFile } = resp

    const metadata = {
      test: 'field1',
      track_segments: trackSegments,
      owner_id: 1
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile })
      .expect(200)

    if (trackMetadataResp.body.data.metadataMultihash !== 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6') {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ blockchainTrackId: 1, blockNumber: 10, metadataFileUUID: trackMetadataResp.body.data.metadataFileUUID })
      .expect(200)
  })

  // depends on "uploads /track_content_async"
  it('fails to create downloadable track with no track_id and no source_id present', async function () {
    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )

    const { track_segments: trackSegments } = resp
    assert.deepStrictEqual(trackSegments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackSegments.length, 32)

    // creates a downloadable Audius track with no track_id and no source_file
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: [{ 'multihash': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6', 'duration': 1000 }],
      download: {
        is_downloadable: true,
        requires_follow: false
      }
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata })
      .expect(400)
  })

  // depends on "uploads /track_content_async" and "creates Audius track" tests
  it('creates a downloadable track', async function () {
    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(4)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )

    const { track_segments: trackSegments, source_file: sourceFile } = resp

    assert.deepStrictEqual(trackSegments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackSegments.length, 32)
    assert.deepStrictEqual(sourceFile.includes('.mp3'), true)

    // needs debugging as to why this 'cid' key is needed for test to work
    const metadata = {
      test: 'field1',
      track_segments: trackSegments,
      owner_id: 1,
      download: {
        'is_downloadable': true,
        'requires_follow': false,
        'cid': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
      }
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile })
      .expect(200)

    if (trackMetadataResp.body.data.metadataMultihash !== 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6') {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ blockchainTrackId: 1, blockNumber: 10, metadataFileUUID: trackMetadataResp.body.data.metadataFileUUID })
      .expect(200)
  })
})

describe('test Tracks with real IPFS', function () {
  let app2, server, session, libsMock, ipfs, handleTrackContentRoute, mockServiceRegistry, userId

  /** Inits ipfs client, libs mock, web server app, blacklist manager, and creates starter CNodeUser */
  beforeEach(async () => {
    ipfs = ipfsClient.ipfs
    libsMock = getLibsMock()

    userId = 1

    const appInfo = await getApp(ipfs, libsMock, BlacklistManager, null, null, userId)
    await BlacklistManager.init()

    app2 = appInfo.app
    server = appInfo.server
    mockServiceRegistry = appInfo.mockServiceRegistry
    session = await createStarterCNodeUser(userId)

    handleTrackContentRoute = require('../src/components/tracks/tracksComponentService').handleTrackContentRoute
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  // ~~~~~~~~~~~~~~~~~~~~~~~~~ /track_content_async TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~
  it('sends server error response if segmenting fails', async function () {
    const { handleTrackContentRoute } = proxyquire('../src/components/tracks/tracksComponentService.js', {
      '../../TranscodingQueue': { segment: sinon.stub(TranscodingQueue, 'segment').rejects(new Error('failed to segment')) }
    })

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    try {
      await handleTrackContentRoute(
        logContext,
        getReqObj(fileUUID, fileDir, session),
        mockServiceRegistry.ipfs,
        mockServiceRegistry.blacklistManager
      )
      assert.fail('Should have thrown error if segmenting failed')
    } catch (e) {
      assert.ok(e.message.includes('failed to segment'))
    }
  })

  it('sends server error response if transcoding fails', async function () {
    const { handleTrackContentRoute } = proxyquire('../src/components/tracks/tracksComponentService.js', {
      '../../TranscodingQueue': { transcode320: sinon.stub(TranscodingQueue, 'transcode320').rejects(new Error('failed to transcode')) }
    })

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    try {
      await handleTrackContentRoute(
        logContext,
        getReqObj(fileUUID, fileDir, session),
        mockServiceRegistry.ipfs,
        mockServiceRegistry.blacklistManager
      )
      assert.fail('Should have thrown error if transcoding failed')
    } catch (e) {
      assert.ok(e.message.includes('failed to transcode'))
    }
  })

  // Note: if hashing logic from ipfs ever changes, this test will fail
  it('sends forbidden error response if track segments are in BlacklistManager', async function () {
    // Add CIDs from testTrackData.json file to BlacklistManager
    let testTrackJSON
    try {
      const testTrackData = fs.readFileSync(path.join(__dirname, 'testTrackData.json'))
      testTrackJSON = JSON.parse(testTrackData)
    } catch (e) {
      assert.fail(`Could not parse testTrack metadata json: ${e}`)
    }
    const testTrackCIDs = testTrackJSON.map(segment => segment.multihash)
    await BlacklistManager.addToRedis(BlacklistManager.getRedisSegmentCIDKey(), testTrackCIDs)

    // Attempt to associate track content and get forbidden error
    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    try {
      await handleTrackContentRoute(
        logContext,
        getReqObj(fileUUID, fileDir, session),
        mockServiceRegistry.ipfs,
        mockServiceRegistry.blacklistManager
      )
      assert.fail('Should have thrown error if segment in blacklist')
    } catch (e) {
      assert.ok(e.message.includes('blacklisted'))
    }

    // Clear redis of segment CIDs
    await BlacklistManager.removeFromRedis(BlacklistManager.getRedisSegmentCIDKey(), testTrackCIDs)
  })

  it('should successfully upload track + transcode and prune upload artifacts', async function () {
    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session),
      mockServiceRegistry.ipfs,
      mockServiceRegistry.blacklistManager
    )

    const { track_segments: trackSegments, transcodedTrackCID } = resp

    // check that the generated transcoded track is the same as the transcoded track in /tests
    const transcodedTrackAssetPath = path.join(__dirname, 'testTranscoded320Track.mp3')
    const transcodedTrackAssetBuf = fs.readFileSync(transcodedTrackAssetPath)
    const transcodedTrackPath = DiskManager.computeFilePath(transcodedTrackCID)
    const transcodedTrackTestBuf = fs.readFileSync(transcodedTrackPath)
    assert.deepStrictEqual(transcodedTrackAssetBuf.compare(transcodedTrackTestBuf), 0)

    // Ensure 32 segments are returned, each segment has a corresponding file on disk,
    //    and each segment disk file is exactly as expected
    // Note - The exact output of track segmentation is deterministic only for a given environment/ffmpeg version
    //    This test may break in the future but at that point we should re-generate the reference segment files.
    assert.deepStrictEqual(trackSegments.length, testAudiusFileNumSegments)
    trackSegments.map(function (cid, index) {
      const cidPath = DiskManager.computeFilePath(cid.multihash)

      // Ensure file exists
      assert.ok(fs.existsSync(cidPath))

      // Ensure file is identical to expected segment file
      const expectedSegmentFilePath = _getTestSegmentFilePathAtIndex(index)
      const expectedSegmentFileBuf = fs.readFileSync(expectedSegmentFilePath)
      const returnedSegmentFileBuf = fs.readFileSync(cidPath)
      assert.deepStrictEqual(expectedSegmentFileBuf.compare(returnedSegmentFileBuf), 0)
    })
  })

  // ~~~~~~~~~~~~~~~~~~~~~~~~~ /tracks/metadata TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~
  it('should throw an error if no metadata is passed', async function () {
    const resp = await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({})
      .expect(400)

    assert.deepStrictEqual(resp.body.error, 'Metadata object must include owner_id and non-empty track_segments array')
  })

  it('should throw an error if segment is blacklisted', async function () {
    sinon.stub(BlacklistManager, 'CIDIsInBlacklist').returns(true)
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6', 'duration': 1000 }],
      owner_id: 1
    }

    const resp = await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata })
      .expect(403)

    assert.deepStrictEqual(resp.body.error, `Segment CID ${metadata.track_segments[0].multihash} has been blacklisted by this node.`)
  })

  it('should throw error response if saving metadata to fails', async function () {
    sinon.stub(ipfs, 'add').rejects(new Error('ipfs add failed!'))
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6', 'duration': 1000 }],
      owner_id: 1
    }

    const resp = await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata })
      .expect(500)

    assert.deepStrictEqual(resp.body.error, '/tracks/metadata saveFileFromBufferToIPFSAndDisk op failed: Error: ipfs add failed!')
  })

  it('successfully adds metadata file to filesystem, db, and ipfs', async function () {
    const metadata = sortKeys({
      test: 'field1',
      track_segments: [{ 'multihash': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6', 'duration': 1000 }],
      owner_id: 1
    })

    const resp = await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata })
      .expect(function (res) {
        if (res.body.error) {
          console.error(res.body.error)
          assert.fail(res.body.error)
        }
      })
      .expect(200)

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = DiskManager.computeFilePath(resp.body.data.metadataMultihash)
    assert.ok(fs.existsSync(metadataPath))

    // check that the metadata file contents match the metadata specified
    let metadataFileData = fs.readFileSync(metadataPath, 'utf-8')
    metadataFileData = sortKeys(JSON.parse(metadataFileData))
    assert.deepStrictEqual(metadataFileData, metadata)

    // check that the correct metadata file properties were written to db
    const file = await models.File.findOne({ where: {
      multihash: resp.body.data.metadataMultihash,
      storagePath: metadataPath,
      type: 'metadata'
    } })
    assert.ok(file)

    // check that the metadata file is in IPFS
    let ipfsResp
    try {
      ipfsResp = await ipfs.cat(resp.body.data.metadataMultihash)
    } catch (e) {
      // If CID is not present, will throw timeout error
      assert.fail(e.message)
    }

    // check that the ipfs content matches what we expect
    const metadataBuffer = Buffer.from(JSON.stringify(metadata))
    assert.deepStrictEqual(metadataBuffer.compare(ipfsResp), 0)
  })

  // ~~~~~~~~~~~~~~~~~~~~~~~~~ /tracks TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~
  it.skip('TODO - POST /tracks tests', async function () {})

  it.skip('TODO - parallel track upload', async function () {})
})

// Create the req context for handleTrackContentRoute
function getReqObj (fileUUID, fileDir, session) {
  return {
    fileName: `${fileUUID}.mp3`,
    fileDir,
    fileDestination: fileDir,
    session: {
      cnodeUserUUID: session.cnodeUserUUID
    }
  }
}

/**
 * Given index of segment, returns filepath of expected segment file in /test/test-segments/ dir
 * TODO - instead of using ./test/test-segments, use ./test/testTrackUploadDir
*/
function _getTestSegmentFilePathAtIndex (index) {
  let suffix = '000'

  if (index >= 0 && index < 10) suffix += `0${index}`
  else if (index >= 10 && index < 32) suffix += `${index}`
  else throw new Error('Index must be [0, 32)')

  return path.join(__dirname, 'test-segments', `segment${suffix}.ts`)
}
