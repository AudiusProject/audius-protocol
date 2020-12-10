const ServiceCommands = require('@audius/service-commands')
const { _ } = require('lodash')

const { logger, addFileLogger } = require('./logger.js')
const { makeExecuteAll, makeExecuteOne } = require('./helpers.js')
const consistency1 = require('./tests/test_1.js')
const { snapbackSMParallelSyncTest } = require('./tests/test_snapbackSM.js')
const ipldBlacklistTests = require('./tests/test_ipldBlacklist')

// Configuration.
// Should be CLI configurable in the future.
const NUM_CREATOR_NODES = 3
const NUM_USERS = 2

// Allow command line args for wallet index offset
const commandLineOffset = parseInt(process.argv.slice(4)[0])
let accountOffset = commandLineOffset || 0

const {
  runSetupCommand,
  Service,
  SetupCommand,
  LibsWrapper,
  allUp
} = ServiceCommands

async function setupAllServices () {
  logger.info('Setting up all services!')
  await allUp({ numCreatorNodes: NUM_CREATOR_NODES })
  logger.info('All services set up!')
}

async function tearDownAllServices () {
  logger.info('Downing services.')
  await runSetupCommand(Service.ALL, SetupCommand.DOWN)
  logger.info('All services downed.')
}

const makeTest = (name, testFn, { numUsers, numCreatorNodes }) => {
  const wrappedTest = async ({ executeAll, executeOne }) => {
    try {
      const res = await testFn({
        executeAll,
        executeOne,
        numUsers,
        numCreatorNodes
      })
      if (res && res.error) return { error: res.error }
      return { success: true }
    } catch (e) {
      return { error: e.message }
    }
  }
  return {
    testName: name,
    test: wrappedTest,
    numUsers
  }
}

const testRunner = async tests => {
  let failedTests = []
  // Run each test
  for (let { testName, test, numUsers } of tests) {
    const date = new Date().toISOString()
    const fileLoggerName = `${testName}-${date}`
    const removeLogger = addFileLogger(fileLoggerName)

    logger.info(`Running test [${testName}] at [${date}]`)

    let libsArray = []

    // Writing IPLD txns to chain require the 0th account
    // Here, we init a libs instance with the 0th acc and set it as index 0
    // in the libs array
    if (testName.startsWith('ipld')) {
      // add libs with wallet index 0
      const libsWithWallet0 = new LibsWrapper(0)
      await libsWithWallet0.initLibs()
      libsArray = [libsWithWallet0]

      // if offset is 0, incr by 1 to not use wallet 0
      accountOffset = accountOffset === 0 ? accountOffset + 1 : accountOffset

      // decr numUsers by 1 as libsWithWallet0 is one of the created users
      numUsers -= 1
    }

    // Init required libs instances
    const libsInstances = await Promise.all(
      _.range(numUsers).map(async i => {
        const l = new LibsWrapper(i + accountOffset)
        await l.initLibs()
        return l
      })
    )
    libsArray = [...libsArray, ...libsInstances]

    const executeAll = makeExecuteAll(libsArray)
    const executeOne = makeExecuteOne(libsArray)

    const { error } = await test({ executeAll, executeOne })
    if (error) {
      const msg = `Failed test [${testName}] with error [${error}]`
      logger.error(msg)
      failedTests.push(msg)
    }
    logger.info('Removing logger after test execution')
    removeLogger()
  }

  if (failedTests.length > 0) throw new Error(failedTests.toString())
}

// This should go away when we have multiple tests.
//
// Currently there's a bug where standing up services
// in the same run as running the tests
// causes libs init failures, so we stand up services
// with a separate command.
async function main () {
  logger.info('🐶 * Woof Woof * Welcome to Mad-Dog 🐶')
  const cmd = process.argv[3]

  switch (cmd) {
    case 'up': {
      await setupAllServices()
      break
    }
    case 'down': {
      await tearDownAllServices()
      break
    }
    case 'test': {
      const test = makeTest('consistency', consistency1, {
        numCreatorNodes: NUM_CREATOR_NODES,
        numUsers: NUM_USERS
      })
      await testRunner([test])
      break
    }
    case 'test-snapback': {
      const snapbackNumUsers = 40
      const test = makeTest(
        'snapback',
        snapbackSMParallelSyncTest,
        {
          numUsers: snapbackNumUsers
        }
      )
      await testRunner([test])
      break
    }
    case 'test-ci': {
      const test = makeTest('consistency:ci', consistency1, {
        numCreatorNodes: NUM_CREATOR_NODES,
        numUsers: NUM_USERS
      })

      // dynamically create ipld tests
      const blacklistTests = Object.entries(ipldBlacklistTests).map(
        ([testName, testLogic]) =>
          makeTest(testName, testLogic, {
            numCreatorNodes: 1,
            numUsers: NUM_USERS
          })
      )
      const tests = [test, ...blacklistTests]

      try {
        await testRunner(tests)
        logger.info('Exiting testrunner')
        process.exit()
      } catch (e) {
        logger.error('Exiting testrunner with errors')
        logger.error(e.message)
        process.exit(1)
      }
    }
    default:
      logger.error('Usage: one of either `up`, `down`, `test`, or `test-ci`.')
  }
}

main()
