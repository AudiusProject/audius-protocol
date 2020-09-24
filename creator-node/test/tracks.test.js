const request = require('supertest')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const sinon = require('sinon')

const config = require('../src/config')
const defaultConfig = require('../default-config.json')
const ipfsClient = require('../src/ipfsClient')
const blacklistManager = require('../src/blacklistManager')
const TranscodingQueue = require('../src/TranscodingQueue')
const models = require('../src/models')

const { getApp } = require('./lib/app')
const { createStarterCNodeUser } = require('./lib/dataSeeds')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')
const { sortKeys } = require('../src/apiHelpers')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')
const testAudioFileWrongFormatPath = path.resolve(__dirname, 'testTrackWrongFormat.jpg')
const testAudiusFileNumSegments = 32

describe('test Tracks with mocked IPFS', function () {
  let app, server, session, ipfsMock, libsMock

  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    libsMock = getLibsMock()

    const appInfo = await getApp(ipfsMock, libsMock, blacklistManager)
    await blacklistManager.blacklist(ipfsMock)

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  it('fails to upload when format is not accepted', async function () {
    const file = fs.readFileSync(testAudioFileWrongFormatPath)

    await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .expect(400)
  })

  it('fails to upload when maxAudioFileSizeBytes exceeded', async function () {
    // Configure extremely small file size
    process.env.maxAudioFileSizeBytes = 10

    // Reset app
    await server.close()

    ipfsMock = getIPFSMock()
    const appInfo = await getApp(ipfsMock)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()

    ipfsMock.add.exactly(64)
    ipfsMock.pin.add.exactly(32)

    // Confirm max audio file size is respected by multer
    let file = fs.readFileSync(testAudioFilePath)
    await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .expect(500)

    // Reset max file limits
    process.env.maxAudioFileSizeBytes = defaultConfig['maxAudioFileSizeBytes']
    await server.close()
  })

  it('fails to upload when maxMemoryFileSizeBytes exceeded', async function () {
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

    // Confirm max audio file size is respected by multer
    let file = fs.readFileSync(testAudioFileWrongFormatPath)
    await request(app)
      .post('/image_upload')
      .attach('file', file, { filename: 'fname.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
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
      .expect(200)

    assert.deepStrictEqual(trackContentResp.body.track_segments[0].multihash, 'testCIDLink')
    assert.deepStrictEqual(trackContentResp.body.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.source_file.includes('.mp3'), true)
    assert.deepStrictEqual(trackContentResp.body.transcodedTrackCID, 'testCIDLink')
    assert.deepStrictEqual(typeof trackContentResp.body.transcodedTrackUUID, 'string')
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
      .expect(200)

    assert.deepStrictEqual(trackContentResp.body.track_segments[0].multihash, 'testCIDLink')
    assert.deepStrictEqual(trackContentResp.body.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.source_file.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: trackContentResp.body.track_segments
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata, sourceFile: trackContentResp.body.source_file })
      .expect(200)

    assert.deepStrictEqual(trackMetadataResp.body.metadataMultihash, 'testCIDLink')
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
      .expect(200)

    assert.deepStrictEqual(resp1.body.track_segments[0].multihash, 'testCIDLink')
    assert.deepStrictEqual(resp1.body.track_segments.length, 32)
    assert.deepStrictEqual(resp1.body.source_file.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      owner_id: 1
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata, sourceFile: resp1.body.source_file })
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
      .expect(200)

    assert.deepStrictEqual(resp1.body.track_segments[0].multihash, 'testCIDLink')
    assert.deepStrictEqual(resp1.body.track_segments.length, 32)
    assert.deepStrictEqual(resp1.body.source_file.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'incorrectCIDLink', 'duration': 1000 }],
      owner_id: 1
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata, sourceFile: resp1.body.source_file })
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
      .expect(200)

    assert.deepStrictEqual(resp1.body.track_segments[0].multihash, 'testCIDLink')
    assert.deepStrictEqual(resp1.body.track_segments.length, 32)
    assert.deepStrictEqual(resp1.body.source_file.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }]
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata, sourceFile: resp1.body.source_file })
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
      .expect(200)

    assert.deepStrictEqual(trackContentResp.body.track_segments[0].multihash, 'testCIDLink')
    assert.deepStrictEqual(trackContentResp.body.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.source_file.includes('.mp3'), true)

    const metadata = {
      test: 'field1',
      track_segments: trackContentResp.body.track_segments,
      owner_id: 1
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata, sourceFile: trackContentResp.body.source_file })
      .expect(200)

    if (trackMetadataResp.body.metadataMultihash !== 'testCIDLink') {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .send({ blockchainTrackId: 1, blockNumber: 10, metadataFileUUID: trackMetadataResp.body.metadataFileUUID })
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
      .expect(200)

    assert.deepStrictEqual(resp1.body.track_segments[0].multihash, 'testCIDLink')
    assert.deepStrictEqual(resp1.body.track_segments.length, 32)

    // creates a downloadable Audius track with no track_id and no source_file
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }],
      download: {
        is_downloadable: true,
        requires_follow: false
      }
    }

    await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
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
      .expect(200)

    assert.deepStrictEqual(trackContentResp.body.track_segments[0].multihash, 'testCIDLink')
    assert.deepStrictEqual(trackContentResp.body.track_segments.length, 32)
    assert.deepStrictEqual(trackContentResp.body.source_file.includes('.mp3'), true)

    // needs debugging as to why this 'cid' key is needed for test to work
    const metadata = {
      test: 'field1',
      track_segments: trackContentResp.body.track_segments,
      owner_id: 1,
      download: {
        'is_downloadable': true,
        'requires_follow': false,
        'cid': 'testCIDLink'
      }
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata, sourceFile: trackContentResp.body.source_file })
      .expect(200)

    if (trackMetadataResp.body.metadataMultihash !== 'testCIDLink') {
      throw new Error('invalid return data')
    }

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .send({ blockchainTrackId: 1, blockNumber: 10, metadataFileUUID: trackMetadataResp.body.metadataFileUUID })
      .expect(200)
  })
})

