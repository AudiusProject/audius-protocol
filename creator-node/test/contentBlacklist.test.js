const assert = require('assert')
const request = require('supertest')
const sinon = require('sinon')
const fs = require('fs')
const path = require('path')

const BlacklistManager = require('../src/blacklistManager')
const config = require('../src/config')
const models = require('../src/models')
const ipfsClient = require('../src/ipfsClient')
const redis = require('../src/redis')
const { generateTimestampAndSignature } = require('../src/apiHelpers')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const { createStarterCNodeUser, getCNodeUser, destroyUsers } = require('./lib/dataSeeds')

// Dummy keys
const DELEGATE_OWNER_WALLET = '0x2cd48ce4ce408198b520e01fe132bdbdc08d6bda'
const DELEGATE_PRIVATE_KEY = '0x3ab83ce9422b045ec4dadb68ecc91df19e5b17216bec409936c2573a67d81fbe'

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')

describe('test ContentBlacklist', function () {
  let app, server, libsMock

  beforeEach(async () => {
    const ipfs = ipfsClient.ipfs
    libsMock = getLibsMock()

    process.env.delegateOwnerWallet = DELEGATE_OWNER_WALLET
    process.env.delegatePrivateKey = DELEGATE_PRIVATE_KEY
    process.env.storagePath = path.join(process.cwd(), 'file_storage')

    // For some reason, needs to have a stub and set as env var for code to work
    sinon.stub(config, 'get').callsFake(key => {
      switch (key) {
        case 'delegateOwnerWallet': {
          return DELEGATE_OWNER_WALLET
        }

        case 'delegatePrivateKey': {
          return DELEGATE_PRIVATE_KEY
        }

        case 'storagePath': {
          return path.join(process.cwd(), 'file_storage')
        }
      }
    })

    const appInfo = await getApp(ipfs, libsMock, BlacklistManager)
    await BlacklistManager.init()

    app = appInfo.app
    server = appInfo.server

    // Clear redis
    await redis.del(BlacklistManager.getRedisSegmentCIDKey())
    await redis.del(BlacklistManager.getRedisUserIdKey())
    await redis.del(BlacklistManager.getRedisTrackIdKey())
  })

  afterEach(async () => {
    sinon.restore()
    await destroyUsers()
    await server.close()
  })

  after(async () => {
    await models.sequelize.close()
    await redis.del(BlacklistManager.getRedisSegmentCIDKey())
    await redis.del(BlacklistManager.getRedisUserIdKey())
    await redis.del(BlacklistManager.getRedisTrackIdKey())
  })

  // Tests that should return success responses

  it('should return the proper userIds and trackIds', async () => {
    const addUserData = generateTimestampAndSignature({
      type: BlacklistManager.getTypes().user,
      id: 1
    }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({
        type: BlacklistManager.getTypes().user,
        id: 1,
        signature: addUserData.signature,
        timestamp: addUserData.timestamp
      })
      .expect(200)

    const addTrackData = generateTimestampAndSignature({
      type: BlacklistManager.getTypes().track,
      id: 1
    }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({
        type: BlacklistManager.getTypes().track,
        id: 1,
        signature: addTrackData.signature,
        timestamp: addTrackData.timestamp
      })
      .expect(200)

    await request(app)
      .get('/blacklist')
      .expect(200)
      .expect(resp => {
        assert.deepStrictEqual(resp.body.trackIds[0], 1)
        assert.deepStrictEqual(resp.body.trackIds.length, 1)
        assert.deepStrictEqual(resp.body.userIds[0], 1)
        assert.deepStrictEqual(resp.body.userIds.length, 1)
      })
  })

  it('should add user type and id to db and redis', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().user
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, timestamp, signature })
      .expect(200)

    const user = await models.ContentBlacklist.findOne({ where: { id, type } })
    assert.deepStrictEqual(user.id, id)
    assert.deepStrictEqual(user.type, type)
    assert.deepStrictEqual(await BlacklistManager.userIdIsInBlacklist(user.id), 1)
  })

  it('should add track type and id to db and redis', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().track
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, timestamp, signature })
      .expect(200)

    const track = await models.ContentBlacklist.findOne({ where: { id, type } })
    assert.deepStrictEqual(track.id, id)
    assert.deepStrictEqual(track.type, type)
    assert.deepStrictEqual(await BlacklistManager.trackIdIsInBlacklist(track.id), 1)
  })

  it('should remove user type and id from db and redis', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().user
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, timestamp, signature })
      .expect(200)

    await request(app)
      .post('/blacklist/delete')
      .query({ type, id, timestamp, signature })
      .expect(200)

    const user = await models.ContentBlacklist.findOne({ where: { id, type } })
    assert.deepStrictEqual(user, null)
    assert.deepStrictEqual(await BlacklistManager.userIdIsInBlacklist(id), 0)
  })

  it('should remove track type and id from db and redis', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().track
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, timestamp, signature })
      .expect(200)

    await request(app)
      .post('/blacklist/delete')
      .query({ type, id, timestamp, signature })
      .expect(200)

    const track = await models.ContentBlacklist.findOne({ where: { id, type } })
    assert.deepStrictEqual(track, null)
    assert.deepStrictEqual(await BlacklistManager.trackIdIsInBlacklist(id), 0)
  })

  it('should return success when removing a user that does not exist', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().user
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/delete')
      .query({ type, id, timestamp, signature })
      .expect(200)

    const user = await models.ContentBlacklist.findOne({ where: { id, type } })
    assert.deepStrictEqual(user, null)
    assert.deepStrictEqual(await BlacklistManager.userIdIsInBlacklist(id), 0)
  })

  it('should return success when removing a track that does not exist', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().track
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/delete')
      .query({ type, id, timestamp, signature })
      .expect(200)

    const track = await models.ContentBlacklist.findOne({ where: { id, type } })
    assert.deepStrictEqual(track, null)
    assert.deepStrictEqual(await BlacklistManager.trackIdIsInBlacklist(id), 0)
  })

  it('should ignore duplicate add for track', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().track
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, timestamp, signature })
      .expect(200)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, timestamp, signature })
      .expect(200)

    const tracks = await models.ContentBlacklist.findAll({ where: { id, type } })
    assert.deepStrictEqual(tracks.length, 1)
    const track = tracks[0]
    assert.deepStrictEqual(track.id, id)
    assert.deepStrictEqual(track.type, type)
    assert.deepStrictEqual(await BlacklistManager.trackIdIsInBlacklist(track.id), 1)
  })

  it('should ignore duplicate add for user', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().user
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, timestamp, signature })
      .expect(200)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, timestamp, signature })
      .expect(200)

    const users = await models.ContentBlacklist.findAll({ where: { id, type } })
    assert.deepStrictEqual(users.length, 1)
    const user = users[0]
    assert.deepStrictEqual(user.id, id)
    assert.deepStrictEqual(user.type, type)
    assert.deepStrictEqual(await BlacklistManager.userIdIsInBlacklist(user.id), 1)
  })

  // Tests that should return error responses

  it('should throw error if query params does not contain all necessary keys', async () => {
    const id = generateRandomNaturalNumber()
    const type = BlacklistManager.getTypes().track

    await request(app)
      .post('/blacklist/add')
      .query({ type, id })
      .expect(400)

    await request(app)
      .post('/blacklist/delete')
      .query({ type, id })
      .expect(400)
  })

  it('should throw error if query params id and type are not proper', async () => {
    const id = 'halsey'
    const type = 'is fantastic'
    const { signature, timestamp } = generateTimestampAndSignature({ type, id }, DELEGATE_PRIVATE_KEY)

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, signature, timestamp })
      .expect(400)

    await request(app)
      .post('/blacklist/delete')
      .query({ type, id, signature, timestamp })
      .expect(400)
  })

  it('should throw an error when attempting to stream a track via /ipfs/:CID route', async () => {
    // Create user and upload track
    const resp = await createUserAndUploadTrack()

    // Blacklist trackId
    const type = BlacklistManager.getTypes().track
    const { signature, timestamp } = generateTimestampAndSignature({ type, id: resp.track.blockchainId }, DELEGATE_PRIVATE_KEY)
    await request(app)
      .post('/blacklist/add')
      .query({ type, id: resp.track.blockchainId, signature, timestamp })
      .expect(200)

    // Hit /ipfs/:CID route for all track CIDs and ensure error response is returned
    try {
      await Promise.all(
        resp.track.trackSegments.map(segment =>
          request(app)
            .get(`/ipfs/${segment.multihash}`)
            .expect(403)
        )
      )
    } catch (e) {
      assert.fail(e.message)
    }
  })

  /** Helper setup method to test ContentBlacklist.  */
  async function createUserAndUploadTrack () {
    // Create user
    const { cnodeUserUUID, sessionToken } = await createStarterCNodeUser()
    const cnodeUser = await getCNodeUser(cnodeUserUUID)

    // Set user metadata
    const metadata = {
      metadata: {
        testField: 'testValue'
      }
    }

    const { body: { data: { metadataFileUUID } } } = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', sessionToken)
      .send(metadata)

    const associateRequest = {
      blockchainUserId: 1,
      metadataFileUUID,
      blockNumber: 10
    }

    // Associate user with metadata
    await request(app)
      .post('/audius_users/')
      .set('X-Session-ID', sessionToken)
      .send(associateRequest)

    // Upload a track
    const file = fs.readFileSync(testAudioFilePath)
    // set track content
    const { body: { transcodedTrackUUID, track_segments: trackSegments, source_file: sourceFile } } = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', sessionToken)

    // set track metadata
    const trackMetadata = {
      owner_id: 1,
      track_segments: trackSegments
    }
    const { body: { metadataFileUUID: trackMetadataFileUUID } } = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', sessionToken)
      .send({ metadata: trackMetadata, source_file: sourceFile })
    // associate track metadata with track
    await request(app)
      .post('/tracks')
      .set('X-Session-ID', sessionToken)
      .send({
        blockchainTrackId: 1,
        blockNumber: 10,
        metadataFileUUID: trackMetadataFileUUID,
        transcodedTrackUUID
      })

    // Return user and some track data
    return { cnodeUser, track: { trackSegments, blockchainId: 1 } }
  }
})

// Generates a random number from [0, max)
// https://stackoverflow.com/questions/29640432/generate-4-digit-random-number-using-substring/29640472
// NOTE: There is a chance the same number will be returned....... :-)
const generateRandomNaturalNumber = (max = 1000) => Math.floor(Math.random() * max)
