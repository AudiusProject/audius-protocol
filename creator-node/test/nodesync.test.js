const request = require('supertest')
const models = require('../src/models')
const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const { getIPFSMock } = require('./lib/ipfsMock')
const { createStarterCNodeUser, testEthereumConstants, getCNodeUser, destroyUsers } = require('./lib/dataSeeds')
const BlacklistManager = require('../src/blacklistManager')
const ipfsClient = require('../src/ipfsClient')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const { stringifiedDateFields } = require('./lib/utils')
const nock = require('nock')
const config = require('../src/config')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')
const sampleExportPath = path.resolve(__dirname, 'syncAssets/sampleExport.json')

describe('test nodesync', function () {
  let server, app
  const maxExportClockValueRange = config.get('maxExportClockValueRange')

  afterEach(async function () {
    await destroyUsers()
    await server.close()
  })

  describe('test export', function () {
    beforeEach(async function () {
      const ipfs = ipfsClient.ipfs
      const libsMock = getLibsMock()
      const appInfo = await getApp(ipfs, libsMock, BlacklistManager)
      server = appInfo.server
      app = appInfo.app
    })

    it('should export the correct json blob for db state with a track and user', async function () {
      // SETUP

      const MAX_CLOCK_VAL = 37

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
          type: 'copy320'
        },
        raw: true
      })))

      // get segment files
      const segmentHashes = trackSegments.map(t => t.multihash)
      const segmentFiles = await Promise.all(segmentHashes.map(async (hash, i) => {
        const segment = await models.File.findOne({
          where: {
            multihash: hash,
            type: 'track'
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

      const clockInfo = {
        localClockMax: cnodeUser.clock,
        requestedClockRangeMin: 0,
        requestedClockRangeMax: maxExportClockValueRange - 1
      }

      // construct the expected response
      const expectedData = {
        [cnodeUserUUID]: {
          ...cnodeUser,
          audiusUsers: [
            audiusUser
          ],
          tracks: [trackFile],
          files: [userMetadataFile, copy320, ...segmentFiles, trackMetadataFile],
          clockRecords,
          clockInfo
        }
      }

      // compare exported data
      const exportedUserData = exportBody.data.cnodeUsers
      assert.deepStrictEqual(exportedUserData, expectedData)
      assert.deepStrictEqual(clockRecords.length, MAX_CLOCK_VAL)
    })
  })

  describe('test sync', function () {
    beforeEach(async function () {
      const ipfsMock = getIPFSMock()

      // Make ipfs add return the cid
      // used to create the readstream.
      // Used in the final step of
      // `saveFileForMultihash`
      ipfsMock.add = function * (content) {
        const { path } = content
        const cid = path.split('/')[1]
        yield {
          cid: {
            toString: () => cid
          }
        }
      }

      const libsMock = getLibsMock()
      const appInfo = await getApp(ipfsMock, libsMock, BlacklistManager)
      server = appInfo.server
      app = appInfo.app
    })

    it('inserts the correct db entries for a given export blob', async function () {
      // Setup

      const TEST_ENDPOINT = 'http://test-cn.co'
      const userMetadataURI = config.get('userMetadataNodeUrl')
      const { pubKey } = testEthereumConstants

      // Get the saved export
      const sampleExport = JSON.parse(fs.readFileSync(sampleExportPath))
      const cnodeUser = Object.values(sampleExport.data.cnodeUsers)[0]
      const audiusUser = cnodeUser.audiusUsers[0]
      const { tracks, files, clockRecords } = cnodeUser

      // Setup mocked responses
      nock(TEST_ENDPOINT)
        .persist()
        .get(uri => uri.includes('/export'))
        .reply(200, sampleExport)

      nock(userMetadataURI)
        .persist()
        .get(uri => uri.includes('/ipfs'))
        .reply(200, { data: Buffer.alloc(32) })

      // test: sync

      const { sessionToken } = await createStarterCNodeUser()
      await request(app)
        .post('/sync')
        .set('X-Session-ID', sessionToken)
        .send({
          wallet: [pubKey.toLowerCase()],
          creator_node_endpoint: TEST_ENDPOINT,
          immediate: true
        }).expect(200)

      // verify: expected files are all on disc

      // verify clock records
      for (let exportedRecord of clockRecords) {
        const { cnodeUserUUID, clock, sourceTable, createdAt, updatedAt } = exportedRecord
        const localRecord = stringifiedDateFields(await models.ClockRecord.findOne({
          where: {
            clock,
            cnodeUserUUID,
            sourceTable,
            createdAt,
            updatedAt
          },
          raw: true
        }))
        assert.deepStrictEqual(localRecord, exportedRecord)
      }

      // verify files
      for (let exportedFile of files) {
        const { fileUUID, cnodeUserUUID, multihash, clock } = exportedFile
        const localFile = stringifiedDateFields(await models.File.findOne({
          where: {
            clock,
            cnodeUserUUID,
            multihash,
            fileUUID
          },
          raw: true
        }))
        assert.deepStrictEqual(localFile, exportedFile)
      }

      // verify tracks
      for (let exportedTrack of tracks) {
        const { cnodeUserUUID, clock, blockchainId, metadataFileUUID } = exportedTrack
        const localFile = stringifiedDateFields(await models.Track.findOne({
          where: {
            clock,
            cnodeUserUUID,
            blockchainId,
            metadataFileUUID
          },
          raw: true
        }))
        assert.deepStrictEqual(localFile, exportedTrack)
      }

      // verify AudiusUser
      const localAudiusUser = stringifiedDateFields(await models.AudiusUser.findOne({
        where: {
          cnodeUserUUID: audiusUser.cnodeUserUUID,
          clock: audiusUser.clock
        },
        raw: true
      }))

      const exportedCnodeUser = {
        cnodeUserUUID: cnodeUser.cnodeUserUUID,
        walletPublicKey: cnodeUser.walletPublicKey,
        lastLogin: cnodeUser.lastLogin,
        latestBlockNumber: cnodeUser.latestBlockNumber,
        clock: cnodeUser.clock,
        createdAt: cnodeUser.createdAt
      }

      assert.deepStrictEqual(localAudiusUser, audiusUser)

      // verify CNodeUser
      let localCnodeUser = stringifiedDateFields(await models.CNodeUser.find({
        where: {
          cnodeUserUUID: cnodeUser.cnodeUserUUID
        },
        raw: true
      }))
      localCnodeUser = _.omit(localCnodeUser, ['updatedAt'])

      assert.deepStrictEqual(localCnodeUser, exportedCnodeUser)
    })
  })
})
