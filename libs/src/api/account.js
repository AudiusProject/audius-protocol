const { Base, Services } = require('./base')
const { CreatorNode } = require('../services/creatorNode')
const { Utils } = require('../utils')
const { AuthHeaders } = require('../constants')
const { getPermitDigest, sign } = require('../utils/signatures')
const { PublicKey } = require('@solana/web3.js')
const { BN } = require('@project-serum/anchor')

class Account extends Base {
  constructor(userApi, ...services) {
    super(...services)

    this.User = userApi

    this.getCurrentUser = this.getCurrentUser.bind(this)
    this.login = this.login.bind(this)
    this.logout = this.logout.bind(this)
    this.signUp = this.signUp.bind(this)
    this.generateRecoveryLink = this.generateRecoveryLink.bind(this)
    this.confirmCredentials = this.confirmCredentials.bind(this)
    this.changePassword = this.changePassword.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
    this.checkIfEmailRegistered = this.checkIfEmailRegistered.bind(this)
    this.getUserEmail = this.getUserEmail.bind(this)
    this.associateTwitterUser = this.associateTwitterUser.bind(this)
    this.associateInstagramUser = this.associateInstagramUser.bind(this)
    this.handleIsValid = this.handleIsValid.bind(this)
    this.lookupTwitterHandle = this.lookupTwitterHandle.bind(this)
    this.updateCreatorNodeEndpoint = this.updateCreatorNodeEndpoint.bind(this)
    this.searchFull = this.searchFull.bind(this)
    this.searchAutocomplete = this.searchAutocomplete.bind(this)
    this.searchTags = this.searchTags.bind(this)
    this.sendTokensFromEthToSol = this.sendTokensFromEthToSol.bind(this)
    this.sendTokensFromSolToEth = this.sendTokensFromSolToEth.bind(this)
    this.getUserAccountOnSolana = this.getUserAccountOnSolana.bind(this)
    this.userHasClaimedSolAccount = this.userHasClaimedSolAccount.bind(this)
  }

  /**
   * Fetches the user metadata for the current account
   * @return {Object} user metadata
   */
  getCurrentUser() {
    return this.userStateManager.getCurrentUser()
  }

  /**
   * Logs a user into Audius
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const phases = {
      FIND_WALLET: 'FIND_WALLET',
      FIND_USER: 'FIND_USER'
    }
    let phase = ''

    phase = phases.FIND_WALLET
    if (!this.web3Manager.web3IsExternal()) {
      this.REQUIRES(Services.HEDGEHOG)

      try {
        const ownerWallet = await this.hedgehog.login(email, password)
        await this.web3Manager.setOwnerWallet(ownerWallet)
      } catch (e) {
        return { error: e.message, phase }
      }
    }

    phase = phases.FIND_USER
    const userAccount = await this.discoveryProvider.getUserAccount(
      this.web3Manager.getWalletAddress()
    )
    if (userAccount) {
      this.userStateManager.setCurrentUser(userAccount)
      const creatorNodeEndpoint = userAccount.creator_node_endpoint
      if (creatorNodeEndpoint) {
        this.creatorNode.setEndpoint(
          CreatorNode.getPrimary(creatorNodeEndpoint)
        )
      }
      return { user: userAccount, error: false, phase }
    }
    return { error: 'No user found', phase }
  }

  /**
   * Logs a user out of Audius
   * Note: Actions will stop working at this point, but
   * clients may wish to call window.location.reload()
   * to show the user as logged out
   */
  async logout() {
    if (!this.web3Manager.web3IsExternal()) {
      this.REQUIRES(Services.HEDGEHOG)
      await this.hedgehog.logout()
      this.userStateManager.clearUser()
    }
  }

