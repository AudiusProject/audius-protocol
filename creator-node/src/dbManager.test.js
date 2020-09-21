const assert = require('assert')
const proxyquire = require('proxyquire')
const _ = require('lodash')

const models = require('./models')
const { createStarterCNodeUser } = require('../test/lib/dataSeeds')
const DBManager = require('./dbManager')
const utils = require('./utils')

describe.only('Test createNewDataRecord()', () => {
  const req = {
    logger: {
      error: (msg) => console.log(msg)
    }
  }

  const getCNodeUser = async (cnodeUserUUID) => {
    return (await models.CNodeUser.findOne({ where: { cnodeUserUUID } })).dataValues
  }

  const initialClockVal = 0
  const timeoutMs = 1000

  let cnodeUserUUID

  /** Create cnodeUser + confirm initial clock state */
  beforeEach(async () => {
    await models.CNodeUser.destroy({
      where: {},
      truncate: true,
      cascade: true // cascades delete to all rows with foreign key on cnodeUser
    })
    const resp = await createStarterCNodeUser()
    cnodeUserUUID = resp.cnodeUserUUID
    req.session = { cnodeUserUUID }

    // Confirm initial clock val in DB
    const cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)
  })

  /** Wipe all CNodeUsers + dependent data */
  after(async () => {
    await models.CNodeUser.destroy({
      where: {},
      truncate: true,
      cascade: true // cascades delete to all rows with foreign key on cnodeUser
    })
  })

  it('Sequential createNewDataRecord - create 2 records', async () => {
    const sourceTable = 'File'

    /**
     * CREATE RECORD 1
     */

    // Create new Data record
    let transaction = await models.sequelize.transaction()
    let createFileQueryObj = {
      multihash: 'testMultihash',
      sourceFile: 'testSourceFile',
      storagePath: 'testStoragePath',
      type: 'metadata' // TODO - replace with models enum
    }
    let createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sourceTable, transaction)
    await transaction.commit()

    // Validate returned file object
    assert.strictEqual(createdFile.cnodeUserUUID, cnodeUserUUID)
    assert.strictEqual(createdFile.clock, initialClockVal + 1)

    // Validate CNodeUsers table state
    let cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal + 1)

    // Validate ClockRecords table state
    let clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID }})
    assert.strictEqual(clockRecords.length, 1)
    let clockRecord = clockRecords[0].dataValues
    assert.strictEqual(clockRecord.clock, initialClockVal + 1)
    assert.strictEqual(clockRecord.sourceTable, sourceTable)

    // Validate Files table state
    let files = await models.File.findAll({ where: { cnodeUserUUID }})
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
    createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sourceTable, transaction)
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
    assert.strictEqual(clockRecord.sourceTable, sourceTable)
    assert.strictEqual(clockRecord.clock, initialClockVal + 2)

    // Validate Files table state
    files = await models.File.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'DESC']] })
    assert.strictEqual(files.length, 2)
    file = files[0].dataValues
    assert.strictEqual(file.clock, initialClockVal + 2)
  })

  it('Concurrent createNewDataRecord - successfully makes concurrent calls in separate transactions', async () => {
    const sourceTable = 'File'
    const numEntries = 5

    // Add global sequelize hook to add timeout before ClockRecord.create calls to force concurrent ops
    const modelsCopy = models
    modelsCopy.sequelize.addHook('beforeCreate', async (instance, options) => {
      if (instance.constructor.name === 'ClockRecord') {
        await utils.timeout(timeoutMs)
      }
    })

    // Replace required models instance with modified models instance
    proxyquire('./dbManager', { './models': modelsCopy })

    // Make multiple concurrent calls - create a transaction for each call
    const arr = _.range(1, numEntries + 1) // [1, 2, ..., numEntries]
    let createdFiles = await Promise.all(arr.map(async (i) => {
      const transaction = await models.sequelize.transaction()
      const createFileQueryObj = {
        multihash: 'testMultihash',
        sourceFile: 'testSourceFile',
        storagePath: 'testStoragePath',
        type: 'metadata' // TODO - replace with models enum
      }
      const createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sourceTable, transaction)
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
      assert.strictEqual(clockRecord.sourceTable, sourceTable)
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
    const sourceTable = 'File'
    const numEntries = 5

    // Add global sequelize hook to add timeout before ClockRecord.create calls to force concurrent ops
    const modelsCopy = models
    modelsCopy.sequelize.addHook('beforeCreate', async (instance, options) => {
      if (instance.constructor.name === 'ClockRecord') {
        await utils.timeout(timeoutMs)
      }
    })

    // Replace required models instance with modified models instance
    proxyquire('./dbManager', { './models': modelsCopy })

    // Attempt to make multiple concurrent calls, re-using the same transaction each time
    const transaction = await models.sequelize.transaction()
    try {
      const arr = _.range(1, numEntries + 1) // [1, 2, ..., numEntries]
      await Promise.all(arr.map(async (i) => {
        const createFileQueryObj = {
          multihash: 'testMultihash',
          sourceFile: 'testSourceFile',
          storagePath: 'testStoragePath',
          type: 'metadata' // TODO - replace with models enum
        }
        const createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sourceTable, transaction)
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
    cnodeUser = await getCNodeUser(cnodeUserUUID)
    assert.strictEqual(cnodeUser.clock, initialClockVal)

    // Validate ClockRecords table state
    clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'DESC']] })
    assert.strictEqual(clockRecords.length, 0)

    // Validate Files table state
    files = await models.File.findAll({ where: { cnodeUserUUID }, order: [['createdAt', 'DESC']] })
    assert.strictEqual(files.length, 0)
  })

  it('Confirm file.pkey will block duplicate clock vals from being written', async () => {
    const transaction = await models.sequelize.transaction()
    try {
      const createFileQueryObj = {
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
      assert.strictEqual(e.name, 'SequelizeUniqueConstraintError')
      assert.strictEqual(e.original.message, 'duplicate key value violates unique constraint "Files_unique_(cnodeUserUUID,clock)"')
    }
  })
})
