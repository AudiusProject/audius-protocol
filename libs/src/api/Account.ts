import { Base, BaseConstructorArgs, Services } from './base'
import { CreatorNode } from '../services/creatorNode'
import { Nullable, User, UserMetadata, Utils } from '../utils'
import { AuthHeaders } from '../constants'
import { getPermitDigest, sign } from '../utils/signatures'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@project-serum/anchor'
import type { Users } from './Users'

type UserBankOutcomes = {
  Request: string
  Failure: string
}

export class Account extends Base {
  User: Users

  constructor(userApi: Users, ...services: BaseConstructorArgs) {
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
   */
  async login(email: string, password: string) {
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
        return { error: (e as Error).message, phase }
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
          CreatorNode.getPrimary(creatorNodeEndpoint)!
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
   * @param email
   * @param password
   * @param metadata
   * @param profilePictureFile an optional file to upload as the profile picture
   * @param coverPhotoFile an optional file to upload as the cover phtoo
   * @param hasWallet
   * @param host The host url used for the recovery email
   * @param handleUserBankOutcomes an optional callback to record user bank outcomes
   * @param userBankOutcomes an optional object with request, succes, and failure keys to record user bank outcomes
   * @param feePayerOverride an optional string in case the client wants to switch between fee payers
   * @param generateRecoveryLink an optional flag to skip generating recovery link for testing purposes
   */
  async signUp(
    email: string,
    password: string,
    metadata: UserMetadata,
    profilePictureFile: Nullable<File> = null,
    coverPhotoFile: Nullable<File> = null,
    hasWallet = false,
    host = (typeof window !== 'undefined' && window.location.origin) || null,
    handleUserBankOutcomes = (_outcome?: string, _errorCodes?: {}) => {},
    userBankOutcomes: Partial<UserBankOutcomes> = {},
    feePayerOverride: Nullable<string> = null,
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
          this.web3Manager.setOwnerWallet(ownerWallet)
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
              await this.solanaWeb3Manager.createUserBank(feePayerOverride!)
            if (error ?? errorCode) {
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
          } catch (err: any) {
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
      metadata = (await this.User.assignReplicaSet({ userId }))!

      // Upload profile pic and cover photo to primary Content Node and sync across secondaries
      phase = phases.UPLOAD_PROFILE_IMAGES
      await this.User.uploadProfileImages(
        profilePictureFile!,
        coverPhotoFile!,
        metadata
      )
    } catch (e: any) {
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
   */
  async generateRecoveryLink({
    handle,
    host
  }: { handle?: string; host?: Nullable<string> } = {}) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    // @ts-expect-error hard to type this hedgehog addon
    const recoveryInfo = await this.hedgehog.generateRecoveryInfo()
    handle = handle ?? this.userStateManager.getCurrentUser()!.handle

    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = await this.web3Manager.sign(Buffer.from(data, 'utf-8'))

    const recoveryData = {
      login: recoveryInfo.login,
      host: host ?? recoveryInfo.host,
      data,
      signature,
      handle
    }

    await this.identityService.sendRecoveryInfo(recoveryData)
  }

  async resetPassword(email: string, newpassword: string) {
    return await this.hedgehog.resetPassword(email, newpassword)
  }

  async changePassword(
    email: string,
    newpassword: string,
    oldpassword: string
  ) {
    return await this.hedgehog.changePassword(email, newpassword, oldpassword)
  }

  async confirmCredentials(email: string, password: string) {
    return await this.hedgehog.confirmCredentials(email, password)
  }

  /**
   * Check if an email address has been previously registered.
   */
  async checkIfEmailRegistered(email: string) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return await this.identityService.checkIfEmailRegistered(email)
  }

  /**
   * Get the current user's email address
   */
  async getUserEmail() {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return await this.identityService.getUserEmail()
  }

  /**
   * Associates a user with a twitter uuid.
   * @param uuid from the Twitter API
   */
  async associateTwitterUser(uuid: string, userId: number, handle: string) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return await this.identityService.associateTwitterUser(uuid, userId, handle)
  }

  /**
   * Associates a user with an instagram uuid.
   * @param uuid from the Instagram API
   */
  async associateInstagramUser(uuid: string, userId: number, handle: string) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return await this.identityService.associateInstagramUser(
      uuid,
      userId,
      handle
    )
  }

