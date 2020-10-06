const assert = require('assert')
const request = require('supertest')
const sinon = require('sinon')
const Web3 = require('web3')
const web3 = new Web3()

const BlacklistManager = require('../src/blacklistManager')
const config = require('../src/config')
const { sortKeys } = require('../src/apiHelpers')
const models = require('../src/models')

const { getApp } = require('./lib/app')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')
const { generateRandomNaturalNumber } = require('./utils')

// Grabbed from commonEnv.sh
const DELEGATE_OWNER_WALLET = '0x2cd48ce4ce408198b520e01fe132bdbdc08d6bda'
const DELEGATE_PRIVATE_KEY = '0x3ab83ce9422b045ec4dadb68ecc91df19e5b17216bec409936c2573a67d81fbe'

describe('test ContentBlacklist', function () {
  let app, server, ipfsMock, libsMock

  beforeEach(async () => {
    ipfsMock = getIPFSMock()
    libsMock = getLibsMock()

    process.env.delegateOwnerWallet = DELEGATE_OWNER_WALLET
    process.env.delegatePrivateKey = DELEGATE_PRIVATE_KEY

    const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager)
    await BlacklistManager.init(ipfsMock)

    app = appInfo.app
    server = appInfo.server

    // For some reason, needs to have a stub and set as env var for code to work
    sinon.stub(config, 'get').callsFake(key => {
      switch (key) {
        case 'delegateOwnerWallet': {
          return DELEGATE_OWNER_WALLET
        }

        case 'delegatePrivateKey': {
          return DELEGATE_PRIVATE_KEY
        }
      }
    })
  })

  afterEach(async () => {
    sinon.restore()
    await server.close()
  })

  after(async () => {
    await models.sequelize.close()
  })

  // Tests that should return success responses

  it('should return the proper userIds and trackIds', async () => {
    const addUserData = generateTimestampAndSignature({
      type: BlacklistManager.getTypes().user,
      id: 1
    })

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
    })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

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
    const { signature, timestamp } = generateTimestampAndSignature({ type, id })

    await request(app)
      .post('/blacklist/add')
      .query({ type, id, signature, timestamp })
      .expect(400)

    await request(app)
      .post('/blacklist/delete')
      .query({ type, id, signature, timestamp })
      .expect(400)
  })
})

function generateTimestampAndSignature ({ type, id }) {
  const timestamp = new Date().toISOString()
  const toSignObj = { type, id, timestamp }
  // JSON stringify automatically removes white space given 1 param
  const toSignStr = JSON.stringify(sortKeys(toSignObj))
  const toSignHash = web3.utils.keccak256(toSignStr)
  const signedResponse = web3.eth.accounts.sign(toSignHash, DELEGATE_PRIVATE_KEY)

  return { timestamp, signature: signedResponse.signature }
}
