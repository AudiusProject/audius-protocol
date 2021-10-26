const packageJSON = require('../package.json')

const EthWeb3Manager = require('./services/ethWeb3Manager/index')
const Web3Manager = require('./services/web3Manager/index')
const EthContracts = require('./services/ethContracts/index')
const SolanaWeb3Manager = require('./services/solanaWeb3Manager/index')
const AudiusContracts = require('./services/dataContracts/index')
const IdentityService = require('./services/identity/index')
const Comstock = require('./services/comstock/index')
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
const Challenge = require('./api/challenge')
const ServiceProvider = require('./api/serviceProvider')
const Web3 = require('./web3')
const Captcha = require('./utils/captcha')
const SolanaUtils = require('./services/solanaWeb3Manager/utils')

const { Keypair } = require('@solana/web3.js')

class AudiusLibs {
  /**
   * Configures a discovery provider wrapper
   * @param {Set<string>?} whitelist whether or not to include only specified nodes (default no whitelist)
   * @param {Set<string>?} blacklist whether or not to exclude specified nodes (default no blacklist)
   * @param {number?} reselectTimeout timeout to clear locally cached discovery providers
   * @param {(selection: string) => void?} selectionCallback invoked with the select discovery provider
   * @param {object?} monitoringCallbacks callbacks to be invoked with metrics from requests sent to a service
   *  @param {function} monitoringCallbacks.request
   *  @param {function} monitoringCallbacks.healthCheck
   * @param {number?} selectionRequestTimeout the amount of time (ms) an individual request should take before reselecting
   * @param {number?} selectionRequestRetries the number of retries to a given discovery node we make before reselecting
   */
  static configDiscoveryProvider (
    whitelist = null,
    blacklist = null,
    reselectTimeout = null,
    selectionCallback = null,
    monitoringCallbacks = {},
    selectionRequestTimeout = null,
    selectionRequestRetries = null
  ) {
    return {
      whitelist,
      blacklist,
      reselectTimeout,
      selectionCallback,
      monitoringCallbacks,
      selectionRequestTimeout,
      selectionRequestRetries
    }
  }

  /**
   * Configures an identity service wrapper
   * @param {string} url
   * @param {boolean?} useHedgehogLocalStorage whether or not to read hedgehog entropy in local storage
   */
  static configIdentityService (url, useHedgehogLocalStorage = true) {
    return { url, useHedgehogLocalStorage }
  }

  /**
   * Configures an identity service wrapper
   * @param {string} url
   */
  static configComstock (url) {
    return { url }
  }

