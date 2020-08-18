const packageJSON = require('../package.json')

const EthWeb3Manager = require('./services/ethWeb3Manager/index')
const Web3Manager = require('./services/web3Manager/index')
const EthContracts = require('./services/ethContracts/index')
const AudiusContracts = require('./services/dataContracts/index')
const IdentityService = require('./services/identity/index')
const Hedgehog = require('./services/hedgehog/index')
const CreatorNode = require('./services/creatorNode/index')
const DiscoveryProvider = require('./services/discoveryProvider/index')
const AudiusABIDecoder = require('./services/ABIDecoder/index')
const SchemaValidator = require('./services/schemaValidator')
const UserStateManager = require('./userStateManager')
const Utils = require('./utils')
const SanityChecks = require('./sanityChecks')

const Account = require('./api/account')
const User = require('./api/user')
const Track = require('./api/track')
const Playlist = require('./api/playlist')
const File = require('./api/file')
const ServiceProvider = require('./api/serviceProvider')

class AudiusLibs {
  /**
   * Configures a discovery provider wrapper
   * @param {Set<string>?} whitelist whether or not to include only specified nodes (default no whitelist)
   * @param {number?} reselectTimeout timeout to clear locally cached discovery providers
   * @param {(selection: string) => void?} selectionCallback invoked with the select discovery provider
   */
  static configDiscoveryProvider (whitelist = null, reselectTimeout = null, selectionCallback = null) {
    return { whitelist, reselectTimeout, selectionCallback }
  }

  /**
   * Configures an identity service wrapper
   * @param {string} url
   */
  static configIdentityService (url) {
    return { url }
  }

  /**
   * Configures a creator node wrapper
   * @param {string} fallbackUrl creator node endpoint to fall back to on requests
   * @param {boolean} lazyConnect whether to delay connection to the node until the first
   * request that requires a connection is made.
   */
  static configCreatorNode (fallbackUrl, lazyConnect = false) {
    return { fallbackUrl, lazyConnect }
  }

  /**
   * Configures an external web3 to use with Audius Libs (e.g. MetaMask)
   * @param {string} registryAddress
   * @param {Object} web3Provider equal to web.currentProvider
   * @param {?number} networkId network chain id
   * @param {?string} walletOverride wallet address to force use instead of the first wallet on the provided web3
   * @param {?number} walletIndex if using a wallet returned from web3, pick the wallet at this index
   */
  static async configExternalWeb3 (registryAddress, web3Provider, networkId, walletOverride = null) {
    const web3Instance = await Utils.configureWeb3(web3Provider, networkId)
    if (!web3Instance) {
      throw new Error('External web3 incorrectly configured')
    }
    const wallets = await web3Instance.eth.getAccounts()
    return {
      registryAddress,
      useExternalWeb3: true,
      externalWeb3Config: {
        web3: web3Instance,
        ownerWallet: walletOverride || wallets[0]
      }
    }
  }
  /**
   * Configures an internal web3 to use (via Hedgehog)
   * @param {string} registryAddress
   * @param {Array} allProviderUrls web3 provider endpoints
   */
  static configInternalWeb3 (registryAddress, allProviderUrls) {
    if (typeof allProviderUrls === 'string') {
      allProviderUrls = [allProviderUrls]
    }

    return {
      registryAddress,
      useExternalWeb3: false,
      internalWeb3Config: {
        web3ProviderEndpoints: allProviderUrls
      }
    }
  }

  /**
   * Configures an eth web3
   * @param {string} tokenAddress
   * @param {string} registryAddress
   * @param {object} url web3 provider endpoint
   * @param {string} ownerWallet
   */
  static configEthWeb3 (tokenAddress, registryAddress, url, ownerWallet) {
    return { tokenAddress, registryAddress, url, ownerWallet }
  }

