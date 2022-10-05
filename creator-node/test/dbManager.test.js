const assert = require('assert')
const proxyquire = require('proxyquire')
const _ = require('lodash')
const getUuid = require('uuid/v4')

const request = require('supertest')
const path = require('path')
const sinon = require('sinon')

const models = require('../src/models')
const DBManager = require('../src/dbManager')
const BlacklistManager = require('../src/blacklistManager')
const FileManager = require('../src/fileManager')
const DiskManager = require('../src/diskManager')
const utils = require('../src/utils')
const {
  createStarterCNodeUser,
  getCNodeUser,
  destroyUsers,
  createSession,
  createStarterCNodeUserWithKey
} = require('./lib/dataSeeds')
const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const { saveFileToStorage, computeFilesHash } = require('./lib/helpers')
const { fetchDBStateForWallet, assertTableEquality } = require('./lib/utils')

const TestAudioFilePath = path.resolve(__dirname, 'testTrack.mp3')

describe('Test createNewDataRecord()', async function () {
  const req = {
    logger: {
      error: (msg) => console.log(msg)
    }
  }

  const initialClockVal = 0
  const timeoutMs = 1000

  let cnodeUserUUID, createFileQueryObj, server

  /** Init server to run DB migrations */
  before(async function () {
    const appInfo = await getApp(getLibsMock(), BlacklistManager)
    server = appInfo.server
  })

  /** Reset DB state + Create cnodeUser + confirm initial clock state + define global vars */
  beforeEach(async function () {
    // Wipe all CNodeUsers + dependent data
    await destroyUsers()
    const resp = await createStarterCNodeUser()
    cnodeUserUUID = resp.cnodeUserUUID
    req.session = { cnodeUserUUID }

    // Confirm initial clock val in DB
    const cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)

    createFileQueryObj = {
      multihash: 'testMultihash',
      sourceFile: 'testSourceFile',
      storagePath: 'testStoragePath',
      type: 'metadata' // TODO - replace with models enum
    }
  })

  /** Remove sequelize hooks */
  afterEach(async function () {
    models.sequelize.removeHook('beforeCreate', 'clockTimeout')
  })

  /** Wipe all CNodeUsers + dependent data */
  after(async function () {
    await destroyUsers()

    await server.close()
  })

  it('Sequential createNewDataRecord - create 2 records', async function () {
    const sequelizeTableInstance = models.File

    /**
     * CREATE RECORD 1
     */

    // Create new Data record
    let transaction = await models.sequelize.transaction()
    let createdFile = await DBManager.createNewDataRecord(
      createFileQueryObj,
      cnodeUserUUID,
      sequelizeTableInstance,
      transaction
    )
    await transaction.commit()

    // Validate returned file object
    assert.strictEqual(createdFile.cnodeUserUUID, cnodeUserUUID)
    assert.strictEqual(createdFile.clock, initialClockVal + 1)

    // Validate CNodeUsers table state
    let cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal + 1)

    // Validate ClockRecords table state
    let clockRecords = await models.ClockRecord.findAll({
      where: { cnodeUserUUID }
    })
    assert.strictEqual(clockRecords.length, 1)
    let clockRecord = clockRecords[0].dataValues
    assert.strictEqual(clockRecord.clock, initialClockVal + 1)
    assert.strictEqual(clockRecord.sourceTable, sequelizeTableInstance.name)

    // Validate Files table state
    let files = await models.File.findAll({ where: { cnodeUserUUID } })
    assert.strictEqual(files.length, 1)
    let file = files[0].dataValues
    assert.strictEqual(file.clock, initialClockVal + 1)

    /**
     * CREATE RECORD 2
     */

    // Create new Data record
    transaction = await models.sequelize.transaction()
    createFileQueryObj = {
      multihash: 'testMultihash2',
      sourceFile: 'testSourceFile2',
      storagePath: 'testStoragePath2',
      type: 'metadata' // TODO - replace with models enum
    }
    createdFile = await DBManager.createNewDataRecord(
      createFileQueryObj,
      cnodeUserUUID,
      sequelizeTableInstance,
      transaction
    )
    await transaction.commit()

    // Validate returned file object
    assert.strictEqual(createdFile.cnodeUserUUID, cnodeUserUUID)
    assert.strictEqual(createdFile.clock, initialClockVal + 2)

    // Validate CNodeUsers table state
    cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal + 2)

    // Validate ClockRecords table state
    clockRecords = await models.ClockRecord.findAll({
      where: { cnodeUserUUID },
      order: [['createdAt', 'DESC']]
    })
    assert.strictEqual(clockRecords.length, 2)
    clockRecord = clockRecords[0].dataValues
    assert.strictEqual(clockRecord.sourceTable, sequelizeTableInstance.name)
    assert.strictEqual(clockRecord.clock, initialClockVal + 2)

    // Validate Files table state
    files = await models.File.findAll({
      where: { cnodeUserUUID },
      order: [['createdAt', 'DESC']]
    })
    assert.strictEqual(files.length, 2)
    file = files[0].dataValues
    assert.strictEqual(file.clock, initialClockVal + 2)
  })

  it('Concurrent createNewDataRecord - successfully makes concurrent calls in separate transactions', async function () {
    const sequelizeTableInstance = models.File
    const numEntries = 5

    // Add global sequelize hook to add timeout before ClockRecord.create calls to force concurrent ops
    models.sequelize.addHook(
      'beforeCreate',
      'clockTimeout',
      async (instance, options) => {
        if (instance.constructor.name === 'ClockRecord') {
          await utils.timeout(timeoutMs)
        }
      }
    )

    // Replace required models instance with modified models instance
    proxyquire('../src/dbManager', { './models': models })

    // Make multiple concurrent calls - create a transaction for each call
    const arr = _.range(1, numEntries + 1) // [1, 2, ..., numEntries]
    let createdFiles = await Promise.all(
      arr.map(async function () {
        const transaction = await models.sequelize.transaction()
        const createdFile = await DBManager.createNewDataRecord(
          createFileQueryObj,
          cnodeUserUUID,
          sequelizeTableInstance,
          transaction
        )
        await transaction.commit()

        return createdFile
      })
    )

    // Validate returned file objects
    createdFiles = _.orderBy(createdFiles, ['createdAt'], ['asc'])
    createdFiles.forEach((createdFile, index) => {
      assert.strictEqual(createdFile.cnodeUserUUID, cnodeUserUUID)
      assert.strictEqual(createdFile.clock, initialClockVal + 1 + index)
    })

    // Validate CNodeUsers table state
    const cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal + numEntries)

    // Validate ClockRecords table state
    const clockRecords = await models.ClockRecord.findAll({
      where: { cnodeUserUUID },
      order: [['createdAt', 'ASC']]
    })
    assert.strictEqual(clockRecords.length, numEntries)
    clockRecords.forEach((clockRecord, index) => {
      clockRecord = clockRecord.dataValues
      assert.strictEqual(clockRecord.sourceTable, sequelizeTableInstance.name)
      assert.strictEqual(clockRecord.clock, initialClockVal + 1 + index)
    })

    // Validate Files table state
    const files = await models.File.findAll({
      where: { cnodeUserUUID },
      order: [['createdAt', 'ASC']]
    })
    assert.strictEqual(files.length, numEntries)
    files.forEach((file, index) => {
      file = file.dataValues
      assert.strictEqual(file.clock, initialClockVal + 1 + index)
    })
  })

  it('Concurrent createNewDataRecord - fails to make concurrent calls in a single transaction due to ClockRecords_pkey', async function () {
    const sequelizeTableInstance = models.File
    const numEntries = 5

    // Add global sequelize hook to add timeout before ClockRecord.create calls to force concurrent ops
    models.sequelize.addHook(
      'beforeCreate',
      'clockTimeout',
      async (instance, options) => {
        if (instance.constructor.name === 'ClockRecord') {
          await utils.timeout(timeoutMs)
        }
      }
    )

    // Replace required models instance with modified models instance
    proxyquire('../src/dbManager', { './models': models })

    // Attempt to make multiple concurrent calls, re-using the same transaction each time
    const transaction = await models.sequelize.transaction()
    try {
      const arr = _.range(1, numEntries + 1) // [1, 2, ..., numEntries]
      await Promise.all(
        arr.map(async function () {
          const createdFile = await DBManager.createNewDataRecord(
            createFileQueryObj,
            cnodeUserUUID,
            sequelizeTableInstance,
            transaction
          )
          return createdFile
        })
      )
      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      assert.strictEqual(e.name, 'SequelizeUniqueConstraintError')
      assert.strictEqual(
        e.original.message,
        'duplicate key value violates unique constraint "ClockRecords_pkey"'
      )
    }

    /**
     * Confirm none of the rows were written to DB
     */

    // Validate CNodeUsers table state
    const cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)

    // Validate ClockRecords table state
    const clockRecords = await models.ClockRecord.findAll({
      where: { cnodeUserUUID },
      order: [['createdAt', 'DESC']]
    })
    assert.strictEqual(clockRecords.length, 0)

    // Validate Files table state
    const files = await models.File.findAll({
      where: { cnodeUserUUID },
      order: [['createdAt', 'DESC']]
    })
    assert.strictEqual(files.length, 0)
  })

  /**
   * Simulates /image_upload and /track_content routes, which write multiple files sequentially in atomic tx
   */
  it('Sequential createNewDataRecord - successfully makes multiple sequential calls in single transaction', async function () {
    const sequelizeTableInstance = models.File
    const numEntries = 5

    // Make multiple squential calls, re-using the same transaction each time
    const transaction = await models.sequelize.transaction()
    const arr = _.range(1, numEntries + 1) // [1, 2, ..., numEntries]
    const createdFilesResp = []
    // eslint-disable-next-line no-unused-vars
    for await (const i of arr) {
      const createdFile = await DBManager.createNewDataRecord(
        createFileQueryObj,
        cnodeUserUUID,
        sequelizeTableInstance,
        transaction
      )
      createdFilesResp.push(createdFile)
    }
    await transaction.commit()

    // Validate returned file objects
    const createdFiles = _.orderBy(createdFilesResp, ['createdAt'], ['asc'])
    createdFiles.forEach((createdFile, index) => {
      assert.strictEqual(createdFile.cnodeUserUUID, cnodeUserUUID)
      assert.strictEqual(createdFile.clock, initialClockVal + 1 + index)
    })

    // Validate CNodeUsers table state
    const cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal + numEntries)

    // Validate ClockRecords table state
    const clockRecords = await models.ClockRecord.findAll({
      where: { cnodeUserUUID },
      order: [['createdAt', 'ASC']]
    })
    assert.strictEqual(clockRecords.length, numEntries)
    clockRecords.forEach((clockRecord, index) => {
      clockRecord = clockRecord.dataValues
      assert.strictEqual(clockRecord.sourceTable, sequelizeTableInstance.name)
      assert.strictEqual(clockRecord.clock, initialClockVal + 1 + index)
    })

    // Validate Files table state
    const files = await models.File.findAll({
      where: { cnodeUserUUID },
      order: [['createdAt', 'ASC']]
    })
    assert.strictEqual(files.length, numEntries)
    files.forEach((file, index) => {
      file = file.dataValues
      assert.strictEqual(file.clock, initialClockVal + 1 + index)
    })
  })

  it('Confirm file.pkey will block duplicate clock vals from being written', async function () {
    const transaction = await models.sequelize.transaction()
    try {
      createFileQueryObj = {
        cnodeUserUUID,
        multihash: 'testMultihash',
        sourceFile: 'testSourceFile',
        storagePath: 'testStoragePath',
        type: 'metadata', // TODO - replace with models enum
        clock: 0
      }
      await models.File.create(createFileQueryObj, { transaction })
      await models.File.create(createFileQueryObj, { transaction })
      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      assert.strictEqual(e.name, 'SequelizeForeignKeyConstraintError')
      assert.strictEqual(
        e.original.message,
        'insert or update on table "Files" violates foreign key constraint "Files_cnodeUserUUID_clock_fkey"'
      )
    }
  })
})

