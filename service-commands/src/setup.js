const { exec, spawn } = require('child_process')
const fs = require('fs')
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

const OUTPUT_LOG = fs.createWriteStream(
  `${PROTOCOL_DIR}/service-commands/output.log`
)
const ERROR_LOG = fs.createWriteStream(
  `${PROTOCOL_DIR}/service-commands/error.log`
)

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
    if (verbose) {
      console.log(command)
    }
    OUTPUT_LOG.write(`[SERVICE]: ${service} [COMMAND]: ${command}`)
    const proc = exec(command, { maxBuffer: 1024 * 1024, shell: '/bin/bash' })
    let output = ''
    // Stream the stdout
    proc.stdout.on('data', data => {
      if (verbose) {
        verbose && process.stdout.write(`${data}`)
        output += data
      }
      OUTPUT_LOG.write(data)
    })

    // Stream the stderr
    proc.stderr.on('data', data => {
      process.stdout.write(`${data}`.error)
      ERROR_LOG.write(data)
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
  HEALTH_CHECK_RETRY: 'health-check-retry',
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
  CONTRACTS_PREDEPLOYED: 'contracts-predeployed',
  ETH_CONTRACTS_PREDEPLOYED: 'eth-contracts-predeployed',
  SOLANA_VALIDATOR: 'solana-validator',
  SOLANA_VALIDATOR_PREDEPLOYED: 'solana-validator-predeployed',
  SOLANA_PROGRAMS: 'solana-programs',
  IPFS: 'ipfs',
  IPFS_2: 'ipfs-2',
  IPFS_3: 'ipfs-3',
  IPFS_4: 'ipfs-4',
  INIT_CONTRACTS_INFO: 'init-contracts-info',
  INIT_TOKEN_VERSIONS: 'init-token-versions',
  DISCOVERY_PROVIDER: 'discovery-provider',
  CREATOR_NODE: 'creator-node',
  IDENTITY_SERVICE: 'identity-service',
  DISTRIBUTE: 'distribute',
  ACCOUNT: 'account',
  INIT_REPOS: 'init-repos',
  USER_REPLICA_SET_MANAGER: 'user-replica-set-manager',
  AAO: 'aao',
  TN: 'tn',
  LIBS: 'libs',
  MONITORING: 'monitoring'
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
      val = val.map(command => command.replace(/#/g, serviceNumber))
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
  { serviceNumber, verbose = false, waitSec, retries } = { verbose: false }
) => {
  console.log(`${service} ${serviceNumber || ''} - ${setupCommand}`.info)
  const start = Date.now()
  const commands = getServiceCommands(service, serviceNumber)
  if (!commands) {
    throw new Error(`No service [${service}]`.error)
  }

  if (setupCommand === SetupCommand.HEALTH_CHECK) {
    await performHealthCheck(service, serviceNumber)
    return
  }

  if (setupCommand === SetupCommand.HEALTH_CHECK_RETRY) {
    await performHealthCheckWithRetry(service, serviceNumber, retries, waitSec)
    return
  }

  if (service === Service.LIBS && setupCommand === SetupCommand.UP) {
    const libsLog = await fs.promises.open(
      `${PROTOCOL_DIR}/service-commands/libs.log`,
      'w'
    )
    const subprocess = await spawn(
      `${PROTOCOL_DIR}/service-commands/scripts/run-libs.sh`,
      [],
      {
        detached: true,
        stdio: ['ignore', libsLog, libsLog],
        cwd: `${PROTOCOL_DIR}/libs`
      }
    )
    subprocess.unref()
    console.log(`Spawned libs watcher. PID: ${subprocess.pid}`.info)
    libsLog.close()
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
        `${service} ${
          serviceNumber || ''
        } - ${setupCommand} | executed in ${durationSeconds}s`.info
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
  const commands = serviceCommands[service]
  if (!commands) {
    throw new Error(`Invalid service: [${service}]`)
  }
  const {
    protocol,
    host,
    port,
    health_check_endpoint: healthCheckEndpoint
  } = commands
  if (service === Service.CREATOR_NODE) {
    if (!serviceNumber) {
      throw new Error('Missing serviceNumber')
    }
    return `http://${getContentNodeContainerName(serviceNumber)}:${
      4000 + parseInt(serviceNumber) - 1
    }/${healthCheckEndpoint}`
  }
  return `${protocol}://${host}:${port}/${healthCheckEndpoint}`
}

const performHealthCheckWithRetry = async (
  service,
  serviceNumber,
  retries = 20,
  waitSec = 0
) => {
  let attempts = retries
  if (waitSec > 0) {
    await wait(waitSec * 1000)
  }
  while (attempts > 0) {
    try {
      await performHealthCheck(service, serviceNumber)
      return
    } catch (e) {
      console.log(`${e}`)
    }
    await wait(10000)
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
  let healthCheckRequestOptions = { method: 'get', url }
  if (
    service === Service.SOLANA_VALIDATOR ||
    service === Service.SOLANA_VALIDATOR_PREDEPLOYED
  ) {
    healthCheckRequestOptions = {
      method: 'post',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'getClusterNodes'
      },
      url
    }
  }
  if (
    service === Service.CONTRACTS_PREDEPLOYED ||
    service === Service.ETH_CONTRACTS_PREDEPLOYED
  ) {
    healthCheckRequestOptions = {
      method: 'post',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber'
      },
      url
    }
  }

  try {
    const resp = await axios(healthCheckRequestOptions)
    console.log(
      `Successful health check for ${service}${serviceNumber || ''}`.happy
    )
    return resp
  } catch (e) {
    console.error(
      `Failed health check for service: ${service}, err: [${e.message}]`.error
    )
    throw e
  }
}
const runInSequence = async (commands, options) => {
  for (const s of commands) {
    await runSetupCommand(...s, options)
  }
}

const runInParallel = async (commands, options) => {
  await Promise.all(commands.map(s => runSetupCommand(...s, options)))
}

/**
 * Brings up all services relevant to the discovery provider
 * @returns {Promise<void>}
 */
const discoveryNodeUp = async (options = { verbose: false }) => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const setup = [
    [Service.NETWORK, SetupCommand.UP],
    [Service.SOLANA_VALIDATOR, SetupCommand.UP],
    [Service.SOLANA_VALIDATOR, SetupCommand.HEALTH_CHECK_RETRY]
  ]

  const inParallel = [
    [Service.CONTRACTS, SetupCommand.UP],
    [Service.ETH_CONTRACTS, SetupCommand.UP],
    [Service.SOLANA_PROGRAMS, SetupCommand.UP]
  ]

  const sequential = [
    [Service.INIT_CONTRACTS_INFO, SetupCommand.UP],
    [Service.INIT_TOKEN_VERSIONS, SetupCommand.UP],
    [
      Service.DISCOVERY_PROVIDER,
      SetupCommand.UP,
      { serviceNumber: 1, ...options }
    ],
    [
      Service.DISCOVERY_PROVIDER,
      SetupCommand.HEALTH_CHECK_RETRY,
      { serviceNumber: 1, ...options }
    ],
    [
      Service.DISCOVERY_PROVIDER,
      SetupCommand.REGISTER,
      { retries: 2, serviceNumber: 1, ...options }
    ]
  ]

  const start = Date.now()

  // Start up the docker network `audius_dev` and the Solana test validator
  await runInSequence(setup, options)

  // Run parallel ops
  await runInParallel(inParallel, options)

  // Run sequential ops
  await runInSequence(sequential, options)

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`Services brought up in ${durationSeconds}s`.info)
}

/**
 * Brings up all services relevant to the discovery node, but
 * with only the discovery web server and redis. Useful in running against a custom
 * database.
 * @returns {Promise<void>}
 */
const discoveryNodeWebServerUp = async (options = { verbose: false }) => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const setup = [
    [Service.NETWORK, SetupCommand.UP],
    [Service.SOLANA_VALIDATOR, SetupCommand.UP],
    [Service.SOLANA_VALIDATOR, SetupCommand.HEALTH_CHECK_RETRY]
  ]

  const inParallel = [
    [Service.CONTRACTS, SetupCommand.UP],
    [Service.ETH_CONTRACTS, SetupCommand.UP],
    [Service.SOLANA_PROGRAMS, SetupCommand.UP]
  ]

  const sequential = [
    [Service.INIT_CONTRACTS_INFO, SetupCommand.UP],
    [Service.INIT_TOKEN_VERSIONS, SetupCommand.UP],
    [
      Service.DISCOVERY_PROVIDER,
      SetupCommand.UP_WEB_SERVER,
      { serviceNumber: 1, ...options }
    ],
    [
      Service.DISCOVERY_PROVIDER,
      SetupCommand.HEALTH_CHECK_RETRY,
      { serviceNumber: 1, ...options }
    ],
    [
      Service.DISCOVERY_PROVIDER,
      SetupCommand.REGISTER,
      { retries: 2, serviceNumber: 1, ...options }
    ]
  ]

  const start = Date.now()

  // Start up the docker network `audius_dev` and the Solana test validator
  await runInSequence(setup, options)

  // Run parallel ops
  await runInParallel(inParallel, options)

  await runInSequence(sequential, options)

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`Services brought up in ${durationSeconds}s`.info)
}
/**
 * Brings up all services relevant to the creator node
 * @returns {Promise<void>}
 */
