const AudiusLibs = require('@audius/libs')
const config = require('../config/config')
const untildify = require('untildify')
const Web3 = require('web3')

/**
 * Picks up envvars written by contracts init and loads them into convict
 */
const loadLibsVars = () => {
  const configDir = untildify(config.get('audius_config_dir'))
  const dataConfig = `${configDir}/config.json`
  const ethConfig = `${configDir}/eth-config.json`
  try {
    const dataConfigJson = require(dataConfig)
    const ethConfigJson = require(ethConfig)

    const convictConfig = {
      registry_address: dataConfigJson.registryAddress,
      owner_wallet: dataConfigJson.ownerWallet,
      eth_token_address: ethConfigJson.audiusTokenAddress,
      eth_owner_wallet: ethConfigJson.ownerWallet,
      eth_registry_address: ethConfigJson.registryAddress,
      data_wallets: dataConfigJson.allWallets
    }

    config.load(convictConfig)
  } catch (e) {
    console.log(`Failed to initialize libs, ${e}`)
  }
}

loadLibsVars()

// Public

/**
 * Constructor for a new LibsWrapper.
 *
 * Every instance of a LibsWrapper is tied to a single wallet, and thus a single user. Multiple instances of LibsWrappers can exist.
 * Each method may throw.
 * @param {*} walletIndex Ganache can be setup with multiple pre-created wallets. WalletIndex lets you pick which wallet to use for libs.
 */
function LibsWrapper(walletIndex = 0) {
  this.libsInstance = null

  const assertLibsDidInit = () => {
    if (!this.libsInstance) throw new Error('Error: libs not initialized!')
  }

  /**
   * Initialize libs. Must be called before any libs operations, or getting the libs instance.
   * LibsWrapper Will throw is this invariant is violated.
   */
  this.initLibs = async () => {
    // If we've already initted, immediately return
    if (this.libsInstance) return

    const [
      // POA Registry
      REGISTRY_ADDRESS,
      // Gateway for POA calls.
      WEB3_PROVIDER_URLS,
      ETH_TOKEN_ADDRESS,
      ETH_REGISTRY_ADDRESS,
      ETH_PROVIDER_URL,
      ETH_OWNER_WALLET,
      DISCPROV_WHITELIST,
      USER_NODE,
      IDENTITY_SERVICE
    ] = [
      config.get('registry_address'),
      config.get('web3_provider_urls'),
      config.get('eth_token_address'),
      config.get('eth_registry_address'),
      config.get('eth_provider_url'),
      config.get('eth_owner_wallet'),
      new Set(config.get('discprov_whitelist').split(',')),
      config.get('user_node'),
      config.get('identity_service')
    ]

    const dataWeb3 = new Web3(
      new Web3.providers.HttpProvider(WEB3_PROVIDER_URLS)
    )

    const walletAddress = config.get('data_wallets')[walletIndex]
    const web3Config = await AudiusLibs.configExternalWeb3(
      REGISTRY_ADDRESS,
      dataWeb3,
      null /* networkId */,
      walletAddress /* wallet override */
    )

    const ethWeb3Config = AudiusLibs.configEthWeb3(
      ETH_TOKEN_ADDRESS,
      ETH_REGISTRY_ADDRESS,
      ETH_PROVIDER_URL,
      ETH_OWNER_WALLET
    )
    const discoveryProviderConfig = AudiusLibs.configDiscoveryProvider(
      false,
      DISCPROV_WHITELIST
    )

    const creatorNodeConfig = AudiusLibs.configCreatorNode(USER_NODE, true)
    const identityServiceConfig = AudiusLibs.configIdentityService(
      IDENTITY_SERVICE
    )

    const libs = new AudiusLibs({
      web3Config,
      ethWeb3Config,
      discoveryProviderConfig,
      identityServiceConfig,
      creatorNodeConfig,
      isServer: true
    })

    try {
      await libs.init()
      this.libsInstance = libs
    } catch (e) {
      console.log(`Error initting libs: ${e.message}`)
    }
  }

  /**
   * Signs up a user.
   * @param {*} args metadata describing a user.
   */
  this.signUp = async ({ metadata }) => {
    assertLibsDidInit()
    return await this.libsInstance.Account.signUp(
      metadata.email,
      metadata.password,
      metadata,
      false /* is creator */,
      null /* profile picture */,
      null /* cover photo */,
      false /* has wallet */,
      null /* host */,
      false /* generate recovery info */
    )
  }

  /**
   * Upgrades the current user for this LibsWrapper to a creator.
   *
   * @param {*} args endpoint to upgrade to, current userNode endpoint.
   */
  this.upgradeToCreator = async ({ endpoint, userNode }) => {
    assertLibsDidInit()
    return this.libsInstance.User.upgradeToCreator(userNode, endpoint)
  }

  /**
   * Selects a primary and set of secondaries from set of valid nodes on chain.
   *
   * @param {*} args number of nodes to include in replica set, whitelist of nodes to select from, blacklist of nodes to exclude
   */
  this.autoSelectCreatorNodes = async ({
    numberOfNodes,
    whitelist,
    blacklist
  }) => {
    assertLibsDidInit()
    return this.libsInstance.ServiceProvider.autoSelectCreatorNodes(
      numberOfNodes,
      whitelist,
      blacklist
    )
  }

  /**
   * Upload a track.
   *
   * @param {*} args trackFile and metadata
   * @returns trackId
   * @throws any libs error
   */
  this.uploadTrack = async ({ trackFile, trackMetadata }) => {
    assertLibsDidInit()

    const { trackId, error } = await this.libsInstance.Track.uploadTrack(
      trackFile,
      null /* image */,
      trackMetadata,
      () => {} /* on progress */
    )
    if (error) throw error
    return trackId
  }

  /**
   * Fetch track metadata from discprov.
   * @param {*} trackId
   * @returns track metadata
   */
  this.getTrack = async trackId => {
    assertLibsDidInit()
    const tracks = await this.libsInstance.discoveryProvider.getTracks(
      1 /* Limit */,
      0 /* Ofset */,
      [trackId] /* idsArray */,
      null /* targetUserId */,
      null /* sort */,
      null /* minBlockNumber */,
      null /* filterDeleted */,
      true /* withUsers */
    )
    if (!tracks.length) {
      throw new Error('No tracks returned.')
    }
    return tracks[0]
  }

  /**
   * Fetch user metadata from discprov
   * @param {*} userId
   * @return user metadata
   */
  this.getUser = async userId => {
    assertLibsDidInit()
    const users = await this.libsInstance.User.getUsers(
      1 /* limit */,
      0 /* offset */,
      [userId]
    )
    if (!users.length) {
      throw new Error('No users!')
    }
    return users[0]
  }
}

module.exports = { LibsWrapper }
