const { exec } = require('child_process')
const colors = require('colors')
const config = require('../config/config.js')
const serviceCommands = require('./commands/service-commands.json')
const axios = require('axios').default
const _ = require('lodash')

// Constants

// Path to audius-protocol
const PROTOCOL_DIR = config.get('protocol_dir')

// `cd` command to audius-protocol
const CD_PROTOCOL_DIR_COMMAND = `cd ${PROTOCOL_DIR};`

const HEALTH_CHECK_ENDPOINT = 'health_check'

// Setting pretty print colors
colors.setTheme({
  happy: 'rainbow',
  success: 'green',
  info: 'magenta',
  error: 'red'
})

// Helpers
// Helper method to wait some desired time before executing next command
const wait = ms => {
  return new Promise((resolve, reject) => {
    console.log(`Waiting ${ms / 1000}s...`)
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/** Executes shell command in audius protocol directory, and logs the stdout and stderr streams.
 * If the shell command exits with a non-zero status code, reject the promise.
 *
 * Upon success, resolve the promise with stdout.
 */
const execShellCommand = (command, service, { verbose }) => {
  return new Promise((resolve, reject) => {
    // Increase the max buffer to 1024*1024 bytes = ~1MB
    if (
      service !== 'STOPPING ANY PRE-EXISTING SERVICES' &&
      service !== Service.INIT_REPOS
    ) {
      command = `${CD_PROTOCOL_DIR_COMMAND} ${command}`
    }

    console.log(`${command}`)
    const proc = exec(command, { maxBuffer: 1024 * 1024 })
    let output = ''
    // Stream the stdout
    proc.stdout.on('data', data => {
      verbose && process.stdout.write(`${data}`)
      output += data
    })

    // Stream the stderr
    proc.stderr.on('data', data => {
      process.stdout.write(`${data}`)
    })

    // Upon completion, handle as necessary if any errors occur
    // Do additional error checking for health checks
    proc.on('close', exitCode => {
      // Running `make stop` when no containers are up exits with a non-zero exit code
      // Ignore that error if occurs (could be better message)
      if (exitCode !== 0 && service !== 'STOPPING ANY PRE-EXISTING SERVICES') {
        reject(
          new Error(`${service} failed to start for the command: ${command}`)
        )
        return
      }

      resolve(output)
    })
  })
}

/**
 * Wrapper method to execute an array of commands in sequence.
 * @param {*} commands array of commands to be executed
 * @param {*} service name of service
 * @param {*} options
 */
const execShellCommands = async (commands, service, { verbose }) => {
  try {
    const commandOutputs = []
    for (const command of commands) {
      const output = await execShellCommand(command, service, { verbose })
      commandOutputs.push(output)
    }
    return commandOutputs
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

// API

/**
 * SetupCommand enum.
 */
const SetupCommand = Object.freeze({
  UP: 'up',
  DOWN: 'down',
  RESTART: 'restart',
  REGISTER: 'register',
  DEREGISTER: 'deregister',
  UPDATE_DELEGATE_WALLET: 'update-delegate-wallet',
  HEALTH_CHECK: 'health-check',
  UNSET_SHELL_ENV: 'unset-shell-env',
  UP_UM: 'up-um',
  UP_WEB_SERVER: 'up-web-server'
})

/**
 * Services enum.
 *
 * For now, these services just map to the existing
 * services in the service-commands.json (creator-node-1, creator-node-2, etc).
 * In the near future these will just be a base service (creator-node),
 * and some config (ports, etc)
 */
const Service = Object.freeze({
  ALL: 'all',
  NETWORK: 'network',
  CONTRACTS: 'contracts',
  ETH_CONTRACTS: 'eth-contracts',
  SOLANA_PROGRAMS: 'solana-programs',
  IPFS: 'ipfs',
  IPFS_2: 'ipfs-2',
  IPFS_3: 'ipfs-3',
  IPFS_4: 'ipfs-4',
  INIT_CONTRACTS_INFO: 'init-contracts-info',
  INIT_TOKEN_VERSIONS: 'init-token-versions',
  DISCOVERY_PROVIDER: 'discovery-provider',
  CONTENT_SERVICE: 'content-service',
  CREATOR_NODE: 'creator-node',
  USER_METADATA_NODE: 'user-metadata-node',
  IDENTITY_SERVICE: 'identity-service',
  DISTRIBUTE: 'distribute',
  ACCOUNT: 'account',
  INIT_REPOS: 'init-repos',
  USER_REPLICA_SET_MANAGER: 'user-replica-set-manager'
})

// gets a service command, interpolating service names
const getServiceCommands = (service, serviceNumber) => {
  const commands = serviceCommands[service]
  if (!serviceNumber) {
    return commands
  }
  const interpolated = Object.keys(commands).reduce((acc, cur) => {
    // If it's an array of commands, try interpolating
    let val = commands[cur]
    if (Array.isArray(val)) {
      val = val.map(command => command.replace('#', serviceNumber))
    }
    return {
      ...acc,
      [cur]: val
    }
  }, {})
  return interpolated
}

/**
 * Run a command against a particular service.
 * @param {*} service
 * @param {*} setupCommand
 * @param {*} options
 */
const runSetupCommand = async (
  service,
  setupCommand,
  { serviceNumber, verbose = true, waitSec, retries } = { verbose: true }
) => {
  console.log(`${service} - ${setupCommand}`.info)
  const start = Date.now()
  const commands = getServiceCommands(service, serviceNumber)
  if (!commands) {
    throw new Error(`No service [${service}]`.error)
  }

  if (setupCommand === SetupCommand.HEALTH_CHECK) {
    await performHealthCheckWithRetry(service, serviceNumber)
    return
  }

  const command = commands[setupCommand]
  if (!command) {
    throw new Error(
      `No valid setupCommand [${setupCommand}] for service [${service}]`.error
    )
  }

  let attemptsRemaining = retries + 1 || 1

  while (attemptsRemaining > 0) {
    try {
      const outputs = await execShellCommands(command, service, { verbose })
      if (waitSec) {
        console.log(`Waiting ${waitSec} seconds...`.happy)
        await new Promise(resolve => {
          setTimeout(resolve, waitSec * 1000)
        })
      }
      const durationSeconds = Math.abs((Date.now() - start) / 1000)
      console.log(
        `${service} - ${setupCommand} | executed in ${durationSeconds}s`.info
      )
      return outputs
    } catch (err) {
      console.error(`Got error: [${err}]`.error)
      attemptsRemaining -= 1
      if (attemptsRemaining === 0) {
        throw err
      }
      console.log('Retrying...'.error)
    }
  }
}

const getContentNodeContainerName = serviceNumber => {
  return `cn${serviceNumber}_creator-node_1`
}

const getServiceURL = (service, serviceNumber) => {
  if (service === Service.CREATOR_NODE) {
    if (!serviceNumber) {
      throw new Error('Missing serviceNumber')
    }
    return `http://${getContentNodeContainerName(serviceNumber)}:${
      4000 + parseInt(serviceNumber) - 1
    }/${HEALTH_CHECK_ENDPOINT}`
  }

  const commands = serviceCommands[service]
  if (!commands) {
    throw new Error(`Invalid service: [${service}]`)
  }
  const { protocol, host, port } = commands
  return `${protocol}://${host}:${port}/${HEALTH_CHECK_ENDPOINT}`
}

const performHealthCheckWithRetry = async (
  service,
  serviceNumber,
  retries = 10
) => {
  let attempts = retries
  while (attempts > 0) {
    try {
      await wait(4000)
      await performHealthCheck(service, serviceNumber)
      console.log(
        `Successful health check for ${service}${serviceNumber || ''}`.happy
      )
      return
    } catch (e) {
      console.log(`${e}`)
    }
    attempts -= 1
  }
  const serviceNumberString = serviceNumber ? `, spId=${serviceNumber}` : ''
  throw new Error(`Failed health check - ${service}${serviceNumberString}`)
}

/**
 * Perform a health-check for a service.
 * @param {*} service
 */
const performHealthCheck = async (service, serviceNumber) => {
  const url = getServiceURL(service, serviceNumber)

  try {
    const resp = await axios({ method: 'get', url })
    return resp
  } catch (e) {
    console.error(
      `Failed health check for service: ${service}, err: [${e.message}]`.error
    )
    throw e
  }
}

/**
 * Brings up all services relevant to the discovery provider
 * @returns {Promise<void>}
 */
const discoveryNodeUp = async () => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const options = { verbose: true }

  const inParallel = [
    [Service.CONTRACTS, SetupCommand.UP, options],
    [Service.ETH_CONTRACTS, SetupCommand.UP, options],
    [Service.SOLANA_PROGRAMS, SetupCommand.UP, options]
  ]

  const sequential = [
    [Service.INIT_CONTRACTS_INFO, SetupCommand.UP],
    [Service.INIT_TOKEN_VERSIONS, SetupCommand.UP],
    [Service.DISCOVERY_PROVIDER, SetupCommand.UP],
    [Service.DISCOVERY_PROVIDER, SetupCommand.HEALTH_CHECK],
    [
      Service.DISCOVERY_PROVIDER,
      SetupCommand.REGISTER,
      { ...options, retries: 2 }
    ]
  ]

  const start = Date.now()

  // Start up the docker network `audius_dev`
  await runSetupCommand(Service.NETWORK, SetupCommand.UP)

  // Run parallel ops
  await Promise.all(inParallel.map(s => runSetupCommand(...s)))

  // Run sequential ops
  for (const s of sequential) {
    await runSetupCommand(...s)
  }

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`Services brought up in ${durationSeconds}s`.info)
}

/**
 * Brings up all services relevant to the discovery node, but
 * with only the discovery web server and redis. Useful in running against a custom
 * database.
 * @returns {Promise<void>}
 */
const discoveryNodeWebServerUp = async () => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const options = { verbose: true }

  const inParallel = [
    [Service.CONTRACTS, SetupCommand.UP, options],
    [Service.ETH_CONTRACTS, SetupCommand.UP, options],
    [Service.SOLANA_PROGRAMS, SetupCommand.UP, options]
  ]

  const sequential = [
    [Service.INIT_CONTRACTS_INFO, SetupCommand.UP],
    [Service.INIT_TOKEN_VERSIONS, SetupCommand.UP],
    [Service.DISCOVERY_PROVIDER, SetupCommand.UP_WEB_SERVER],
    [Service.DISCOVERY_PROVIDER, SetupCommand.HEALTH_CHECK],
    [
      Service.DISCOVERY_PROVIDER,
      SetupCommand.REGISTER,
      { ...options, retries: 2 }
    ]
  ]

  const start = Date.now()

  // Start up the docker network `audius_dev`
  await runSetupCommand(Service.NETWORK, SetupCommand.UP)

  // Run parallel ops
  await Promise.all(inParallel.map(s => runSetupCommand(...s)))

  // Run sequential ops
  for (const s of sequential) {
    await runSetupCommand(...s)
  }

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`Services brought up in ${durationSeconds}s`.info)
}


/**
 * Brings up all services relevant to the creator node
 * @returns {Promise<void>}
 */
const creatorNodeUp = async (serviceNumber) => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const options = { verbose: true }
  const sequential = [
    [
      Service.CREATOR_NODE,
      SetupCommand.UPDATE_DELEGATE_WALLET,
      { ...options, serviceNumber: serviceNumber }
    ],
    [
      Service.CREATOR_NODE,
      SetupCommand.UP,
      { ...options, serviceNumber: serviceNumber, waitSec: 10 }
    ],
    [
      Service.CREATOR_NODE,
      SetupCommand.HEALTH_CHECK,
      { ...options, serviceNumber: serviceNumber }
    ],
    [
      Service.CREATOR_NODE,
      SetupCommand.REGISTER,
      { ...options, serviceNumber: serviceNumber }
    ]
  ]

  const start = Date.now()

  // Run sequential ops
  for (const s of sequential) {
    await runSetupCommand(...s)
  }

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`Creator Node Services num:${serviceNumber} brought up in ${durationSeconds}s`.info)
}

