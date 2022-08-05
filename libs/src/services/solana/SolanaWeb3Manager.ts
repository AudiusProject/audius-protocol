import solanaWeb3, { Connection, Keypair, PublicKey } from '@solana/web3.js'
import type BN from 'bn.js'
import splToken from '@solana/spl-token'
import anchor, { Address, Idl, Program } from '@project-serum/anchor'
import { idl } from '@audius/anchor-audius-data'

import { transferWAudioBalance } from './transfer'
import { getBankAccountAddress, createUserBankFrom } from './userBank'
import {
  createAssociatedTokenAccount,
  getAssociatedTokenAccountInfo,
  findAssociatedTokenAddress
} from './tokenAccount'
import { wAudioFromWeiAudio } from './wAudio'
import { Logger, Nullable, Utils } from '../../utils'
import { SolanaUtils } from './SolanaUtils'
import { TransactionHandler } from './transactionHandler'
import {
  submitAttestations,
  evaluateAttestations,
  createSender,
  deriveSolanaSenderFromEthAddress,
  SubmitAttestationsConfig as SubmitAttestationsBaseConfig,
  CreateSenderParams as CreateSenderBaseParams
} from './rewards'
import { AUDIO_DECMIALS, WAUDIO_DECMIALS } from '../../constants'
import type { IdentityService } from '../identity'
import type { Web3Manager } from '../web3Manager'

type EvaluateChallengeAttestationsConfig = {
  challengeId: string
  specifier: string
  recipientEthAddress: string
  oracleEthAddress: string
  tokenAmount: BN
  logger: Logger
}

type SubmitAttestationsConfig = Omit<
  SubmitAttestationsBaseConfig,
  | 'rewardManagerProgramId'
  | 'rewardManagerAccount'
  | 'rewardManagerTokenSource'
  | 'userBankProgramAccount'
  | 'feePayer'
  | 'transactionHandler'
> & { feePayerOverride: Nullable<string> }

type CreateSenderParams = Omit<
  CreateSenderBaseParams,
  | 'rewardManagerProgramId'
  | 'rewardManagerAccount'
  | 'feePayer'
  | 'transactionHandler'
  | 'identityService'
> & { feePayerOverride: Nullable<string> }

// Somewhat arbitrary close-to-zero number of Sol. For context, creating a UserBank costs ~0.002 SOL.
// Without this padding, we could reach some low non-zero number of SOL where transactions would fail
// despite a remaining balance.
const ZERO_SOL_EPSILON = 0.005
const SOL_PER_LAMPORT = 0.000000001

// Generous default connection confirmation timeout to better cope with RPC congestion
const DEFAULT_CONNECTION_CONFIRMATION_TIMEOUT_MS = 180 * 1000

export type SolanaWeb3Config = {
  //  the RPC endpoint to make requests against
  solanaClusterEndpoint: string
  // wAudio mint address
  mintAddress: string
  // native solana token program
  solanaTokenAddress: string
  // the generated program derived address we use so our bank program can take ownership of accounts
  claimableTokenPDA: string
  // address for the fee payer for transactions
  feePayerAddress: string
  // address of the audius user bank program
  claimableTokenProgramAddress: string
  // address for the Rewards Manager program
  rewardsManagerProgramId: string
  // Rewards Manager PDA
  rewardsManagerProgramPDA: string
  // The PDA of the rewards manager funds holder account
  rewardsManagerTokenPDA: string
  // Whether to use identity as a relay or submit transactions locally
  useRelay: boolean
  // fee payer secret keys, if client wants to switch between different fee payers during relay
  feePayerKeypairs?: Keypair[]
  // solana web3 connection confirmationTimeout in ms
  confirmationTimeout: number
  // admin storage PK for audius-data program
  audiusDataProgramId: PublicKey
  // program ID for the audius-data Anchor program
  audiusDataAdminStorageKeypairPublicKey: PublicKey
  // IDL for the audius-data Anchor program.
  audiusDataIdl: Idl
}

