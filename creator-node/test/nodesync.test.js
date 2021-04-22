const request = require('supertest')
const fs = require('fs-extra')
const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const nock = require('nock')

const { timeout } = require('../src/utils')
const config = require('../src/config')
const models = require('../src/models')
const { getApp, getServiceRegistryMock } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const libsMock = getLibsMock()
const { createStarterCNodeUser, testEthereumConstants, destroyUsers } = require('./lib/dataSeeds')
const BlacklistManager = require('../src/blacklistManager')
const ipfsImport = require('../src/ipfsClient')
// TODO - upgrade to newer ipfs client
const ipfsClient = ipfsImport.ipfs
const redisClient = require('../src/redis')
const { stringifiedDateFields } = require('./lib/utils')
const processSync = require('../src/services/sync/processSync')

const testAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')
const sampleExportPath = path.resolve(__dirname, 'syncAssets/sampleExport.json')
const sampleExportFromClock2Path = path.resolve(__dirname, 'syncAssets/sampleExportFromClock2.json')

describe.only('test nodesync', async function () {
  let server, app

  const originalMaxExportClockValueRange = config.get('maxExportClockValueRange')
  let maxExportClockValueRange = originalMaxExportClockValueRange

  const setupDepsAndApp = async function () {
    const appInfo = await getApp(ipfsClient, libsMock, BlacklistManager)
    server = appInfo.server
    app = appInfo.app
  }

  /** Wipe DB + Redis */
  beforeEach(async function () {
    try {
      await destroyUsers()
    } catch (e) {
      // do nothing
    }
    await redisClient.flushdb()
  })

  /**
   * Wipe DB, server, and redis state
   */
  afterEach(async function () {
    await server.close()
  })

  describe('test /export route', async function () {
    let cnodeUserUUID, sessionToken, metadataMultihash, metadataFileUUID, transcodedTrackCID, transcodedTrackUUID, trackSegments, sourceFile
    let trackMetadataMultihash, trackMetadataFileUUID

    const { pubKey } = testEthereumConstants

    const createUserAndTrack = async function () {
      // Create user
      ({ cnodeUserUUID, sessionToken } = await createStarterCNodeUser())

      // Upload user metadata
      const metadata = {
        metadata: {
          testField: 'testValue'
        }
      }
      const userMetadataResp = await request(app)
        .post('/audius_users/metadata')
        .set('X-Session-ID', sessionToken)
        .send(metadata)
        .expect(200)
      metadataMultihash = userMetadataResp.body.data.metadataMultihash
      metadataFileUUID = userMetadataResp.body.data.metadataFileUUID

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
        .expect(200)

      /** Upload a track */

      const file = fs.readFileSync(testAudioFilePath)

      // Upload track content
      const { body: { data: trackContentRespBody } } = await request(app)
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
      trackMetadataMultihash = trackMetadataResp.body.data.metadataMultihash
      trackMetadataFileUUID = trackMetadataResp.body.data.metadataFileUUID

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

      /**
       * unset maxExportClockValueRange
       */
      afterEach(async function () {
        delete process.env.maxExportClockValueRange
      })

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

  describe.only('Test /sync2 route', async function () {
    const TEST_ENDPOINT = 'http://test-cn.co'
    const userMetadataURI = config.get('userMetadataNodeUrl')
    const { pubKey } = testEthereumConstants

    const createUser = async function () {
      // Create user
      const { cnodeUserUUID, sessionToken } = await createStarterCNodeUser()

      // Upload user metadata
      const metadata = {
        metadata: {
          testField: 'testValue'
        }
      }
      const userMetadataResp = await request(app)
        .post('/audius_users/metadata')
        .set('X-Session-ID', sessionToken)
        .send(metadata)
        .expect(200)

      const metadataFileUUID = userMetadataResp.body.data.metadataFileUUID

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
        .expect(200)

      return cnodeUserUUID
    }


    /**
     * Setup deps + mocks + app
     */
    beforeEach(async function () {
      nock.cleanAll()

      maxExportClockValueRange = originalMaxExportClockValueRange
      process.env.maxExportClockValueRange = maxExportClockValueRange

      // Mock ipfs.swarm.connect() function for test purposes
      ipfsImport.ipfs.swarm.connect = async function () { return { 'Strings': [] } }

      const appInfo = await getApp(ipfsImport.ipfs, libsMock, BlacklistManager, ipfsImport.ipfsLatest)
      server = appInfo.server
      app = appInfo.app
    })

    it.only('Test processSync function - from clean user state with mocked export object', async function () {
      // Unpack sample export data
      const sampleExport = JSON.parse(fs.readFileSync(sampleExportPath))
      const cnodeUser = Object.values(sampleExport.data.cnodeUsers)[0]
      const audiusUser = cnodeUser.audiusUsers[0]
      const { tracks, files, clockRecords, clockInfo } = cnodeUser

      // Mock /export route response
      nock(TEST_ENDPOINT)
        .persist()
        .get(uri => uri.includes('/export'))
        .reply(200, sampleExport)

      // Mock /ipfs gateway routes for saveFileForMultihashToFS
      nock(userMetadataURI)
        .persist()
        .get(uri => uri.includes('/ipfs'))
        .reply(200, { data: Buffer.alloc(32) })

      // Confirm no local user state before sync
      const initialCNodeUserCount = await models.CNodeUser.count()
      assert.strictEqual(initialCNodeUserCount, 0)

      // test: sync
      // await request(app)
      //   .post('/sync')
      //   .send({
      //     wallet: [pubKey.toLowerCase()],
      //     creator_node_endpoint: TEST_ENDPOINT,
      //     immediate: true
      //   }).expect(200)

      // await timeout(10000, true)

      const userWallets = [pubKey.toLowerCase()]

      const serviceRegistryMock = getServiceRegistryMock(ipfsImport.ipfs, libsMock, BlacklistManager, ipfsImport.ipfsLatest)
      await processSync(serviceRegistryMock, userWallets, TEST_ENDPOINT)

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

      // verify clockInfo
      const localClockInfo = {
        requestedClockRangeMin: 0,
        requestedClockRangeMax: 0 + (maxExportClockValueRange - 1),
        localClockMax: localCNodeUser.clock
      }
      assert.deepStrictEqual(localClockInfo, clockInfo)
    })

    it('Syncs correctly from clean user state with mocked export object', async function () {
      // Get the saved export
      const sampleExport = JSON.parse(fs.readFileSync(sampleExportPath))
      const cnodeUser = Object.values(sampleExport.data.cnodeUsers)[0]
      const audiusUser = cnodeUser.audiusUsers[0]
      const { tracks, files, clockRecords, clockInfo } = cnodeUser

      // Setup mocked responses -> replace with S3 files
      nock(TEST_ENDPOINT)
        .persist()
        .get(uri => uri.includes('/export'))
        .reply(200, sampleExport)

      /**
       * All IPFS calls will fail since data doesn't exist, and node will fallback via gateway
       * Mock this route to ensure data retrieval succeeds.
       * TODO - replace with S3 file
       */
      nock(userMetadataURI)
        .persist()
        .get(uri => uri.includes('/ipfs'))
        .reply(200, { data: Buffer.alloc(32) })

      // Confirm no local user state before sync
      const initialCNodeUserCount = await models.CNodeUser.count()
      assert.strictEqual(initialCNodeUserCount, 0)

      // test: sync
      await request(app)
        .post('/sync')
        .send({
          wallet: [pubKey.toLowerCase()],
          creator_node_endpoint: TEST_ENDPOINT,
          immediate: true
        }).expect(200)

      await timeout(10000, true)

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

      // verify clockInfo
      const localClockInfo = {
        requestedClockRangeMin: 0,
        requestedClockRangeMax: 0 + (maxExportClockValueRange - 1),
        localClockMax: localCNodeUser.clock
      }
      assert.deepStrictEqual(localClockInfo, clockInfo)
    })

    it('Syncs correctly when cnodeUser data already exists locally', async function () {
      // Get the saved export
      const sampleExport = JSON.parse(fs.readFileSync(sampleExportFromClock2Path))
      const cnodeUser = Object.values(sampleExport.data.cnodeUsers)[0]
      const audiusUser = cnodeUser.audiusUsers[0]
      const { tracks, files, clockRecords, clockInfo } = cnodeUser

      // Setup mocked responses
      nock(TEST_ENDPOINT)
        .persist()
        .get(uri => uri.includes('/export'))
        .reply(200, sampleExport)
      nock(userMetadataURI)
        .persist()
        .get(uri => uri.includes('/ipfs'))
        .reply(200, { data: Buffer.alloc(32) })

      // Confirm initial local state is empty
      let initialCNodeUserCount = await models.CNodeUser.count()
      assert.strictEqual(initialCNodeUserCount, 0)

      // seed user state locally with different cnodeUserUUID
      const cnodeUserUUID = await createUser()

      // Confirm user state exists locally before sync
      const localCNodeUsersBeforeSync = await models.CNodeUser.findAll({
        where: { cnodeUserUUID },
        raw: true
      })
      assert.strictEqual(localCNodeUsersBeforeSync.length, 1)
      const localCNodeUserBeforeSync = stringifiedDateFields(localCNodeUsersBeforeSync[0])

      // test: sync
      await request(app)
        .post('/sync2')
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
          cnodeUserUUID,
          walletPublicKey: cnodeUser.walletPublicKey
        },
        raw: true
      }))
      assert.deepStrictEqual(
        _.omit(localCNodeUser, ['cnodeUserUUID', 'updatedAt']),
        exportedCnodeUser
      )

      // verify AudiusUser
      const localAudiusUser = undefined
      assert.deepStrictEqual(localAudiusUser, audiusUser)

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

      // verify clockInfo
      const localClockInfo = {
        requestedClockRangeMin: localCNodeUserBeforeSync.clock + 1,
        requestedClockRangeMax: (localCNodeUserBeforeSync.clock + 1) + (maxExportClockValueRange - 1),
        localClockMax: localCNodeUser.clock
      }
      assert.deepStrictEqual(localClockInfo, clockInfo)
    })
  })
})
