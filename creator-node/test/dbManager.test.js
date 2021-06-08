const assert = require('assert')
const proxyquire = require('proxyquire')
const _ = require('lodash')
const getUuid = require('uuid/v4')

const models = require('../src/models')
const DBManager = require('../src/dbManager')
const BlacklistManager = require('../src/blacklistManager')
const utils = require('../src/utils')
const { createStarterCNodeUser, getCNodeUser, destroyUsers } = require('./lib/dataSeeds')
const { getApp } = require('./lib/app')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

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
    const appInfo = await getApp(getIPFSMock(), getLibsMock(), BlacklistManager)
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

  afterEach(async function () {
    models.sequelize.removeHook('beforeCreate', 'clockTimeout')
  })

  /** Wipe all CNodeUsers + dependent data */
  after(async function () {
    await destroyUsers()

    await server.close()
  })

  it('Sequential createNewDataRecord - create 2 records', async () => {
    const sequelizeTableInstance = models.File

    /**
     * CREATE RECORD 1
     */

    // Create new Data record
    let transaction = await models.sequelize.transaction()
    let createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sequelizeTableInstance, transaction)
    await transaction.commit()

    // Validate returned file object
    assert.strictEqual(createdFile.cnodeUserUUID, cnodeUserUUID)
    assert.strictEqual(createdFile.clock, initialClockVal + 1)

    // Validate CNodeUsers table state
    let cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal + 1)

    // Validate ClockRecords table state
    let clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID } })
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
    createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sequelizeTableInstance, transaction)
    await transaction.commit()

    // Validate returned file object
    assert.strictEqual(createdFile.cnodeUserUUID, cnodeUserUUID)
    assert.strictEqual(createdFile.clock, initialClockVal + 2)

    // Validate CNodeUsers table state
    cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal + 2)

    // Validate ClockRecords table state
    clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'DESC']] })
    assert.strictEqual(clockRecords.length, 2)
    clockRecord = clockRecords[0].dataValues
    assert.strictEqual(clockRecord.sourceTable, sequelizeTableInstance.name)
    assert.strictEqual(clockRecord.clock, initialClockVal + 2)

    // Validate Files table state
    files = await models.File.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'DESC']] })
    assert.strictEqual(files.length, 2)
    file = files[0].dataValues
    assert.strictEqual(file.clock, initialClockVal + 2)
  })

  it('Concurrent createNewDataRecord - successfully makes concurrent calls in separate transactions', async () => {
    const sequelizeTableInstance = models.File
    const numEntries = 5

    // Add global sequelize hook to add timeout before ClockRecord.create calls to force concurrent ops
    models.sequelize.addHook('beforeCreate', 'clockTimeout', async (instance, options) => {
      if (instance.constructor.name === 'ClockRecord') {
        await utils.timeout(timeoutMs)
      }
    })

    // Replace required models instance with modified models instance
    proxyquire('../src/dbManager', { './models': models })

    // Make multiple concurrent calls - create a transaction for each call
    const arr = _.range(1, numEntries + 1) // [1, 2, ..., numEntries]
    let createdFiles = await Promise.all(arr.map(async () => {
      const transaction = await models.sequelize.transaction()
      const createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sequelizeTableInstance, transaction)
      await transaction.commit()

      return createdFile
    }))

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
    const clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'ASC']] })
    assert.strictEqual(clockRecords.length, numEntries)
    clockRecords.forEach((clockRecord, index) => {
      clockRecord = clockRecord.dataValues
      assert.strictEqual(clockRecord.sourceTable, sequelizeTableInstance.name)
      assert.strictEqual(clockRecord.clock, initialClockVal + 1 + index)
    })

    // Validate Files table state
    const files = await models.File.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'ASC']] })
    assert.strictEqual(files.length, numEntries)
    files.forEach((file, index) => {
      file = file.dataValues
      assert.strictEqual(file.clock, initialClockVal + 1 + index)
    })
  })

  it('Concurrent createNewDataRecord - fails to make concurrent calls in a single transaction due to ClockRecords_pkey', async () => {
    const sequelizeTableInstance = models.File
    const numEntries = 5

    // Add global sequelize hook to add timeout before ClockRecord.create calls to force concurrent ops
    models.sequelize.addHook('beforeCreate', 'clockTimeout', async (instance, options) => {
      if (instance.constructor.name === 'ClockRecord') {
        await utils.timeout(timeoutMs)
      }
    })

    // Replace required models instance with modified models instance
    proxyquire('../src/dbManager', { './models': models })

    // Attempt to make multiple concurrent calls, re-using the same transaction each time
    const transaction = await models.sequelize.transaction()
    try {
      const arr = _.range(1, numEntries + 1) // [1, 2, ..., numEntries]
      await Promise.all(arr.map(async () => {
        const createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sequelizeTableInstance, transaction)
        return createdFile
      }))
      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      assert.strictEqual(e.name, 'SequelizeUniqueConstraintError')
      assert.strictEqual(e.original.message, 'duplicate key value violates unique constraint "ClockRecords_pkey"')
    }

    /**
     * Confirm none of the rows were written to DB
     */

    // Validate CNodeUsers table state
    const cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)

    // Validate ClockRecords table state
    const clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'DESC']] })
    assert.strictEqual(clockRecords.length, 0)

    // Validate Files table state
    const files = await models.File.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'DESC']] })
    assert.strictEqual(files.length, 0)
  })

  /**
   * Simulates /image_upload and /track_content routes, which write multiple files sequentially in atomic tx
   */
  it('Sequential createNewDataRecord - successfully makes multiple sequential calls in single transaction', async () => {
    const sequelizeTableInstance = models.File
    const numEntries = 5

    // Make multiple squential calls, re-using the same transaction each time
    const transaction = await models.sequelize.transaction()
    const arr = _.range(1, numEntries + 1) // [1, 2, ..., numEntries]
    const createdFilesResp = []
    // eslint-disable-next-line no-unused-vars
    for await (const i of arr) {
      const createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sequelizeTableInstance, transaction)
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
    const clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'ASC']] })
    assert.strictEqual(clockRecords.length, numEntries)
    clockRecords.forEach((clockRecord, index) => {
      clockRecord = clockRecord.dataValues
      assert.strictEqual(clockRecord.sourceTable, sequelizeTableInstance.name)
      assert.strictEqual(clockRecord.clock, initialClockVal + 1 + index)
    })

    // Validate Files table state
    const files = await models.File.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'ASC']] })
    assert.strictEqual(files.length, numEntries)
    files.forEach((file, index) => {
      file = file.dataValues
      assert.strictEqual(file.clock, initialClockVal + 1 + index)
    })
  })

  it('Confirm file.pkey will block duplicate clock vals from being written', async () => {
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
      assert.strictEqual(e.original.message, 'insert or update on table "Files" violates foreign key constraint "Files_cnodeUserUUID_clock_fkey"')
    }
  })
})