/**
 * SolanaWeb3Manager acts as the interface to solana contracts from a client.
 * It wraps methods to create and lookup user banks, transfer balances, and
 * interact with the @solana/web3 library.
 *
 * Note: Callers of this class should specify all $AUDIO amounts in units of wei.
 * The internals of this class should handle the conversion from wei AUDIO to wormhole
 * $AUDIO amounts.
 */

export class SolanaWeb3Manager {
  solanaWeb3Config: SolanaWeb3Config
  identityService: Nullable<IdentityService>
  web3Manager: Nullable<Web3Manager>
  solanaWeb3: typeof solanaWeb3
  splToken: typeof splToken
  solanaClusterEndpoint!: string
  transactionHandler!: TransactionHandler
  connection!: Connection
  mintAddress!: string
  mintKey!: PublicKey
  solanaTokenAddress!: string
  solanaTokenKey!: PublicKey
  feePayerAddress!: Address
  feePayerKey!: PublicKey
  claimableTokenProgramKey!: PublicKey
  claimableTokenPDA!: string
  claimableTokenPDAKey!: PublicKey
  rewardManagerProgramId!: PublicKey
  rewardManagerProgramPDA!: PublicKey
  rewardManagerTokenPDA!: PublicKey
  audiusDataProgramId!: PublicKey
  audiusDataAdminStorageKeypairPublicKey!: PublicKey
  audiusDataIdl!: Idl
  anchorProgram!: Program

  constructor(
    solanaWeb3Config: SolanaWeb3Config,
    identityService: Nullable<IdentityService>,
    web3Manager: Nullable<Web3Manager>
  ) {
    this.solanaWeb3Config = solanaWeb3Config
    this.identityService = identityService
    this.web3Manager = web3Manager

    this.solanaWeb3 = solanaWeb3
    this.splToken = splToken
  }

  async init() {
    const {
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
      feePayerKeypairs,
      confirmationTimeout,
      audiusDataProgramId,
      audiusDataAdminStorageKeypairPublicKey,
      audiusDataIdl
    } = this.solanaWeb3Config

    this.solanaClusterEndpoint = solanaClusterEndpoint
    this.connection = new solanaWeb3.Connection(this.solanaClusterEndpoint, {
      confirmTransactionInitialTimeout:
        confirmationTimeout || DEFAULT_CONNECTION_CONFIRMATION_TIMEOUT_MS
    })

    this.transactionHandler = new TransactionHandler({
      connection: this.connection,
      useRelay,
      identityService: this.identityService,
      feePayerKeypairs
    })

    this.mintAddress = mintAddress
    this.mintKey = SolanaUtils.newPublicKeyNullable(mintAddress)

    this.solanaTokenAddress = solanaTokenAddress
    this.solanaTokenKey = SolanaUtils.newPublicKeyNullable(solanaTokenAddress)

    if (feePayerAddress) {
      this.feePayerAddress = feePayerAddress
      this.feePayerKey = SolanaUtils.newPublicKeyNullable(feePayerAddress)
    } else if (feePayerKeypairs?.length) {
      this.feePayerAddress = feePayerKeypairs[0]!.publicKey
      this.feePayerKey = SolanaUtils.newPublicKeyNullable(
        feePayerKeypairs[0]?.publicKey as unknown as string
      )
    }

    this.claimableTokenProgramKey = SolanaUtils.newPublicKeyNullable(
      claimableTokenProgramAddress
    )
    this.claimableTokenPDA =
      claimableTokenPDA ||
      ((this.claimableTokenProgramKey
        ? (
            await SolanaUtils.findProgramAddressFromPubkey(
              this.claimableTokenProgramKey,
              this.mintKey
            )
          )[0].toString()
        : null) as string)
    this.claimableTokenPDAKey = SolanaUtils.newPublicKeyNullable(
      this.claimableTokenPDA
    )
    this.rewardManagerProgramId = SolanaUtils.newPublicKeyNullable(
      rewardsManagerProgramId
    )
    this.rewardManagerProgramPDA = SolanaUtils.newPublicKeyNullable(
      rewardsManagerProgramPDA
    )
    this.rewardManagerTokenPDA = SolanaUtils.newPublicKeyNullable(
      rewardsManagerTokenPDA
    )
    this.audiusDataProgramId = audiusDataProgramId
    this.audiusDataAdminStorageKeypairPublicKey =
      audiusDataAdminStorageKeypairPublicKey

    this.audiusDataIdl = audiusDataIdl || idl

    if (
      this.audiusDataProgramId &&
      this.audiusDataAdminStorageKeypairPublicKey &&
      this.audiusDataIdl
    ) {
      const connection = new solanaWeb3.Connection(
        this.solanaClusterEndpoint,
        anchor.AnchorProvider.defaultOptions()
      )
      const anchorProvider = new anchor.AnchorProvider(
        connection,
        // @ts-expect-error weirdness with 3rd party types
        solanaWeb3.Keypair.generate(),
        anchor.AnchorProvider.defaultOptions()
      )
      this.anchorProgram = new anchor.Program(
        this.audiusDataIdl,
        audiusDataProgramId,
        anchorProvider
      )
    }
  }