describe('Test ClockRecord model', async function () {
  let server

  /** Init server to run DB migrations */
  before(async function () {
    const appInfo = await getApp(getLibsMock(), BlacklistManager)
    server = appInfo.server
  })

  /** Reset DB state */
  beforeEach(async function () {
    await destroyUsers()
  })

  /** Close server */
  after(async function () {
    await server.close()
  })

  it('Confirm only valid sourceTable value can be written to ClockRecords table', async function () {
    const cnodeUserUUID = (await createStarterCNodeUser()).cnodeUserUUID

    const validSourceTable = 'AudiusUser'
    const invalidSourceTable = 'invalidSourceTable'

    // Confirm ClockRecords insert with validSourceTable value will succeed
    await models.ClockRecord.create({
      cnodeUserUUID,
      clock: 1,
      sourceTable: validSourceTable
    })

    // Confirm ClockRecord was created
    const clockRecords = await models.ClockRecord.findAll({
      where: { cnodeUserUUID }
    })
    assert.strictEqual(clockRecords.length, 1)
    const clockRecord = clockRecords[0]
    assert.strictEqual(clockRecord.cnodeUserUUID, cnodeUserUUID)
    assert.strictEqual(clockRecord.clock, 1)
    assert.strictEqual(clockRecord.sourceTable, validSourceTable)

    // Confirm ClockRecords insert with invalidSourceTable value will fail due to DB error
    // Use raw query to test DB-level constraints, instead of sequelize-level
    try {
      await models.sequelize.query(
        `INSERT INTO "ClockRecords"
        ("cnodeUserUUID","clock","sourceTable","createdAt","updatedAt")
        VALUES (
          :cnodeUserUUID,
          1,
          :invalidSourceTable,
          '2020-09-21 23:04:06.339 +00:00',
          '2020-09-21 23:04:06.339 +00:00'
        );`,
        {
          replacements: { cnodeUserUUID, invalidSourceTable },
          type: 'RAW',
          raw: true
        }
      )
    } catch (e) {
      assert.strictEqual(e.name, 'SequelizeDatabaseError')
      assert.strictEqual(
        e.original.message,
        `invalid input value for enum "enum_ClockRecords_sourceTable": "${invalidSourceTable}"`
      )
    }
  })

  it('Confirm only clockRecords with correct clock values can be inserted', async function () {
    const validSourceTable = 'AudiusUser'

    // Create initial cnodeUser
    const cnodeUserUUID = (await createStarterCNodeUser()).cnodeUserUUID

    // clock value cannot be negative
    try {
      await models.ClockRecord.create({
        cnodeUserUUID,
        clock: -1,
        sourceTable: validSourceTable
      })
    } catch (e) {
      assert.strictEqual(e, 'Clock value must be > 0')
    }

    // clock value cannot be 0
    try {
      await models.ClockRecord.create({
        cnodeUserUUID,
        clock: 0,
        sourceTable: validSourceTable
      })
    } catch (e) {
      assert.strictEqual(e, 'Clock value must be > 0')
    }

    // initial clockRecord must have clock value 1
    try {
      await models.ClockRecord.create({
        cnodeUserUUID,
        clock: 2,
        sourceTable: validSourceTable
      })
    } catch (e) {
      assert.strictEqual(
        e,
        'First clockRecord for cnodeUser must have clock value 1'
      )
    }

    // successfully create initial clockRecord with clock value 1
    await models.ClockRecord.create({
      cnodeUserUUID,
      clock: 1,
      sourceTable: validSourceTable
    })

    // clock values must be contiguous
    try {
      await models.ClockRecord.create({
        cnodeUserUUID,
        clock: 5,
        sourceTable: validSourceTable
      })
    } catch (e) {
      assert.ok(
        e.includes(
          'Can only insert contiguous clock values. Inconsistency in beforeCreate'
        )
      )
    }

    // successfully create clockrecord with contiguous clock value
    await models.ClockRecord.create({
      cnodeUserUUID,
      clock: 2,
      sourceTable: validSourceTable
    })

    // bulk create must contain only contiguous clock values
    try {
      await models.ClockRecord.bulkCreate([
        { cnodeUserUUID, clock: 3, sourceTable: validSourceTable },
        { cnodeUserUUID, clock: 5, sourceTable: validSourceTable },
        { cnodeUserUUID, clock: 5, sourceTable: validSourceTable }
      ])
    } catch (e) {
      assert.ok(
        e.includes(
          'Can only insert contiguous clock values. Inconsistency in beforeBulkCreate'
        )
      )
    }

    // successfully bulk create multiple clock records
    await models.ClockRecord.bulkCreate([
      { cnodeUserUUID, clock: 3, sourceTable: validSourceTable },
      { cnodeUserUUID, clock: 4, sourceTable: validSourceTable },
      { cnodeUserUUID, clock: 5, sourceTable: validSourceTable }
    ])

    // successfully bulk create multiple clock records in one transaction
    const transaction = await models.sequelize.transaction()
    await models.ClockRecord.bulkCreate(
      [
        { cnodeUserUUID, clock: 6, sourceTable: validSourceTable },
        { cnodeUserUUID, clock: 7, sourceTable: validSourceTable },
        { cnodeUserUUID, clock: 8, sourceTable: validSourceTable }
      ],
      { transaction }
    )
    await transaction.commit()
  })

  it('Confirm only valid cnodeUserUUID value can be written to ClockRecords table', async function () {
    const invalidUUID = getUuid()
    const validSourceTable = 'AudiusUser'

    // Attempt to insert a clockRecord into DB with a non-existent cnodeUserUUID
    // Use raw query to test DB-level constraints, instead of sequelize-level
    try {
      await models.sequelize.query(
        `INSERT INTO "ClockRecords"
        ("cnodeUserUUID","clock","sourceTable","createdAt","updatedAt")
        VALUES (
          :cnodeUserUUID,
          1,
          :validSourceTable,
          '2020-09-21 23:04:06.339 +00:00',
          '2020-09-21 23:04:06.339 +00:00'
        );`,
        {
          replacements: { cnodeUserUUID: invalidUUID, validSourceTable },
          type: 'RAW',
          raw: true
        }
      )
    } catch (e) {
      assert.strictEqual(e.name, 'SequelizeForeignKeyConstraintError')
      assert.strictEqual(
        e.original.message,
        'insert or update on table "ClockRecords" violates foreign key constraint "ClockRecords_cnodeUserUUID_fkey"'
      )
    }
  })
})

