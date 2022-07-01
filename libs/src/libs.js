const packageJSON = require('../package.json')

const { EthWeb3Manager } = require('./services/ethWeb3Manager')
const { SolanaAudiusData } = require('./services/solanaAudiusData/index')
const { Web3Manager } = require('./services/web3Manager')
const { EthContracts } = require('./services/ethContracts')
const SolanaWeb3Manager = require('./services/solanaWeb3Manager/index')
const { AudiusContracts } = require('./services/dataContracts')
const { IdentityService } = require('./services/identity')
const { Comstock } = require('./services/comstock')
const { Hedgehog } = require('./services/hedgehog')
const { CreatorNode } = require('./services/creatorNode')
const { DiscoveryProvider } = require('./services/discoveryProvider')
const Wormhole = require('./services/wormhole')
const { AudiusABIDecoder } = require('./services/ABIDecoder')
const { SchemaValidator } = require('./services/schemaValidator')
const { UserStateManager } = require('./userStateManager')
const SanityChecks = require('./sanityChecks')
const { Utils, Captcha } = require('./utils')

const Account = require('./api/account')
const User = require('./api/user')
const Track = require('./api/track')
const Playlist = require('./api/playlist')
const File = require('./api/file')
const Rewards = require('./api/rewards')
const ServiceProvider = require('./api/serviceProvider')
const Web3 = require('./web3')
const SolanaUtils = require('./services/solanaWeb3Manager/utils')

const { Keypair } = require('@solana/web3.js')
const { PublicKey } = require('@solana/web3.js')
const {
  RewardsAttester
} = require('./services/solanaWeb3Manager/rewardsAttester')
const { Reactions } = require('./api/reactions')
const { getPlatformLocalStorage } = require('./utils/localStorage')

class AudiusLibs {
  /**
   * Configures an identity service wrapper
   * @param {string} url
   * @param {boolean?} useHedgehogLocalStorage whether or not to read hedgehog entropy in local storage
   */
  static configIdentityService(url, useHedgehogLocalStorage = true) {
    return { url, useHedgehogLocalStorage }
  }