  /**
   * Checks if a requested handle is valid (unused).
   */
  async handleIsValid(handle: string) {
    return await this.contracts.UserFactoryClient.handleIsValid(handle)
  }

  /**
   * Looks up a Twitter account by handle.
   */
  async lookupTwitterHandle(handle: string) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return await this.identityService.lookupTwitterHandle(handle)
  }

  /**
   * Updates a user's creator node endpoint. Sets the connected creator node in the libs instance
   * and updates the user's metadata blob.
   */
  async updateCreatorNodeEndpoint(url: string) {
    this.REQUIRES(Services.CREATOR_NODE)

    const user = this.userStateManager.getCurrentUser() as User
    await this.creatorNode.setEndpoint(url)
    user.creator_node_endpoint = url
    await this.User.updateCreator(user.user_id, user)
  }

  /**
   * Perform a full-text search. Returns tracks, users, playlists, albums
   *    with optional user-specific results for each
   *  - user, track, and playlist objects have all same data as returned from standalone endpoints
   * @param text search query
   * @param kind 'tracks', 'users', 'playlists', 'albums', 'all'
   * @param limit max # of items to return per list (for pagination)
   * @param offset offset into list to return from (for pagination)
   */
  async searchFull(text: string, kind: string, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.searchFull(text, kind, limit, offset)
  }

  /**
   * Perform a lighter-weight full-text search. Returns tracks, users, playlists, albums
   *    with optional user-specific results for each
   *  - user, track, and playlist objects have core data, and track & playlist objects
   *    also return user object
   * @param text search query
   * @param limit max # of items to return per list (for pagination)
   * @param offset offset into list to return from (for pagination)
   */
  async searchAutocomplete(text: string, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.searchAutocomplete(text, limit, offset)
  }

  /**
   * Perform a tags-only search. Returns tracks with required tag and users
   * that have used a tag greater than a specified number of times
   * @param text search query
   * @param userTagCount min # of times a user must have used a tag to be returned
   * @param kind 'tracks', 'users', 'playlists', 'albums', 'all'
   * @param limit max # of items to return per list (for pagination)
   * @param offset offset into list to return from (for pagination)
   */
  async searchTags(
    text: string,
    userTagCount = 2,
    kind: string,
    limit = 100,
    offset = 0
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.searchTags(
      text,
      userTagCount,
      kind,
      limit,
      offset
    )
  }

  /**
   * Check if the user has a distribution claim
   * @param index The index of the claim to check (if known)
   */
  async getHasClaimed(index?: number) {
    this.REQUIRES(Services.COMSTOCK)
    if (index) {
      return await this.ethContracts.ClaimDistributionClient?.isClaimed(index)
    }
    const userWallet = this.web3Manager.getWalletAddress()
    const web3 = this.web3Manager.getWeb3()
    const wallet = web3.utils.toChecksumAddress(userWallet)
    const claim = await this.comstock.getComstock({ wallet })
    return await this.ethContracts.ClaimDistributionClient?.isClaimed(
      claim.index
    )
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
   * @param index The index of the claim to check
   * @param amount The amount to be claimed
   * @param merkleProof The merkle proof for the claim
   */
  async makeDistributionClaim(
    index: number,
    amount: BN,
    merkleProof: string[]
  ) {
    this.REQUIRES(Services.COMSTOCK, Services.IDENTITY_SERVICE)
    const userWallet = this.web3Manager.getWalletAddress()
    const web3 = this.web3Manager.getWeb3()
    const wallet = web3.utils.toChecksumAddress(userWallet)
    if (index && amount && merkleProof) {
      return await this.ethContracts.ClaimDistributionClient?.claim(
        index,
        userWallet,
        amount,
        merkleProof
      )
    }
    const claim = await this.comstock.getComstock({ wallet })
    return await this.ethContracts.ClaimDistributionClient?.claim(
      claim.index,
      userWallet,
      claim.amount,
      claim.proof
    )
  }

  /**
   * Sends `amount` tokens to `recipientAddress`
   */
  async permitAndSendTokens(recipientAddress: string, amount: BN) {
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
  async sendTokensFromEthToSol(amount: BN, solanaAccount: string) {
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

      const transferTransactionHash = transferTokensTx?.txHash
      logs.push(`Completed transfer tokens with tx ${transferTransactionHash}`)
      phase = phases.ATTEST_AND_COMPLETE_TRANSFER

      const response =
        await this.wormholeClient.attestAndCompleteTransferEthToSol(
          transferTransactionHash!
        )
      if (response.transactionSignature) {
        logs.push(
          `Receive sol wrapped tokens in tx ${response.transactionSignature}`
        )
      }
      return {
        txSignature: response.transactionSignature,
        phase: response.phase,
        error: response.error ?? null,
        logs: logs.concat(response.logs)
      }
    } catch (error: any) {
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
  async proxySendTokensFromEthToSol(amount: BN, solanaAccount: string) {
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
        solanaAccount
      )
    const transferTokens = await this.ethWeb3Manager.getRelayMethodParams(
      this.ethContracts.WormholeClient.contractAddress,
      transferTokensMethod,
      selectedEthWallet
    )
    return await this.identityService.wormholeRelay({
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
  async sendTokensFromSolToEth(amount: BN, ethAccount: string) {
    const { error, logs, phase } =
      await this.wormholeClient.sendTokensFromSolToEthViaWormhole(
        amount,
        ethAccount
      )
    return { error, logs, phase }
  }

  async _getPermitProxySendTokensParams(
    owner: string,
    relayerAddress: string,
    amount: BN
  ) {
    const web3 = this.ethWeb3Manager.getWeb3()
    const myPrivateKey = this.web3Manager.getOwnerWalletPrivateKey()
    /* eslint-disable -- some funky promise logic ahead */
    const chainId = await new Promise<number>(
      async (resolve) =>
        await web3.eth.getChainId((_, chainId) => resolve(chainId))
    )
    /* eslint-enable */
    const name = await this.ethContracts.AudiusTokenClient.name()
    const tokenAddress = this.ethContracts.AudiusTokenClient.contractAddress

    // Submit permit request to give address approval, via relayer
    const nonce = await this.ethContracts.AudiusTokenClient.nonces(owner)
    const currentBlockNumber = await web3.eth.getBlockNumber()
    const currentBlock = await web3.eth.getBlock(currentBlockNumber)
    // 1 hour, sufficiently far in future
    const deadline = (currentBlock.timestamp as unknown as number) + 60 * 60 * 1

    const digest = getPermitDigest(
      web3,
      name,
      tokenAddress,
      chainId,
      { owner: owner, spender: relayerAddress, value: amount },
      nonce,
      deadline
    )
    const result = sign(digest, myPrivateKey!)
    return {
      result,
      deadline
    }
  }

  /**
   * Permits `relayerAddress` to send `amount` on behalf of the current user, `owner`
   */
  async permitProxySendTokens(
    owner: string,
    relayerAddress: string,
    amount: BN
  ) {
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
  async getPermitProxySendTokensMethod(
    owner: string,
    relayerAddress: string,
    amount: BN
  ) {
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
  async sendTokens(
    owner: string,
    address: string,
    relayer: string,
    amount: BN
  ) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return await this.ethContracts.AudiusTokenClient.transferFrom(
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
  async updateMinimumDelegationAmount(amount: BN) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const message = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = await this.ethWeb3Manager.sign(
      Buffer.from(message, 'utf-8')
    )
    const wallet = this.ethWeb3Manager.getWalletAddress()
    return await this.identityService.updateMinimumDelegationAmount(
      wallet,
      amount,
      {
        [AuthHeaders.MESSAGE]: message,
        [AuthHeaders.SIGNATURE]: signature
      }
    )
  }

  /**
   * Get current user account PDA from SOL given an ID and ETH wallet address
   * @returns with keys ethAddress, authority, replicaSet or
   * null when account not found
   */
  async getUserAccountOnSolana(
    {
      userId,
      wallet
    }: { userId?: Nullable<number | BN>; wallet?: Nullable<string> } = {
      userId: null,
      wallet: null
    }
  ) {
    this.REQUIRES(Services.SOLANA_WEB3_MANAGER)

    // If wallet or userId are not passed in, use the user loaded in libs
    if (!wallet || !userId) {
      const user = this.getCurrentUser()!
      wallet = user.wallet
      // @ts-expect-error this should probably be user_id
      userId = user.userId
    }

    if (!(userId instanceof BN)) {
      // @ts-expect-error also weird
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
   * @returns userHasClaimedAccount
   */
  async userHasClaimedSolAccount(
    {
      account = null,
      wallet = null,
      userId = null
    }: { account: any; wallet: Nullable<string>; userId: Nullable<number> } = {
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
