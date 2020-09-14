const ServiceCommands = require('@audius/service-commands')
const { _ } = require('lodash')

const { logger, addFileLogger } = require('./logger.js')
const { makeExecuteAll, makeExecuteOne } = require('./helpers.js')
const consistency1 = require('./tests/test_1.js')

// Configuration.
// Should be CLI configurable in the future.
const NUM_CREATOR_NODES = 3
const NUM_USERS = 2
const ACCOUNT_OFFSET = 0 // Increment this if you wish to modify the start account for testing

const {
  runSetupCommand,
  Service,
  SetupCommand,
  LibsWrapper,
  allUp
} = ServiceCommands

async function setupAllServices() {
  logger.info('Setting up all services!')
  await allUp({ numCreatorNodes: NUM_CREATOR_NODES })
  logger.info('All services set up!')
}

async function tearDownAllServices() {
  logger.info('Downing services.')
  await runSetupCommand(Service.ALL, SetupCommand.DOWN)
  logger.info('All services downed.')
}

const makeTest = (name, testFn, numUsers, numCreatorNodes) => {
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
    test: wrappedTest
  }
}

const testRunner = async tests => {
  let failedTests = []
  // Run each test
  for (const { testName, test } of tests) {
    const date = new Date().toISOString()
    const fileLoggerName = `${testName}-${date}`
    const removeLogger = addFileLogger(fileLoggerName)

    logger.info(`Running test [${testName}] at [${date}]`)

    // Init required libs instances
    const libsArray = await Promise.all(
      _.range(NUM_USERS).map(async i => {
        const l = new LibsWrapper(i + ACCOUNT_OFFSET)
        await l.initLibs()
        return l
      })
    )

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
async function main() {
  logger.info('🐶 * Woof Woof * Welcome to Mad-Dog 🐶')
  const cmd = process.argv[3]
  let enableFaultInjection = true
  if (cmd === 'up') {
    await setupAllServices()
  } else if (cmd === 'down') {
    await tearDownAllServices()
  } else if (cmd === 'test') {
    const test = makeTest(
      'consistency',
      consistency1,
      NUM_USERS,
      NUM_CREATOR_NODES,
      enableFaultInjection
    )
    await testRunner([test])
  } else if (cmd === 'test-ci') {
    enableFaultInjection = false
    const test = makeTest(
      'consistency:ci',
      consistency1,
      NUM_USERS,
      NUM_CREATOR_NODES,
      enableFaultInjection
    )
    try {
      await testRunner([test])
      logger.info('Exiting testrunner')
      process.exit()
    } catch (e) {
      logger.info('Exiting testrunner with errors', e)
      process.exit(1)
    }
  } else {
    logger.error('Usage: one of either `up`, `down`, or `test`.')
  }
}

main()