  /**
   * Configures an identity service wrapper
   * @param {string} url
   */
  static configComstock(url) {
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
  static configCreatorNode(
    fallbackUrl,
    lazyConnect = false,
    passList = null,
    blockList = null,
    monitoringCallbacks = {}
  ) {
    return {
      fallbackUrl,
      lazyConnect,
      passList,
      blockList,
      monitoringCallbacks
    }
  }

  /**
   * Configures an external web3 to use with Audius Libs (e.g. MetaMask)
   * @param {string} registryAddress
   * @param {Object} web3Provider equal to web.currentProvider
   * @param {?number} networkId network chain id
   * @param {?string} walletOverride wallet address to force use instead of the first wallet on the provided web3
   * @param {?number} walletIndex if using a wallet returned from web3, pick the wallet at this index
   */
  static async configExternalWeb3(
    registryAddress,
    web3Provider,
    networkId,
    walletOverride = null
  ) {
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
  static configInternalWeb3(registryAddress, providers, privateKey) {
    let providerList
    if (typeof providers === 'string') {
      providerList = providers.split(',')
    } else if (providers instanceof Web3) {
      providerList = [providers]
    } else if (Array.isArray(providers)) {
      providerList = providers
    } else {
      throw new Error(
        'Providers must be of type string, Array, or Web3 instance'
      )
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
  static configEthWeb3(
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
      throw new Error(
        'Providers must be of type string, Array, or Web3 instance'
      )
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
   * Configures wormhole
   * @param {Object} config
   * @param {string | Array<string>} config.rpcHosts
   * @param {string} config.solBridgeAddress
   * @param {string} config.solTokenBridgeAddress
   * @param {string} config.ethBridgeAddress
   * @param {string} config.ethTokenBridgeAddress
   */
  static configWormhole({
    rpcHosts,
    solBridgeAddress,
    solTokenBridgeAddress,
    ethBridgeAddress,
    ethTokenBridgeAddress
  }) {
    let rpcHostList
    if (typeof rpcHosts === 'string') {
      rpcHostList = rpcHosts.split(',')
    } else if (Array.isArray(rpcHosts)) {
      rpcHostList = rpcHosts
    } else {
      throw new Error('rpcHosts must be of type string or Array')
    }
    return {
      rpcHosts: rpcHostList,
      solBridgeAddress,
      solTokenBridgeAddress,
      ethBridgeAddress,
      ethTokenBridgeAddress
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
   * @param {Uint8Array} feePayerSecretKeys fee payer secret keys, if client wants to switch between different fee payers during relay
   * @param {number} confirmationTimeout solana web3 connection confirmationTimeout in ms
   * @param {PublicKey|string} audiusDataAdminStorageKeypairPublicKey admin storage PK for audius-data program
   * @param {PublicKey|string} audiusDataProgramId program ID for the audius-data Anchor program
   * @param {Idl} audiusDataIdl IDL for the audius-data Anchor program.
   */
  static configSolanaWeb3({
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
    feePayerSecretKeys,
    confirmationTimeout,
    audiusDataAdminStorageKeypairPublicKey,
    audiusDataProgramId,
    audiusDataIdl
  }) {
    if (audiusDataAdminStorageKeypairPublicKey instanceof String) {
      audiusDataAdminStorageKeypairPublicKey = new PublicKey(
        audiusDataAdminStorageKeypairPublicKey
      )
    }
    if (audiusDataProgramId instanceof String) {
      audiusDataProgramId = new PublicKey(audiusDataProgramId)
    }
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
      feePayerKeypairs: feePayerSecretKeys
        ? feePayerSecretKeys.map((key) => Keypair.fromSecretKey(key))
        : null,
      confirmationTimeout,
      audiusDataAdminStorageKeypairPublicKey,
      audiusDataProgramId,
      audiusDataIdl
    }
  }

  /**
   * Configures a solana audius-data
   * @param {Object} config
   * @param {string} config.programId Program ID of the audius data program
   * @param {string} config.adminAccount Public Key of admin account
   */
  static configSolanaAudiusData({ programId, adminAccount }) {
    return {
      programId,
      adminAccount
    }
  }

  /**
   * Constructs an Audius Libs instance with configs.
   * Unless default-valued, all configs are optional.
   * @example
   *  const audius = AudiusLibs({
   *    discoveryProviderConfig: {},
   *    creatorNodeConfig: configCreatorNode('https://my-creator.node')
   *  })
   *  await audius.init()
   */
  constructor({
    web3Config,
    ethWeb3Config,
    solanaWeb3Config,
    solanaAudiusDataConfig,
    identityServiceConfig,
    discoveryProviderConfig,
    creatorNodeConfig,
    comstockConfig,
    wormholeConfig,
    captchaConfig,
    isServer,
    logger = console,
    isDebug = false,
    preferHigherPatchForPrimary = true,
    preferHigherPatchForSecondaries = true,
    localStorage = getPlatformLocalStorage()
  }) {
    // set version

    this.version = packageJSON.version

    this.ethWeb3Config = ethWeb3Config
    this.web3Config = web3Config
    this.solanaWeb3Config = solanaWeb3Config
    this.solanaAudiusDataConfig = solanaAudiusDataConfig
    this.identityServiceConfig = identityServiceConfig
    this.creatorNodeConfig = creatorNodeConfig
    this.discoveryProviderConfig = discoveryProviderConfig
    this.comstockConfig = comstockConfig
    this.wormholeConfig = wormholeConfig
    this.captchaConfig = captchaConfig
    this.isServer = isServer
    this.isDebug = isDebug
    this.logger = logger

    this.AudiusABIDecoder = AudiusABIDecoder
    this.Utils = Utils

    // Services to initialize. Initialized in .init().
    this.userStateManager = null
    this.identityService = null
    this.hedgehog = null
    this.discoveryProvider = null
    this.ethWeb3Manager = null
    this.ethContracts = null
    this.web3Manager = null
    this.solanaWeb3Manager = null
    this.anchorAudiusData = null
    this.contracts = null
    this.creatorNode = null

    // API
    this.Account = null
    this.User = null
    this.Track = null
    this.Playlist = null
    this.File = null
    this.Rewards = null
    this.Reactions = null

    this.preferHigherPatchForPrimary = preferHigherPatchForPrimary
    this.preferHigherPatchForSecondaries = preferHigherPatchForSecondaries
    this.localStorage = localStorage

    // Schemas
    const schemaValidator = new SchemaValidator()
    schemaValidator.init()
    this.schemas = schemaValidator.getSchemas()
  }

  /** Init services based on presence of a relevant config. */
  async init() {
    this.userStateManager = new UserStateManager({
      localStorage: this.localStorage
    })
    // Config external web3 is an async function, so await it here in case it needs to be
    this.web3Config = await this.web3Config

    /** Captcha */
    if (this.captchaConfig) {
      this.captcha = new Captcha(this.captchaConfig)
    }

    /** Identity Service */
    if (this.identityServiceConfig) {
      this.identityService = new IdentityService({
        identityServiceEndpoint: this.identityServiceConfig.url,
        captcha: this.captcha
      })
      const hedgehogService = new Hedgehog({
        identityService: this.identityService,
        useLocalStorage: this.identityServiceConfig.useHedgehogLocalStorage
      })
      this.hedgehog = hedgehogService.instance
    } else if (this.web3Config && !this.web3Config.useExternalWeb3) {
      throw new Error('Identity Service required for internal Web3')
    }

    /** Web3 Managers */
    if (this.ethWeb3Config) {
      this.ethWeb3Manager = new EthWeb3Manager({
        web3Config: this.ethWeb3Config,
        identityService: this.identityService,
        hedgehog: this.hedgehog
      })
    }
    if (this.web3Config) {
      this.web3Manager = new Web3Manager({
        web3Config: this.web3Config,
        identityService: this.identityService,
        hedgehog: this.hedgehog,
        isServer: this.isServer
      })
      await this.web3Manager.init()
      if (this.identityService) {
        this.identityService.setWeb3Manager(this.web3Manager)
      }
    }
    if (this.solanaWeb3Config) {
      this.solanaWeb3Manager = new SolanaWeb3Manager(
        this.solanaWeb3Config,
        this.identityService,
        this.web3Manager
      )
      await this.solanaWeb3Manager.init()
    }
    if (this.solanaWeb3Manager && this.solanaAudiusDataConfig) {
      this.solanaAudiusData = new SolanaAudiusData(
        this.solanaAudiusDataConfig,
        this.solanaWeb3Manager,
        this.web3Manager
      )
      await this.solanaAudiusData.init()
    }

    /** Contracts - Eth and Data Contracts */
    const contractsToInit = []
    if (this.ethWeb3Manager) {
      this.ethContracts = new EthContracts({
        ethWeb3Manager: this.ethWeb3Manager,
        tokenContractAddress: this.ethWeb3Config
          ? this.ethWeb3Config.tokenAddress
          : null,
        registryAddress: this.ethWeb3Config
          ? this.ethWeb3Config.registryAddress
          : null,
        claimDistributionContractAddress:
          (this.ethWeb3Config &&
            this.ethWeb3Config.claimDistributionContractAddress) ||
          null,
        wormholeContractAddress:
          (this.ethWeb3Config && this.ethWeb3Config.wormholeContractAddress) ||
          null,
        isServer: this.isServer,
        logger: this.logger,
        isDebug: this.isDebug
      })
      contractsToInit.push(this.ethContracts.init())
    }
    if (this.web3Manager) {
      this.contracts = new AudiusContracts(
        this.web3Manager,
        this.web3Config ? this.web3Config.registryAddress : null,
        this.isServer,
        this.logger
      )
      contractsToInit.push(this.contracts.init())
    }
    await Promise.all(contractsToInit)
    if (
      this.wormholeConfig &&
      this.ethWeb3Manager &&
      this.ethContracts &&
      this.solanaWeb3Manager
    ) {
      this.wormholeClient = new Wormhole(
        this.hedgehog,
        this.ethWeb3Manager,
        this.ethContracts,
        this.identityService,
        this.solanaWeb3Manager,
        this.wormholeConfig.rpcHosts,
        this.wormholeConfig.solBridgeAddress,
        this.wormholeConfig.solTokenBridgeAddress,
        this.wormholeConfig.ethBridgeAddress,
        this.wormholeConfig.ethTokenBridgeAddress,
        this.isServer
      )
    }

    /** Discovery Provider */
    if (this.discoveryProviderConfig) {
      this.discoveryProvider = new DiscoveryProvider({
        userStateManager: this.userStateManager,
        ethContracts: this.ethContracts,
        web3Manager: this.web3Manager,
        localStorage: this.localStorage,
        ...this.discoveryProviderConfig
      })
      await this.discoveryProvider.init()
    }

    /** Creator Node */
    if (this.creatorNodeConfig) {
      const currentUser = this.userStateManager.getCurrentUser()
      const creatorNodeEndpoint = currentUser
        ? CreatorNode.getPrimary(currentUser.creator_node_endpoint) ||
          this.creatorNodeConfig.fallbackUrl
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
        this.creatorNodeConfig.monitoringCallbacks
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
      this.anchorAudiusData,
      this.wormholeClient,
      this.creatorNode,
      this.comstock,
      this.captcha,
      this.isServer,
      this.logger
    ]
    this.ServiceProvider = new ServiceProvider(...services)
    this.User = new User(
      this.ServiceProvider,
      this.preferHigherPatchForPrimary,
      this.preferHigherPatchForSecondaries,
      ...services
    )
    this.Account = new Account(this.User, ...services)
    this.Track = new Track(...services)
    this.Playlist = new Playlist(...services)
    this.File = new File(this.User, ...services)
    this.Rewards = new Rewards(this.ServiceProvider, ...services)
    this.Reactions = new Reactions(...services)
  }
}

// This is needed to ensure default and named exports are handled correctly by rollup
// https://github.com/rollup/plugins/tree/master/packages/commonjs#defaultismoduleexports
// exports.__esModule = true

module.exports = AudiusLibs

module.exports.AudiusABIDecoder = AudiusABIDecoder
module.exports.Utils = Utils
module.exports.SolanaUtils = SolanaUtils
module.exports.SanityChecks = SanityChecks
module.exports.RewardsAttester = RewardsAttester
module.exports.CreatorNode = CreatorNode
