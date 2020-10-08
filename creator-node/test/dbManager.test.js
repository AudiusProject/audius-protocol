const assert = require('assert')
const proxyquire = require('proxyquire')
const _ = require('lodash')

const models = require('../src/models')
const DBManager = require('../src/dbManager')
const BlacklistManager = require('../src/blacklistManager')
const utils = require('../src/utils')
const { createStarterCNodeUser, getCNodeUser, destroyUsers } = require('./lib/dataSeeds')
const { getApp } = require('./lib/app')
const { getIPFSMock } = require('./lib/ipfsMock')
const { getLibsMock } = require('./lib/libsMock')

describe('Test createNewDataRecord()', () => {
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
    await models.CNodeUser.destroy({
      where: {},
      truncate: true,
      cascade: true // cascades delete to all rows with foreign key on cnodeUser
    })

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

describe('Test ClockRecord model', () => {
  it('Confirm only valid sourceTable value can be written to ClockRecords table', async () => {
    await models.CNodeUser.destroy({
      where: {},
      truncate: true,
      cascade: true // cascades delete to all rows with foreign key on cnodeUser
    })
    const cnodeUserUUID = (await createStarterCNodeUser()).cnodeUserUUID

    const validSourceTable = 'AudiusUser'
    const invalidSourceTable = 'invalidSourceTable'

    // Confirm ClockRecords insert with validSourceTable value will succeed
    await models.ClockRecord.create({
      cnodeUserUUID,
      clock: 0,
      sourceTable: validSourceTable
    })

    // Confirm ClockRecord was created
    const clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID } })
    assert.strictEqual(clockRecords.length, 1)
    const clockRecord = clockRecords[0]
    assert.strictEqual(clockRecord.cnodeUserUUID, cnodeUserUUID)
    assert.strictEqual(clockRecord.clock, 0)
    assert.strictEqual(clockRecord.sourceTable, validSourceTable)

    // Confirm ClockRecords insert with invalidSourceTable value will fail due to DB error
    try {
      await models.sequelize.query(`
        INSERT INTO "ClockRecords"
        ("cnodeUserUUID","clock","sourceTable","createdAt","updatedAt")
        VALUES (
          'f13d776e-c4a6-4007-93bc-7e625c862873',
          0,
          :invalidSourceTable,
          '2020-09-21 23:04:06.339 +00:00',
          '2020-09-21 23:04:06.339 +00:00'
        );`,
      {
        replacements: { invalidSourceTable },
        type: 'RAW',
        raw: true
      }
      )
    } catch (e) {
      assert.strictEqual(e.name, 'SequelizeDatabaseError')
      assert.strictEqual(e.original.message, `invalid input value for enum "enum_ClockRecords_sourceTable": "${invalidSourceTable}"`)
    }
  })
})