describe('Test deleteSessionTokensFromDB() when provided an Array of SessionTokens that all exist in the SessionToken table', async function () {
  const initialClockVal = 0
  let cnodeUserUUID, server, token1, token2

  /** Init server to run DB migrations */
  before(async function () {
    const appInfo = await getApp(getLibsMock(), BlacklistManager)
    server = appInfo.server
  })

  /** Reset DB state + Create cnodeUser + confirm initial clock state + define global vars */
  beforeEach(async function () {
    // Wipe all CNodeUsers + dependent data
    await destroyUsers()
    const resp = await createStarterCNodeUser()
    cnodeUserUUID = resp.cnodeUserUUID
    // Confirm initial clock val in DB
    const cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)
    // Seed DB
    token1 = await createSession()
    token2 = await createSession()
    await DBManager.deleteSessionTokensFromDB([token1, token2])
  })

  /** Wipe all CNodeUsers + dependent data */
  after(async function () {
    await destroyUsers()
    await server.close()
  })

  it('Successfully deletes the session tokens from the DB', async function () {
    const deletedToken1 = await models.SessionToken.findByPk(token1.id)
    const deletedToken2 = await models.SessionToken.findByPk(token2.id)
    assert(deletedToken1 === null)
    assert(deletedToken2 === null)
  })
})

