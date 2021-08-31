const solanaWeb3 = require('@solana/web3.js')
const splToken = require('@solana/spl-token')
const { transferWAudioBalance } = require('./transfer')
const { getBankAccountAddress, createUserBankFrom } = require('./userBank')
const {
  createAssociatedTokenAccount,
  getAssociatedTokenAccountInfo,
  findAssociatedTokenAddress
} = require('./tokenAccount')
const { wAudioFromWeiAudio } = require('./wAudio')
const Utils = require('../../utils')
const { submitAttestations, evaluateAttestations } = require('./rewards')
const BN = require('bn.js')

const { PublicKey } = solanaWeb3

/**
 * @typedef {import("./rewards.js").AttestationMeta} AttestationMeta
 */

/**
 * SolanaWeb3Manager acts as the interface to solana contracts from a client.
 * It wraps methods to create and lookup user banks, transfer balances, and
 * interact with the @solana/web3 library.
 *
 * Note: Callers of this class should specify all $AUDIO amounts in units of wei.
 * The internals of this class should handle the conversion from wei AUDIO to wormhole
 * $AUDIO amounts.
 */
class SolanaWeb3Manager {
  /**
   * @param {Object} solanaWeb3Config
   * @param {string} solanaWeb3Config.solanaClusterEndpoint
   *  the solana cluster RPC endpoint
   * @param {string} solanaWeb3Config.mintAddress
   *  address for the wAudio mint - Audius (Wormhole) token
   * @param {string} solanaWeb3Config.solanaTokenAddress
   *  the SPL token program address
   * @param {string} solanaWeb3Config.claimableTokenPDA
   *  the program derived address for the claimable token program (using the mint)
   * @param {string} solanaWeb3Config.feePayerAddress
   *  the address for the specific fee payer to be used in relayed transactions
   * @param {string} solanaWeb3Config.claimableTokenProgramAddress
   *  the address for the claimable token program used to create banks and transfer wAudio
   * @param {string} solanaWeb3Config.rewardsManagerProgramId
   *  the ID of the rewards manager program
   * @param {string} solanaWeb3Config.rewardsManagerProgramPDA
   *  the manager account of the rewards manager program
   * @param {string} solanaWeb3Config.rewardsManagerTokenPDA
   *  the token holder account of the rewards manager program
   * @param {IdentityService} identityService
   * @param {Web3Manager} web3Manager
   */
  constructor (
    solanaWeb3Config,
    identityService,
    web3Manager
  ) {
    this.solanaWeb3Config = solanaWeb3Config
    this.identityService = identityService
    this.web3Manager = web3Manager

    this.solanaWeb3 = solanaWeb3
    this.splToken = splToken
  }

  async init () {
    const {
      solanaClusterEndpoint,
      mintAddress,
      solanaTokenAddress,
      claimableTokenPDA,
      feePayerAddress,
      claimableTokenProgramAddress,
      rewardsManagerProgramId,
      rewardsManagerProgramPDA,
      rewardsManagerTokenPDA
    } = this.solanaWeb3Config
    this.solanaClusterEndpoint = solanaClusterEndpoint
    this.connection = new solanaWeb3.Connection(this.solanaClusterEndpoint)

    this.mintAddress = mintAddress
    this.mintKey = new PublicKey(mintAddress)

    this.solanaTokenAddress = solanaTokenAddress
    this.solanaTokenKey = new PublicKey(solanaTokenAddress)

    this.feePayerAddress = feePayerAddress
    this.feePayerKey = new PublicKey(feePayerAddress)

    this.claimableTokenProgramKey = new PublicKey(claimableTokenProgramAddress)
    this.claimableTokenPDA = claimableTokenPDA || (
      await this._generateClaimableTokenPDA(
        this.mintKey,
        this.claimableTokenProgramKey
      )
    )
    this.claimableTokenPDAKey = new PublicKey(this.claimableTokenPDA)
    this.rewardManagerProgramId = new PublicKey(rewardsManagerProgramId)
    this.rewardManagerProgramPDA = new PublicKey(rewardsManagerProgramPDA)
    this.rewardManagerTokenPDA = new PublicKey(rewardsManagerTokenPDA)
  }