describe('Test ClockRecord model', async function () {
  let server

  /** Init server to run DB migrations */
  before(async function () {
    const appInfo = await getApp(getIPFSMock(), getLibsMock(), BlacklistManager)
    server = appInfo.server
  })

  /** Reset DB state */
  beforeEach(async function () {
    await destroyUsers()
  })

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
    const clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID } })
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
      assert.strictEqual(e.original.message, `invalid input value for enum "enum_ClockRecords_sourceTable": "${invalidSourceTable}"`)
    }
  })

  it('Confirm only clockRecords with correct clock values can be inserted', async function () {
    const validSourceTable = 'AudiusUser'

    // Create initial cnodeUser
    let cnodeUserUUID = (await createStarterCNodeUser()).cnodeUserUUID

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
      assert.strictEqual(e, 'First clockRecord for cnodeUser must have clock value 1')
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
      assert.ok(e.includes('Can only insert contiguous clock values. Inconsistency in beforeCreate'))
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
      assert.ok(e.includes('Can only insert contiguous clock values. Inconsistency in beforeBulkCreate'))
    }

    // successfully bulk create multiple clock records
    await models.ClockRecord.bulkCreate([
      { cnodeUserUUID, clock: 3, sourceTable: validSourceTable },
      { cnodeUserUUID, clock: 4, sourceTable: validSourceTable },
      { cnodeUserUUID, clock: 5, sourceTable: validSourceTable }
    ])

    // successfully bulk create multiple clock records in one transaction
    const transaction = await models.sequelize.transaction()
    await models.ClockRecord.bulkCreate([
      { cnodeUserUUID, clock: 6, sourceTable: validSourceTable },
      { cnodeUserUUID, clock: 7, sourceTable: validSourceTable },
      { cnodeUserUUID, clock: 8, sourceTable: validSourceTable }
    ], { transaction })
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
      assert.strictEqual(e.original.message, 'insert or update on table "ClockRecords" violates foreign key constraint "ClockRecords_cnodeUserUUID_fkey"')
    }
  })
})

describe.skip('TODO - Test deleteAllCNodeUserData', async function () { })