  /**
   * Constructs an Audius Libs instance with configs.
   * Unless default-valued, all configs are optional.
   * @example
   *  const audius = AudiusLibs({
   *    discoveryProviderConfig: configDiscoveryProvider(),
   *    creatorNodeConfig: configCreatorNode('https://my-creator.node')
   *  })
   *  await audius.init()
   */
  constructor ({
    web3Config,
    ethWeb3Config,
    identityServiceConfig,
    discoveryProviderConfig,
    creatorNodeConfig,
    isServer,
    isDebug = false
  }) {
    // set version
    this.version = packageJSON.version

    this.ethWeb3Config = ethWeb3Config
    this.web3Config = web3Config
    this.identityServiceConfig = identityServiceConfig
    this.creatorNodeConfig = creatorNodeConfig
    this.discoveryProviderConfig = discoveryProviderConfig
    this.isServer = isServer
    this.isDebug = isDebug

    this.AudiusABIDecoder = AudiusABIDecoder

    // Services to initialize. Initialized in .init().
    this.userStateManager = null
    this.identityService = null
    this.hedgehog = null
    this.discoveryProvider = null
    this.ethWeb3Manager = null
    this.ethContracts = null
    this.web3Manager = null
    this.contracts = null
    this.creatorNode = null

    // API
    this.Account = null
    this.User = null
    this.Track = null
    this.Playlist = null
    this.File = null

    // Schemas
    const schemaValidator = new SchemaValidator()
    schemaValidator.init()
    this.schemas = schemaValidator.getSchemas()
  }

  /** Init services based on presence of a relevant config. */
  async init () {
    this.userStateManager = new UserStateManager()
    // Config external web3 is an async function, so await it here in case it needs to be
    this.web3Config = await this.web3Config

    /** Identity Service */
    if (this.identityServiceConfig) {
      this.identityService = new IdentityService(this.identityServiceConfig.url)
      this.hedgehog = new Hedgehog(this.identityService)
    } else if (this.web3Config && !this.web3Config.useExternalWeb3) {
      throw new Error('Identity Service required for internal Web3')
    }

    /** Web3 Managers */
    if (this.ethWeb3Config) {
      this.ethWeb3Manager = new EthWeb3Manager(
        this.ethWeb3Config
      )
    }
    if (this.web3Config) {
      this.web3Manager = new Web3Manager(
        this.web3Config,
        this.identityService,
        this.hedgehog,
        this.isServer
      )
      await this.web3Manager.init()
    }

    /** Contracts */
    let contractsToInit = []
    if (this.ethWeb3Manager) {
      this.ethContracts = new EthContracts(
        this.ethWeb3Manager,
        this.ethWeb3Config ? this.ethWeb3Config.tokenAddress : null,
        this.ethWeb3Config ? this.ethWeb3Config.registryAddress : null,
        this.isServer,
        this.isDebug
      )
      contractsToInit.push(this.ethContracts.init())
    }
    if (this.web3Manager) {
      this.contracts = new AudiusContracts(
        this.web3Manager,
        this.web3Config ? this.web3Config.registryAddress : null,
        this.isServer)
      contractsToInit.push(this.contracts.init())
    }
    await Promise.all(contractsToInit)

    /** Discovery Provider */
    if (this.discoveryProviderConfig) {
      this.discoveryProvider = new DiscoveryProvider(
        this.discoveryProviderConfig.whitelist,
        this.userStateManager,
        this.ethContracts,
        this.web3Manager,
        this.discoveryProviderConfig.reselectTimeout,
        this.discoveryProviderConfig.selectionCallback
      )
      await this.discoveryProvider.init()
    }

    /** Creator Node */
    if (this.creatorNodeConfig) {
      const currentUser = this.userStateManager.getCurrentUser()
      let creatorNodeEndpoint = currentUser
        ? CreatorNode.getPrimary(currentUser.creator_node_endpoint) || this.creatorNodeConfig.fallbackUrl
        : this.creatorNodeConfig.fallbackUrl

      this.creatorNode = new CreatorNode(
        this.web3Manager,
        creatorNodeEndpoint,
        this.isServer,
        this.userStateManager,
        this.creatorNodeConfig.lazyConnect,
        this.schemas)
      await this.creatorNode.init()
    }

    // Initialize apis
    const services = [
      this.userStateManager,
      this.identityService,
      this.hedgehog,
      this.discoveryProvider,
      this.web3Manager,
      this.contracts,
      this.ethWeb3Manager,
      this.ethContracts,
      this.creatorNode,
      this.isServer
    ]
    this.User = new User(...services)
    this.Account = new Account(this.User, ...services)
    this.Track = new Track(...services)
    this.Playlist = new Playlist(...services)
    this.File = new File(...services)
    this.ServiceProvider = new ServiceProvider(...services)
  }
}

module.exports = AudiusLibs

module.exports.AudiusABIDecoder = AudiusABIDecoder
module.exports.Utils = Utils
module.exports.SanityChecks = SanityChecks