/**
 * Deregisters a creator node
 * @returns {Promise<void>}
 */
 const deregisterCreatorNode = async (serviceNumber) => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const options = { verbose: true }
  const sequential = [
    [
      Service.CREATOR_NODE,
      SetupCommand.DEREGISTER,
      { ...options, serviceNumber: serviceNumber }
    ]
  ]

  const start = Date.now()

  // Run sequential ops
  for (const s of sequential) {
    await runSetupCommand(...s)
  }

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`Deregister Creator Node Service num:${serviceNumber} in ${durationSeconds}s`.info)
}

/**
 * Distributes 200k tokens to all wallets
 * @returns {Promise<void>}
 */
const distribute = async () => {
  await runSetupCommand(Service.DISTRIBUTE, SetupCommand.UP)
}

/**
 * Fetches the eth accounts
 * @returns {Promise<void>}
 */
 const getAccounts = async () => {
  const outputs = await runSetupCommand(Service.ACCOUNT, SetupCommand.UP)
  const accountsSubstring = outputs[0].substring(outputs[0].lastIndexOf('[{"'),outputs[0].length-1);
  return JSON.parse(accountsSubstring)
}

/**
 * Brings up all services relevant to the identity service
 * @returns {Promise<void>}
 */
const identityServiceUp = async () => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const options = { verbose: true }

  const inParallel = [
    [Service.CONTRACTS, SetupCommand.UP, options],
    [Service.ETH_CONTRACTS, SetupCommand.UP, options],
    [Service.SOLANA_PROGRAMS, SetupCommand.UP, options]
  ]

  const sequential = [
    [Service.INIT_CONTRACTS_INFO, SetupCommand.UP],
    [Service.INIT_TOKEN_VERSIONS, SetupCommand.UP],
    [Service.IDENTITY_SERVICE, SetupCommand.UP],
    [Service.IDENTITY_SERVICE, SetupCommand.HEALTH_CHECK]
  ]

  const start = Date.now()

  // Start up the docker network `audius_dev`
  await runSetupCommand(Service.NETWORK, SetupCommand.UP)

  // Run parallel ops
  await Promise.all(inParallel.map(s => runSetupCommand(...s)))

  // Run sequential ops
  for (const s of sequential) {
    await runSetupCommand(...s)
  }

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`Services brought up in ${durationSeconds}s`.info)
}

