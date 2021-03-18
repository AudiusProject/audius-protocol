const ServiceCommands = require('@audius/service-commands')
const ContainerLogs = require('@audius/service-commands/src/ContainerLogs')
const { _ } = require('lodash')

const { logger, addFileLogger } = require('./logger.js')
const { makeExecuteAll, makeExecuteOne } = require('./helpers.js')
const {
  coreIntegration,
  snapbackSMParallelSyncTest,
  userReplicaSetManagerTest,
  IpldBlacklistTest
} = require('./tests/')

// Configuration.
// Should be CLI configurable in the future.
const DEFAULT_NUM_CREATOR_NODES = 4
const DEFAULT_NUM_USERS = 2
const SNAPBACK_NUM_USERS = 10
const USER_REPLICA_SET_NUM_USERS = 4

const SERVICES = [
  {
    service: ServiceCommands.Service.CREATOR_NODE,
    serviceNumber: 1
  },
  {
    service: ServiceCommands.Service.CREATOR_NODE,
    serviceNumber: 2
  },
  {
    service: ServiceCommands.Service.CREATOR_NODE,
    serviceNumber: 3
  },
  {
    service: ServiceCommands.Service.DISCOVERY_PROVIDER,
    serviceNumber: null
  },
  {
    service: ServiceCommands.Service.IDENTITY_SERVICE,
    serviceNumber: null
  },
  {
    service: ServiceCommands.Service.USER_METADATA_NODE,
    serviceNumber: null
  }
]

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
  await allUp({ numCreatorNodes: DEFAULT_NUM_CREATOR_NODES })
  logger.info('All services set up!')
}

async function tearDownAllServices () {
  logger.info('Downing services.')
  await runSetupCommand(Service.ALL, SetupCommand.DOWN)
  logger.info('All services downed.')
}

// Writing IPLD txns to chain require the 0th indexed wallet.
// This flag is set to 'true' to run the test with the 0th indexed wallet.
// The default will be 'undefined' for the other tests that do not require
// this flag.
const makeTest = (name, testFn, { numUsers, numCreatorNodes, useZeroIndexedWallet }) => {
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
    numUsers,
    useZeroIndexedWallet
  }
}

const testRunner = async tests => {
  const failedTests = []

  // Run each test
  for (const { testName, test, numUsers, useZeroIndexedWallet } of tests) {
    const date = new Date().toISOString()
    const fileLoggerName = `${testName}-${date}`
    const removeLogger = addFileLogger(fileLoggerName)

    logger.info(`Running test [${testName}]`)

    const libsInstances = await generateLibsInstances(numUsers, useZeroIndexedWallet)
    const executeAll = makeExecuteAll(libsInstances)
    const executeOne = makeExecuteOne(libsInstances)

    const { error } = await test({ executeAll, executeOne })
    if (error) {
      const msg = `Failed test [${testName}] with error [${error}]`
      logger.error(msg)
      failedTests.push(msg)
    }
    removeLogger()
  }

  if (failedTests.length > 0) throw new Error(`\n${JSON.stringify(failedTests, null, 2)}`)
}

async function generateLibsInstances (numUsers, useZeroIndexedWallet = false) {
  let libsInstances = []

  // Performing certain special actions the 0th indexed wallet (e.g. writing
  // an IPLD blacklist transaction).
  // Here, we init a libs instance with the 0th wallet and set it in index 0
  // of the libs array
  if (useZeroIndexedWallet) {
    const libsWithWalletIndex0 = new LibsWrapper(0)
    libsInstances.push(libsWithWalletIndex0)
    // If offset is 0, incr by 1 to not use wallet 0
    accountOffset = accountOffset === 0 ? accountOffset + 1 : accountOffset
    // Decrement numUsers by 1 as libsWithWallet0 is one of the created users
    numUsers--
  }

  // Create numUsers of libs instances and then asynchronously init them all
  libsInstances = libsInstances.concat(_.range(numUsers).map(i =>
    new LibsWrapper(i + accountOffset)
  ))

  return Promise.all(
    libsInstances.map(async instance => {
      await instance.initLibs()
      return instance
    })
  )
}

// This should go away when we have multiple tests.
//
// Currently there's a bug where standing up services
// in the same run as running the tests
// causes libs init failures, so we stand up services
// with a separate command.
async function main () {
  logger.info('🐶 * Woof Woof * Welcome to Mad-Dog 🐶')

  logger.info('Ensuring all nodes are healthy..')
  try {
    await Promise.all(
      SERVICES.map(entry =>
        ServiceCommands.performHealthCheckWithRetry(
          entry.service,
          entry.serviceNumber
        )
      )
    )
  } catch (e) {
    logger.error('Some or all health checks failed. Please check the necessary protocol logs.\n', e)
    return
  }

  const cmd = process.argv[3]
  const verbose = true // process.argv[4]

  try {
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
        const test = makeTest('consistency', coreIntegration, {
          numCreatorNodes: DEFAULT_NUM_CREATOR_NODES,
          numUsers: DEFAULT_NUM_USERS
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
      case 'test-ursm': {
        const test = makeTest(
          'userReplicaSetManager',
          userReplicaSetManagerTest,
          {
            numUsers: USER_REPLICA_SET_NUM_USERS
          })
        await testRunner([test])
        break
      }
      case 'test-ci': {
        const coreIntegrationTests = makeTest('consistency:ci', coreIntegration, {
          numCreatorNodes: DEFAULT_NUM_CREATOR_NODES,
          numUsers: DEFAULT_NUM_USERS
        })

        const snapbackTest = makeTest('snapback', snapbackSMParallelSyncTest, {
          numUsers: SNAPBACK_NUM_USERS
        })

        // dynamically create ipld tests
        const blacklistTests = Object.entries(IpldBlacklistTest).map(
          ([testName, testLogic]) =>
            makeTest(testName, testLogic, {
              numCreatorNodes: 1,
              numUsers: DEFAULT_NUM_USERS,
              useZeroIndexedWallet: true
            })
        )

        // User replica set manager tests
        // Enabled in CI only until contract has been deployed
        const ursmTest = makeTest(
          'userReplicaSetManager',
          userReplicaSetManagerTest,
          { numUsers: USER_REPLICA_SET_NUM_USERS }
        )

        const tests = [
          coreIntegrationTests,
          snapbackTest,
          ...blacklistTests,
          ursmTest
        ]

        await testRunner(tests)
        logger.info('Exiting testrunner')
        break
      }
      default:
        logger.error('Usage: one of either `up`, `down`, `test`, `test-ci`, `test-ursm`, `test-snapback`.')
    }
    process.exit()
  } catch (e) {
    logger.error('Exiting testrunner with errors')
    logger.error(e.message)

    if (verbose) {
      const containerLogs = Object.entries(ContainerLogs.logs)
      if (containerLogs.length === 0) return
      logger.info('Displaying logs from container time of error..')
      containerLogs.map(entry => {
        entry[1].forEach(containerLogInfo => {
          logger.error(`method name=${entry[0]}, userId=${containerLogInfo.userId}, container=${containerLogInfo.containerName}`, 'Error info with stack trace', containerLogInfo.error)
          logger.error('Relevant container logs:')
          console.error(containerLogInfo.stdout)
        })
      })
    }
    process.exit(1)
  }
}

main()