const creatorNodeUp = async (serviceNumber, options = { verbose: false }) => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const sequential = [
    [
      Service.CREATOR_NODE,
      SetupCommand.UPDATE_DELEGATE_WALLET,
      { serviceNumber, ...options }
    ],
    [
      Service.CREATOR_NODE,
      SetupCommand.UP,
      { serviceNumber, ...options, waitSec: 10 }
    ],
    [
      Service.CREATOR_NODE,
      SetupCommand.HEALTH_CHECK_RETRY,
      { serviceNumber, ...options }
    ],
    [Service.CREATOR_NODE, SetupCommand.REGISTER, { serviceNumber, ...options }]
  ]

  const start = Date.now()

  // Run sequential ops

  await runInSequence(sequential, options)

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(
    `Creator Node Services num:${serviceNumber} brought up in ${durationSeconds}s`
      .info
  )
}

/**
 * Deregisters a creator node
 * @returns {Promise<void>}
 */
const deregisterCreatorNode = async (
  serviceNumber,
  options = { verbose: false }
) => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )

  const sequential = [
    [
      Service.CREATOR_NODE,
      SetupCommand.DEREGISTER,
      { ...options, serviceNumber: serviceNumber }
    ]
  ]

  const start = Date.now()

  // Run sequential ops
  await runInSequence(sequential, options)

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(
    `Deregister Creator Node Service num:${serviceNumber} in ${durationSeconds}s`
      .info
  )
}