describe('Test deleteAllCNodeUserDataFromDB()', async function () {
  const initialClockVal = 0
  const userId = 1

  // Create the req context for handleTrackContentRoute
  function getReqObj(fileUUID, fileDir, session) {
    return {
      fileName: `${fileUUID}.mp3`,
      fileDir,
      fileDestination: fileDir,
      cnodeUserUUID: session.cnodeUserUUID
    }
  }

  let session, app, cnodeUser, cnodeUserUUID, server, libsMock

  /** Init server to run DB migrations */
  before(async function () {
    const spId = 1
    libsMock = getLibsMock()
    const appInfo = await getApp(libsMock, BlacklistManager, null, spId)
    server = appInfo.server
    app = appInfo.app
  })

  /** Reset DB state + Create cnodeUser + confirm initial clock state + define global vars */
  beforeEach(async function () {
    // Wipe all CNodeUsers + dependent data
    await destroyUsers()
    session = await createStarterCNodeUser(userId)
    cnodeUserUUID = session.cnodeUserUUID

    // Confirm initial clock val in DB
    cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)
  })

  /** Wipe all CNodeUsers + dependent data */
  after(async function () {
    sinon.restore()
    await destroyUsers()
    await server.close()
  })

  it('Successfully deletes all state for CNodeUser with data in all tables', async function () {
    const uploadAudiusUserState = async function () {
      const audiusUserMetadata = { test: 'field1' }
      const audiusUserMetadataResp = await request(app)
        .post('/audius_users/metadata')
        .set('X-Session-ID', session.sessionToken)
        .set('User-Id', session.userId)
        .set('Enforce-Write-Quorum', false)
        .send({ metadata: audiusUserMetadata })
        .expect(200)
      // Make chain recognize current session wallet as the wallet for the session user ID
      const blockchainUserId = 1
      const getUserStub = sinon.stub().callsFake((blockchainUserIdArg) => {
        let wallet = 'no wallet'
        if (blockchainUserIdArg === blockchainUserId) {
          wallet = session.walletPublicKey
        }
        return {
          wallet
        }
      })
      libsMock.contracts.UserFactoryClient = { getUser: getUserStub }
      await request(app)
        .post('/audius_users')
        .set('X-Session-ID', session.sessionToken)
        .set('User-Id', session.userId)
        .send({
          blockchainUserId: 1,
          blockNumber: 10,
          metadataFileUUID: audiusUserMetadataResp.body.data.metadataFileUUID
        })
        .expect(200)
    }

    const uploadTrackState = async () => {
      // Mock `generateNonImageCid()` in `handleTrackContentRoute()` to succeed
      const mockCid = 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
      const { handleTrackContentRoute } = proxyquire(
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
              .returns(await DiskManager.computeFilePath(mockCid)),
            '@global': true
          }
        }
      )

      // Upload track content
      const { fileUUID, fileDir } = await saveFileToStorage(TestAudioFilePath)
      const trackContentResp = await handleTrackContentRoute(
        {},
        getReqObj(fileUUID, fileDir, session)
      )

      // Upload track metadata
      const {
        track_segments: trackSegments,
        source_file: sourceFile,
        transcodedTrackUUID
      } = trackContentResp
      const trackMetadata = {
        test: 'field1',
        track_segments: trackSegments,
        owner_id: userId
      }
      const expectedTrackMetadataMultihash =
        'QmTWhw49RfSMSJJmfm8cMHFBptgWoBGpNwjAc5jy2qeJfs'
      const trackMetadataResp = await request(app)
        .post('/tracks/metadata')
        .set('X-Session-ID', session.sessionToken)
        .set('User-Id', session.userId)
        .set('Enforce-Write-Quorum', false)
        .send({ metadata: trackMetadata, sourceFile })
        .expect(200)
      assert.deepStrictEqual(
        trackMetadataResp.body.data.metadataMultihash,
        expectedTrackMetadataMultihash
      )

      // Make chain recognize wallet as owner of track
      const blockchainTrackId = 1
      const getTrackStub = sinon.stub().callsFake((_, __, trackIds) => {
        let trackOwnerId = -1
        if (trackIds[0] === blockchainTrackId) {
          trackOwnerId = userId
        }
        return [
          {
            blocknumber: 99999,
            owner_id: trackOwnerId
          }
        ]
      })
      libsMock.Track = { getTracks: getTrackStub }

      // Complete track upload
      await request(app)
        .post('/tracks')
        .set('X-Session-ID', session.sessionToken)
        .set('User-Id', session.userId)
        .send({
          blockchainTrackId,
          blockNumber: 10,
          metadataFileUUID: trackMetadataResp.body.data.metadataFileUUID,
          transcodedTrackUUID
        })
        .expect(200)
    }

    const getAllDBRecordsForUser = async (cnodeUserUUID) => {
      const cnodeUserEntries = await models.CNodeUser.findAll({
        where: { cnodeUserUUID }
      })
      const audiusUserEntries = await models.AudiusUser.findAll({
        where: { cnodeUserUUID }
      })
      const trackEntries = await models.Track.findAll({
        where: { cnodeUserUUID }
      })
      const fileEntries = await models.File.findAll({
        where: { cnodeUserUUID }
      })
      const clockRecordEntries = await models.ClockRecord.findAll({
        where: { cnodeUserUUID }
      })

      return {
        cnodeUserEntries,
        audiusUserEntries,
        trackEntries,
        fileEntries,
        clockRecordEntries
      }
    }

    await uploadAudiusUserState()
    await uploadTrackState()

    /** assert all tables non empty */
    let {
      cnodeUserEntries,
      audiusUserEntries,
      trackEntries,
      fileEntries,
      clockRecordEntries
    } = await getAllDBRecordsForUser(cnodeUserUUID)
    assert.ok(cnodeUserEntries.length > 0)
    assert.ok(audiusUserEntries.length > 0)
    assert.ok(trackEntries.length > 0)
    assert.ok(fileEntries.length > 0)
    assert.ok(clockRecordEntries.length > 0)

    // delete all DB records
    await DBManager.deleteAllCNodeUserDataFromDB({
      lookupCNodeUserUUID: cnodeUserUUID
    })

    /** assert all tables empty */
    ;({
      cnodeUserEntries,
      audiusUserEntries,
      trackEntries,
      fileEntries,
      clockRecordEntries
    } = await getAllDBRecordsForUser(cnodeUserUUID))
    assert.strictEqual(cnodeUserEntries.length, 0)
    assert.strictEqual(audiusUserEntries.length, 0)
    assert.strictEqual(trackEntries.length, 0)
    assert.strictEqual(fileEntries.length, 0)
    assert.strictEqual(clockRecordEntries.length, 0)
  })

  it.skip('external & internal transaction', async function () {})
})