  /**
   * Creates a solana bank account from the web3 provider's eth address
   */
  async createUserBank(feePayerOverride: string) {
    if (!this.web3Manager) {
      throw new Error(
        'A web3Manager is required for this solanaWeb3Manager method'
      )
    }

    const ethAddress = this.web3Manager.getWalletAddress()
    return await createUserBankFrom({
      ethAddress,
      claimableTokenPDAKey: this.claimableTokenPDAKey,
      feePayerKey:
        SolanaUtils.newPublicKeyNullable(feePayerOverride) || this.feePayerKey,
      mintKey: this.mintKey,
      solanaTokenProgramKey: this.solanaTokenKey,
      claimableTokenProgramKey: this.claimableTokenProgramKey,
      transactionHandler: this.transactionHandler
    })
  }

  /**
   * Creates a token account for the provided solana address (a wallet)
   * See https://spl.solana.com/associated-token-account
   */
  async createAssociatedTokenAccount(solanaAddress: string) {
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
   */
  async findAssociatedTokenAddress(solanaAddress: string) {
    return await findAssociatedTokenAddress({
      solanaWalletKey: new PublicKey(solanaAddress),
      mintKey: this.mintKey,
      solanaTokenProgramKey: this.solanaTokenKey
    })
  }

  /**
   * Gets a solana bank account from the current we3 provider's eth address
   */
  async getUserBank() {
    if (!this.web3Manager) {
      throw new Error(
        'A web3Manager is required for this solanaWeb3Manager method'
      )
    }
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
   */
  async getAssociatedTokenAccountInfo(solanaAddress: string) {
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
   */
  async getWAudioBalance(solanaAddress: string) {
    try {
      let tokenAccount = await this.getAssociatedTokenAccountInfo(solanaAddress)

      // If the token account doesn't exist, check if solanaAddress is a root account
      // if so, derive the associated token account & check that balance
      if (!tokenAccount) {
        const associatedTokenAccount = await this.findAssociatedTokenAddress(
          solanaAddress
        )
        tokenAccount = await this.getAssociatedTokenAccountInfo(
          associatedTokenAccount.toString()
        )
        if (!tokenAccount) {
          return null
        }
      }

      // Multiply by 10^10 to maintain same decimals as eth $AUDIO
      const decimals = AUDIO_DECMIALS - WAUDIO_DECMIALS
      return tokenAccount.amount.mul(Utils.toBN('1'.padEnd(decimals + 1, '0')))
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
   * demarcation on that side is 10^-8, so the $AUDIO amount must be >= 10^8 and have no
   * remainder after a division with 10^8 or this method will throw.
   *
   * Generally speaking, callers into the solanaWeb3Manager should use BN.js representation
   * of wei $AUDIO for all method calls
   */
  async transferWAudio(recipientSolanaAddress: string, amount: BN) {
    if (!this.web3Manager) {
      throw new Error(
        'A web3Manager is required for this solanaWeb3Manager method'
      )
    }

    // Check if the solana address is a token account
    let tokenAccountInfo = await this.getAssociatedTokenAccountInfo(
      recipientSolanaAddress
    )
    if (!tokenAccountInfo) {
      console.info('Provided recipient solana address was not a token account')
      // If not, check to see if it already has an associated token account.
      const associatedTokenAccount = await this.findAssociatedTokenAddress(
        recipientSolanaAddress
      )
      tokenAccountInfo = await this.getAssociatedTokenAccountInfo(
        associatedTokenAccount.toString()
      )

      // If it's not a valid token account, we need to make one first
      if (!tokenAccountInfo) {
        console.info(
          'Provided recipient solana address has no associated token account, creating'
        )
        await this.createAssociatedTokenAccount(recipientSolanaAddress)
      }
      recipientSolanaAddress = associatedTokenAccount.toString()
    }

    console.info(
      `Transfering ${amount.toString()} wei $AUDIO to ${recipientSolanaAddress}`
    )

    const wAudioAmount = wAudioFromWeiAudio(amount)

    const ethAddress = this.web3Manager.getWalletAddress()
    const senderSolanaAddress = await getBankAccountAddress(
      ethAddress,
      this.claimableTokenPDAKey,
      this.solanaTokenKey
    )
    return await transferWAudioBalance({
      amount: wAudioAmount,
      senderEthAddress: ethAddress,
      feePayerKey: this.feePayerKey,
      senderEthPrivateKey:
        this.web3Manager.getOwnerWalletPrivateKey() as unknown as string,
      senderSolanaAddress,
      recipientSolanaAddress,
      claimableTokenPDA: this.claimableTokenPDAKey,
      solanaTokenProgramKey: this.solanaTokenKey,
      claimableTokenProgramKey: this.claimableTokenProgramKey,
      connection: this.connection,
      mintKey: this.mintKey,
      transactionHandler: this.transactionHandler
    })
  }

  /**
   * Submits attestations for challenge completion to the RewardsManager program on Solana.
   */
  async submitChallengeAttestations({
    attestations,
    oracleAttestation,
    challengeId,
    specifier,
    recipientEthAddress,
    tokenAmount,
    instructionsPerTransaction,
    logger = console,
    feePayerOverride = null
  }: SubmitAttestationsConfig) {
    return await submitAttestations({
      rewardManagerProgramId: this.rewardManagerProgramId,
      rewardManagerAccount: this.rewardManagerProgramPDA,
      attestations,
      oracleAttestation,
      challengeId,
      specifier,
      feePayer:
        SolanaUtils.newPublicKeyNullable(feePayerOverride) ?? this.feePayerKey,
      recipientEthAddress,
      tokenAmount,
      transactionHandler: this.transactionHandler,
      instructionsPerTransaction,
      logger
    })
  }

  /**
   * Evaluates existing submitted attestations, disbursing if successful.
   */
  async evaluateChallengeAttestations({
    challengeId,
    specifier,
    recipientEthAddress,
    oracleEthAddress,
    tokenAmount,
    logger = console,
    feePayerOverride = null
  }: EvaluateChallengeAttestationsConfig & {
    feePayerOverride: Nullable<string>
  }) {
    return await evaluateAttestations({
      rewardManagerProgramId: this.rewardManagerProgramId,
      rewardManagerAccount: this.rewardManagerProgramPDA,
      rewardManagerTokenSource: this.rewardManagerTokenPDA,
      challengeId,
      specifier,
      recipientEthAddress,
      userBankProgramAccount: this.claimableTokenPDAKey,
      oracleEthAddress,
      feePayer:
        SolanaUtils.newPublicKeyNullable(feePayerOverride) ?? this.feePayerKey,
      tokenAmount,
      transactionHandler: this.transactionHandler,
      logger
    })
  }

  /**
   * Creates a new rewards signer (one that can attest)
   */
  async createSender({
    senderEthAddress,
    operatorEthAddress,
    attestations,
    feePayerOverride = null
  }: CreateSenderParams) {
    return await createSender({
      rewardManagerProgramId: this.rewardManagerProgramId,
      rewardManagerAccount: this.rewardManagerProgramPDA,
      senderEthAddress,
      feePayer:
        SolanaUtils.newPublicKeyNullable(feePayerOverride) ?? this.feePayerKey,
      operatorEthAddress,
      attestations,
      identityService: this.identityService,
      transactionHandler: this.transactionHandler
    })
  }

  /**
   * Gets the balance of a PublicKey, in SOL
   */
  async getBalance({ publicKey }: { publicKey: PublicKey }) {
    const lamports = await this.connection.getBalance(publicKey)
    return lamports * SOL_PER_LAMPORT
  }

  /**
   * Gets whether a PublicKey has a usable balance
   */
  async hasBalance({
    publicKey,
    epsilon = ZERO_SOL_EPSILON
  }: {
    publicKey: PublicKey
    epsilon?: number
  }) {
    const balance = await this.getBalance({ publicKey })
    return balance > epsilon
  }

  async getSlot() {
    return await this.connection.getSlot('processed')
  }

  async getRandomFeePayer() {
    return await this.identityService?.getRandomFeePayer()
  }

  /**
   * Gets whether a given node registered on eth with `senderEthAddress` is registered on Solana
   */
  async getIsDiscoveryNodeRegistered(senderEthAddress: string) {
    const derivedSenderSolanaAddress = await deriveSolanaSenderFromEthAddress(
      senderEthAddress,
      this.rewardManagerProgramId,
      this.rewardManagerProgramPDA
    )

    const res = await this.connection.getAccountInfo(derivedSenderSolanaAddress)
    return !!res
  }

  async findProgramAddress(programId: PublicKey, pubkey: PublicKey) {
    return await PublicKey.findProgramAddress(
      [pubkey.toBytes().slice(0, 32)],
      programId
    )
  }

  /**
   * Finds a 'derived' address by finding a programAddress with
   * seeds array  as first 32 bytes of base + seeds
   * @returns the program address
   */
  async findDerivedAddress(
    programId: PublicKey,
    base: PublicKey,
    seed: Buffer | Uint8Array
  ) {
    return await PublicKey.findProgramAddress(
      [base.toBytes().slice(0, 32), seed],
      programId
    )
  }

  /**
   * Finds the target PDA with the base audius admin as the initial seed
   * In conjunction with the secondary seed as the users id in bytes
   */
  async findDerivedPair(
    programId: PublicKey,
    adminAccount: PublicKey,
    seed: Buffer | Uint8Array
  ) {
    programId = SolanaUtils.newPublicKeyNullable(programId)
    adminAccount = SolanaUtils.newPublicKeyNullable(adminAccount)

    const [baseAuthorityAccount] = await this.findProgramAddress(
      programId,
      adminAccount
    )
    const derivedAddressInfo = await this.findDerivedAddress(
      programId,
      baseAuthorityAccount,
      seed
    )

    const derivedAddress = derivedAddressInfo[0]
    const bumpSeed = derivedAddressInfo[1]

    return { baseAuthorityAccount, derivedAddress, bumpSeed }
  }

  /**
   * Fetch account on Solana given the program derived address
   */
  async fetchAccount(pda: PublicKey) {
    let account
    try {
      account = await this.anchorProgram.account?.['user']?.fetch(pda)
      return account
    } catch (e) {
      return null
    }
  }

  /**
   * Given the eth address buffer from the account, convert to hex
   * @returns hex string of input bytes
   */
  async deriveEthWalletFromAddress(accountEthAddress: Buffer) {
    let encodedEthAddress = Buffer.from(accountEthAddress).toString('hex')

    if (!encodedEthAddress.startsWith('0x')) {
      encodedEthAddress = '0x' + encodedEthAddress
    }

    return encodedEthAddress
  }
}
