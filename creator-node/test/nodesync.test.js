const request = require('supertest')
const models = require('../src/models')
const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const { getIPFSMock } = require('./lib/ipfsMock')
const { createStarterCNodeUser, testEthereumConstants, destroyUsers } = require('./lib/dataSeeds')
const BlacklistManager = require('../src/blacklistManager')
const ipfsClient = require('../src/ipfsClient')
const fs = require('fs-extra')
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

  let maxExportClockValueRange = config.get('maxExportClockValueRange')

  afterEach(async function () {
    await destroyUsers()
    await server.close()
  })

  describe('test /export route', function () {
    let cnodeUserUUID, sessionToken, metadataMultihash, metadataFileUUID, transcodedTrackCID, transcodedTrackUUID, trackSegments, sourceFile
    let trackMetadataMultihash, trackMetadataFileUUID

    const { pubKey } = testEthereumConstants

    const setupDepsAndApp = async function () {
      const ipfs = ipfsClient.ipfs
      const libsMock = getLibsMock()
      const appInfo = await getApp(ipfs, libsMock, BlacklistManager)
      server = appInfo.server
      app = appInfo.app
    }

    const createUserAndTrack = async function () {
      // Create user
      ({ cnodeUserUUID, sessionToken } = await createStarterCNodeUser())

      // Upload user metadata
      const metadata = {
        metadata: {
          testField: 'testValue'
        }
      }
      const userMedataResp = await request(app)
        .post('/audius_users/metadata')
        .set('X-Session-ID', sessionToken)
        .send(metadata)
      metadataMultihash = userMedataResp.body.data.metadataMultihash
      metadataFileUUID = userMedataResp.body.data.metadataFileUUID

      // Associate user with with blockchain ID
      const associateRequest = {
        blockchainUserId: 1,
        metadataFileUUID,
        blockNumber: 10
      }
      await request(app)
        .post('/audius_users')
        .set('X-Session-ID', sessionToken)
        .send(associateRequest)

      /** Upload a track */

      const file = fs.readFileSync(testAudioFilePath)

      // Upload track content
      const { body: trackContentRespBody } = await request(app)
        .post('/track_content')
        .attach('file', file, { filename: 'fname.mp3' })
        .set('Content-Type', 'multipart/form-data')
        .set('X-Session-ID', sessionToken)
      transcodedTrackCID = trackContentRespBody.transcodedTrackCID
      transcodedTrackUUID = trackContentRespBody.transcodedTrackUUID
      trackSegments = trackContentRespBody.track_segments
      sourceFile = trackContentRespBody.source_file

      // Upload track metadata
      const trackMetadata = {
        test: 'field1',
        owner_id: 1,
        track_segments: trackSegments
      }
      const trackMetadataResp = await request(app)
        .post('/tracks/metadata')
        .set('X-Session-ID', sessionToken)
        .send({ metadata: trackMetadata, source_file: sourceFile })
      trackMetadataMultihash = trackMetadataResp.body.metadataMultihash
      trackMetadataFileUUID = trackMetadataResp.body.metadataFileUUID

      // associate track + track metadata with blockchain ID
      await request(app)
        .post('/tracks')
        .set('X-Session-ID', sessionToken)
        .send({
          blockchainTrackId: 1,
          blockNumber: 10,
          metadataFileUUID: trackMetadataFileUUID,
          transcodedTrackUUID
        })
    }

    describe('Confirm export object matches DB state with a user and track', async function () {
      beforeEach(setupDepsAndApp)

      beforeEach(createUserAndTrack)

      it('Test default export', async function () {
        // confirm maxExportClockValueRange > cnodeUser.clock
        const cnodeUserClock = (await models.CNodeUser.findOne({
          where: { cnodeUserUUID },
          raw: true
        })).clock
        assert.ok(cnodeUserClock <= maxExportClockValueRange)

        const { body: exportBody } = await request(app)
          .get(`/export?wallet_public_key=${pubKey.toLowerCase()}`)

        /**
         * Verify
         */

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
            cnodeUserUUID
          },
          raw: true
        }))

        // get clock records
        const clockRecords = (await models.ClockRecord.findAll({
          where: { cnodeUserUUID },
          raw: true
        })).map(stringifiedDateFields)

        // get track file
        const trackFile = stringifiedDateFields(await models.Track.findOne({
          where: {
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
        assert.deepStrictEqual(clockRecords.length, cnodeUserClock)
      })
    })

    describe('Confirm export works for user with data exceeding maxExportClockValueRange', async function () {
      /**
       * override maxExportClockValueRange to smaller value for testing
       */
      beforeEach(async function () {
        maxExportClockValueRange = 10
        process.env.maxExportClockValueRange = maxExportClockValueRange
      })

      beforeEach(setupDepsAndApp)

      beforeEach(createUserAndTrack)

      it('Export from clock = 0', async function () {
        const requestedClockRangeMin = 0
        const requestedClockRangeMax = (maxExportClockValueRange - 1)

        // confirm maxExportClockValueRange < cnodeUser.clock
        const cnodeUserClock = (await models.CNodeUser.findOne({
          where: { cnodeUserUUID },
          raw: true
        })).clock
        assert.ok(cnodeUserClock > maxExportClockValueRange)

        const { body: exportBody } = await request(app)
          .get(`/export?wallet_public_key=${pubKey.toLowerCase()}`)

        /**
         * Verify
         */

        // get cnodeUser
        const cnodeUser = stringifiedDateFields(await models.CNodeUser.findOne({
          where: {
            cnodeUserUUID
          },
          raw: true
        }))
        cnodeUser.clock = requestedClockRangeMax

        // get clockRecords
        const clockRecords = (await models.ClockRecord.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // Get audiusUsers
        const audiusUsers = (await models.AudiusUser.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // get tracks
        const tracks = (await models.Track.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // get files
        const files = (await models.File.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        const clockInfo = {
          requestedClockRangeMin,
          requestedClockRangeMax,
          localClockMax: requestedClockRangeMax
        }

        // construct the expected response
        const expectedData = {
          [cnodeUserUUID]: {
            ...cnodeUser,
            audiusUsers,
            tracks,
            files,
            clockRecords,
            clockInfo
          }
        }

        // compare exported data
        const exportedUserData = exportBody.data.cnodeUsers
        assert.deepStrictEqual(exportedUserData, expectedData)
        // when requesting from 0, exported data set is 1 less than expected range since clock values are 1-indexed
        assert.deepStrictEqual(clockRecords.length, maxExportClockValueRange - 1)
      })

      it('Export from clock = 10', async function () {
        const clockRangeMin = 10
        const requestedClockRangeMin = clockRangeMin
        const requestedClockRangeMax = clockRangeMin + (maxExportClockValueRange - 1)

        // confirm maxExportClockValueRange < cnodeUser.clock
        const cnodeUserClock = (await models.CNodeUser.findOne({
          where: { cnodeUserUUID },
          raw: true
        })).clock
        assert.ok(cnodeUserClock > maxExportClockValueRange)

        const { body: exportBody } = await request(app)
          .get(`/export?wallet_public_key=${pubKey.toLowerCase()}&clock_range_min=${requestedClockRangeMin}`)

        /**
         * Verify
         */

        // get cnodeUser
        const cnodeUser = stringifiedDateFields(await models.CNodeUser.findOne({
          where: {
            cnodeUserUUID
          },
          raw: true
        }))
        cnodeUser.clock = requestedClockRangeMax

        // get clockRecords
        const clockRecords = (await models.ClockRecord.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // Get audiusUsers
        const audiusUsers = (await models.AudiusUser.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // get tracks
        const tracks = (await models.Track.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // get files
        const files = (await models.File.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        const clockInfo = {
          requestedClockRangeMin,
          requestedClockRangeMax,
          localClockMax: requestedClockRangeMax
        }

        // construct the expected response
        const expectedData = {
          [cnodeUserUUID]: {
            ...cnodeUser,
            audiusUsers,
            tracks,
            files,
            clockRecords,
            clockInfo
          }
        }

        // compare exported data
        const exportedUserData = exportBody.data.cnodeUsers
        assert.deepStrictEqual(exportedUserData, expectedData)
        assert.deepStrictEqual(clockRecords.length, maxExportClockValueRange)
      })

      it('Export from clock = 30 where range exceeds final value', async function () {
        const clockRangeMin = 30
        const requestedClockRangeMin = clockRangeMin
        const requestedClockRangeMax = clockRangeMin + (maxExportClockValueRange - 1)

        // confirm cnodeUser.clock < (requestedClockRangeMin + maxExportClockValueRange)
        const cnodeUserClock = (await models.CNodeUser.findOne({
          where: { cnodeUserUUID },
          raw: true
        })).clock
        assert.ok(cnodeUserClock < (requestedClockRangeMin + maxExportClockValueRange))

        const { body: exportBody } = await request(app)
          .get(`/export?wallet_public_key=${pubKey.toLowerCase()}&clock_range_min=${requestedClockRangeMin}`)

        /**
         * Verify
         */

        // get cnodeUser
        const cnodeUser = stringifiedDateFields(await models.CNodeUser.findOne({
          where: {
            cnodeUserUUID
          },
          raw: true
        }))
        cnodeUser.clock = Math.min(cnodeUser.clock, requestedClockRangeMax)

        // get clockRecords
        const clockRecords = (await models.ClockRecord.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // Get audiusUsers
        const audiusUsers = (await models.AudiusUser.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // get tracks
        const tracks = (await models.Track.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        // get files
        const files = (await models.File.findAll({
          where: {
            cnodeUserUUID,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          raw: true
        })).map(stringifiedDateFields)

        const clockInfo = {
          requestedClockRangeMin,
          requestedClockRangeMax,
          localClockMax: cnodeUser.clock
        }

        // construct the expected response
        const expectedData = {
          [cnodeUserUUID]: {
            ...cnodeUser,
            audiusUsers,
            tracks,
            files,
            clockRecords,
            clockInfo
          }
        }

        // compare exported data
        const exportedUserData = exportBody.data.cnodeUsers
        assert.deepStrictEqual(exportedUserData, expectedData)
        assert.deepStrictEqual(clockRecords.length, cnodeUser.clock - requestedClockRangeMin + 1)
      })
    })
  })

  describe.only('Test /sync route', function () {
    const TEST_ENDPOINT = 'http://test-cn.co'
    const userMetadataURI = config.get('userMetadataNodeUrl')
    const { pubKey } = testEthereumConstants

    /**
     * Setup deps + mocks + app
     */
    beforeEach(async function () {
      const ipfsMock = getIPFSMock()

      // Make ipfs add return the cid
      // used to create the readstream.
      // Used in the final step of
      // `saveFileForMultihashToFS`
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

    it.only('Syncs correctly from clock = 0 with mocked export object', async function () {
      // Get the saved export
      const sampleExport = JSON.parse(fs.readFileSync(sampleExportPath))
      const cnodeUser = Object.values(sampleExport.data.cnodeUsers)[0]
      const audiusUser = cnodeUser.audiusUsers[0]
      const { tracks, files, clockRecords } = cnodeUser
      console.log(`SIDTEST audiusUser: ${JSON.stringify(audiusUser, null, 2)}`)

      // Setup mocked responses
      nock(TEST_ENDPOINT)
        .persist()
        .get(uri => uri.includes('/export'))
        .reply(200, sampleExport)
      nock(userMetadataURI)
        .persist()
        .get(uri => uri.includes('/ipfs'))
        .reply(200, { data: Buffer.alloc(32) })

      // Create start cnodeUser
      // const { sessionToken } = await createStarterCNodeUser()

      // test: sync
      await request(app)
        .post('/sync')
        // .set('X-Session-ID', sessionToken)
        .send({
          wallet: [pubKey.toLowerCase()],
          creator_node_endpoint: TEST_ENDPOINT,
          immediate: true
        }).expect(200)

      const exportedCnodeUser = {
        walletPublicKey: cnodeUser.walletPublicKey,
        lastLogin: cnodeUser.lastLogin,
        latestBlockNumber: cnodeUser.latestBlockNumber,
        clock: cnodeUser.clock,
        createdAt: cnodeUser.createdAt
      }

      // verify CNodeUser
      const localCNodeUser = stringifiedDateFields(await models.CNodeUser.findOne({
        where: {
          walletPublicKey: cnodeUser.walletPublicKey
        },
        raw: true
      }))
      assert.deepStrictEqual(
        _.omit(localCNodeUser, ['cnodeUserUUID', 'updatedAt']),
        exportedCnodeUser
      )

      const cnodeUserUUID = localCNodeUser.cnodeUserUUID

      // verify AudiusUser
      const localAudiusUser = stringifiedDateFields(await models.AudiusUser.findOne({
        where: {
          cnodeUserUUID,
          clock: audiusUser.clock
        },
        raw: true
      }))
      assert.deepStrictEqual(
        _.omit(localAudiusUser, ['cnodeUserUUID']),
        _.omit(audiusUser, ['cnodeUserUUID'])
      )

      // TODO verify: expected files are all on disc

      // verify clock records
      for (let exportedRecord of clockRecords) {
        const { clock, sourceTable, createdAt, updatedAt } = exportedRecord
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
        assert.deepStrictEqual(
          _.omit(localRecord, ['cnodeUserUUID']),
          _.omit(exportedRecord, ['cnodeUserUUID'])
        )
      }

      // verify files
      for (let exportedFile of files) {
        const { fileUUID, multihash, clock } = exportedFile
        const localFile = stringifiedDateFields(await models.File.findOne({
          where: {
            clock,
            cnodeUserUUID,
            multihash,
            fileUUID
          },
          raw: true
        }))
        assert.deepStrictEqual(
          _.omit(localFile, ['cnodeUserUUID']),
          _.omit(exportedFile, ['cnodeUserUUID'])
        )
      }

      // verify tracks
      for (let exportedTrack of tracks) {
        const { clock, blockchainId, metadataFileUUID } = exportedTrack
        const localFile = stringifiedDateFields(await models.Track.findOne({
          where: {
            clock,
            cnodeUserUUID,
            blockchainId,
            metadataFileUUID
          },
          raw: true
        }))
        assert.deepStrictEqual(
          _.omit(localFile, ['cnodeUserUUID']),
          _.omit(exportedTrack, ['cnodeUserUUID'])
        )
      }
    })

    it.skip('Test sync when cnodeUser entry already exists locally')
  })
})