describe('Test fetchFilesHashFromDB()', async function () {
  const initialClockVal = 0
  const ClockZero = 0
  const filesTableInst = models.File

  let cnodeUser, cnodeUserUUID, server

  /** Init server to run DB migrations */
  before(async function() {
    const appInfo = await getApp(getLibsMock(), BlacklistManager)
    server = appInfo.server
  })

  /** Reset DB state + Create cnodeUser + confirm initial clock state + define global vars */
  beforeEach(async function () {
    // Wipe all CNodeUsers + dependent data
    await destroyUsers()
    const resp = await createStarterCNodeUser()
    cnodeUserUUID = resp.cnodeUserUUID

    // Confirm initial clock val in DB
    cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)
  })

  /** Wipe all CNodeUsers + dependent data */
  after(async function () {
    await destroyUsers()

    await server.close()
  })

  const generateRandomHash = () => {
    return Buffer.from(Math.random().toString()).toString('base64')
  }

  const generateRandomFileQueryObjects = (numFiles) => {
    return new Array(numFiles).fill(0).map(() => ({
      multihash: generateRandomHash(),
      sourceFile: 'testSourcefile',
      storagePath: 'testStoragePath',
      type: 'metadata'
    }))
  }

  const createFilesForUser = async (cnodeUserUUID, fileQueryObjects) => {
    const multihashes = []

    const transaction = await models.sequelize.transaction()
    for (const fileQueryObj of fileQueryObjects) {
      const fileRecord = await DBManager.createNewDataRecord(
        fileQueryObj,
        cnodeUserUUID,
        filesTableInst,
        transaction
      )
      multihashes.push(fileRecord.multihash)
    }
    await transaction.commit()

    return multihashes
  }

  it('fetchFilesHashFromDB successfully returns hash', async function () {
    const numFiles = 10
    const randomFileQueryObjects = generateRandomFileQueryObjects(numFiles)
    const multihashes = await createFilesForUser(
      cnodeUserUUID,
      randomFileQueryObjects
    )

    // compute expectedFilesHash
    let expectedFilesHash = computeFilesHash(multihashes)

    // fetch filesHash by cnodeUserUUID & assert equal
    let actualFilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupCNodeUserUUID: cnodeUserUUID }
    })
    assert.strictEqual(actualFilesHash, expectedFilesHash)

    // fetch filesHash by wallet & assert equal
    actualFilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupWallet: cnodeUser.walletPublicKey }
    })
    assert.strictEqual(actualFilesHash, expectedFilesHash)

    // Create CNU2
    const walletCNU2 = getUuid()
    const createCNU2Resp = await createStarterCNodeUserWithKey(walletCNU2)
    const cnodeUserUUID2 = createCNU2Resp.cnodeUserUUID
    const cnodeUser2 = await getCNodeUser(cnodeUserUUID2)
    assert.strictEqual(cnodeUser2.clock, initialClockVal)

    // Confirm handles user with no data
    actualFilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupCNodeUserUUID: cnodeUserUUID2 }
    })
    expectedFilesHash = null
    assert.strictEqual(actualFilesHash, expectedFilesHash)

    // Confirm handles non-existent user
    const cnodeUserUUID3 = getUuid()
    actualFilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupCNodeUserUUID: cnodeUserUUID3 }
    })
    expectedFilesHash = null
    assert.strictEqual(actualFilesHash, expectedFilesHash)
  })

  it('fetchFilesHashFromDB successully returns hash by clock range when supplied', async function () {
    const numFiles = 10
    const randomFileQueryObjects = generateRandomFileQueryObjects(numFiles)
    const multihashes = await createFilesForUser(
      cnodeUserUUID,
      randomFileQueryObjects
    )

    const clockMin = 3 // inclusive
    const clockMax = 8 // exclusive

    /** clockMin */
    let expectedFilesHash = computeFilesHash(multihashes.slice(clockMin - 1))
    let actualFilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupCNodeUserUUID: cnodeUserUUID },
      clockMin
    })
    assert.strictEqual(actualFilesHash, expectedFilesHash)

    /** clockMax */
    expectedFilesHash = computeFilesHash(multihashes.slice(0, clockMax - 1))
    actualFilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupCNodeUserUUID: cnodeUserUUID },
      clockMax
    })
    assert.strictEqual(actualFilesHash, expectedFilesHash)

    /** clockMin and clockMax */
    expectedFilesHash = computeFilesHash(multihashes
      .slice(clockMin - 1, clockMax - 1))
    actualFilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupCNodeUserUUID: cnodeUserUUID },
      clockMin,
      clockMax
    })
    assert.strictEqual(actualFilesHash, expectedFilesHash)
    actualFilesHash = await DBManager.fetchFilesHashFromDB({
      lookupKey: { lookupWallet: cnodeUser.walletPublicKey },
      clockMin,
      clockMax
    })
    assert.strictEqual(actualFilesHash, expectedFilesHash)
  })

  it('fetchFilesHashesFromDB', async function () {
    const numFiles = 10

    // Upload files for CNU1
    const randomFileQueryObjectsCNU1 = generateRandomFileQueryObjects(numFiles)
    const multihashesCNU1 = await createFilesForUser(
      cnodeUserUUID,
      randomFileQueryObjectsCNU1
    )

    // compute expectedFilesHashCNU1
    const expectedFilesHashCNU1 = computeFilesHash(multihashesCNU1)

    // Create CNU2
    const walletCNU2 = getUuid()
    const createCNU2Resp = await createStarterCNodeUserWithKey(walletCNU2)
    const cnodeUserUUID2 = createCNU2Resp.cnodeUserUUID
    const cnodeUser2 = await getCNodeUser(cnodeUserUUID2)
    assert.strictEqual(cnodeUser2.clock, initialClockVal)

    // Upload files for cnodeUser2
    const randomFileQueryObjectsCNU2 = generateRandomFileQueryObjects(numFiles)
    const multihashesCNU2 = await createFilesForUser(
      cnodeUserUUID2,
      randomFileQueryObjectsCNU2
    )

    // compute expectedFilesHashCNU2
    const expectedFilesHashCNU2 = computeFilesHash(multihashesCNU2)

    // fetch filesHashes & assert equal
    let cnodeUserUUIDs = [cnodeUserUUID, cnodeUserUUID2]
    let actualResp = await DBManager.fetchFilesHashesFromDB({ cnodeUserUUIDs })
    let expectedResp = {
      [cnodeUserUUID]: expectedFilesHashCNU1,
      [cnodeUserUUID2]: expectedFilesHashCNU2
    }
    assert.deepEqual(actualResp, expectedResp)

    // Create CNU3 with no files
    const walletCNU3 = getUuid()
    const createCNU3Resp = await createStarterCNodeUserWithKey(walletCNU3)
    const cnodeUserUUID3 = createCNU3Resp.cnodeUserUUID
    const cnodeUser3 = await getCNodeUser(cnodeUserUUID3)
    assert.strictEqual(cnodeUser3.clock, ClockZero)

    // Correctly handles user with no files
    actualResp = await DBManager.fetchFilesHashesFromDB({ cnodeUserUUIDs: [cnodeUserUUID3] })
    expectedResp = { [cnodeUserUUID3]: null }
    assert.deepEqual(actualResp, expectedResp)

    // Correctly handles non-existent user
    const cnodeUserUUID4 = getUuid()
    actualResp = await DBManager.fetchFilesHashesFromDB({ cnodeUserUUIDs: [cnodeUserUUID4] })
    expectedResp = { [cnodeUserUUID4]: null }
    assert.deepEqual(actualResp, expectedResp)

    // Correctly handles request with valid user, invalid user, and user with no files
    actualResp = await DBManager.fetchFilesHashesFromDB({
      cnodeUserUUIDs: [cnodeUserUUID, cnodeUserUUID2, cnodeUserUUID3, cnodeUserUUID4]
    })
    expectedResp = {
      [cnodeUserUUID]: expectedFilesHashCNU1,
      [cnodeUserUUID2]: expectedFilesHashCNU2,
      [cnodeUserUUID3]: null,
      [cnodeUserUUID4]: null
    }
    assert.deepEqual(actualResp, expectedResp)
  })
})