  /**
   * Creates a solana bank account from the web3 provider's eth address
   */
  async createUserBank () {
    const ethAddress = this.web3Manager.getWalletAddress()
    await createUserBankFrom({
      ethAddress,
      claimableTokenPDAKey: this.claimableTokenPDAKey,
      feePayerKey: this.feePayerKey,
      mintKey: this.mintKey,
      solanaTokenProgramKey: this.solanaTokenKey,
      claimableTokenProgramKey: this.claimableTokenProgramKey,
      connection: this.connection,
      identityService: this.identityService
    })
  }

  /**
   * Creates a token account for the provided solana address (a wallet)
   * See https://spl.solana.com/associated-token-account
   * @param {string} solanaAddress
   */
  async createAssociatedTokenAccount (solanaAddress) {
    await createAssociatedTokenAccount({
      feePayerKey: this.feePayerKey,
      solanaWalletKey: new PublicKey(solanaAddress),
      mintKey: this.mintKey,
      solanaTokenProgramKey: this.solanaTokenKey,
      connection: this.connection,
      identityService: this.identityService
    })
  }

  /**
   * Finds the wAudio token account for a provided solana address (a wallet)
   * See https://spl.solana.com/associated-token-account
   * @param {string} solanaAddress
   */
  async findAssociatedTokenAddress (solanaAddress) {
    return findAssociatedTokenAddress({
      solanaWalletKey: new PublicKey(solanaAddress),
      mintKey: this.mintKey,
      solanaTokenProgramKey: this.solanaTokenKey
    })
  }

  /**
   * Gets a solana bank account from the current we3 provider's eth address
   * @returns {PublicKey} UserBank
   */
  async getUserBank () {
    const ethAddress = this.web3Manager.getWalletAddress()
    const bank = await getBankAccountAddress(
      ethAddress,
      this.claimableTokenPDAKey,
      this.solanaTokenKey
    )
    return bank
  }

  /**
   * Gets the info for a user bank/wAudio token account given a solana address.
   * If the solanaAddress is not a valid token account, returns `null`
   * @returns {AccountInfo | null}
   */
  async getAssociatedTokenAccountInfo (solanaAddress) {
    try {
      const res = await getAssociatedTokenAccountInfo({
        tokenAccountAddressKey: new PublicKey(solanaAddress),
        mintKey: this.mintKey,
        solanaTokenProgramKey: this.solanaTokenKey,
        connection: this.connection
      })
      return res
    } catch (e) {
      return null
    }
  }

  /**
   * Gets the SPL waudio balance for a solana address in wei with 18 decimals
   * @returns {BN | null}
   */
  async getWAudioBalance (solanaAddress) {
    try {
      const tokenAccount = await this.getAssociatedTokenAccountInfo(solanaAddress)
      if (!tokenAccount) return null

      // Multiply by 10^9 to maintain same decimals as eth $AUDIO
      return tokenAccount.amount.mul(Utils.toBN('1'.padEnd(10, '0')))
    } catch (e) {
      return null
    }
  }

