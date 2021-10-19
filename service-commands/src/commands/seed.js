const AudiusLibs = require('@audius/libs')

// CONFIG - from sauron https://github.com/AudiusProject/sauron/blob/master/config.js
// Dummy values
const ETH_REGISTRY_ADDRESS = ''
const ETH_TOKEN_ADDRESS = ''
const ETH_OWNER_WALLET = ''
const DATA_CONTRACTS_REGISTRY_ADDRESS = ''
const ETH_PROVIDER_ENDPOINT = ''

const getLibsConfig = () => {
  const contentNodeAllowlist = process.env.CONTENT_NODE_ALLOWLIST
    ? new Set(process.env.CONTENT_NODE_ALLOWLIST.split(','))
    : undefined
    // TODO do these process env vars all come from services being up?
  const audiusLibsConfig = {
    ethWeb3Config: AudiusLibs.configEthWeb3(
      process.env.ETH_TOKEN_ADDRESS || ETH_TOKEN_ADDRESS,
      process.env.ETH_REGISTRY_ADDRESS || ETH_REGISTRY_ADDRESS,
      process.env.ETH_PROVIDER_ENDPOINT || ETH_PROVIDER_ENDPOINT,
      process.env.ETH_OWNER_WALLET || ETH_OWNER_WALLET
    ),
    web3Config: AudiusLibs.configInternalWeb3(
      process.env.DATA_CONTRACTS_REGISTRY_ADDRESS || DATA_CONTRACTS_REGISTRY_ADDRESS,
      [process.env.DATA_CONTRACTS_PROVIDER_ENDPOINT]
    ),
    creatorNodeConfig: AudiusLibs.configCreatorNode(
      process.env.USER_METADATA_ENDPOINT,
      true,
      contentNodeAllowlist
    ),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(),
    identityServiceConfig: AudiusLibs.configIdentityService(
      process.env.IDENTITY_SERVICE_ENDPOINT,
      false
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true,
    useTrackContentPolling: true
  }

  return audiusLibsConfig
}
// TODO move these to utils.js
const camelToKebabCase = str => str
    .replace(/([A-Z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

const kebabToCamelCase = str => str.replace(/-./g, x => x[1].toUpperCase())

const isUpperCase = char => char !== char.toLowerCase() && char === char.toUpperCase()

const getParamNames = func => {
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
    const ARGUMENT_NAMES = /([^\s,]+)/g
    let fnStr = func.toString().replace(STRIP_COMMENTS, '')
    let paramNames = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES)
    if (paramNames === null) {
        paramNames = []
    }
    return paramNames
}

const setupCommands = (api, apiName, program) => {
    const apiMethods = Object.getOwnPropertyNames(api).filter(prop => typeof api[prop] === 'function')
    console.log(apiMethods)
    apiMethods.forEach(fn => {
        const params = getParamNames(api[fn])
        const cliApiName = camelToKebabCase(apiName)
        const cliMethodName = camelToKebabCase(fn)
        console.log('PARAMS', params, fn)
        let cmd = program.command(`seed ${cliApiName} ${cliMethodName}`)
        params.forEach(p => {
            const optionName = camelToKebabCase(p)
            console.log('PARAM', p, optionName)
            cmd = cmd
            .option(`--${optionName} <value>`)
        })
        cmd.action((options) => {
            console.log("options", options.opts())
            api[fn](options.opts()) // TODO figure out option ordering dynamically
        })
    })
}
// TODO should the below be derived dynamically?
const LIBS_API_CLASSES = [
    'Account',
    'User',
    'Track',
    'Playlist',
    'File',
    'Challenge'
  ]
const Seed = {}

Seed.init = async () => {
    const libsConfig = getLibsConfig()
    this.libs = new AudiusLibs(libsConfig)
    // await this.libs.init() // TODO troubleshoot why libs.init isn't working
    this.mapOfUserIdsToEntropyKeys = {}
    // TODO set up seed dump file
}

Seed.clearSession = async () => {
    this.libs = undefined
    this.mapOfUserIdsToEntropyKeys = {}
}

Seed.setUser = async (userId) => {
    const newEntropyKey = this.mapOfUserIdsToEntropyKeys[userId]
    // TODO set entropy key in localStorage (node-localstorage)
    await this.libs.init()
}

Seed.setupCommands = (program) => {
    LIBS_API_CLASSES.forEach(className => {
        const api = this.libs[className]
        setupCommands(api, className, program) // TODO why aren't libs API classes appearing? maybe not instantiating correclty
    })
}

// TODO seed with --file argument that parses JSON or iterates through?
module.exports = Seed