/**
 * Brings up an entire Audius Protocol stack.
 * @param {*} config. currently supports up to 4 Creator Nodes.
 */
const allUp = async ({ numCreatorNodes = 4, numDiscoveryNodes = 1  }) => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const options = { verbose: true }

  const inParallel = [
    [Service.IPFS, SetupCommand.UP, options],
    [Service.IPFS_2, SetupCommand.UP, options],
    [Service.CONTRACTS, SetupCommand.UP, options],
    [Service.ETH_CONTRACTS, SetupCommand.UP, options],
    [Service.SOLANA_PROGRAMS, SetupCommand.UP, options]
  ]

  const creatorNodeCommands = _.range(1, numCreatorNodes + 1).reduce(
    (acc, cur) => {
      return [
        ...acc,
        [
          Service.CREATOR_NODE,
          SetupCommand.UPDATE_DELEGATE_WALLET,
          { ...options, serviceNumber: cur }
        ],
        [
          Service.CREATOR_NODE,
          SetupCommand.UP,
          { ...options, serviceNumber: cur, waitSec: 10 }
        ],
        [
          Service.CREATOR_NODE,
          SetupCommand.HEALTH_CHECK,
          { ...options, serviceNumber: cur }
        ],
        [
          Service.CREATOR_NODE,
          SetupCommand.REGISTER,
          { ...options, serviceNumber: cur }
        ]
      ]
    },
    []
  )

  const discoveryNodesCommands = _.range(1, numDiscoveryNodes + 1).reduce(
    (acc, cur) => {
      return [
        ...acc,
        [Service.DISCOVERY_PROVIDER, SetupCommand.UP, { serviceNumber: cur }],
        [Service.DISCOVERY_PROVIDER, SetupCommand.HEALTH_CHECK, { serviceNumber: cur }],
        [
          Service.DISCOVERY_PROVIDER,
          SetupCommand.REGISTER,
          { ...options, retries: 2, serviceNumber: cur }
        ]
      ]
    },
    []
  )

  const sequential = [
    [Service.INIT_CONTRACTS_INFO, SetupCommand.UP],
    [Service.INIT_TOKEN_VERSIONS, SetupCommand.UP],
    ...discoveryNodesCommands,
    [Service.USER_METADATA_NODE, SetupCommand.UNSET_SHELL_ENV],
    [Service.USER_METADATA_NODE, SetupCommand.UP_UM, { ...options, waitSec: 10 }],
    [Service.USER_METADATA_NODE, SetupCommand.HEALTH_CHECK],
    ...creatorNodeCommands,
    [Service.IDENTITY_SERVICE, SetupCommand.UP],
    [Service.IDENTITY_SERVICE, SetupCommand.HEALTH_CHECK],
    [Service.USER_REPLICA_SET_MANAGER, SetupCommand.UP]
  ]

  const start = Date.now()

  // Start up the docker network `audius_dev`
  await runSetupCommand(Service.NETWORK, SetupCommand.UP)

  // Run parallel ops
  await Promise.all(inParallel.map(s => runSetupCommand(...s)))

  // Run sequential ops
  for (const s of sequential) {
    await runSetupCommand(...s)
  }

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`All services brought up in ${durationSeconds}s`.info)
}

module.exports = {
  runSetupCommand,
  performHealthCheck,
  performHealthCheckWithRetry,
  getServiceURL,
  getContentNodeContainerName,
  allUp,
  distribute,
  getAccounts,
  creatorNodeUp,
  deregisterCreatorNode,
  discoveryNodeUp,
  discoveryNodeWebServerUp,
  identityServiceUp,
  SetupCommand,
  Service
}
