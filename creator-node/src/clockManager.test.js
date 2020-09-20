const assert = require('assert')
const proxyquire = require('proxyquire')
const _ = require('lodash')

const models = require('./models')
const { createStarterCNodeUser } = require('../test/lib/dataSeeds')
const { incrementAndFetchCNodeUserClock, fetchCNodeUserClockSubquery } = require('./clockManager')
const utils = require('./utils')

describe.skip('Test incrementAndFetchCNodeUserClock', () => {
  const req = {
    logger: {
      error: (msg) => console.log(msg)
    }
  }

  const initialClockVal = 0
  const incrementClockBy = 1

  let cnodeUser

  /** Create cnodeUser */
  beforeEach(async () => {
    const resp = await createStarterCNodeUser()
    req.session = { cnodeUserUUID: resp.cnodeUserUUID }

    // Confirm initial clock val in DB
    cnodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID: req.session.cnodeUserUUID } })
    console.log(cnodeUser)
    // assert.strictEqual(cnodeUser.clock, initialClockVal)
  })

  /** Wipe all CNodeUsers + dependent data */
  afterEach(async () => {
    await models.CNodeUser.destroy({
      where: {},
      truncate: true,
      cascade: true // cascades delete to all rows with foreign key on cnodeUser
    })
  })

  it('Sequential increment&Fetch', async () => {
    // Explicitly pass in incrementBy value
    const newClockVal1 = await incrementAndFetchCNodeUserClock(req, incrementClockBy)

    // Confirm function response
    assert.strictEqual(newClockVal1, initialClockVal + incrementClockBy)

    // Confirm clock val in DB
    cnodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID: req.session.cnodeUserUUID } })
    assert.strictEqual(cnodeUser.clock, initialClockVal + incrementClockBy)

    // Use default incrementBy value
    const newClockVal2 = await incrementAndFetchCNodeUserClock(req)

    // Confirm function response
    assert.strictEqual(newClockVal2, newClockVal1 + incrementClockBy)

    // Confirm clock val in DB
    cnodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID: req.session.cnodeUserUUID } })
    assert.strictEqual(cnodeUser.clock, newClockVal1 + incrementClockBy)
  })

  it('Concurrent increment&Fetch', async () => {
    // Add global sequelize hook to add timeout before cnodeUser.update calls to force concurrent transactions
    const modelsCopy = models
    modelsCopy.sequelize.addHook('beforeUpdate', async (instance, options) => {
      if (instance.constructor.name === 'CNodeUser') {
        await utils.timeout(5000)
      }
    })

    // Replace required models instance with modified models instance
    proxyquire('./incrementAndFetchCNodeUserClock.js', { '../models': modelsCopy })

    // Fire 10 increment&Fetch calls in parallel
    const arr = _.range(1, 11) // [1,2,3,4,5,6,7,8,9,10]
    const returnedClockVals = await Promise.all(arr.map(async (i) => {
      console.log(`calling increment and fetch ${i}...`)
      return incrementAndFetchCNodeUserClock(req)
    }))

    // Ensure returned clock values include no duplicates and include each value from 1-10, in any order
    const returnedClockValsSorted = returnedClockVals.sort((a, b) => a - b)
    assert.deepStrictEqual(returnedClockValsSorted, arr)
  })

  it('Force blocked requests to fail', async () => {
    // return
  })
})
