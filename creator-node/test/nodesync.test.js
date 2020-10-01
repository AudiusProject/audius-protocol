// const assert = require('assert')
const request = require('supertest')
const models = require('../src/models')
const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const { createStarterCNodeUser, testEthereumConstants } = require('./lib/dataSeeds')
const blacklistManager = require('../src/blacklistManager')
const ipfsClient = require('../src/ipfsClient')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const _ = require('lodash')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')

let server, app, ipfs, libsMock

// TODO: move to helpers + remove from dbManager.test
const stringifiedDateFields = (obj) => {
  const newObj = {...obj}
  if (newObj.createdAt) newObj.createdAt = newObj.createdAt.toISOString()
  if (newObj.updatedAt) newObj.updatedAt = newObj.updatedAt.toISOString()
  return newObj
}
const destroyUsers = async () => (
  models.CNodeUser.destroy({
    where: {},
    truncate: true,
    cascade: true // cascades delete to all rows with foreign key on cnodeUser
  })
)

const getCNodeUser = async (cnodeUserUUID) => {
  const { dataValues } = await models.CNodeUser.findOne({ where: { cnodeUserUUID } })
  return dataValues
}


describe('test nodesync', function () {
  before(async function () {
    ipfs = ipfsClient.ipfs
    libsMock = getLibsMock()
    const appInfo = await getApp(ipfs, libsMock, blacklistManager)
    server = appInfo.server
    app = appInfo.app
  })

  beforeEach(async function () {
    await destroyUsers()
  })

  after(async function () {
    // TODO: destroy users
    // await destroyUsers()
    await server.close()
  })

  it.only('test /export', async function () {
    const MAX_CLOCK_VAL = 37

    const { cnodeUserUUID, sessionToken } = await createStarterCNodeUser()
    await getCNodeUser(cnodeUserUUID)

    const metadata = {"metadata":{"is_creator":true,"is_verified":false,"name":"m1","handle":"m1","profile_picture":null,"profile_picture_sizes":null,"cover_photo":null,"cover_photo_sizes":null,"bio":"blhblahblahblahblahlba","location":"Oakland, CA","creator_node_endpoint":"https://creatornode3.staging.audius.co,https://creatornode.staging.audius.co,https://creatornode2.staging.audius.co","user_id":46}}

    const {body: { data: { metadataMultihash, metadataFileUUID }}} = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', sessionToken)
      .send(metadata)

    const associateRequest = {
      blockchainUserId: 1,
      metadataFileUUID,
      blockNumber:10
    }
    const {body: associateBody} = await request(app)
      .post('/audius_users/')
      .set('X-Session-ID', sessionToken)
      .send(associateRequest)

    // Upload a track
    const file = fs.readFileSync(testAudioFilePath)
    const {body: { transcodedTrackCID, transcodedTrackUUID, track_segments, source_file}} = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', sessionToken)

    const trackMetadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: track_segments
    }

    const {body: { metadataMultihash: trackMetadataMultihash, metadataFileUUID: trackMetadataFileUUID}} = await request(app)
      .post('/tracks/metadata')
      .set('X-Session-ID', sessionToken)
      .send({ metadata: trackMetadata, source_file: source_file })

    const associateResp = await request(app)
      .post('/tracks')
      .set('X-Session-ID', sessionToken)
      .send({
          blockchainTrackId: 1,
          blockNumber: 10,
          metadataFileUUID: trackMetadataFileUUID,
          transcodedTrackUUID
       })

    const {pubKey} = testEthereumConstants
    const {body: exportBody} = await request(app)
      .get(`/export?wallet_public_key=${pubKey.toLowerCase()}`)

    // console.log({exportBody: JSON.stringify(exportBody.data.cnodeUsers[cnodeUserUUID], null, 2)})

    const userMetadataFile = stringifiedDateFields((await models.File.findOne({
      where: {
        multihash: metadataMultihash,
        fileUUID: metadataFileUUID,
        clock: 1,
      },
      raw: true
    })))

    const copy320 = stringifiedDateFields((await models.File.findOne({
      where: {
        multihash: transcodedTrackCID,
        fileUUID: transcodedTrackUUID,
        clock: 3,
      },
      raw: true
    })))

    const segmentHashes = track_segments.map(t => t.multihash)
    // Do this sequentially so we can confirm clock
    // values for each segment
    const segmentFiles = await Promise.all(segmentHashes.map(async (hash, i) => {
      const segment = await models.File.findOne({
        where: {
          multihash: hash,
          clock: i + 4 // starts @ 4 due to user creation + update
        },
        raw: true
      })
      return stringifiedDateFields(segment)
    }))

    const trackMetadataFile = stringifiedDateFields(await models.File.findOne({
      where: {
        multihash: trackMetadataMultihash,
        fileUUID: trackMetadataFileUUID,
        clock: 36
      },
      raw: true
    }))

    const audiusUser = stringifiedDateFields(await models.AudiusUser.findOne({
      where: {
        metadataFileUUID,
        clock: 2,
      },
      raw: true
    }))

    const cnodeUser = stringifiedDateFields(await models.CNodeUser.findOne({
      where: {
        clock: MAX_CLOCK_VAL,
        cnodeUserUUID,
      },
      raw: true
    }))

    const clockRecords = await Promise.all(_.range(1, MAX_CLOCK_VAL + 1).map(async (i) => {
      const record = await models.ClockRecord.findOne({
        where: {
          clock: i,
          cnodeUserUUID,
        },
        raw: true
      })
      return stringifiedDateFields(record)
    }))

    const trackFile = stringifiedDateFields(await models.Track.findOne({
      where: {
        clock: MAX_CLOCK_VAL,
        cnodeUserUUID,
        metadataFileUUID: trackMetadataFileUUID
      },
      raw: true
    }))

    const expectedData = {
      [cnodeUserUUID]: {
        ...cnodeUser,
        audiusUsers: [
          audiusUser
        ],
        tracks: [trackFile],
        files: [userMetadataFile, copy320, ...segmentFiles, trackMetadataFile],
        clockRecords,
      }
    }

    const exportedUserData = exportBody.data.cnodeUsers
    assert.deepStrictEqual(exportedUserData, expectedData)
    assert.deepStrictEqual(clockRecords.length, MAX_CLOCK_VAL)
  })

  it('test /sync', function () {
    /**
         * mock export request obj + ensure all files are avail on test IPFS node
         * confirm sync successfully
         */
  })
})
