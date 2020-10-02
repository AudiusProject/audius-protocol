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
const { getCNodeUser, stringifiedDateFields, destroyUsers } = require('./utils')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')

let server, app, ipfs, libsMock

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
    await destroyUsers()
    await server.close()
  })

  it('test /export', async function () {
    const MAX_CLOCK_VAL = 37

    // SETUP

    // Create user
    const { cnodeUserUUID, sessionToken } = await createStarterCNodeUser()
    await getCNodeUser(cnodeUserUUID)

    // Set user metadata
    const metadata = {
      metadata: {
        testField: 'testValue'
      }
    }
    const { body: { data: { metadataMultihash, metadataFileUUID } } } = await request(app)
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
    const { body: { transcodedTrackCID, transcodedTrackUUID, track_segments: trackSegments, source_file: sourceFile } } = await request(app)
      .post('/track_content')
      .attach('file', file, { filename: 'fname.mp3' })
      .set('Content-Type', 'multipart/form-data')
      .set('X-Session-ID', sessionToken)

    // set track metadata
    const trackMetadata = {
      test: 'field1',
      owner_id: 1,
      track_segments: trackSegments
    }
    const { body: { metadataMultihash: trackMetadataMultihash, metadataFileUUID: trackMetadataFileUUID } } = await request(app)
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

    // Test: export

    const { pubKey } = testEthereumConstants
    const { body: exportBody } = await request(app)
      .get(`/export?wallet_public_key=${pubKey.toLowerCase()}`)

    // Verify

    // Get user metadata
    const userMetadataFile = stringifiedDateFields((await models.File.findOne({
      where: {
        multihash: metadataMultihash,
        fileUUID: metadataFileUUID,
        clock: 1
      },
      raw: true
    })))

    // get transcoded track file
    const copy320 = stringifiedDateFields((await models.File.findOne({
      where: {
        multihash: transcodedTrackCID,
        fileUUID: transcodedTrackUUID,
        clock: 3
      },
      raw: true
    })))

    // get segment files
    const segmentHashes = trackSegments.map(t => t.multihash)
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

    // Get track metadata file
    const trackMetadataFile = stringifiedDateFields(await models.File.findOne({
      where: {
        multihash: trackMetadataMultihash,
        fileUUID: trackMetadataFileUUID,
        clock: 36
      },
      raw: true
    }))

    // get audiusUser
    const audiusUser = stringifiedDateFields(await models.AudiusUser.findOne({
      where: {
        metadataFileUUID,
        clock: 2
      },
      raw: true
    }))

    // get cnodeUser
    const cnodeUser = stringifiedDateFields(await models.CNodeUser.findOne({
      where: {
        clock: MAX_CLOCK_VAL,
        cnodeUserUUID
      },
      raw: true
    }))

    // get clock records
    const clockRecords = await Promise.all(_.range(1, MAX_CLOCK_VAL + 1).map(async (i) => {
      const record = await models.ClockRecord.findOne({
        where: {
          clock: i,
          cnodeUserUUID
        },
        raw: true
      })
      return stringifiedDateFields(record)
    }))

    // get track file
    const trackFile = stringifiedDateFields(await models.Track.findOne({
      where: {
        clock: MAX_CLOCK_VAL,
        cnodeUserUUID,
        metadataFileUUID: trackMetadataFileUUID
      },
      raw: true
    }))

    // construct the expected response
    const expectedData = {
      [cnodeUserUUID]: {
        ...cnodeUser,
        audiusUsers: [
          audiusUser
        ],
        tracks: [trackFile],
        files: [userMetadataFile, copy320, ...segmentFiles, trackMetadataFile],
        clockRecords
      }
    }

    // compare exported data
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
