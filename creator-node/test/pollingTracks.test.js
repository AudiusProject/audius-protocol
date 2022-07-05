const request = require('supertest')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const sinon = require('sinon')
const uuid = require('uuid/v4')
const proxyquire = require('proxyquire')
const _ = require('lodash')

const config = require('../src/config')
const defaultConfig = require('../default-config.json')
const { libs } = require('@audius/sdk')
const Utils = libs
const BlacklistManager = require('../src/blacklistManager')
const TranscodingQueue = require('../src/TranscodingQueue')
const models = require('../src/models')
const DiskManager = require('../src/diskManager')
const FileManager = require('../src/fileManager')
const DBManager = require('../src/dbManager.js')

const { getApp } = require('./lib/app')
const {
  createStarterCNodeUser,
  testEthereumConstants
} = require('./lib/dataSeeds')
const { getLibsMock } = require('./lib/libsMock')
const { sortKeys } = require('../src/apiSigning')
const { saveFileToStorage, computeFilesHash } = require('./lib/helpers')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')
const testAudioFileWrongFormatPath = path.resolve(
  __dirname,
  'testTrackWrongFormat.jpg'
)

const TestAudiusTrackFileNumSegments = 32
const TRACK_CONTENT_POLLING_ROUTE = '/track_content_async'

const logContext = {
  logContext: {
    requestID: uuid(),
    requestMethod: 'POST',
    requestHostname: '127.0.0.1',
    requestUrl: TRACK_CONTENT_POLLING_ROUTE
  }
}

// Create the req context for handleTrackContentRoute
function getReqObj(fileUUID, fileDir, session) {
  return {
    fileName: `${fileUUID}.mp3`,
    fileDir,
    fileDestination: fileDir,
    cnodeUserUUID: session.cnodeUserUUID
  }
}

/**
 * Given index of segment, returns filepath of expected segment file in /test/test-segments/ dir
 * TODO - instead of using ./test/test-segments, use ./test/testTrackUploadDir
 */
function _getTestSegmentFilePathAtIndex(index) {
  let suffix = '000'

  if (index >= 0 && index < 10) suffix += `0${index}`
  else if (index >= 10 && index < 32) suffix += `${index}`
  else throw new Error('Index must be [0, 32)')

  return path.join(__dirname, 'test-segments', `segment${suffix}.ts`)
}