describe('Test fixInconsistentUser()', async function () {
  const userId = 1

  let server, app, libsMock

  /** Init server to run DB migrations */
  before(async function () {
    libsMock = getLibsMock()
    const appInfo = await getApp(libsMock)
    server = appInfo.server
    app = appInfo.app
  })

  beforeEach(async function () {
    await destroyUsers()
  })

  /** Wipe all CNodeUsers + dependent data */
  after(async function () {
    await destroyUsers()

    await server.close()
  })

  /** Add state to AudiusUsers table for given userId */
  const uploadAudiusUserState = async function ({
    sessionToken,
    walletPublicKey,
    metadataObj,
    audiusUserBlockNumber
  }) {
    const audiusUserMetadataResp = await request(app)
      .post('/audius_users/metadata')
      .set('X-Session-ID', sessionToken)
      .set('User-Id', userId)
      .set('Enforce-Write-Quorum', false)
      .send({ metadata: metadataObj })
      .expect(200)

    // Make chain recognize current session wallet as the wallet for the session user ID
    const blockchainUserId = 1
    const getUserStub = sinon.stub().callsFake((blockchainUserIdArg) => {
      let wallet = 'no wallet'
      if (blockchainUserIdArg === blockchainUserId) {
        wallet = walletPublicKey
      }
      return {
        wallet
      }
    })
    libsMock.contracts.UserFactoryClient = { getUser: getUserStub }

    await request(app)
      .post('/audius_users')
      .set('X-Session-ID', sessionToken)
      .set('User-Id', userId)
      .send({
        blockchainUserId: userId,
        blockNumber: audiusUserBlockNumber,
        metadataFileUUID: audiusUserMetadataResp.body.data.metadataFileUUID
      })
      .expect(200)
  }

  it('Confirm no change to healthy users DB state', async function () {
    const { cnodeUserUUID, walletPublicKey, sessionToken } = await createStarterCNodeUser(userId)

    // Upload some state for user
    const audiusUserBlockNumber = 10
    const audiusUserMetadata = { test: 'field1' }
    const metadataCID = 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W'
    await uploadAudiusUserState({
      sessionToken,
      walletPublicKey,
      metadataObj: audiusUserMetadata,
      audiusUserBlockNumber
    })
    const expectedCNodeUserClock = 2

    // Confirm expected initial state
    const {
      cnodeUser: initialCNodeUser,
      audiusUsers: initialAudiusUsers,
      tracks: initialTracks,
      files: initialFiles,
      clockRecords: initialClockRecords
    } = await fetchDBStateForWallet(walletPublicKey, models)
    assertTableEquality(
      [initialCNodeUser],
      [{ cnodeUserUUID, walletPublicKey, latestBlockNumber: audiusUserBlockNumber, clock: expectedCNodeUserClock }],
      ['createdAt', 'updatedAt', 'lastLogin']
    )
    assertTableEquality(
      initialAudiusUsers,
      [{ cnodeUserUUID, clock: expectedCNodeUserClock, blockchainId: `${userId}`, metadataJSON: audiusUserMetadata, coverArtFileUUID: null, profilePicFileUUID: null }],
      ['createdAt', 'updatedAt', 'metadataFileUUID']
    )
    assertTableEquality(initialTracks, [])
    assertTableEquality(
      initialFiles,
      [{
        cnodeUserUUID,
        trackBlockchainId: null,
        multihash: metadataCID,
        sourceFile: null,
        fileName: null,
        dirMultihash: null,
        storagePath: await DiskManager.computeFilePath(metadataCID, false),
        type: "metadata",
        clock: 1,
        skipped: false
      }],
      ['fileUUID', 'createdAt', 'updatedAt']
    )
    assertTableEquality(
      initialClockRecords,
      [
        { cnodeUserUUID, clock: 1, sourceTable: "File" },
        { cnodeUserUUID, clock: 2, sourceTable: "AudiusUser" }
      ],
      ['createdAt', 'updatedAt']
    )

    // Call fixInconsistentUser()
    const numRowsUpdated = await DBManager.fixInconsistentUser(cnodeUserUUID)
    assert.strictEqual(numRowsUpdated, 1)

    // Confirm final initial state is unchanged
    const {
      cnodeUser: finalCNodeUser,
      audiusUsers: finalAudiusUsers,
      tracks: finalTracks,
      files: finalFiles,
      clockRecords: finalClockRecords
    } = await fetchDBStateForWallet(walletPublicKey, models)
    assertTableEquality(
      [finalCNodeUser],
      [{ cnodeUserUUID, walletPublicKey, latestBlockNumber: audiusUserBlockNumber, clock: expectedCNodeUserClock }],
      ['createdAt', 'updatedAt', 'lastLogin']
    )
    assertTableEquality(
      finalAudiusUsers,
      [{ cnodeUserUUID, clock: expectedCNodeUserClock, blockchainId: `${userId}`, metadataJSON: audiusUserMetadata, coverArtFileUUID: null, profilePicFileUUID: null }],
      ['createdAt', 'updatedAt', 'metadataFileUUID']
    )
    assertTableEquality(finalTracks, [])
    assertTableEquality(
      finalFiles,
      [{
        cnodeUserUUID,
        trackBlockchainId: null,
        multihash: metadataCID,
        sourceFile: null,
        fileName: null,
        dirMultihash: null,
        storagePath: await DiskManager.computeFilePath(metadataCID, false),
        type: "metadata",
        clock: 1,
        skipped: false
      }],
      ['fileUUID', 'createdAt', 'updatedAt']
    )
    assertTableEquality(
      finalClockRecords,
      [
        { cnodeUserUUID, clock: 1, sourceTable: "File" },
        { cnodeUserUUID, clock: 2, sourceTable: "AudiusUser" }
      ],
      ['createdAt', 'updatedAt']
    )
  })

  it('Confirm inconsistent users state is correctly fixed', async function () {
    const { cnodeUserUUID, walletPublicKey, sessionToken } = await createStarterCNodeUser(userId)

    // Upload some state for user
    const audiusUserBlockNumber = 10
    const audiusUserMetadata = { test: 'field1' }
    const metadataCID = 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W'
    await uploadAudiusUserState({
      sessionToken,
      walletPublicKey,
      metadataObj: audiusUserMetadata,
      audiusUserBlockNumber
    })
    const expectedCNodeUserClock = 2
    const actualCNodeUserClock = 1

    // Change cnodeUser.clock to be inconsistent with ClockRecords
    await models.CNodeUser.update(
      { clock: actualCNodeUserClock },
      { where: { cnodeUserUUID }}
    )

    // Confirm expected initial state
    const {
      cnodeUser: initialCNodeUser,
      audiusUsers: initialAudiusUsers,
      tracks: initialTracks,
      files: initialFiles,
      clockRecords: initialClockRecords
    } = await fetchDBStateForWallet(walletPublicKey, models)
    assertTableEquality(
      [initialCNodeUser],
      [{ cnodeUserUUID, walletPublicKey, latestBlockNumber: audiusUserBlockNumber, clock: actualCNodeUserClock }],
      ['createdAt', 'updatedAt', 'lastLogin']
    )
    assertTableEquality(
      initialAudiusUsers,
      [{ cnodeUserUUID, clock: expectedCNodeUserClock, blockchainId: `${userId}`, metadataJSON: audiusUserMetadata, coverArtFileUUID: null, profilePicFileUUID: null }],
      ['createdAt', 'updatedAt', 'metadataFileUUID']
    )
    assertTableEquality(initialTracks, [])
    assertTableEquality(
      initialFiles,
      [{
        cnodeUserUUID,
        trackBlockchainId: null,
        multihash: metadataCID,
        sourceFile: null,
        fileName: null,
        dirMultihash: null,
        storagePath: await DiskManager.computeFilePath(metadataCID, false),
        type: "metadata",
        clock: 1,
        skipped: false
      }],
      ['fileUUID', 'createdAt', 'updatedAt']
    )
    assertTableEquality(
      initialClockRecords,
      [
        { cnodeUserUUID, clock: 1, sourceTable: "File" },
        { cnodeUserUUID, clock: 2, sourceTable: "AudiusUser" }
      ],
      ['createdAt', 'updatedAt']
    )

    // Call fixInconsistentUser()
    const numRowsUpdated = await DBManager.fixInconsistentUser(cnodeUserUUID)
    assert.strictEqual(numRowsUpdated, 1)

    // Confirm final initial state where CNodeUser clock is consistent with ClockRecords
    const {
      cnodeUser: finalCNodeUser,
      audiusUsers: finalAudiusUsers,
      tracks: finalTracks,
      files: finalFiles,
      clockRecords: finalClockRecords
    } = await fetchDBStateForWallet(walletPublicKey, models)
    assertTableEquality(
      [finalCNodeUser],
      [{ cnodeUserUUID, walletPublicKey, latestBlockNumber: audiusUserBlockNumber, clock: expectedCNodeUserClock }],
      ['createdAt', 'updatedAt', 'lastLogin']
    )
    assertTableEquality(
      finalAudiusUsers,
      [{ cnodeUserUUID, clock: expectedCNodeUserClock, blockchainId: `${userId}`, metadataJSON: audiusUserMetadata, coverArtFileUUID: null, profilePicFileUUID: null }],
      ['createdAt', 'updatedAt', 'metadataFileUUID']
    )
    assertTableEquality(finalTracks, [])
    assertTableEquality(
      finalFiles,
      [{
        cnodeUserUUID,
        trackBlockchainId: null,
        multihash: metadataCID,
        sourceFile: null,
        fileName: null,
        dirMultihash: null,
        storagePath: await DiskManager.computeFilePath(metadataCID, false),
        type: "metadata",
        clock: 1,
        skipped: false
      }],
      ['fileUUID', 'createdAt', 'updatedAt']
    )
    assertTableEquality(
      finalClockRecords,
      [
        { cnodeUserUUID, clock: 1, sourceTable: "File" },
        { cnodeUserUUID, clock: 2, sourceTable: "AudiusUser" }
      ],
      ['createdAt', 'updatedAt']
    )
  })
})