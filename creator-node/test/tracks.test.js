const request = require('supertest')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const sinon = require('sinon')

const config = require('../src/config')
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

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')
const testAudioFileWrongFormatPath = path.resolve(__dirname, 'testTrackWrongFormat.jpg')
const testAudiusFileNumSegments = 32

// NOTE: Skipping as this test file tests the legacy route. We should deprecate that route eventually, and then remove these tests. The
// test file pollingTracks.test.js tests the same track upload logic as this file.
describe.skip('test non-polling Tracks with mocked IPFS (these are legacy - see pollingTracks.test.js for updated tests)', function () {
  let app, server, session, ipfsMock, libsMock, userId

  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    libsMock = getLibsMock()

    userId = 1

    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager, null, null, userId)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  it('fails to upload when format is not accepted', async function () {
    const file = fs.readFileSync(testAudioFileWrongFormatPath)

    // NOTE - for some reason this req returns 200
    const res = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
    assert.notStrictEqual(res.error, undefined)
  })

  it.skip('[TODO BROKEN] fails to upload when maxAudioFileSizeBytes exceeded', async function () {
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

    // TODO - this returns 200 for some reason?
    // Confirm max audio file size is respected by multer
    let file = fs.readFileSync(testAudioFilePath)
    await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(500)

    // Reset max file limits
    process.env.maxAudioFileSizeBytes = defaultConfig['maxAudioFileSizeBytes']
    await server.close()
  })

  it.skip('[TODO BROKEN] fails to upload when maxMemoryFileSizeBytes exceeded', async function () {
    // Configure extremely small file size
    process.env.maxMemoryFileSizeBytes = 10

    // Reset app
    await server.close()
    ipfsMock = getIPFSMock()
    const appInfo = await getApp(ipfsMock)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()

    ipfsMock.add.exactly(64)
    ipfsMock.pin.add.exactly(32)

    // TODO - this returns 200 for some reason?
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
    await server.close()
  })

  it('uploads /track_content', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(33)
    ipfsMock.pin.add.exactly(33)

    const trackContentResp = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)
    assert.deepStrictEqual(trackContentResp.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackContentResp.body.data.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.data.source_file.includes('.mp3'), true)
    assert.deepStrictEqual(trackContentResp.body.data.transcodedTrackCID, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(typeof trackContentResp.body.data.transcodedTrackUUID, 'string')
  })

  // depends on "uploads /track_content"
  it('creates Audius track', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const trackContentResp = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    assert.deepStrictEqual(trackContentResp.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackContentResp.body.data.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.data.source_file.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: trackContentResp.body.data.track_segments
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile: trackContentResp.body.data.source_file })
      .expect(200)

    assert.deepStrictEqual(trackMetadataResp.body.data.metadataMultihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
  })

  // depends on "uploads /track_content"
  it('Confirm /users/clock_status works with user and track', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const trackContentResp = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    assert.deepStrictEqual(trackContentResp.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackContentResp.body.data.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.data.source_file.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: trackContentResp.body.data.track_segments
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile: trackContentResp.body.data.source_file })
      .expect(200)

    assert.deepStrictEqual(trackMetadataResp.body.data.metadataMultihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')

    const wallet = session.walletPublicKey

    // Confirm /users/clock_status returns expected info
    let resp = await request(app)
      .get(`/users/clock_status/${wallet}`)
      .expect(200)
    assert.deepStrictEqual(resp.body.data, { clockValue: 34, syncInProgress: false })

    // Confirm /users/clock_status returns expected info with returnSkipInfo flag
    resp = await request(app)
      .get(`/users/clock_status/${wallet}?returnSkipInfo=true`)
      .expect(200)
    assert.deepStrictEqual(resp.body.data, { clockValue: 34, syncInProgress: false, CIDSkipInfo: { numCIDs: 34, numSkippedCIDs: 0 } })

    // Update track DB entries to be skipped
    const numAffectedRows = (await models.File.update(
      { skipped: true },
      {
        where: {
          cnodeUserUUID: session.cnodeUserUUID,
          type: 'track'
        }
      }
    ))[0]
    assert.strictEqual(numAffectedRows, 32)

    // Confirm /users/clock_status returns expected info with returnSkipInfo flag when some entries are skipped
    resp = await request(app)
      .get(`/users/clock_status/${wallet}?returnSkipInfo=true`)
      .expect(200)
    assert.deepStrictEqual(resp.body.data, { clockValue: 34, syncInProgress: false, CIDSkipInfo: { numCIDs: 34, numSkippedCIDs: 32 } })
  })

  // depends on "uploads /track_content"
  it('fails to create Audius track when segments not provided', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    assert.deepStrictEqual(resp1.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(resp1.body.data.track_segments.length, 32)
    assert.deepStrictEqual(resp1.body.data.source_file.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile: resp1.body.data.source_file })
      .expect(400)
  })

  // depends on "uploads /track_content"
  it('fails to create Audius track when invalid segment multihashes are provided', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    assert.deepStrictEqual(resp1.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(resp1.body.data.track_segments.length, 32)
    assert.deepStrictEqual(resp1.body.data.source_file.includes('.mp3'), true)

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
      .send({ metadata, sourceFile: resp1.body.data.source_file })
      .expect(400)
  })

  // depends on "uploads /track_content"
  it('fails to create Audius track when owner_id is not provided', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    assert.deepStrictEqual(resp1.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(resp1.body.data.track_segments.length, 32)
    assert.deepStrictEqual(resp1.body.data.source_file.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6', 'duration': 1000 }]
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile: resp1.body.data.source_file })
      .expect(400)
  })

  // depends on "uploads /track_content" and "creates Audius track" tests
  it('completes Audius track creation', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(4)

    const trackContentResp = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    assert.deepStrictEqual(trackContentResp.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackContentResp.body.data.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.data.source_file.includes('.mp3'), true)

    const metadata = {
      test: 'field1',
      track_segments: trackContentResp.body.data.track_segments,
      owner_id: 1
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile: trackContentResp.body.data.source_file })
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

  // depends on "uploads /track_content"
  it('fails to create downloadable track with no track_id and no source_id present', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(2)

    const resp1 = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    assert.deepStrictEqual(resp1.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(resp1.body.data.track_segments.length, 32)

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

  // depends on "uploads /track_content" and "creates Audius track" tests
  it('creates a downloadable track', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    ipfsMock.addFromFs.exactly(34)
    ipfsMock.pin.add.exactly(34)
    libsMock.User.getUsers.exactly(4)

    const trackContentResp = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    assert.deepStrictEqual(trackContentResp.body.data.track_segments[0].multihash, 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(trackContentResp.body.data.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.data.source_file.includes('.mp3'), true)

    // needs debugging as to why this 'cid' key is needed for test to work
    const metadata = {
      test: 'field1',
      track_segments: trackContentResp.body.data.track_segments,
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
      .send({ metadata, sourceFile: trackContentResp.body.data.source_file })
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

describe.skip('test non-polling Tracks with real IPFS (these are legacy - see pollingTracks.test.js for updated tests)', function () {
  let app, server, session, libsMock, ipfs, userId

  // Will need a '.' in front of storagePath to look at current dir
  // a '/' will search the root dir
  before(async () => {
    let storagePath = config.get('storagePath')
    if (storagePath.startsWith('/')) {
      storagePath = '.' + storagePath
      config.set('storagePath', storagePath)
    }
  })

  /** Inits ipfs client, libs mock, web server app, blacklist manager, and creates starter CNodeUser */
  beforeEach(async () => {
    ipfs = ipfsClient.ipfs
    libsMock = getLibsMock()

    userId = 1

    const appInfo = await getApp(ipfs, libsMock, BlacklistManager, null, null, userId)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  // ~~~~~~~~~~~~~~~~~~~~~~~~~ /track_content TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~
  it('sends server error response if segmenting fails', async function () {
    const file = fs.readFileSync(testAudioFilePath)
    sinon.stub(TranscodingQueue, 'segment').rejects(new Error('failed to segment'))

    const res = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
    assert.notStrictEqual(res.error, undefined)
  })

  it('sends server error response if transcoding fails', async function () {
    const file = fs.readFileSync(testAudioFilePath)
    sinon.stub(TranscodingQueue, 'transcode320').rejects(new Error('failed to transcode'))

    const res = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
    assert.notStrictEqual(res.error, undefined)
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
    const file = fs.readFileSync(testAudioFilePath)
    const res = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
    assert.notStrictEqual(res.error, undefined)

    // Clear redis of segment CIDs
    await BlacklistManager.removeFromRedis(BlacklistManager.getRedisSegmentCIDKey(), testTrackCIDs)
  })

  it('should successfully upload track + transcode and prune upload artifacts', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    // Make /track_content call with test file + expect success
    const resp = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(200)

    // check that the generated transcoded track is the same as the transcoded track in /tests
    const transcodedTrackAssetPath = path.join(__dirname, 'testTranscoded320Track.mp3')
    const transcodedTrackAssetBuf = fs.readFileSync(transcodedTrackAssetPath)
    const transcodedTrackPath = DiskManager.computeFilePath(resp.body.data.transcodedTrackCID)
    const transcodedTrackTestBuf = fs.readFileSync(transcodedTrackPath)
    assert.deepStrictEqual(transcodedTrackAssetBuf.compare(transcodedTrackTestBuf), 0)

    // Ensure 32 segments are returned, each segment has a corresponding file on disk,
    //    and each segment disk file is exactly as expected
    // Note - The exact output of track segmentation is deterministic only for a given environment/ffmpeg version
    //    This test may break in the future but at that point we should re-generate the reference segment files.
    const segmentCIDs = resp.body.data.track_segments
    assert.deepStrictEqual(segmentCIDs.length, testAudiusFileNumSegments)
    segmentCIDs.map(function (cid, index) {
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
    const resp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({})
      .expect(400)

    assert.deepStrictEqual(resp.body.error, 'Metadata object must include owner_id and non-empty track_segments array')
  })

  it('should not throw an error if segment is blacklisted', async function () {
    sinon.stub(BlacklistManager, 'CIDIsInBlacklist').returns(true)
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6', 'duration': 1000 }],
      owner_id: 1
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata })
      .expect(200)
  })

  it('should throw error response if saving metadata to fails', async function () {
    sinon.stub(ipfs, 'add').rejects(new Error('ipfs add failed!'))
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6', 'duration': 1000 }],
      owner_id: 1
    }

    const resp = await request(app)
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

    const resp = await request(app)
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