  /**
   * Configures a creator node wrapper
   * @param {string} fallbackUrl creator node endpoint to fall back to on requests
   * @param {boolean} lazyConnect whether to delay connection to the node until the first
   * request that requires a connection is made.
   * @param {Set<string>?} passList whether or not to include only specified nodes (default null)
   * @param {Set<string>?} blockList whether or not to exclude any nodes (default null)
   * @param {object?} monitoringCallbacks callbacks to be invoked with metrics from requests sent to a service
   * @param {function} monitoringCallbacks.request
   * @param {function} monitoringCallbacks.healthCheck
   */
  static configCreatorNode (
    fallbackUrl,
    lazyConnect = false,
    passList = null,
    blockList = null,
    monitoringCallbacks = {}
  ) {
    return { fallbackUrl, lazyConnect, passList, blockList, monitoringCallbacks }
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
   * @param {string | Web3 | Array<string>} providers web3 provider endpoint(s)
   */
  static configInternalWeb3 (registryAddress, providers, privateKey) {
    let providerList
    if (typeof providers === 'string') {
      providerList = providers.split(',')
    } else if (providers instanceof Web3) {
      providerList = [providers]
    } else if (Array.isArray(providers)) {
      providerList = providers
    } else {
      throw new Error('Providers must be of type string, Array, or Web3 instance')
    }

    return {
      registryAddress,
      useExternalWeb3: false,
      internalWeb3Config: {
        web3ProviderEndpoints: providerList,
        privateKey
      }
    }
  }

  /**
   * Configures an eth web3
   * @param {string} tokenAddress
   * @param {string} registryAddress
   * @param {string | Web3 | Array<string>} providers web3 provider endpoint(s)
   * @param {string?} ownerWallet optional owner wallet to establish who we are sending transactions on behalf of
   * @param {string?} claimDistributionContractAddress
   * @param {string?} wormholeContractAddress
   */
  static configEthWeb3 (
    tokenAddress,
    registryAddress,
    providers,
    ownerWallet,
    claimDistributionContractAddress,
    wormholeContractAddress
  ) {
    let providerList
    if (typeof providers === 'string') {
      providerList = providers.split(',')
    } else if (providers instanceof Web3) {
      providerList = [providers]
    } else if (Array.isArray(providers)) {
      providerList = providers
    } else {
      throw new Error('Providers must be of type string, Array, or Web3 instance')
    }

    return {
      tokenAddress,
      registryAddress,
      providers: providerList,
      ownerWallet,
      claimDistributionContractAddress,
      wormholeContractAddress
    }
  }

  /**
   * Configures a solana web3
   * @param {Object} config
   * @param {string} config.solanaClusterEndpoint the RPC endpoint to make requests against
   * @param {string} config.mintAddress wAudio mint address
   * @param {string} solanaTokenAddress native solana token program
   * @param {string} claimableTokenPDA the generated program derived address we use so our
   *  bank program can take ownership of accounts
   * @param {string} feePayerAddress address for the fee payer for transactions
   * @param {string} claimableTokenProgramAddress address of the audius user bank program
   * @param {string} rewardsManagerProgramId address for the Rewards Manager program
   * @param {string} rewardsManagerProgramPDA Rewards Manager PDA
   * @param {string} rewardsManagerTokenPDA The PDA of the rewards manager funds holder account
   * @param {boolean} useRelay Whether to use identity as a relay or submit transactions locally
   * @param {Uint8Array} [feePayerSecretKey] optional fee payer secret key, if not using relay
   */
  static configSolanaWeb3 ({
    solanaClusterEndpoint,
    mintAddress,
    solanaTokenAddress,
    claimableTokenPDA,
    feePayerAddress,
    claimableTokenProgramAddress,
    rewardsManagerProgramId,
    rewardsManagerProgramPDA,
    rewardsManagerTokenPDA,
    useRelay,
    feePayerSecretKey = null
  }) {
    return {
      solanaClusterEndpoint,
      mintAddress,
      solanaTokenAddress,
      claimableTokenPDA,
      feePayerAddress,
      claimableTokenProgramAddress,
      rewardsManagerProgramId,
      rewardsManagerProgramPDA,
      rewardsManagerTokenPDA,
      useRelay,
      feePayerKeypair: feePayerSecretKey ? Keypair.fromSecretKey(feePayerSecretKey) : null
    }
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
    solanaWeb3Config,
    identityServiceConfig,
    discoveryProviderConfig,
    creatorNodeConfig,
    comstockConfig,
    captchaConfig,
    isServer,
    isDebug = false,
    useTrackContentPolling = false,
    useResumableTrackUpload = false
  }) {
    // set version
    this.version = packageJSON.version

    this.ethWeb3Config = ethWeb3Config
    this.web3Config = web3Config
    this.solanaWeb3Config = solanaWeb3Config
    this.identityServiceConfig = identityServiceConfig
    this.creatorNodeConfig = creatorNodeConfig
    this.discoveryProviderConfig = discoveryProviderConfig
    this.comstockConfig = comstockConfig
    this.captchaConfig = captchaConfig
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
    this.solanaWeb3Manager = null
    this.contracts = null
    this.creatorNode = null

    // API
    this.Account = null
    this.User = null
    this.Track = null
    this.Playlist = null
    this.File = null
    this.Challenge = null

    this.useTrackContentPolling = useTrackContentPolling
    this.useResumableTrackUpload = useResumableTrackUpload

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

    /** Captcha */
    if (this.captchaConfig) {
      this.captcha = new Captcha(this.captchaConfig)
    }

    /** Identity Service */
    if (this.identityServiceConfig) {
      this.identityService = new IdentityService(this.identityServiceConfig.url, this.captcha)
      this.hedgehog = new Hedgehog(this.identityService, this.identityServiceConfig.useHedgehogLocalStorage)
    } else if (this.web3Config && !this.web3Config.useExternalWeb3) {
      throw new Error('Identity Service required for internal Web3')
    }

    /** Web3 Managers */
    if (this.ethWeb3Config) {
      this.ethWeb3Manager = new EthWeb3Manager(
        this.ethWeb3Config,
        this.identityService,
        this.hedgehog
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
    if (this.solanaWeb3Config && this.web3Manager) {
      this.solanaWeb3Manager = new SolanaWeb3Manager(
        this.solanaWeb3Config,
        this.identityService,
        this.web3Manager
      )
      await this.solanaWeb3Manager.init()
    }

    /** Contracts - Eth and Data Contracts */
    let contractsToInit = []
    if (this.ethWeb3Manager) {
      this.ethContracts = new EthContracts(
        this.ethWeb3Manager,
        this.ethWeb3Config ? this.ethWeb3Config.tokenAddress : null,
        this.ethWeb3Config ? this.ethWeb3Config.registryAddress : null,
        (this.ethWeb3Config && this.ethWeb3Config.claimDistributionContractAddress) || null,
        (this.ethWeb3Config && this.ethWeb3Config.wormholeContractAddress) || null,
        this.isServer,
        this.isDebug
      )
      contractsToInit.push(this.ethContracts.init())
    }
    if (this.web3Manager) {
      this.contracts = new AudiusContracts(
        this.web3Manager,
        this.web3Config ? this.web3Config.registryAddress : null,
        this.isServer
      )
      contractsToInit.push(this.contracts.init())
    }
    await Promise.all(contractsToInit)

    /** Discovery Provider */
    if (this.discoveryProviderConfig) {
      this.discoveryProvider = new DiscoveryProvider(
        this.discoveryProviderConfig.whitelist,
        this.discoveryProviderConfig.blacklist,
        this.userStateManager,
        this.ethContracts,
        this.web3Manager,
        this.discoveryProviderConfig.reselectTimeout,
        this.discoveryProviderConfig.selectionCallback,
        this.discoveryProviderConfig.monitoringCallbacks,
        this.discoveryProviderConfig.selectionRequestTimeout,
        this.discoveryProviderConfig.selectionRequestRetries
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
        this.schemas,
        this.creatorNodeConfig.passList,
        this.creatorNodeConfig.blockList,
        this.creatorNodeConfig.monitoringCallbacks,
        this.useTrackContentPolling,
        this.useResumableTrackUpload
      )
      await this.creatorNode.init()
    }

    /** Comstock */
    if (this.comstockConfig) {
      this.comstock = new Comstock(this.comstockConfig.url)
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
      this.solanaWeb3Manager,
      this.creatorNode,
      this.comstock,
      this.captcha,
      this.isServer
    ]
    this.ServiceProvider = new ServiceProvider(...services)
    this.User = new User(this.ServiceProvider, ...services)
    this.Account = new Account(this.User, ...services)
    this.Track = new Track(...services)
    this.Playlist = new Playlist(...services)
    this.File = new File(this.User, ...services)
    this.Challenge = new Challenge(...services)
  }
}

module.exports = AudiusLibs

module.exports.AudiusABIDecoder = AudiusABIDecoder
module.exports.Utils = Utils
module.exports.SolanaUtils = SolanaUtils
module.exports.SanityChecks = SanityChecks
