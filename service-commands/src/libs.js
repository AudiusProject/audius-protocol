const fs = require('fs')
const untildify = require('untildify')
const Web3 = require('web3')
const axios = require('axios')
const { libs: AudiusLibs } = require('@audius/sdk')
const { CreatorNode, Utils } = AudiusLibs
const config = require('../config/config')

const DISCOVERY_NODE_ENDPOINT = 'http://localhost:5000'
const MAX_INDEXING_TIMEOUT = 10000

/**
 * Picks up envvars written by contracts init and loads them into convict
 */
const loadLibsVars = () => {
  const configDir = untildify(config.get('audius_config_dir'))
  const dataConfig = `${configDir}/config.json`
  const ethConfig = `${configDir}/eth-config.json`

  console.log(`Config dir: ${configDir}`)
  console.log(dataConfig)
  console.log(ethConfig)

  try {
    let dataConfigJson
    let ethConfigJson
    if (fs.existsSync(configDir)) {
      dataConfigJson = require(dataConfig)
      ethConfigJson = require(ethConfig)
    } else {
      dataConfigJson = {
        registryAddress: "0xCfEB869F69431e42cdB54A4F4f105C19C080A601",
        ownerWallet: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        allWallets: [
          "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
          "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
          "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",
          "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d",
          "0xd03ea8624C8C5987235048901fB614fDcA89b117",
          "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC",
          "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
          "0x28a8746e75304c0780E011BEd21C72cD78cd535E",
          "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E",
          "0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e",
          "0x610Bb1573d1046FCb8A70Bbbd395754cD57C2b60",
          "0x855FA758c77D68a04990E992aA4dcdeF899F654A",
          "0xfA2435Eacf10Ca62ae6787ba2fB044f8733Ee843",
          "0x64E078A8Aa15A41B85890265648e965De686bAE6",
          "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598",
          "0xf408f04F9b7691f7174FA2bb73ad6d45fD5d3CBe",
          "0x66FC63C2572bF3ADD0Fe5d44b97c2E614E35e9a3",
          "0xF0D5BC18421fa04D0a2A2ef540ba5A9f04014BE3",
          "0x325A621DeA613BCFb5B1A69a7aCED0ea4AfBD73A",
          "0x3fD652C93dFA333979ad762Cf581Df89BaBa6795",
          "0x73EB6d82CFB20bA669e9c178b718d770C49BB52f",
          "0x9D8E5fAc117b15DaCED7C326Ae009dFE857621f1",
          "0x982a8CbE734cb8c29A6a7E02a3B0e4512148F6F9",
          "0xCDC1E53Bdc74bBf5b5F715D6327Dca5785e228B4",
          "0xf5d1EAF516eF3b0582609622A221656872B82F78",
          "0xf8eA26C3800D074a11bf814dB9a0735886C90197",
          "0x2647116f9304abb9F0B7aC29aBC0D9aD540506C8",
          "0x80a32A0E5cA81b5a236168C21532B32e3cBC95e2",
          "0x47f55A2ACe3b84B0F03717224DBB7D0Df4351658",
          "0xC817898296b27589230B891f144dd71A892b0C18",
          "0x0D38e653eC28bdea5A2296fD5940aaB2D0B8875c",
          "0x1B569e8f1246907518Ff3386D523dcF373e769B6",
          "0xCBB025e7933FADfc7C830AE520Fb2FD6D28c1065",
          "0xdDEEA4839bBeD92BDAD8Ec79AE4f4Bc2Be1A3974",
          "0xBC2cf859f671B78BA42EBB65Deb31Cc7fEc07019",
          "0xF75588126126DdF76bDc8aBA91a08f31d2567Ca5",
          "0x369109C74ea7159E77e180f969f7D48c2bf19b4C",
          "0xA2A628f4eEE25F5b02B0688Ad9c1290e2e9A3D9e",
          "0x693D718cCfadE6F4A1379051D6ab998146F3173F",
          "0x845A0F9441081779110FEE40E6d5d8b90cE676eF",
          "0xC7739909e08A9a0F303A010d46658Bdb4d5a6786",
          "0x99cce66d3A39C2c2b83AfCefF04c5EC56E9B2A58",
          "0x4b930E7b3E491e37EaB48eCC8a667c59e307ef20",
          "0x02233B22860f810E32fB0751f368fE4ef21A1C05",
          "0x89c1D413758F8339Ade263E6e6bC072F1d429f32",
          "0x61bBB5135b43F03C96570616d6d3f607b7103111",
          "0x8C4cE7a10A4e38EE96feD47C628Be1FfA57Ab96e",
          "0x25c1230C7EFC00cFd2fcAA3a44f30948853824bc",
          "0x709F7Ae06Fe93be48FbB90FFDDd69e2746FA8506",
          "0xc0514C03D097fCbB77a74B4DA5b594bA473b6CE1"
        ]
      }

      ethConfigJson = {
        audiusTokenAddress: "0xdcB2fC9469808630DD0744b0adf97C0003fC29B2",
        ownerWallet: "0x855FA758c77D68a04990E992aA4dcdeF899F654A",
        registryAddress: "0xABbfF712977dB51f9f212B85e8A4904c818C2b63",
      }
    }

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
 * @param {int} walletIndex Ganache can be setup with multiple pre-created wallets. WalletIndex lets you pick which wallet to use for libs.
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
      USER_NODE,
      IDENTITY_SERVICE
    ] = [
        config.get('registry_address'),
        config.get('web3_provider_urls'),
        config.get('eth_token_address'),
        config.get('eth_registry_address'),
        config.get('eth_provider_url'),
        config.get('eth_owner_wallet'),
        config.get('user_node'),
        config.get('identity_service')
      ]

    const dataWeb3 = new Web3(
      new Web3.providers.HttpProvider(WEB3_PROVIDER_URLS)
    )

    const walletAddress = config.get('data_wallets')[walletIndex]
    this.walletAddress = walletAddress
    this.walletIndex = walletIndex
    this.userId = null // to be updated on init

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
    const discoveryProviderConfig = {}

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
      isServer: true,
      enableUserReplicaSetManagerContract: true,
      preferHigherPatchForPrimary: true,
      preferHigherPatchForSecondaries: true
    })

    try {
      await libs.init()
      this.libsInstance = libs
    } catch (e) {
      console.error(`Error initting libs: ${e}`)
    }
  }

  this.getLatestBlockOnChain = async () => {
    assertLibsDidInit()
    const {
      number: latestBlock
    } = await this.libsInstance.web3Manager.web3.eth.getBlock('latest')
    return latestBlock
  }

  /**
   * Signs up a user.
   * @param {*} args metadata describing a user.
   */
  this.signUp = async ({ metadata }) => {
    assertLibsDidInit()
    const signUpResp = await this.libsInstance.Account.signUp(
      metadata.email,
      metadata.password,
      metadata,
      metadata.profilePictureFile /* profile picture */,
      metadata.coverPhotoFile /* cover photo */,
      false /* has wallet */,
      null /* host */
    )

    // Update libs instance with associated userId
    if (!signUpResp.error) this.userId = signUpResp.userId

    return signUpResp
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
    return this.libsInstance.ServiceProvider.autoSelectCreatorNodes({
      numberOfNodes,
      whitelist,
      blacklist
    })
  }

  this.setCreatorNodeEndpoint = async primary => {
    assertLibsDidInit()
    return this.libsInstance.creatorNode.setEndpoint(primary)
  }

  this.updateCreator = async (userId, metadata) => {
    assertLibsDidInit()
    return this.libsInstance.User.updateCreator(userId, metadata)
  }

  /**
   * Exposes the function used by libs to clean the metadata object passed
   * when updating or creating a user since it could have extra fields.
   * - Add what user props might be missing to normalize
   * - Only keep core fields in USER_PROPS and 'user_id'.
   */
  this.cleanUserMetadata = metadata => {
    assertLibsDidInit()
    return this.libsInstance.User.cleanUserMetadata(metadata)
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
      () => { } /* on progress */
    )
    if (error) throw error
    return trackId
  }

  /**
   * Updates an existing track given metadata. This function expects that all associated files
   * such as track content, cover art are already on creator node.
   * @param {Object} metadata json of the track metadata with all fields, missing fields will error
   */
  this.updateTrackOnChainAndCnode = async metadata => {
    const {
      blockHash,
      blockNumber,
      trackId
    } = await this.libsInstance.Track.updateTrack(metadata)
    return { blockHash, blockNumber, trackId }
  }

  this.uploadTrackCoverArt = async coverArtFilePath => {
    const coverArtFile = fs.createReadStream(coverArtFilePath)
    const resp = await this.libsInstance.File.uploadImage(
      coverArtFile,
      true // square
    )
    const { dirCID } = resp
    return dirCID
  }

  /**
   * Repost a track.
   *
   * @param {number} args trackId
   * @returns transaction receipt
   * @throws any libs error
   */
  this.repostTrack = async trackId => {
    assertLibsDidInit()
    return await this.libsInstance.Track.addTrackRepost(trackId)
  }

  /**
   * Gets reposters for a tracks.
   *
   * @param {number} args trackId
   * @returns trackId
   * @throws any libs error
   */
  this.getRepostersForTrack = async trackId => {
    assertLibsDidInit()
    return await this.libsInstance.Track.getRepostersForTrack(100, 0, trackId)
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

    if (!tracks || !tracks.length) {
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

  /**
   * Fetch users metadata from discovery node given array of userIds
   * @param {number[]} userIds int array of user ids
   */
  this.getUsers = async userIds => {
    assertLibsDidInit()
    const users = await this.libsInstance.User.getUsers(
      1 /* limit */,
      0 /* offset */,
      userIds
    )
    if (!users.length || users.length !== userIds.length) {
      throw new Error('No users or not all users found')
    }
    return users
  }

  /**
   * Fetch user account from /user/account with wallet param
   * @param {string} wallet wallet address
   */
  this.getUserAccount = async wallet => {
    assertLibsDidInit()
    const userAccount = await this.libsInstance.discoveryProvider.getUserAccount(
      wallet
    )

    if (!userAccount) {
      throw new Error('No user account found.')
    }

    return userAccount
  }

  /**
   * Updates userStateManager and updates the primary endpoint in libsInstance.creatorNode
   * @param {Object} userAccount new metadata field
   */
  this.setCurrentUserAndUpdateLibs = async userAccount => {
    assertLibsDidInit()
    this.setCurrentUser(userAccount)
    const contentNodeEndpointField = userAccount.creator_node_endpoint
    if (contentNodeEndpointField) {
      this.getPrimaryAndSetLibs(contentNodeEndpointField)
    }
  }

  /**
   * Updates userStateManager with input user metadata
   * @param {object} user user metadata
   */
  this.setCurrentUser = user => {
    assertLibsDidInit()
    this.libsInstance.userStateManager.setCurrentUser(user)
  }

  /**
   * Gets the primary off the user metadata and then sets the primary
   * on the CreatorNode instance in libs
   * @param {string} contentNodeEndpointField creator_node_endpoint field in user metadata
   */
  this.getPrimaryAndSetLibs = contentNodeEndpointField => {
    assertLibsDidInit()
    const primary = CreatorNode.getPrimary(contentNodeEndpointField)
    this.libsInstance.creatorNode.setEndpoint(primary)
  }

  /**
   * Wrapper for libsInstance.creatorNode.getEndpoints()
   * @param {string} contentNodesEndpointField creator_node_endpoint field from user's metadata
   */
  this.getContentNodeEndpoints = contentNodesEndpointField => {
    assertLibsDidInit()
    return CreatorNode.getEndpoints(contentNodesEndpointField)
  }

  this.getPrimary = contentNodesEndpointField => {
    assertLibsDidInit()
    return CreatorNode.getPrimary(contentNodesEndpointField)
  }

  this.getSecondaries = contentNodesEndpointField => {
    assertLibsDidInit()
    return CreatorNode.getSecondaries(contentNodesEndpointField)
  }

  /**
   * Updates the metadata on chain and uploads new metadata instance on content node
   * @param {Object} param
   * @param {Object} param.newMetadata new metadata object to update in content nodes and on chain
   * @param {number} param.userId
   */
  this.updateAndUploadMetadata = async ({ newMetadata, userId }) => {
    assertLibsDidInit()
    return await this.libsInstance.User.updateAndUploadMetadata({
      newMetadata,
      userId
    })
  }

  /**
   * Wrapper for libsInstance.creatorNode.getClockValuesFromReplicaSet()
   */
  this.getClockValuesFromReplicaSet = async () => {
    assertLibsDidInit()
    return this.libsInstance.creatorNode.getClockValuesFromReplicaSet()
  }

  /**
   * Gets the user associated with the wallet set in libs
   */
  this.getLibsUserInfo = async () => {
    assertLibsDidInit()
    const users = await this.libsInstance.User.getUsers(
      1,
      0,
      null,
      this.getWalletAddress()
    )

    if (!users.length) {
      throw new Error('No users!')
    }

    if (!this.userId) this.userId = users[0].user_id

    return users[0]
  }

  /**
   * Add ipld blacklist txn with bad CID to chain
   * @param {string} digest base 58 decoded in hex
   * @param {string} blacklisterAddressPrivateKey private key associated with blacklisterAddress
   */
  this.addIPLDToBlacklist = async (digest, blacklisterAddressPrivateKey) => {
    assertLibsDidInit()
    const ipldTxReceipt = await this.libsInstance.contracts.IPLDBlacklistFactoryClient.addIPLDToBlacklist(
      digest,
      blacklisterAddressPrivateKey
    )
    return ipldTxReceipt
  }

  /**
   * Add an add track txn to chain
   * @param {int} userId
   * @param {object} param2 track data
   */
  this.addTrackToChain = async (userId, { digest, hashFn, size }) => {
    assertLibsDidInit()
    const trackTxReceipt = await this.libsInstance.contracts.TrackFactoryClient.addTrack(
      userId,
      digest,
      hashFn,
      size
    )
    return trackTxReceipt
  }

  /**
   * Add an update track txn to chain.
   * WARNING: This will break indexing if the tx contains CIDs that don't exist on any CN.
   * Make sure you call uploadTrackMetadata first!
   * @param {int} trackId
   * @param {int} userId
   * @param {object} param3 track data
   */
  this.updateTrackOnChain = async (
    trackId,
    userId,
    { digest, hashFn, size }
  ) => {
    assertLibsDidInit()
    const trackTxReceipt = await this.libsInstance.contracts.TrackFactoryClient.updateTrack(
      trackId,
      userId,
      digest,
      hashFn,
      size
    )
    return trackTxReceipt
  }

  /**
   * Add an update user metadata CID txn to chain
   * @param {int} userId
   * @param {string} multihashDigest
   */
  this.updateMultihash = async (userId, multihashDigest) => {
    assertLibsDidInit()
    const updateMultihashTxReceipt = await this.libsInstance.contracts.UserFactoryClient.updateMultihash(
      userId,
      multihashDigest
    )
    return updateMultihashTxReceipt
  }

  /**
   * Add an update user cover photo txn to chain
   * @param {int} userId
   * @param {string} coverPhotoMultihashDigest
   */
  this.updateCoverPhoto = async (userId, coverPhotoMultihashDigest) => {
    assertLibsDidInit()
    const updateCoverPhotoTxReceipt = await this.libsInstance.contracts.UserFactoryClient.updateCoverPhoto(
      userId,
      coverPhotoMultihashDigest
    )
    return updateCoverPhotoTxReceipt
  }

  /**
   * Add an update user profile photo txn to chain
   * @param {int} userId
   * @param {string} profilePhotoMultihashDigest
   */
  this.updateProfilePhoto = async (userId, profilePhotoMultihashDigest) => {
    assertLibsDidInit()
    const updateProfilePhotoTxReceipt = await this.libsInstance.contracts.UserFactoryClient.updateProfilePhoto(
      userId,
      profilePhotoMultihashDigest
    )
    return updateProfilePhotoTxReceipt
  }

  /**
   * Add a create playlist txn to chain
   * @param {int} userId
   * @param {string} playlistName
   * @param {boolean} isPrivate
   * @param {boolean} isAlbum
   * @param {array} trackIds
   */
  this.createPlaylist = async (
    userId,
    playlistName,
    isPrivate,
    isAlbum,
    trackIds
  ) => {
    assertLibsDidInit()
    const createPlaylistTxReceipt = await this.libsInstance.contracts.PlaylistFactoryClient.createPlaylist(
      userId,
      playlistName,
      isPrivate,
      isAlbum,
      trackIds
    )
    return createPlaylistTxReceipt
  }

  /**
   * Add a playlist track addition txn to chain
   * @param {number} playlistId
   * @param {number} trackId
   */
  this.addPlaylistTrack = async (playlistId, trackId) => {
    assertLibsDidInit()
    const addPlaylistTrackTxReceipt = await this.libsInstance.contracts.PlaylistFactoryClient.addPlaylistTrack(
      playlistId,
      trackId
    )
    return addPlaylistTrackTxReceipt
  }

  this.uploadPlaylistCoverPhoto = async coverPhotoFile => {
    assertLibsDidInit()
    const dirCid = await this.libsInstance.Playlist.uploadPlaylistCoverPhoto(
      coverPhotoFile
    )
    return dirCid
  }

  /**
   * Add an update playlist txn to chain
   * @param {*} playlistId
   * @param {*} updatedPlaylistImageMultihashDigest
   */
  this.updatePlaylistCoverPhoto = async (
    playlistId,
    updatedPlaylistImageMultihashDigest
  ) => {
    assertLibsDidInit()
    const updatePlaylistCoverPhotoTxReceipt = await this.libsInstance.contracts.PlaylistFactoryClient.updatePlaylistCoverPhoto(
      playlistId,
      updatedPlaylistImageMultihashDigest
    )
    return updatePlaylistCoverPhotoTxReceipt
  }

  // returns array of playlist objs
  this.getPlaylists = async (
    limit = 100,
    offset = 0,
    idsArray = null,
    targetUserId = null,
    withUsers = false
  ) => {
    assertLibsDidInit()
    const playlists = await this.libsInstance.Playlist.getPlaylists(
      limit,
      offset,
      idsArray,
      targetUserId,
      withUsers
    )

    if (!playlists || playlists.length === 0) {
      throw new Error('No playlists found!')
    }

    return playlists
  }

  this.getWalletAddress = () => {
    return this.libsInstance.web3Manager.getWalletAddress()
  }

  this.getServices = async type => {
    return this.libsInstance.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(
      type
    )
  }

  this.getServiceEndpointInfo = async (serviceType, serviceId) => {
    return this.libsInstance.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
      serviceType,
      serviceId
    )
  }

  this.getUserReplicaSet = async userId => {
    return this.libsInstance.contracts.UserReplicaSetManagerClient.getUserReplicaSet(
      userId
    )
  }

  this.getContentNodeWallets = async cnodeId => {
    return this.libsInstance.contracts.UserReplicaSetManagerClient.getContentNodeWallets(
      cnodeId
    )
  }

  this.updateReplicaSet = async (userId, primary, secondaries) => {
    return this.libsInstance.contracts.UserReplicaSetManagerClient.updateReplicaSet(
      userId,
      primary,
      secondaries
    )
  }

  this.updateBio = async (userId, bioString) => {
    return this.libsInstance.contracts.UserFactoryClient.updateBio(
      userId,
      bioString
    )
  }

  this.updateName = async (userId, userName) => {
    return this.libsInstance.contracts.UserFactoryClient.updateBio(
      userId,
      userName
    )
  }

  this.getDiscoveryNodeEndpoint = () => {
    return this.libsInstance.discoveryProvider.discoveryProviderEndpoint
  }

  this.getURSMContentNodes = ownerWallet => {
    return this.libsInstance.discoveryProvider.getURSMContentNodes(ownerWallet)
  }

  // Record a single track listen
  this.logTrackListen = (
    trackId,
    userId,
    listenerAddress,
    signatureData,
    solanaListen
  ) => {
    return this.libsInstance.identityService.logTrackListen(
      trackId,
      userId,
      listenerAddress,
      signatureData,
      solanaListen
    )
  }

  /**
   * Wait for the discovery node to catch up to the latest block on chain up to a max
   * indexing timeout of default 10000ms. Used to check regular block indexing.
   * @param {number} [maxIndexingTimeout=10000] max time indexing window
   */
  this.waitForLatestBlock = async (
    maxIndexingTimeout = MAX_INDEXING_TIMEOUT
  ) => {
    let latestBlockOnChain = -1
    let latestIndexedBlock = -1

    try {
      // Note: this is /not/ the block of which a certain txn occurred. This is just the
      // latest block on chain. (e.g. Upload track occurred at block 80; latest block on chain
      // might be 83). This method is the quickest way to attempt to poll up to a reasonably
      // close block without having to change libs API.
      latestBlockOnChain = await this.getLatestBlockOnChain()

      console.log(
        `[Block Check] Waiting for #${latestBlockOnChain} to be indexed...`
      )

      const startTime = Date.now()
      while (Date.now() - startTime < maxIndexingTimeout) {
        latestIndexedBlock = await this._getLatestIndexedBlock()
        if (latestIndexedBlock >= latestBlockOnChain) {
          console.log(
            `[Block Check] Discovery Node has indexed #${latestBlockOnChain}!`
          )
          return
        }
      }
    } catch (e) {
      const errorMsg = '[Block Check] Error with checking latest indexed block'
      console.error(errorMsg, e)
      throw new Error(`${errorMsg}\n${e}`)
    }
    console.warn(
      `[Block Check] Did not index #${latestBlockOnChain} within ${maxIndexingTimeout}ms. Latest block: ${latestIndexedBlock}`
    )
  }

  /**
   * Wait for the discovery node to catch up to the latest block on chain up to a max
   * indexing timeout of default 10000ms.
   * @param {number} [maxIndexingTimeout=10000] max time indexing window
   */
  this.waitForLatestIPLDBlock = async (
    maxIndexingTimeout = MAX_INDEXING_TIMEOUT
  ) => {
    let latestBlockOnChain = -1
    let latestIndexedBlock = -1

    try {
      // Note: this is /not/ the block of which a certain txn occurred. This is just the
      // latest block on chain. (e.g. Upload track occurred at block 80; latest block on chain
      // might be 83). This method is the quickest way to attempt to poll up to a reasonably
      // close block without having to change libs API.
      latestBlockOnChain = await this.getLatestBlockOnChain()

      console.log(
        `[IPLD Block Check] Waiting for #${latestBlockOnChain} to be indexed...`
      )

      const startTime = Date.now()
      while (Date.now() - startTime < maxIndexingTimeout) {
        latestIndexedBlock = await this._getLatestIndexedIpldBlock()
        if (latestIndexedBlock >= latestBlockOnChain) {
          console.log(
            `[IPLD Block Check] Discovery Node has indexed #${latestBlockOnChain}!`
          )
          return
        }
      }
    } catch (e) {
      const errorMsg =
        '[IPLD Block Check] Error with checking latest indexed block'
      console.error(errorMsg, e)
      throw new Error(`${errorMsg}\n${e}`)
    }
    console.warn(
      `[IPLD Block Check] Did not index #${latestBlockOnChain} within ${maxIndexingTimeout}ms. Latest block: ${latestIndexedBlock}`
    )
  }

  this._getLatestIndexedBlock = async (endpoint = DISCOVERY_NODE_ENDPOINT) => {
    return (
      await axios({
        method: 'get',
        baseURL: endpoint,
        url: '/health_check'
      })
    ).data.latest_indexed_block
  }

  this._getLatestIndexedIpldBlock = async (
    endpoint = DISCOVERY_NODE_ENDPOINT
  ) => {
    return (
      await axios({
        method: 'get',
        baseURL: endpoint,
        url: '/ipld_block_check'
      })
    ).data.data.db.number
  }

  this.updateUserStateManagerToChainData = async userId => {
    const users = await this.libsInstance.discoveryProvider.getUsers(1, 0, [
      userId
    ])
    if (!users || !users[0])
      throw new Error(
        `[updateUserStateManagerToChainData] Cannot update user because no current record exists for user id ${userId}`
      )

    const metadata = users[0]

    this.libsInstance.userStateManager.setCurrentUser(metadata)
  }
}

module.exports = { LibsWrapper, Utils }