  /**
   * Signs a user up for Audius
   * @param {string} email
   * @param {string} password
   * @param {Object} metadata
   * @param {?File} [profilePictureFile] an optional file to upload as the profile picture
   * @param {?File} [coverPhotoFile] an optional file to upload as the cover phtoo
   * @param {?boolean} [hasWallet]
   * @param {?boolean} [host] The host url used for the recovery email
   * @param {?boolean} [createWAudioUserBank] an optional flag to create the solana user bank account
   * @param {?Function} [handleUserBankOutcomes] an optional callback to record user bank outcomes
   * @param {?Object} [userBankOutcomes] an optional object with request, succes, and failure keys to record user bank outcomes
   * @param {?string} [feePayerOverride] an optional string in case the client wants to switch between fee payers
   * @param {?boolean} [generateRecoveryLink] an optional flag to skip generating recovery link for testing purposes
   */
  async signUp(
    email,
    password,
    metadata,
    profilePictureFile = null,
    coverPhotoFile = null,
    hasWallet = false,
    host = (typeof window !== 'undefined' && window.location.origin) || null,
    handleUserBankOutcomes = () => {},
    userBankOutcomes = {},
    feePayerOverride = null,
    generateRecoveryLink = true
  ) {
    const phases = {
      ADD_REPLICA_SET: 'ADD_REPLICA_SET',
      CREATE_USER_RECORD: 'CREATE_USER_RECORD',
      HEDGEHOG_SIGNUP: 'HEDGEHOG_SIGNUP',
      SOLANA_USER_BANK_CREATION: 'SOLANA_USER_BANK_CREATION',
      UPLOAD_PROFILE_IMAGES: 'UPLOAD_PROFILE_IMAGES',
      ADD_USER: 'ADD_USER'
    }
    let phase = ''
    let userId, blockHash, blockNumber

    try {
      this.REQUIRES(Services.CREATOR_NODE, Services.IDENTITY_SERVICE)

      if (this.web3Manager.web3IsExternal()) {
        phase = phases.CREATE_USER_RECORD
        await this.identityService.createUserRecord(
          email,
          this.web3Manager.getWalletAddress()
        )
      } else {
        this.REQUIRES(Services.HEDGEHOG)
        // If an owner wallet already exists, don't try to recreate it
        if (!hasWallet) {
          phase = phases.HEDGEHOG_SIGNUP
          const ownerWallet = await this.hedgehog.signUp(email, password)
          await this.web3Manager.setOwnerWallet(ownerWallet)
          if (generateRecoveryLink) {
            await this.generateRecoveryLink({ handle: metadata.handle, host })
          }
        }
      }

      // Create a wAudio user bank address.
      // If userbank creation fails, we still proceed
      // through signup
      if (this.solanaWeb3Manager) {
        phase = phases.SOLANA_USER_BANK_CREATION
        // Fire and forget createUserBank. In the case of failure, we will
        // retry to create user banks in a later session before usage
        ;(async () => {
          try {
            handleUserBankOutcomes(userBankOutcomes.Request)
            const { error, errorCode } =
              await this.solanaWeb3Manager.createUserBank(feePayerOverride)
            if (error || errorCode) {
              console.error(
                `Failed to create userbank, with err: ${error}, ${errorCode}`
              )
              handleUserBankOutcomes(userBankOutcomes.Failure, {
                error,
                errorCode
              })
            } else {
              console.log('Successfully created userbank!')
              handleUserBankOutcomes('Create User Bank: Success')
            }
          } catch (err) {
            console.error(`Got error creating userbank: ${err}, continuing...`)
            handleUserBankOutcomes(userBankOutcomes.Failure, {
              error: err.toString()
            })
          }
        })()
      }

      // Add user to chain
      phase = phases.ADD_USER
      const response = await this.User.addUser(metadata)
      userId = response.userId
      blockHash = response.blockHash
      blockNumber = response.blockNumber

      // Assign replica set to user, updates creator_node_endpoint on chain, and then update metadata object on content node + chain (in this order)
      phase = phases.ADD_REPLICA_SET
      metadata = await this.User.assignReplicaSet({ userId })

      // Upload profile pic and cover photo to primary Content Node and sync across secondaries
      phase = phases.UPLOAD_PROFILE_IMAGES
      await this.User.uploadProfileImages(
        profilePictureFile,
        coverPhotoFile,
        metadata
      )
    } catch (e) {
      return {
        error: e.message,
        phase,
        errorStatus: e.response ? e.response.status : null
      }
    }
    return { blockHash, blockNumber, userId }
  }