describe('test Tracks with real IPFS', function () {
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

  /** Inits ipfs client, libs mock, web server app, blacklist manager, and creates starter CNodeUser */
  beforeEach(async () => {
    ipfs = ipfsClient.ipfs
    libsMock = getLibsMock()

    const appInfo = await getApp(ipfs, libsMock, blacklistManager)
    await blacklistManager.blacklist(ipfs)

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser()
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  // ~~~~~~~~~~~~~~~~~~~~~~~~~ /track_content TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~
  it('sends server error response if segmenting fails', async function () {
    const file = fs.readFileSync(testAudioFilePath)
    sinon.stub(TranscodingQueue, 'segment').rejects(new Error('failed to segment'))

    await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .expect(500)
  })

  it('sends server error response if transcoding fails', async function () {
    const file = fs.readFileSync(testAudioFilePath)
    sinon.stub(TranscodingQueue, 'transcode320').rejects(new Error('failed to transcode'))

    await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .expect(500)
  })

  it('should successfully upload track + transcode and prune upload artifacts', async function () {
    const file = fs.readFileSync(testAudioFilePath)

    // Make /track_content call with test file + expect success
    const resp = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .expect(200)

    let storagePath = config.get('storagePath')
    storagePath = storagePath.slice(0, 1) === '/' ? '.' + storagePath : storagePath

    // check that the generated transcoded track is the same as the transcoded track in /tests
    const transcodedTrackAssetPath = path.join(__dirname, 'testTranscoded320Track.mp3')
    const transcodedTrackAssetBuf = fs.readFileSync(transcodedTrackAssetPath)
    const transcodedTrackPath = path.join(storagePath, resp.body.data.transcodedTrackCID)
    const transcodedTrackTestBuf = fs.readFileSync(transcodedTrackPath)
    assert.deepStrictEqual(transcodedTrackAssetBuf.compare(transcodedTrackTestBuf), 0)

    // Ensure 32 segments are returned, each segment has a corresponding file on disk,
    //    and each segment disk file is exactly as expected
    // Note - The exact output of track segmentation is deterministic only for a given environment/ffmpeg version
    //    This test may break in the future but at that point we should re-generate the reference segment files.
    const segmentCIDs = resp.body.track_segments
    assert.deepStrictEqual(segmentCIDs.length, testAudiusFileNumSegments)
    segmentCIDs.map(function (cid, index) {
      const cidPath = path.join(storagePath, cid.multihash)

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
      .send({})
      .expect(400)

    assert.deepStrictEqual(resp.body.error, 'Metadata object must include owner_id and non-empty track_segments array')
  })

  it('should throw an error if segment is blacklisted', async function () {
    sinon.stub(blacklistManager, 'CIDIsInBlacklist').returns(true)
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }],
      owner_id: 1
    }

    const resp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata })
      .expect(403)

    assert.deepStrictEqual(resp.body.error, `Segment CID ${metadata.track_segments[0].multihash} has been blacklisted by this node.`)
  })

  it('should throw error response if saving metadata to fails', async function () {
    sinon.stub(ipfs, 'add').rejects(new Error('ipfs add failed!'))
    const metadata = {
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }],
      owner_id: 1
    }

    const resp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata })
      .expect(500)

    assert.deepStrictEqual(resp.body.error, '/tracks/metadata saveFileFromBufferToIPFSAndDisk op failed: Error: ipfs add failed!')
  })

  it('successfully adds metadata file to filesystem, db, and ipfs', async function () {
    const metadata = sortKeys({
      test: 'field1',
      track_segments: [{ 'multihash': 'testCIDLink', 'duration': 1000 }],
      owner_id: 1
    })

    const resp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .send({ metadata })
      .expect(function (res) {
        if (res.body.error) {
          console.error(res.body.error)
          assert.fail(res.body.error)
        }
      })
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

  // ~~~~~~~~~~~~~~~~~~~~~~~~~ /tracks TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~
  it('TODO - POST /tracks tests', async function () {})
})

/**
 * Given index of segment, returns filepath of expected segment file in /test/test-segments/ dir
 * TODO - instead of using ./test/test-segments, use ./test/testTrackUploadDir
*/
function _getTestSegmentFilePathAtIndex (index) {
  let suffix = '0'

  if (index >= 0 && index < 10) suffix += `0${index}`
  else if (index >= 10 && index < 32) suffix += `${index}`
  else throw new Error('Index must be [0, 32)')

  return path.join(__dirname, 'test-segments', `segment${suffix}.ts`)
}