/**
 * Distributes 200k tokens to all wallets
 * @returns {Promise<void>}
 */
const distribute = async (options = { verbose: false }) => {
  await runSetupCommand(Service.DISTRIBUTE, SetupCommand.UP, options)
}

/**
 * Fetches the eth accounts
 * @returns {Promise<void>}
 */
const getAccounts = async (options = { verbose: false }) => {
  const outputs = await runSetupCommand(
    Service.ACCOUNT,
    SetupCommand.UP,
    options
  )
  const accountsSubstring = outputs[0].substring(
    outputs[0].lastIndexOf('[{"'),
    outputs[0].length - 1
  )
  return JSON.parse(accountsSubstring)
}

/**
 * Brings up all services relevant to the identity service
 * @returns {Promise<void>}
 */
const identityServiceUp = async (options = { verbose: false }) => {
  console.log(
    "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
      .error
  )
  const setup = [
    [Service.NETWORK, SetupCommand.UP],
    [Service.SOLANA_VALIDATOR, SetupCommand.UP],
    [Service.SOLANA_VALIDATOR, SetupCommand.HEALTH_CHECK_RETRY]
  ]

  const inParallel = [
    [Service.CONTRACTS, SetupCommand.UP],
    [Service.ETH_CONTRACTS, SetupCommand.UP],
    [Service.SOLANA_PROGRAMS, SetupCommand.UP]
  ]

  const sequential = [
    [Service.INIT_CONTRACTS_INFO, SetupCommand.UP],
    [Service.INIT_TOKEN_VERSIONS, SetupCommand.UP],
    [Service.IDENTITY_SERVICE, SetupCommand.UP],
    [Service.IDENTITY_SERVICE, SetupCommand.HEALTH_CHECK_RETRY]
  ]

  const start = Date.now()

  // Start up the docker network `audius_dev` and the Solana test validator
  await runInSequence(setup, options)

  // Run parallel ops
  await runInParallel(inParallel, options)

  // Run sequential ops
  await runInSequence(sequential, options)

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`Services brought up in ${durationSeconds}s`.info)
}