  /**
   * Generates and sends a recovery email for a user
   * @param {string} [handle] The user handle, defaults to the current user handle
   * @param {string} [host] The host domain, defaults to window.location.origin
   */
  async generateRecoveryLink({ handle, host } = {}) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    try {
      const recoveryInfo = await this.hedgehog.generateRecoveryInfo()
      handle = handle || this.userStateManager.getCurrentUser().handle

      const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
      const data = `Click sign to authenticate with identity service: ${unixTs}`
      const signature = await this.web3Manager.sign(data)

      const recoveryData = {
        login: recoveryInfo.login,
        host: host || recoveryInfo.host,
        data,
        signature,
        handle
      }

      await this.identityService.sendRecoveryInfo(recoveryData)
    } catch (e) {
      console.error(e)
    }
  }

  async resetPassword(email, newpassword) {
    return this.hedgehog.resetPassword(email, newpassword)
  }

  async changePassword(email, newpassword, oldpassword) {
    return this.hedgehog.changePassword(email, newpassword, oldpassword)
  }

  async confirmCredentials(email, password) {
    return this.hedgehog.confirmCredentials(email, password)
  }

  /**
   * Check if an email address has been previously registered.
   * @param {string} email
   * @returns {{exists: boolean}}
   */
  async checkIfEmailRegistered(email) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.checkIfEmailRegistered(email)
  }

  /**
   * Get the current user's email address
   * @returns {{email: string | undefined | null}}
   */
  async getUserEmail() {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.getUserEmail()
  }

  /**
   * Associates a user with a twitter uuid.
   * @param {string} uuid from the Twitter API
   * @param {number} userId
   * @param {string} handle
   */
  async associateTwitterUser(uuid, userId, handle) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.associateTwitterUser(uuid, userId, handle)
  }

  /**
   * Associates a user with an instagram uuid.
   * @param {string} uuid from the Instagram API
   * @param {number} userId
   * @param {string} handle
   */
  async associateInstagramUser(uuid, userId, handle) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.associateInstagramUser(uuid, userId, handle)
  }

  /**
   * Checks if a requested handle is valid (unused).
   * @param {string} handle
   */
  async handleIsValid(handle) {
    return this.contracts.UserFactoryClient.handleIsValid(handle)
  }

  /**
   * Looks up a Twitter account by handle.
   * @returns {Object} twitter API response.
   */
  async lookupTwitterHandle(handle) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.lookupTwitterHandle(handle)
  }

  /**
   * Updates a user's creator node endpoint. Sets the connected creator node in the libs instance
   * and updates the user's metadata blob.
   * @param {string} url
   */
  async updateCreatorNodeEndpoint(url) {
    this.REQUIRES(Services.CREATOR_NODE)

    const user = this.userStateManager.getCurrentUser()
    if (user.is_creator) {
      await this.creatorNode.setEndpoint(url)
      // Only a creator will have a creator node endpoint
      user.creator_node_endpoint = url
      await this.User.updateCreator(user.user_id, user)
    }
  }

  /**
   * Perform a full-text search. Returns tracks, users, playlists, albums
   *    with optional user-specific results for each
   *  - user, track, and playlist objects have all same data as returned from standalone endpoints
   * @param {string} text search query
   * @param {string} kind 'tracks', 'users', 'playlists', 'albums', 'all'
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchFull(text, kind, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.searchFull(text, kind, limit, offset)
  }

  /**
   * Perform a lighter-weight full-text search. Returns tracks, users, playlists, albums
   *    with optional user-specific results for each
   *  - user, track, and playlist objects have core data, and track & playlist objects
   *    also return user object
   * @param {string} text search query
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchAutocomplete(text, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.searchAutocomplete(text, limit, offset)
  }

  /**
   * Perform a tags-only search. Returns tracks with required tag and users
   * that have used a tag greater than a specified number of times
   * @param {string} text search query
   * @param {number} user_tag_count min # of times a user must have used a tag to be returned
   * @param {string} kind 'tracks', 'users', 'playlists', 'albums', 'all'
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchTags(text, user_tag_count = 2, kind, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.searchTags(
      text,
      user_tag_count,
      kind,
      limit,
      offset
    )
  }

  /**
   * Check if the user has a distribution claim
   * @param {number?} index The index of the claim to check (if known)
   */
  async getHasClaimed(index) {
    this.REQUIRES(Services.COMSTOCK)
    if (index) {
      return this.ethContracts.ClaimDistributionClient.isClaimed(index)
    }
    const userWallet = this.web3Manager.getWalletAddress()
    const web3 = this.web3Manager.getWeb3()
    const wallet = web3.utils.toChecksumAddress(userWallet)
    const claim = await this.comstock.getComstock({ wallet })
    return this.ethContracts.ClaimDistributionClient.isClaimed(claim.index)
  }

  /**
   * Get the distribution claim amount
   */
  async getClaimDistributionAmount() {
    this.REQUIRES(Services.COMSTOCK)
    const userWallet = this.web3Manager.getWalletAddress()
    const web3 = this.web3Manager.getWeb3()
    const wallet = web3.utils.toChecksumAddress(userWallet)
    const claimDistribution = await this.comstock.getComstock({ wallet })
    const amount = Utils.toBN(claimDistribution.amount.replace('0x', ''), 16)
    return amount
  }

  /**
   * Make the claim
   * @param {number?} index The index of the claim to check
   * @param {BN?} amount The amount to be claimed
   * @param {Array<string>?} merkleProof The merkle proof for the claim
   */
  async makeDistributionClaim(index, amount, merkleProof) {
    this.REQUIRES(Services.COMSTOCK, Services.IDENTITY_SERVICE)
    const userWallet = this.web3Manager.getWalletAddress()
    const web3 = this.web3Manager.getWeb3()
    const wallet = web3.utils.toChecksumAddress(userWallet)
    if (index && amount && merkleProof) {
      return this.ethContracts.ClaimDistributionClient.claim(
        index,
        userWallet,
        amount,
        merkleProof
      )
    }
    const claim = await this.comstock.getComstock({ wallet })
    return this.ethContracts.ClaimDistributionClient.claim(
      claim.index,
      userWallet,
      claim.amount,
      claim.proof
    )
  }

  /**
   * Sends `amount` tokens to `recipientAddress`
   */
  async permitAndSendTokens(recipientAddress, amount) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const myWalletAddress = this.web3Manager.getWalletAddress()
    const { selectedEthWallet } = await this.identityService.getEthRelayer(
      myWalletAddress
    )
    await this.permitProxySendTokens(myWalletAddress, selectedEthWallet, amount)
    await this.sendTokens(
      myWalletAddress,
      recipientAddress,
      selectedEthWallet,
      amount
    )
  }

  /**
   * Sends Eth `amount` tokens to `solanaAccount` by way of the wormhole
   * 1.) Permits the eth relay to proxy send tokens on behalf of the user
   * 2.) Transfers the tokens on the eth side to the wormhole contract
   * 3.) Gathers attestations from wormhole oracles and relizes the tokens on sol
   */
  async sendTokensFromEthToSol(amount, solanaAccount) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const phases = {
      PERMIT_PROXY_SEND: 'PERMIT_PROXY_SEND',
      TRANSFER_TOKENS: 'TRANSFER_TOKENS',
      ATTEST_AND_COMPLETE_TRANSFER: 'ATTEST_AND_COMPLETE_TRANSFER'
    }
    let phase = phases.PERMIT_PROXY_SEND
    const logs = [
      `Send tokens from eth to sol to ${solanaAccount} for ${amount.toString()}`
    ]
    try {
      const myWalletAddress = this.web3Manager.getWalletAddress()
      const wormholeAddress = this.ethContracts.WormholeClient.contractAddress
      const { selectedEthWallet } = await this.identityService.getEthRelayer(
        myWalletAddress
      )
      await this.permitProxySendTokens(myWalletAddress, wormholeAddress, amount)

      logs.push('Completed permit proxy send tokens')
      phase = phases.TRANSFER_TOKENS
      const transferTokensTx =
        await this.wormholeClient.transferTokensToEthWormhole(
          myWalletAddress,
          amount,
          solanaAccount,
          selectedEthWallet
        )

      const transferTransactionHash = transferTokensTx.txHash
      logs.push(`Completed transfer tokens with tx ${transferTransactionHash}`)
      phase = phases.ATTEST_AND_COMPLETE_TRANSFER

      const response =
        await this.wormholeClient.attestAndCompleteTransferEthToSol(
          transferTransactionHash
        )
      if (response.transactionSignature) {
        logs.push(
          `Receive sol wrapped tokens in tx ${response.transactionSignature}`
        )
      }
      return {
        txSignature: response.transactionSignature,
        phase: response.phase,
        error: response.error || null,
        logs: logs.concat(response.logs)
      }
    } catch (error) {
      return {
        error: error.message,
        phase,
        logs
      }
    }
  }

  /**
   * Sends Eth `amount` tokens to `solanaAccount` on the identity service
   * by way of the wormhole.
   */
  async proxySendTokensFromEthToSol(amount, solanaAccount) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const myWalletAddress = this.web3Manager.getWalletAddress()
    const wormholeAddress = this.ethContracts.WormholeClient.contractAddress
    const { selectedEthWallet } = await this.identityService.getEthRelayer(
      myWalletAddress
    )
    const permitMethod = await this.getPermitProxySendTokensMethod(
      myWalletAddress,
      wormholeAddress,
      amount
    )
    const permit = await this.ethWeb3Manager.getRelayMethodParams(
      this.ethContracts.AudiusTokenClient.contractAddress,
      permitMethod,
      selectedEthWallet
    )
    const transferTokensMethod =
      await this.wormholeClient.getTransferTokensToEthWormholeMethod(
        myWalletAddress,
        amount,
        solanaAccount,
        selectedEthWallet
      )
    const transferTokens = await this.ethWeb3Manager.getRelayMethodParams(
      this.ethContracts.WormholeClient.contractAddress,
      transferTokensMethod,
      selectedEthWallet
    )
    return this.identityService.wormholeRelay({
      senderAddress: myWalletAddress,
      permit,
      transferTokens
    })
  }

  /**
   * Sends `amount` tokens to `ethAccount` by way of the wormhole
   * 1.) Creates a solana root wallet
   * 2.) Sends the tokens from the user bank account to the solana wallet
   * 3.) Permits the solana wallet to approve transfer to wormhole
   * 4.) Transfers to the wrapped audio to the sol wormhole contract
   * 5.) Gathers attestations from wormhole oracles and realizes the tokens on eth
   */
  async sendTokensFromSolToEth(amount, ethAccount) {
    const { error, logs, phase } =
      await this.wormholeClient.sendTokensFromSolToEthViaWormhole(
        amount,
        ethAccount
      )
    return { error, logs, phase }
  }

  async _getPermitProxySendTokensParams(owner, relayerAddress, amount) {
    const web3 = this.ethWeb3Manager.getWeb3()
    const myPrivateKey = this.web3Manager.getOwnerWalletPrivateKey()
    const chainId = await new Promise((resolve) =>
      web3.eth.getChainId((_, chainId) => resolve(chainId))
    )
    const name = await this.ethContracts.AudiusTokenClient.name()
    const tokenAddress = this.ethContracts.AudiusTokenClient.contractAddress

    // Submit permit request to give address approval, via relayer
    const nonce = await this.ethContracts.AudiusTokenClient.nonces(owner)
    const currentBlockNumber = await web3.eth.getBlockNumber()
    const currentBlock = await web3.eth.getBlock(currentBlockNumber)
    // 1 hour, sufficiently far in future
    const deadline = currentBlock.timestamp + 60 * 60 * 1

    const digest = getPermitDigest(
      web3,
      name,
      tokenAddress,
      chainId,
      { owner: owner, spender: relayerAddress, value: amount },
      nonce,
      deadline
    )
    const result = sign(digest, myPrivateKey)
    return {
      result,
      deadline
    }
  }

  /**
   * Permits `relayerAddress` to send `amount` on behalf of the current user, `owner`
   */
  async permitProxySendTokens(owner, relayerAddress, amount) {
    const { result, deadline } = await this._getPermitProxySendTokensParams(
      owner,
      relayerAddress,
      amount
    )
    const tx = await this.ethContracts.AudiusTokenClient.permit(
      owner,
      relayerAddress,
      amount,
      deadline,
      result.v,
      result.r,
      result.s
    )
    return tx
  }

  /**
   * Gets the permit method to proxy send tokens `relayerAddress` to send `amount` on behalf of the current user, `owner`
   */
  async getPermitProxySendTokensMethod(owner, relayerAddress, amount) {
    const { result, deadline } = await this._getPermitProxySendTokensParams(
      owner,
      relayerAddress,
      amount
    )
    const contractMethod =
      this.ethContracts.AudiusTokenClient.AudiusTokenContract.methods.permit(
        owner,
        relayerAddress,
        amount,
        deadline,
        result.v,
        result.r,
        result.s
      )
    return contractMethod
  }

  /**
   * Sends `amount` tokens to `address` from `owner`
   */
  async sendTokens(owner, address, relayer, amount) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.ethContracts.AudiusTokenClient.transferFrom(
      owner,
      address,
      relayer,
      amount
    )
  }

  /**
   * Updates the minimum delegation amount for a user in identity
   * NOTE: Requests eth account signature
   */
  async updateMinimumDelegationAmount(amount) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const message = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = await this.ethWeb3Manager.sign(message)
    const wallet = this.ethWeb3Manager.getWalletAddress()
    return this.identityService.updateMinimumDelegationAmount(wallet, amount, {
      [AuthHeaders.MESSAGE]: message,
      [AuthHeaders.SIGNATURE]: signature
    })
  }

  /**
   * Get current user account PDA from SOL given an ID and ETH wallet address
   * @returns {object} with keys ethAddress, authority, replicaSet or
   * null when account not found
   */
  async getUserAccountOnSolana(
    { userId, wallet } = { userId: null, wallet: null }
  ) {
    this.REQUIRES(Services.SOLANA_WEB3_MANAGER)

    // If wallet or userId are not passed in, use the user loaded in libs
    if (!wallet || !userId) {
      const user = this.getCurrentUser()
      wallet = user.wallet
      userId = user.userId
    }

    if (!(userId instanceof BN)) {
      userId = new BN(userId)
    }
    // matches format for PDA derivation seed in SOL program
    // use BN.toArrayLike instead of .toBuffer for browser compat reasons
    const userIdSeed = userId.toArrayLike(Buffer, 'le', 4)

    const { derivedAddress: userAccountPDA } =
      await this.solanaWeb3Manager.findDerivedPair(
        this.solanaWeb3Manager.audiusDataProgramId,
        this.solanaWeb3Manager.audiusDataAdminStorageKeypairPublicKey,
        userIdSeed
      )

    const account = await this.solanaWeb3Manager.fetchAccount(userAccountPDA)
    return account
  }

  /**
   * Checks that the current user has claimed account PDA on SOL
   * @returns {boolean} userHasClaimedAccount
   */
  async userHasClaimedSolAccount(
    { account = null, wallet = null, userId = null } = {
      account: null,
      wallet: null,
      userId: null
    }
  ) {
    if (!account && !wallet && !userId) {
      throw new Error(
        'Must supply EITHER an `account` OR `wallet` and `userId` to look up whether userHasClaimedSolAccount'
      )
    }
    if (!account && wallet && userId) {
      account = await this.getUserAccountOnSolana({ wallet, userId })
    }
    const userHasClaimedAccount =
      PublicKey.default.toString() !== account.authority.toString()

    return userHasClaimedAccount
  }
}

module.exports = Account