  /**
   * Transfers audio from the web3 provider's eth address
   * @param {string} recipientSolanaAddress
   *  Recipient solana address which is either a user bank, wAudio token account,
   *  or a solana account. In the last case, an associated token account is created
   *  if one does not already exist for the solana account
   * @param {BN} amount the amount of $AUDIO to send in wei units of $AUDIO.
   * **IMPORTANT NOTE**
   * wAudio (Solana) does not support 10^-18 (wei) units of $AUDIO. The smallest
   * demarcation on that side is 10^-9, so the $AUDIO amount must be >= 10^9 and have no
   * remainder after a division with 10^9 or this method will throw.
   *
   * Generally speaking, callers into the solanaWeb3Manager should use BN.js representation
   * of wei $AUDIO for all method calls
   */
  async transferWAudio (recipientSolanaAddress, amount) {
    // Check if the solana address is a token account
    let tokenAccountInfo = await this.getAssociatedTokenAccountInfo(recipientSolanaAddress)
    if (!tokenAccountInfo) {
      console.info('Provided recipient solana address was not a token account')
      // If not, check to see if it already has an associated token account.
      const associatedTokenAccount = await this.findAssociatedTokenAddress(recipientSolanaAddress)
      tokenAccountInfo = await this.getAssociatedTokenAccountInfo(associatedTokenAccount.toString())

      // If it's not a valid token account, we need to make one first
      if (!tokenAccountInfo) {
        console.info('Provided recipient solana address has no associated token account, creating')
        await this.createAssociatedTokenAccount(recipientSolanaAddress)
      }
      recipientSolanaAddress = associatedTokenAccount.toString()
    }

    console.info(`Transfering ${amount.toString()} wei $AUDIO to ${recipientSolanaAddress}`)

    const wAudioAmount = wAudioFromWeiAudio(amount)

    const ethAddress = this.web3Manager.getWalletAddress()
    const senderSolanaAddress = await getBankAccountAddress(
      ethAddress,
      this.claimableTokenPDAKey,
      this.solanaTokenKey
    )
    await transferWAudioBalance({
      amount: wAudioAmount,
      senderEthAddress: ethAddress,
      senderEthPrivateKey: this.web3Manager.getOwnerWalletPrivateKey(),
      senderSolanaAddress,
      recipientSolanaAddress,
      claimableTokenPDA: this.claimableTokenPDAKey,
      solanaTokenProgramKey: this.solanaTokenKey,
      claimableTokenProgramKey: this.claimableTokenProgramKey,
      connection: this.connection,
      identityService: this.identityService
    })
  }

  /**
   * Submits attestations for challenge completion to the RewardsManager program on Solana.
   *
   * @param {{
   *     attestations: AttestationMeta[],
   *     oracleAttestation: AttestationMeta,
   *     challengeId: string,
   *     specifier: string,
   *     recipientEthAddress: string,
   *     tokenAmount: BN,
   * }} {
   *     attestations,
   *     oracleAttestation,
   *     challengeId,
   *     specifier,
   *     recipientEthAddress,
   *     tokenAmount,
   *    }
   * @memberof SolanaWeb3Manager
   */
  async submitChallengeAttestations ({
    attestations,
    oracleAttestation,
    challengeId,
    specifier,
    recipientEthAddress,
    tokenAmount
  }) {
    return submitAttestations({
      rewardManagerProgramId: this.rewardManagerProgramId,
      rewardManagerAccount: this.rewardManagerProgramPDA,
      attestations,
      oracleAttestation,
      challengeId,
      specifier,
      feePayer: this.feePayerKey,
      recipientEthAddress,
      tokenAmount,
      identityService: this.identityService,
      connection: this.connection
    })
  }

  /**
   * Evaluates existing submitted attestations, disbursing if successful.
   *
   * @param {{
   *    challengeId: string,
   *    specifier: string,
   *    recipientEthAddress: string
   *    oracleEthAddress: string
   * }} {
   *     challengeId,
   *     specifier,
   *     recipientEthAddress,
   *     oracleEthAddress,
   *     tokenAmount
   *   }
   * @memberof SolanaWeb3Manager
   */
  async evaluateChallengeAttestations ({
    challengeId,
    specifier,
    recipientEthAddress,
    oracleEthAddress,
    tokenAmount
  }) {
    return evaluateAttestations({
      rewardManagerProgramId: this.rewardManagerProgramId,
      rewardManagerAccount: this.rewardManagerProgramPDA,
      rewardManagerTokenSource: this.rewardManagerTokenPDA,
      challengeId,
      specifier,
      recipientEthAddress,
      userBankProgramAccount: this.claimableTokenPDAKey,
      oracleEthAddress,
      feePayer: this.feePayerKey,
      tokenAmount,
      identityService: this.identityService,
      connection: this.connection
    })
  }

  /**
   * Generates a PDA for the claimable token program from
   * the mint key and the program ID
   */
  async _generateClaimableTokenPDA (mintKey, programKey) {
    let res = await this.solanaWeb3.PublicKey.findProgramAddress(
      [mintKey.toBytes().slice(0, 32)],
      programKey
    )
    return res[0].toString()
  }
}

module.exports = SolanaWeb3Manager