/**
 * Brings up an entire Audius Protocol stack.
 * @param {*} config. currently supports up to 4 Creator Nodes.
 */
const allUp = async ({
  numCreatorNodes = 4,
  numDiscoveryNodes = 1,
  withAAO = false,
  verbose = false,
  parallel = false,
  buildSolana = false,
  buildDataEthContracts = false
}) => {
  if (verbose) {
    console.log('Running in verbose mode.')
    console.log({
      numCreatorNodes,
      numDiscoveryNodes,
      verbose,
      parallel,
      withAAO
    })
    console.log(
      "\n\n========================================\n\nNOTICE - Please make sure your '/etc/hosts' file is up to date.\n\n========================================\n\n"
        .error
    )
  }

  const options = { verbose }

  const setup = [
    [Service.NETWORK, SetupCommand.UP],
    [Service.SOLANA_VALIDATOR_PREDEPLOYED, SetupCommand.UP, { waitSec: 3 }],
    [Service.SOLANA_VALIDATOR_PREDEPLOYED, SetupCommand.HEALTH_CHECK_RETRY]
  ]

  const ipfsAndContractsCommands = [
    [Service.IPFS, SetupCommand.UP],
    [Service.IPFS_2, SetupCommand.UP],
    [Service.CONTRACTS_PREDEPLOYED, SetupCommand.UP],
    [Service.ETH_CONTRACTS_PREDEPLOYED, SetupCommand.UP],
    [Service.LIBS, SetupCommand.UP]
  ]

  const contractHealthChecksCommands = [
    [
      Service.CONTRACTS_PREDEPLOYED,
      SetupCommand.HEALTH_CHECK_RETRY,
      { waitSec: 3 }
    ],
    [
      Service.ETH_CONTRACTS_PREDEPLOYED,
      SetupCommand.HEALTH_CHECK_RETRY,
      { waitSec: 3 }
    ]
  ]

  if (buildSolana) {
    ipfsAndContractsCommands.push([Service.SOLANA_PROGRAMS, SetupCommand.UP])
  }

  const discoveryNodeUpCommands = []
  const discoveryNodeHealthCheckCommands = []
  const discoveryNodeRegisterCommands = []
  // Add discovery node commands
  for (
    let serviceNumber = 1;
    serviceNumber < numDiscoveryNodes + 1;
    serviceNumber++
  ) {
    discoveryNodeUpCommands.push([
      [
        Service.DISCOVERY_PROVIDER,
        SetupCommand.UP,
        { serviceNumber, ...options }
      ]
    ])
    discoveryNodeHealthCheckCommands.push([
      [
        Service.DISCOVERY_PROVIDER,
        SetupCommand.HEALTH_CHECK_RETRY,
        { serviceNumber, ...options }
      ]
    ])
    discoveryNodeRegisterCommands.push([
      [
        Service.DISCOVERY_PROVIDER,
        SetupCommand.REGISTER,
        { retries: 2, serviceNumber, ...options }
      ]
    ])
  }
  const nodeUpCommands = []
  const nodeHealthCheckCommands = []
  const nodeRegisterCommands = []
  // Add creator node commands
  for (
    let serviceNumber = 1;
    serviceNumber < numCreatorNodes + 1;
    serviceNumber++
  ) {
    nodeUpCommands.push([
      [
        Service.CREATOR_NODE,
        SetupCommand.UPDATE_DELEGATE_WALLET,
        { serviceNumber, ...options }
      ],
      [Service.CREATOR_NODE, SetupCommand.UP, { serviceNumber, ...options }]
    ])
    nodeHealthCheckCommands.push([
      [
        Service.CREATOR_NODE,
        SetupCommand.HEALTH_CHECK_RETRY,
        { serviceNumber, ...options }
      ]
    ])
    nodeRegisterCommands.push([
      [
        Service.CREATOR_NODE,
        SetupCommand.REGISTER,
        { serviceNumber, ...options }
      ]
    ])
  }

  const prereqs = [
    [Service.INIT_CONTRACTS_INFO, SetupCommand.UP],
    [Service.INIT_TOKEN_VERSIONS, SetupCommand.UP]
  ]
  // Add Identity Service commands
  nodeUpCommands.push([[Service.IDENTITY_SERVICE, SetupCommand.UP]])
  nodeHealthCheckCommands.push([
    [Service.IDENTITY_SERVICE, SetupCommand.HEALTH_CHECK_RETRY]
  ])

  // Add AAO commands
  if (withAAO) {
    nodeUpCommands.push([Service.AAO, SetupCommand.UP])
    if (buildDataEthContracts) {
      nodeRegisterCommands.push([Service.AAO, SetupCommand.REGISTER])
    }
  }

  const start = Date.now()

  // Start up the docker network `audius_dev` and the Solana test validator
  await runInSequence(setup, options)

  // Run parallel ops
  await runInParallel(ipfsAndContractsCommands, options)
  await runInParallel(contractHealthChecksCommands, options)
  if (buildDataEthContracts) {
    await runInSequence(prereqs, options)
  }

  if (parallel) {
    const runParallel = async (up, healthCheck, register) => {
      const startProv = Date.now()
      await Promise.all(
        up.map(commandGroup => runInSequence(commandGroup, options))
      )
      console.log(
        `Services provisioned in ${Math.abs(
          (Date.now() - startProv) / 1000.0
        )}s`.info
      )
      const startHealth = Date.now()
      console.log('Health checking services'.info)
      await Promise.all(
        healthCheck.map(commandGroup => runInSequence(commandGroup, options))
      )
      console.log(
        `Services health check complete in ${Math.abs(
          (Date.now() - startHealth) / 1000.0
        )}s`.info
      )
      const startRegister = Date.now()
      console.log('Registering services'.info)
      await runInSequence(register.flat())
      console.log(
        `Services registered in ${Math.abs(
          (Date.now() - startRegister) / 1000.0
        )}s`.info
      )
    }
    console.log('Provisioning DNs in parallel'.info)
    await runParallel(
      discoveryNodeUpCommands,
      discoveryNodeHealthCheckCommands,
      discoveryNodeRegisterCommands
    )
    console.log('Provisioning CNs, identity, etc in parallel'.info)
    await runParallel(
      nodeUpCommands,
      nodeHealthCheckCommands,
      nodeRegisterCommands
    )
  } else {
    console.log('Provisioning DNs in sequence.'.info)
    await runInSequence(discoveryNodeUpCommands.flat())
    console.log('Health checking DNs'.info)
    await runInSequence(discoveryNodeHealthCheckCommands.flat())
    console.log('Registering DNs'.info)
    await runInSequence(discoveryNodeRegisterCommands.flat())
    console.log('Provisioning services in sequence.'.info)
    await runInSequence(nodeUpCommands.flat())
    console.log('Health checking services'.info)
    await runInSequence(nodeHealthCheckCommands.flat())
    console.log('Registering services'.info)
    await runInSequence(nodeRegisterCommands.flat())
  }

  const durationSeconds = Math.abs((Date.now() - start) / 1000)
  console.log(`All services brought up in ${durationSeconds}s`.happy)
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
