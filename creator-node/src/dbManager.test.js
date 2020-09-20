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
  afterEach(async () => {
    return
    await models.CNodeUser.destroy({
      where: {},
      truncate: true,
      cascade: true // cascades delete to all rows with foreign key on cnodeUser
    })
  })

  // it.only('test', () => {})

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
    clockRecords = await models.ClockRecord.findAll({ where: { cnodeUserUUID }, order: [['updatedAt', 'DESC']] })
    assert.strictEqual(clockRecords.length, 2)
    clockRecord = clockRecords[0].dataValues
    assert.strictEqual(clockRecord.clock, initialClockVal + 2)
    assert.strictEqual(clockRecord.sourceTable, sourceTable)

    // Validate Files table state
    files = await models.File.findAll({ where: { cnodeUserUUID }, order: [['updatedAt', 'DESC']] })
    assert.strictEqual(files.length, 2)
    file = files[0].dataValues
    assert.strictEqual(file.clock, initialClockVal + 2)
  })

  it.skip('Concurrent createNewDataRecord - create 10 records', async () => {
    // test two concurrent in separate transactions (simulates routes)
    const t1 = await models.sequelize.transaction()
    const t2 = await models.sequelize.transaction()

    // Create new Data record
    let createFileQueryObj = {
      multihash: 'testMultihash',
      sourceFile: 'testSourceFile',
      storagePath: 'testStoragePath',
      type: 'metadata' // TODO - replace with models enum
    }
    let createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sourceTable, transaction)
    await t1.commit()
  })

  it.skip('Concurrent pt2', async () => {
    // test concurrent in same transaction -> this should break
  })



  it.only('Concurrent createNewDataRecord', async () => {
    const sourceTable = 'File'
    try {
      // Add global sequelize hook to add timeout before ClockRecord.create calls to force concurrent ops
      const modelsCopy = models
      modelsCopy.sequelize.addHook('beforeCreate', async (instance, options) => {
        if (instance.constructor.name === 'File') {
          await utils.timeout(1000)
        }
      })

      // Replace required models instance with modified models instance
      proxyquire('./dbManager', { './models': modelsCopy })

      const transaction = await models.sequelize.transaction()

      // Fire 10 increment&Fetch calls in parallel
      const arr = _.range(1, 8) // [1,2,3,4,5,6,7,8,9,10]
      const returnedData = await Promise.all(arr.map(async (i) => {
        console.log(`calling createNewDataRecord ${i}...`)

        const createFileQueryObj = {
          multihash: 'testMultihash2',
          sourceFile: 'testSourceFile2',
          storagePath: 'testStoragePath2',
          type: 'metadata' // TODO - replace with models enum
        }
        const createdFile = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, sourceTable, transaction)

        return createdFile
      }))
      await transaction.commit()
    } catch (e) {
      console.log(e)
      throw new Error(e)
    }
    
    /**
     * TODO
     * ensure concurrent with multiple transactions always works
     * ensure concurrent in single transaction always fails due to SequelizeUniqueConstraintError
     * - test with timeout before ClockRecord to confirm ClockRecord.pkey
     * - test with timeout before File to confirm File.pkey
     * - test with timeout before 
     */


    // // Ensure returned clock values include no duplicates and include each value from 1-10, in any order
    // const returnedClockValsSorted = returnedClockVals.sort((a, b) => a - b)
    // assert.deepStrictEqual(returnedClockValsSorted, arr)
  })

  it('Force blocked requests to fail', async () => {
    // return
  })
})