describe('test Polling Tracks with mocked IPFS', function () {
  let app,
    server,
    libsMock,
    handleTrackContentRoute
  let session, userId, userWallet

  const spId = 1

  beforeEach(async () => {
    libsMock = getLibsMock()

    userId = 1
    userWallet = testEthereumConstants.pubKey.toLowerCase()

    const { getApp } = require('./lib/app')
    const appInfo = await getApp(libsMock, BlacklistManager, null, spId)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId, userWallet)

    // Mock `generateNonImageCid()` in `handleTrackContentRoute()` to succeed
    const mockCid = 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    ;({ handleTrackContentRoute } = proxyquire(
      '../src/components/tracks/tracksComponentService.js',
      {
        '@audius/sdk': {
          libs: {
            Utils: {
              fileHasher: {
                generateNonImageCid: sinon.stub().returns(
                  new Promise((resolve) => {
                    return resolve(mockCid)
                  })
                )
              }
            }
          },
          '@global': true
        },
        '../../fileManager': {
          copyMultihashToFs: sinon
            .stub(FileManager, 'copyMultihashToFs')
            .returns(
              new Promise((resolve) => {
                const dstPath = DiskManager.computeFilePath(mockCid)
                return resolve(dstPath)
              })
            ),
          '@global': true
        }
      }
    ))
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

    const appInfo = await getApp(libsMock, BlacklistManager, null, userId)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)

    // Confirm max audio file size is respected by multer
    const file = fs.readFileSync(testAudioFilePath)
    await request(app)
      .post(TRACK_CONTENT_POLLING_ROUTE)
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(400)

    // Reset max file limits
    process.env.maxAudioFileSizeBytes = defaultConfig.maxAudioFileSizeBytes
  })

  it('fails to upload when maxMemoryFileSizeBytes exceeded', async function () {
    // Configure extremely small file size
    process.env.maxMemoryFileSizeBytes = 10

    // Reset app
    await server.close()
    const appInfo = await getApp(libsMock, BlacklistManager, null, userId)
    app = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)

    // Confirm max audio file size is respected by multer
    const file = fs.readFileSync(testAudioFileWrongFormatPath)
    await request(app)
      .post('/image_upload')
      .attach('file', file, { filename: 'fname.jpg' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .expect(500)

    // Reset max file limits
    process.env.maxMemoryFileSizeBytes = defaultConfig.maxMemoryFileSizeBytes
  })

  it('uploads /track_content_async', async function () {
    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    const {
      track_segments: trackSegments,
      source_file: sourceFile,
      transcodedTrackCID,
      transcodedTrackUUID
    } = resp

    assert.deepStrictEqual(
      trackSegments[0].multihash,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    assert.deepStrictEqual(trackSegments.length, 32)
    assert.deepStrictEqual(sourceFile.includes('.mp3'), true)
    assert.deepStrictEqual(
      transcodedTrackCID,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    assert.deepStrictEqual(typeof transcodedTrackUUID, 'string')
  })

  // depends on "uploads /track_content_async"
  it('Confirm /users/clock_status works with user and track state', async function () {
    const numExpectedFilesForUser = TestAudiusTrackFileNumSegments + 1 // numSegments + 320kbps copy

    /** Upload track */
    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    let resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    const wallet = session.walletPublicKey

    // Confirm /users/clock_status returns expected info
    resp = await request(app).get(`/users/clock_status/${wallet}`).expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false
    })

    // Confirm /users/clock_status returns expected info with returnSkipInfo flag
    resp = await request(app)
      .get(`/users/clock_status/${wallet}?returnSkipInfo=true`)
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      CIDSkipInfo: { numCIDs: numExpectedFilesForUser, numSkippedCIDs: 0 }
    })

    // Update track DB entries to be skipped
    const numAffectedRows = (
      await models.File.update(
        { skipped: true },
        {
          where: {
            cnodeUserUUID: session.cnodeUserUUID,
            type: 'track'
          }
        }
      )
    )[0]
    assert.strictEqual(numAffectedRows, TestAudiusTrackFileNumSegments)

    // Confirm /users/clock_status returns expected info with returnSkipInfo flag when some entries are skipped
    resp = await request(app)
      .get(`/users/clock_status/${wallet}?returnSkipInfo=true`)
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      CIDSkipInfo: {
        numCIDs: numExpectedFilesForUser,
        numSkippedCIDs: TestAudiusTrackFileNumSegments
      }
    })

    const files = await models.File.findAll({
      where: { cnodeUserUUID: session.cnodeUserUUID }
    })
    const filesSorted = _.sortBy(files, ['clock'], ['asc'])
    const multihashesSorted = filesSorted.map((file) => file.multihash)

    // Confirm /users/clock_status returns expected info with `returnFilesHash` flag
    const expectedFilesHashFull = computeFilesHash(multihashesSorted)
    resp = await request(app)
      .get(`/users/clock_status/${wallet}?returnFilesHash=true`)
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      filesHash: expectedFilesHashFull
    })

    /** Confirm /users/clock_status returns expected info with `returnsFilesHash` and clock range specified */
    const clockMin = 3
    const clockMax = 8

    /** clockMin */
    const expectedFilesHashClockMin = computeFilesHash(multihashesSorted
      .slice(clockMin - 1))
    resp = await request(app)
      .get(
        `/users/clock_status/${wallet}?returnFilesHash=true&filesHashClockRangeMin=${clockMin}`
      )
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      filesHash: expectedFilesHashFull,
      filesHashForClockRange: expectedFilesHashClockMin
    })

    /** clockMax */
    const expectedFilesHashClockMax = computeFilesHash(multihashesSorted
      .slice(0, clockMax - 1))
    resp = await request(app)
      .get(
        `/users/clock_status/${wallet}?returnFilesHash=true&filesHashClockRangeMax=${clockMax}`
      )
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      filesHash: expectedFilesHashFull,
      filesHashForClockRange: expectedFilesHashClockMax
    })

    /** clockMin and clockMax */
    let expectedFilesHashClockRange = computeFilesHash(multihashesSorted
      .slice(clockMin - 1, clockMax - 1))
    resp = await request(app)
      .get(
        `/users/clock_status/${wallet}?returnFilesHash=true&filesHashClockRangeMin=${clockMin}&filesHashClockRangeMax=${clockMax}`
      )
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      filesHash: expectedFilesHashFull,
      filesHashForClockRange: expectedFilesHashClockRange
    })

    /** clockMinTooHigh */
    const clockMinTooHigh = numExpectedFilesForUser + 5
    resp = await request(app).get(
      `/users/clock_status/${wallet}?returnFilesHash=true&filesHashClockRangeMin=${clockMinTooHigh}`
    )
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      filesHash: expectedFilesHashFull,
      filesHashForClockRange: null
    })

    /** clockMaxTooLow */
    const clockMaxTooLow = -5
    resp = await request(app).get(
      `/users/clock_status/${wallet}?returnFilesHash=true&filesHashClockRangeMax=${clockMaxTooLow}`
    )
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      filesHash: expectedFilesHashFull,
      filesHashForClockRange: null
    })

    /** partially overlapping clockrange */
    const clockMaxTooHigh = numExpectedFilesForUser + 5
    expectedFilesHashClockRange = computeFilesHash(
      multihashesSorted.slice(clockMin - 1, clockMaxTooHigh - 1)
    )
    resp = await request(app)
      .get(
        `/users/clock_status/${wallet}?returnFilesHash=true&filesHashClockRangeMin=${clockMin}&filesHashClockRangeMax=${clockMaxTooHigh}`
      )
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: numExpectedFilesForUser,
      syncInProgress: false,
      filesHash: expectedFilesHashFull,
      filesHashForClockRange: expectedFilesHashClockRange
    })

    /** Non-existent user */
    const invalidWallet = 'asdf'
    resp = await request(app)
      .get(`/users/clock_status/${invalidWallet}`)
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: -1,
      syncInProgress: false
    })

    /** Non-existent user, returnFilesHash = true */
    resp = await request(app)
      .get(`/users/clock_status/${invalidWallet}?returnFilesHash=true`)
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      clockValue: -1,
      syncInProgress: false,
      filesHash: null
    })
  })

  it('Confirms /users/batch_clock_status works with user and track state for 2 users', async () => {
    const numExpectedFilesForUser = TestAudiusTrackFileNumSegments + 1 // numSegments + 320kbps copy

    /** Upload track for user 1 */
    const { fileUUID: fileUUID1, fileDir: fileDir1 } =
      saveFileToStorage(testAudioFilePath)
    await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID1, fileDir1, session)
    )

    // Compute expected filesHash for user1
    const expectedUser1FilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupWallet: userWallet }
    })

    // Create user 2
    const userId2 = 2
    const pubKey2 = '0xadD36bad12002f1097Cdb7eE24085C28e9random'
    const session2 = await createStarterCNodeUser(userId2, pubKey2)

    /** Upload track for user 2 */
    const { fileUUID: fileUUID2, fileDir: fileDir2 } =
      saveFileToStorage(testAudioFilePath)
    await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID2, fileDir2, session2)
    )

    const expectedUser2FilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupWallet: pubKey2 }
    })

    // Confirm /users/batch_clock_status returns expected info
    let resp = await request(app)
      .post(`/users/batch_clock_status`)
      .send({ walletPublicKeys: [userWallet, pubKey2] })
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      users: [
        { walletPublicKey: userWallet, clock: numExpectedFilesForUser },
        { walletPublicKey: pubKey2, clock: numExpectedFilesForUser }
      ]
    })

    // Requests with too many wallet keys should be rejected
    const maxNumWallets = config.get('maxBatchClockStatusBatchSize')
    const largeWalletPublicKeys = Array.from(
      { length: maxNumWallets + 1 },
      (_, i) => i + 'a'
    )
    resp = await request(app)
      .post(`/users/batch_clock_status`)
      .send({ walletPublicKeys: largeWalletPublicKeys })
      .expect(400, {
        error: `Number of wallets must not exceed ${maxNumWallets} (reduce 'walletPublicKeys' field in request body).`
      })

    /** Non-existent user */
    const invalidWallet = 'asdf'
    resp = await request(app)
      .post(`/users/batch_clock_status`)
      .send({ walletPublicKeys: [userWallet, invalidWallet] })
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      users: [
        { walletPublicKey: userWallet, clock: numExpectedFilesForUser },
        { walletPublicKey: invalidWallet, clock: -1 }
      ]
    })

    /** returnFilesHash = true */
    resp = await request(app)
      .post(`/users/batch_clock_status?returnFilesHash=true`)
      .send({ walletPublicKeys: [userWallet, pubKey2] })
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      users: [
        {
          walletPublicKey: userWallet,
          clock: numExpectedFilesForUser,
          filesHash: expectedUser1FilesHash
        },
        {
          walletPublicKey: pubKey2,
          clock: numExpectedFilesForUser,
          filesHash: expectedUser2FilesHash
        }
      ]
    })

    /** returnFilesHash = true, invalid user */
    resp = await request(app)
      .post(`/users/batch_clock_status?returnFilesHash=true`)
      .send({ walletPublicKeys: [userWallet, invalidWallet] })
      .expect(200)
    assert.deepStrictEqual(resp.body.data, {
      users: [
        {
          walletPublicKey: userWallet,
          clock: numExpectedFilesForUser,
          filesHash: expectedUser1FilesHash
        },
        { walletPublicKey: invalidWallet, clock: -1, filesHash: null }
      ]
    })
  })

  // depends on "uploads /track_content_async"; if that test fails, this test will fail to due to similarity
  it('creates Audius track using application logic for /track_content_async', async function () {
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    const { track_segments: trackSegments, source_file: sourceFile } = resp
    assert.deepStrictEqual(
      trackSegments[0].multihash,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
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

    assert.deepStrictEqual(
      trackMetadataResp.body.data.metadataMultihash,
      'QmYhusD7qFv7gxNqi9nyaoiqaRXYQvoCvVgXY75nSoydmy'
    )
  })

  // depends on "uploads /track_content_async"
  it('fails to create Audius track when segments not provided', async function () {
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    const { track_segments: trackSegments, source_file: sourceFile } = resp

    assert.deepStrictEqual(
      trackSegments[0].multihash,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
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
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    const { track_segments: trackSegments, source_file: sourceFile } = resp

    assert.deepStrictEqual(
      trackSegments[0].multihash,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    assert.deepStrictEqual(trackSegments.length, 32)
    assert.deepStrictEqual(sourceFile.includes('.mp3'), true)

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [{ multihash: 'incorrectCIDLink', duration: 1000 }],
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
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    const { source_file: sourceFile } = resp

    // creates Audius track
    const metadata = {
      test: 'field1',
      track_segments: [
        {
          multihash: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6',
          duration: 1000
        }
      ]
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
    libsMock.User.getUsers.exactly(4)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const {
      track_segments: trackSegments,
      source_file: sourceFile,
      transcodedTrackUUID
    } = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

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

    assert.deepStrictEqual(
      trackMetadataResp.body.data.metadataMultihash,
      'QmTWhw49RfSMSJJmfm8cMHFBptgWoBGpNwjAc5jy2qeJfs'
    )

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({
        blockchainTrackId: 1,
        blockNumber: 10,
        metadataFileUUID: trackMetadataResp.body.data.metadataFileUUID,
        transcodedTrackUUID
      })
      .expect(200)
  })

  // depends on "uploads /track_content_async"
  it('fails to create downloadable track with no track_id and no source_id present', async function () {
    libsMock.User.getUsers.exactly(2)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    const { track_segments: trackSegments } = resp
    assert.deepStrictEqual(
      trackSegments[0].multihash,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    assert.deepStrictEqual(trackSegments.length, 32)

    // creates a downloadable Audius track with no track_id and no source_file
    const metadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: [
        {
          multihash: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6',
          duration: 1000
        }
      ],
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
    libsMock.User.getUsers.exactly(4)

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const {
      track_segments: trackSegments,
      source_file: sourceFile,
      transcodedTrackUUID
    } = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    assert.deepStrictEqual(
      trackSegments[0].multihash,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    assert.deepStrictEqual(trackSegments.length, 32)
    assert.deepStrictEqual(sourceFile.includes('.mp3'), true)

    // needs debugging as to why this 'cid' key is needed for test to work
    const metadata = {
      test: 'field1',
      track_segments: trackSegments,
      owner_id: 1,
      download: {
        is_downloadable: true,
        requires_follow: false,
        cid: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
      }
    }

    const trackMetadataResp = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata, sourceFile })
      .expect(200)

    assert.deepStrictEqual(
      trackMetadataResp.body.data.metadataMultihash,
      'QmPjrvx9MBcvf495t43ZhiMpKWwu1JnqkcNUN3Z9EBWm49'
    )

    await request(app)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({
        blockchainTrackId: 1,
        blockNumber: 10,
        metadataFileUUID: trackMetadataResp.body.data.metadataFileUUID,
        transcodedTrackUUID
      })
      .expect(200)
  })
})

describe('test Polling Tracks with real files', function () {
  let app2, server, session, libsMock, handleTrackContentRoute, userId

  /** Inits libs mock, web server app, blacklist manager, and creates starter CNodeUser */
  beforeEach(async () => {
    libsMock = getLibsMock()

    userId = 1

    const { getApp } = require('./lib/app')
    const appInfo = await getApp(libsMock, BlacklistManager, null, userId)
    await BlacklistManager.init()

    app2 = appInfo.app
    server = appInfo.server
    session = await createStarterCNodeUser(userId)

    handleTrackContentRoute =
      require('../src/components/tracks/tracksComponentService').handleTrackContentRoute
  })

  /** Reset sinon & close server */
  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  // ~~~~~~~~~~~~~~~~~~~~~~~~~ /track_content_async TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~
  it('sends server error response if segmenting fails', async function () {
    const { handleTrackContentRoute } = proxyquire(
      '../src/components/tracks/tracksComponentService.js',
      {
        '../../TranscodingQueue': {
          segment: sinon
            .stub(TranscodingQueue, 'segment')
            .rejects(new Error('failed to segment')),
          '@global': true
        }
      }
    )

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    try {
      await handleTrackContentRoute(
        logContext,
        getReqObj(fileUUID, fileDir, session)
      )
      assert.fail('Should have thrown error if segmenting failed')
    } catch (e) {
      assert.ok(e.message.includes('failed to segment'))
    }
  })

  it('sends server error response if transcoding fails', async function () {
    const { handleTrackContentRoute } = proxyquire(
      '../src/components/tracks/tracksComponentService.js',
      {
        '../../TranscodingQueue': {
          transcode320: sinon
            .stub(TranscodingQueue, 'transcode320')
            .rejects(new Error('failed to transcode')),
          '@global': true
        }
      }
    )

    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    try {
      await handleTrackContentRoute(
        logContext,
        getReqObj(fileUUID, fileDir, session)
      )
      assert.fail('Should have thrown error if transcoding failed')
    } catch (e) {
      assert.ok(e.message.includes('failed to transcode'))
    }
  })

  it('should successfully upload track + transcode and prune upload artifacts when TranscodingQueue is available', async function () {
    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const resp = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    const { track_segments: trackSegments, transcodedTrackCID } = resp

    // check that the generated transcoded track is the same as the transcoded track in /tests
    const transcodedTrackAssetPath = path.join(
      __dirname,
      'testTranscoded320Track.mp3'
    )
    const transcodedTrackAssetBuf = fs.readFileSync(transcodedTrackAssetPath)
    const transcodedTrackPath = DiskManager.computeFilePath(transcodedTrackCID)
    const transcodedTrackTestBuf = fs.readFileSync(transcodedTrackPath)
    assert.deepStrictEqual(
      transcodedTrackAssetBuf.compare(transcodedTrackTestBuf),
      0
    )

    // Ensure 32 segments are returned, each segment has a corresponding file on disk,
    //    and each segment disk file is exactly as expected
    // Note - The exact output of track segmentation is deterministic only for a given environment/ffmpeg version
    //    This test may break in the future but at that point we should re-generate the reference segment files.
    assert.deepStrictEqual(trackSegments.length, TestAudiusTrackFileNumSegments)
    trackSegments.map(function (cid, index) {
      const cidPath = DiskManager.computeFilePath(cid.multihash)

      // Ensure file exists
      assert.ok(fs.existsSync(cidPath))

      // Ensure file is identical to expected segment file
      const expectedSegmentFilePath = _getTestSegmentFilePathAtIndex(index)
      const expectedSegmentFileBuf = fs.readFileSync(expectedSegmentFilePath)
      const returnedSegmentFileBuf = fs.readFileSync(cidPath)
      assert.deepStrictEqual(
        expectedSegmentFileBuf.compare(returnedSegmentFileBuf),
        0
      )
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

    assert.deepStrictEqual(
      resp.body.error,
      'Metadata object must include owner_id and non-empty track_segments array'
    )
  })

  it('should not throw an error if segment is blacklisted', async function () {
    sinon.stub(BlacklistManager, 'CIDIsInBlacklist').returns(true)
    const metadata = {
      test: 'field1',
      track_segments: [
        {
          multihash: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6',
          duration: 1000
        }
      ],
      owner_id: 1
    }

    await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata })
      .expect(200)
  })

  it('successfully adds metadata file to filesystem and db', async function () {
    const metadata = sortKeys({
      test: 'field1',
      track_segments: [
        {
          multihash: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6',
          duration: 1000
        }
      ],
      owner_id: 1
    })

    const resp = await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', session.userId)
      .send({ metadata })
      .expect(200)

    // check that the metadata file was written to storagePath under its multihash
    const metadataPath = DiskManager.computeFilePath(
      resp.body.data.metadataMultihash
    )
    assert.ok(fs.existsSync(metadataPath))

    // check that the metadata file contents match the metadata specified
    let metadataFileData = fs.readFileSync(metadataPath, 'utf-8')
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

  // ~~~~~~~~~~~~~~~~~~~~~~~~~ /tracks TESTS ~~~~~~~~~~~~~~~~~~~~~~~~~
  it('POST /tracks tests', async function () {
    // Upload track content
    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const {
      track_segments: trackSegments,
      transcodedTrackUUID,
      source_file: sourceFile
    } = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    // Upload track metadata
    const trackMetadata = {
      metadata: {
        owner_id: userId,
        track_segments: trackSegments
      },
      source_file: sourceFile
    }
    const trackMetadataResp = await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', userId)
      .send(trackMetadata)
      .expect(200)
    const trackMetadataFileUUID = trackMetadataResp.body.data.metadataFileUUID

    // Complete track creation
    await request(app2)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', userId)
      .send({
        blockchainTrackId: 1,
        blockNumber: 10,
        metadataFileUUID: trackMetadataFileUUID,
        transcodedTrackUUID
      })
  })

  it('parallel track upload', async function () {
    // Upload track content
    const { fileUUID, fileDir } = saveFileToStorage(testAudioFilePath)
    const {
      track_segments: trackSegments,
      transcodedTrackUUID,
      source_file: sourceFile
    } = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID, fileDir, session)
    )

    // Upload same track content again
    const { fileUUID: fileUUID2, fileDir: fileDir2 } =
      saveFileToStorage(testAudioFilePath)
    const {
      track_segments: track2Segments,
      transcodedTrackUUID: transcodedTrack2UUID,
      source_file: sourceFile2
    } = await handleTrackContentRoute(
      logContext,
      getReqObj(fileUUID2, fileDir2, session)
    )

    // Upload track 1 metadata
    const trackMetadata = {
      metadata: {
        owner_id: userId,
        track_segments: trackSegments
      },
      source_file: sourceFile
    }
    const trackMetadataResp = await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', userId)
      .send(trackMetadata)
      .expect(200)
    const trackMetadataFileUUID = trackMetadataResp.body.data.metadataFileUUID

    // Upload track 2 metadata
    const track2Metadata = {
      metadata: {
        owner_id: userId,
        track_segments: track2Segments
      },
      source_file: sourceFile
    }
    const track2MetadataResp = await request(app2)
      .post('/tracks/metadata')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', userId)
      .send(track2Metadata)
      .expect(200)
    const track2MetadataFileUUID = track2MetadataResp.body.data.metadataFileUUID

    // Complete track1 creation
    await request(app2)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', userId)
      .send({
        blockchainTrackId: 1,
        blockNumber: 10,
        metadataFileUUID: trackMetadataFileUUID,
        transcodedTrackUUID
      })
      .expect(200)

    // Complete track2 creation
    await request(app2)
      .post('/tracks')
      .set('X-Session-ID', session.sessionToken)
      .set('User-Id', userId)
      .send({
        blockchainTrackId: 2,
        blockNumber: 20,
        metadataFileUUID: track2MetadataFileUUID,
        transcodedTrackUUID: transcodedTrack2UUID
      })
      .expect(200)
  })
})
