import * as splToken from '@solana/spl-token'
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  Transaction
} from '@solana/web3.js'
import * as solanaWeb3 from '@solana/web3.js'
import BN from 'bn.js'

import { AUDIO_DECIMALS, USDC_DECIMALS, WAUDIO_DECIMALS } from '../../constants'
import { Logger, Nullable, Utils } from '../../utils'
import type { IdentityService } from '../identity'
import type { Web3Manager } from '../web3Manager'

import { SolanaUtils } from './SolanaUtils'
import {
  submitAttestations,
  evaluateAttestations,
  createSender,
  deriveSolanaSenderFromEthAddress,
  SubmitAttestationsConfig as SubmitAttestationsBaseConfig,
  CreateSenderParams as CreateSenderBaseParams
} from './rewards'
import {
  createAssociatedTokenAccount,
  getTokenAccountInfo,
  findAssociatedTokenAddress
} from './tokenAccount'
import { TransactionHandler } from './transactionHandler'
import { createTransferInstructions, transferWAudioBalance } from './transfer'
import { getBankAccountAddress, createUserBankFrom } from './userBank'
import { wAudioFromWeiAudio } from './wAudio'
import { route } from '@audius/spl'
import {
  TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction
} from '@solana/spl-token'

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

export type MintName = 'usdc' | 'audio'
export const DEFAULT_MINT: MintName = 'audio'

const MEMO_PROGRAM_ID = new PublicKey(
  'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
)

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
  // USDC mint address
  usdcMintAddress: string
  // native solana token program
  solanaTokenAddress: string
  // address for the fee payer for transactions
  feePayerAddress: PublicKey
  // address of the audius user bank program
  claimableTokenProgramAddress: string
  // address for the Rewards Manager program
  rewardsManagerProgramId: string
  // Rewards Manager PDA
  rewardsManagerProgramPDA: string
  // The PDA of the rewards manager funds holder account
  rewardsManagerTokenPDA: string
  // address for the payment router program
  paymentRouterProgramId: string
  // Whether to use identity as a relay or submit transactions locally
  useRelay: boolean
  // fee payer secret keys, if client wants to switch between different fee payers during relay
  feePayerKeypairs?: Keypair[]
  // solana web3 connection confirmationTimeout in ms
  confirmationTimeout: number
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
  mints!: Record<MintName, PublicKey>
  claimableTokenPDAs!: Record<MintName, PublicKey>
  solanaTokenAddress!: string
  solanaTokenKey!: PublicKey
  feePayerAddress!: PublicKey
  feePayerKey!: PublicKey
  claimableTokenProgramKey!: PublicKey
  rewardManagerProgramId!: PublicKey
  rewardManagerProgramPDA!: PublicKey
  rewardManagerTokenPDA!: PublicKey
  paymentRouterProgramId!: PublicKey

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
      usdcMintAddress,
      solanaTokenAddress,
      feePayerAddress,
      claimableTokenProgramAddress,
      rewardsManagerProgramId,
      rewardsManagerProgramPDA,
      rewardsManagerTokenPDA,
      paymentRouterProgramId,
      useRelay,
      feePayerKeypairs,
      confirmationTimeout
    } = this.solanaWeb3Config

    this.solanaClusterEndpoint = solanaClusterEndpoint
    this.connection = new Connection(this.solanaClusterEndpoint, {
      confirmTransactionInitialTimeout:
        confirmationTimeout || DEFAULT_CONNECTION_CONFIRMATION_TIMEOUT_MS
    })

    this.transactionHandler = new TransactionHandler({
      connection: this.connection,
      useRelay,
      identityService: this.identityService,
      feePayerKeypairs
    })

    this.mints = {
      audio: SolanaUtils.newPublicKeyNullable(mintAddress),
      usdc: SolanaUtils.newPublicKeyNullable(usdcMintAddress)
    }

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
    const audioPDA = (
      this.claimableTokenProgramKey
        ? (
            await SolanaUtils.findProgramAddressFromPubkey(
              this.claimableTokenProgramKey,
              this.mints.audio
            )
          )[0].toString()
        : null
    ) as string

    const usdcPDA = this.claimableTokenProgramKey
      ? (
          await SolanaUtils.findProgramAddressFromPubkey(
            this.claimableTokenProgramKey,
            this.mints.usdc
          )
        )[0].toString()
      : ''

    this.claimableTokenPDAs = {
      audio: SolanaUtils.newPublicKeyNullable(audioPDA),
      usdc: SolanaUtils.newPublicKeyNullable(usdcPDA)
    }

    this.rewardManagerProgramId = SolanaUtils.newPublicKeyNullable(
      rewardsManagerProgramId
    )
    this.rewardManagerProgramPDA = SolanaUtils.newPublicKeyNullable(
      rewardsManagerProgramPDA
    )
    this.rewardManagerTokenPDA = SolanaUtils.newPublicKeyNullable(
      rewardsManagerTokenPDA
    )
    this.paymentRouterProgramId = SolanaUtils.newPublicKeyNullable(
      paymentRouterProgramId
    )
  }

  async doesUserbankExist({
    ethAddress,
    mint = DEFAULT_MINT
  }: {
    ethAddress?: string
    mint?: MintName
  } = {}) {
    const userbank = await this.deriveUserBank({ ethAddress, mint })
    const tokenAccount = await this.getTokenAccountInfo(userbank.toString())
    return !!tokenAccount
  }

  /**
   * Creates a solana bank account, either for optional `ethAddress` or from the web3 provider's eth address
   */
  async createUserBank({
    feePayerOverride,
    ethAddress,
    mint = DEFAULT_MINT
  }: {
    feePayerOverride: string
    ethAddress?: string
    mint: MintName
  }) {
    if (!this.web3Manager) {
      throw new Error(
        'A web3Manager is required for this solanaWeb3Manager method'
      )
    }

    return await createUserBankFrom({
      ethAddress: ethAddress ?? this.web3Manager.getWalletAddress(),
      claimableTokenPDAKey: this.claimableTokenPDAs[mint],
      feePayerKey:
        SolanaUtils.newPublicKeyNullable(feePayerOverride) || this.feePayerKey,
      mintKey: this.mints[mint],
      solanaTokenProgramKey: this.solanaTokenKey,
      claimableTokenProgramKey: this.claimableTokenProgramKey,
      transactionHandler: this.transactionHandler
    })
  }

  /**
   * Creates a userbank if needed.
   * Returns the userbank address as `userbank` if it was created or already existed, or `error` if it failed to create.
   */
  async createUserBankIfNeeded({
    feePayerOverride,
    ethAddress,
    mint = DEFAULT_MINT
  }: {
    feePayerOverride: string
    ethAddress?: string
    mint?: MintName
  }): Promise<
    | { error: string; errorCode: string | number | null }
    | {
        didExist: boolean
        userbank: PublicKey
      }
  > {
    const didExist = await this.doesUserbankExist({ ethAddress, mint })
    if (!didExist) {
      const response = await this.createUserBank({
        feePayerOverride,
        ethAddress,
        mint
      })
      if (response.error) {
        return {
          error: response.error,
          errorCode: response.errorCode
        }
      }
    }

    const derived = await this.deriveUserBank({ ethAddress, mint })
    return { userbank: derived, didExist }
  }

  /**
   * Creates a token account for the provided solana address (a wallet)
   * See https://spl.solana.com/associated-token-account
   */
  async createAssociatedTokenAccount(
    solanaAddress: string,
    mint: MintName = DEFAULT_MINT
  ) {
    await createAssociatedTokenAccount({
      feePayerKey: this.feePayerKey,
      solanaWalletKey: new PublicKey(solanaAddress),
      mintKey: this.mints[mint],
      solanaTokenProgramKey: this.solanaTokenKey,
      connection: this.connection,
      identityService: this.identityService
    })
  }

  /**
   * Finds the user bank token account for a provided solana address (a wallet) for the given mint
   * See https://spl.solana.com/associated-token-account
   */
  async findAssociatedTokenAddress(
    solanaAddress: string,
    mint: MintName = DEFAULT_MINT
  ) {
    return await findAssociatedTokenAddress({
      solanaWalletKey: new PublicKey(solanaAddress),
      mintKey: this.mints[mint],
      solanaTokenProgramKey: this.solanaTokenKey
    })
  }

  /**
   * Gets a solana bank account from `ethAddress` or the current web3 provider's eth address.
   */
  async deriveUserBank({
    ethAddress,
    mint = DEFAULT_MINT
  }: {
    ethAddress?: string
    mint?: MintName
  } = {}) {
    if (!ethAddress && !this.web3Manager) {
      throw new Error(
        'A web3Manager is required for this solanaWeb3Manager method'
      )
    }

    const derivationSourceAddress =
      ethAddress ?? this.web3Manager!.getWalletAddress()

    const bank = await getBankAccountAddress(
      derivationSourceAddress,
      this.claimableTokenPDAs[mint],
      this.solanaTokenKey
    )
    return bank
  }

  /**
   * Gets the info for a user bank/wAudio token account given a spl-token address.
   * If the address is not a valid token account, returns `null`
   */
  async getTokenAccountInfo(solanaAddress: string) {
    try {
      const res = await getTokenAccountInfo({
        tokenAccountAddressKey: new PublicKey(solanaAddress),
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
      let tokenAccount = await this.getTokenAccountInfo(solanaAddress)
      // If the token account doesn't exist, check if solanaAddress is a root account
      // if so, derive the associated token account & check that balance
      if (!tokenAccount) {
        const associatedTokenAccount = await this.findAssociatedTokenAddress(
          solanaAddress
        )
        tokenAccount = await this.getTokenAccountInfo(
          associatedTokenAccount.toString()
        )
        if (!tokenAccount) {
          return BigInt(0)
        }
      }

      // Multiply by 10^10 to maintain same decimals as eth $AUDIO
      const decimals = AUDIO_DECIMALS - WAUDIO_DECIMALS
      return tokenAccount.amount * BigInt('1'.padEnd(decimals + 1, '0'))
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
    let tokenAccountInfo = await this.getTokenAccountInfo(
      recipientSolanaAddress
    )
    if (!tokenAccountInfo) {
      console.info('Provided recipient solana address was not a token account')
      // If not, check to see if it already has an associated token account.
      const associatedTokenAccount = await this.findAssociatedTokenAddress(
        recipientSolanaAddress
      )
      tokenAccountInfo = await this.getTokenAccountInfo(
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
      this.claimableTokenPDAs.audio,
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
      claimableTokenPDA: this.claimableTokenPDAs.audio,
      solanaTokenProgramKey: this.solanaTokenKey,
      claimableTokenProgramKey: this.claimableTokenProgramKey,
      connection: this.connection,
      mintKey: this.mints.audio,
      transactionHandler: this.transactionHandler
    })
  }

  /**
   * Purchases USDC gated content
   * @param params.id the id of the content, eg. the track ID
   * @param params.type the type of the content, eg. "track"
   * @param params.blocknumber the blocknumber the content was last updated
   * @param params.splits map of address to USDC amount, used to split the price amoung several stakeholders
   * @param params.extraAmount Extra amount in USDC wei to be distributed to the stakeholders
   * @param params.purchaserUserId Id of the user that is purchasing the track
   * @returns the transaction signature and/or an error
   */
  async purchaseContent({
    id,
    type,
    blocknumber,
    extraAmount = 0,
    splits,
    purchaserUserId
  }: {
    id: number
    type: 'track'
    splits: Record<string, number | BN>
    extraAmount?: number | BN
    blocknumber: number
    purchaserUserId: number
  }) {
    if (!this.web3Manager) {
      throw new Error(
        'A web3Manager is required for this solanaWeb3Manager method'
      )
    }
    if (Object.values(splits).length !== 1) {
      throw new Error(
        'Purchasing content only supports a single split. Specifying more splits coming soon!'
      )
    }

    const totalAmount = Object.values(splits).reduce<BN>(
      (sum, split) => (split instanceof BN ? sum.add(split) : sum.addn(split)),
      extraAmount instanceof BN ? extraAmount : new BN(extraAmount)
    )

    const senderEthAddress = this.web3Manager.getWalletAddress()
    const senderSolanaAddress = await getBankAccountAddress(
      senderEthAddress,
      this.claimableTokenPDAs.usdc,
      this.solanaTokenKey
    )

    const instructions = await createTransferInstructions({
      amount: totalAmount,
      feePayerKey: this.feePayerKey,
      senderEthAddress,
      senderEthPrivateKey:
        this.web3Manager.getOwnerWalletPrivateKey() as unknown as string,
      senderSolanaAddress,
      recipientSolanaAddress: Object.keys(splits)[0]!,
      claimableTokenPDA: this.claimableTokenPDAs.usdc,
      solanaTokenProgramKey: this.solanaTokenKey,
      claimableTokenProgramKey: this.claimableTokenProgramKey,
      connection: this.connection,
      mintKey: this.mints.usdc
    })

    const data = `${type}:${id}:${blocknumber}:${purchaserUserId}`

    const memoInstruction = new TransactionInstruction({
      keys: [
        {
          pubkey: new PublicKey(this.feePayerKey),
          isSigner: true,
          isWritable: true
        }
      ],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(data)
    })
    return await this.transactionHandler.handleTransaction({
      instructions: [...instructions, memoInstruction],
      skipPreflight: true,
      feePayerOverride: this.feePayerKey
    })
  }

  /**
   * Purchases USDC gated content
   * @param params.id the id of the content, eg. the track ID
   * @param params.type the type of the content, eg. "track"
   * @param params.blocknumber the blocknumber the content was last updated
   * @param params.splits map of address to USDC amount, used to split the price amoung several stakeholders
   * @param params.extraAmount Extra amount in USDC wei to be distributed to the stakeholders
   * @param params.purchaserUserId Id of the user that is purchasing the track
   * @param params.senderAccount Should either be root solana account or user bank.
   * @returns the transaction signature and/or an error
   */
  async getPurchaseContentWithPaymentRouterInstructions({
    id,
    type,
    blocknumber,
    extraAmount = 0,
    splits,
    purchaserUserId,
    senderAccount
  }: {
    id: number
    type: 'track'
    splits: Record<string, number | BN>
    extraAmount?: number | BN
    blocknumber: number
    purchaserUserId: number
    senderAccount: PublicKey
  }) {
    if (!this.web3Manager) {
      throw new Error(
        'A web3Manager is required for this solanaWeb3Manager method'
      )
    }
    if (Object.values(splits).length !== 1) {
      throw new Error(
        'Purchasing content only supports a single split. Specifying more splits coming soon!'
      )
    }

    // TODO: PAY-2252 split extra amount amongst all recipients correctly
    const recipientAmounts: Record<string, bigint> = Object.entries(
      splits
    ).reduce((acc, [key, value]) => {
      acc[key] =
        (value instanceof BN ? BigInt(value.toString()) : BigInt(value)) +
        (extraAmount instanceof BN
          ? BigInt(extraAmount.toString())
          : BigInt(extraAmount))
      return acc
    }, {} as Record<string, bigint>)

    const [paymentRouterPda, paymentRouterPdaBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from('payment_router')],
        this.paymentRouterProgramId
      )

    // Associated token account owned by the PDA
    const paymentRouterTokenAccount = await this.findAssociatedTokenAddress(
      paymentRouterPda.toString(),
      'usdc'
    )
    const paymentRouterTokenAccountInfo = this.getTokenAccountInfo(
      paymentRouterTokenAccount.toString()
    )
    if (paymentRouterTokenAccountInfo === null) {
      throw new Error('Payment Router balance PDA token account does not exist')
    }

    const senderTokenAccount = await this.findAssociatedTokenAddress(
      senderAccount.toString(),
      'usdc'
    )
    const senderTokenAccountInfo = await this.getTokenAccountInfo(
      senderTokenAccount.toString()
    )
    if (senderTokenAccountInfo === null) {
      throw new Error('Sender token account ATA does not exist')
    }

    const amounts = Object.values(recipientAmounts)
    const totalAmount = amounts.reduce(
      (acc, current) => acc + current,
      BigInt(0)
    )

    const transferInstruction = createTransferCheckedInstruction(
      senderTokenAccount,
      this.mints.usdc,
      paymentRouterTokenAccount,
      senderAccount,
      Number(totalAmount),
      USDC_DECIMALS
    )

    const paymentRouterInstruction = await route(
      paymentRouterTokenAccount,
      paymentRouterPda,
      paymentRouterPdaBump,
      Object.keys(recipientAmounts).map((key) => new PublicKey(key)), // recipients
      amounts,
      totalAmount,
      TOKEN_PROGRAM_ID,
      this.paymentRouterProgramId
    )

    const data = `${type}:${id}:${blocknumber}:${purchaserUserId}`

    const memoInstruction = new TransactionInstruction({
      keys: [
        {
          pubkey: new PublicKey(this.feePayerKey),
          isSigner: true,
          isWritable: true
        }
      ],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(data)
    })

    const instructions = [
      transferInstruction,
      paymentRouterInstruction,
      memoInstruction
    ]
    return instructions
  }

  async purchaseContentWithPaymentRouter({
    id,
    type,
    blocknumber,
    extraAmount = 0,
    splits,
    purchaserUserId,
    senderKeypair,
    skipSendAndReturnTransaction
  }: {
    id: number
    type: 'track'
    splits: Record<string, number | BN>
    extraAmount?: number | BN
    blocknumber: number
    purchaserUserId: number
    senderKeypair: Keypair,
    skipSendAndReturnTransaction?: boolean
  }) {
    const instructions =
      await this.getPurchaseContentWithPaymentRouterInstructions({
        id,
        type,
        blocknumber,
        extraAmount,
        splits,
        purchaserUserId,
        senderAccount: senderKeypair.publicKey
      })
    const recentBlockhash = (await this.connection.getLatestBlockhash())
      .blockhash

    const transaction = new Transaction({
      feePayer: this.feePayerKey,
      recentBlockhash: recentBlockhash
    }).add(...instructions)
    transaction.partialSign(senderKeypair)
    if (skipSendAndReturnTransaction) {
      return transaction
    }
    const signatures = transaction.signatures
      .filter((s) => s.signature !== null)
      .map((s) => ({
        signature: s.signature!, // safe from filter
        publicKey: s.publicKey.toString()
      }))

    return await this.transactionHandler.handleTransaction({
      instructions,
      skipPreflight: true,
      feePayerOverride: this.feePayerKey,
      signatures,
      recentBlockhash
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
      userBankProgramAccount: this.claimableTokenPDAs.audio,
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

  async getSolBalance(address: string) {
    const publicKey = new PublicKey(address)
    const balance = await this.getBalance({ publicKey })
    const balanceBN = Utils.toBN(balance * LAMPORTS_PER_SOL)
    return balanceBN
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

  /**
   * Creates transfer instructions from the current user's user bank to the provided solana address.
   * Supports both $AUDIO or USDC user banks.
   */
  async createTransferInstructionsFromCurrentUser({
    amount,
    feePayerKey,
    senderSolanaAddress,
    recipientSolanaAddress,
    mint = DEFAULT_MINT,
    instructionIndex = 0
  }: {
    amount: BN
    senderSolanaAddress: PublicKey
    recipientSolanaAddress: string
    mint: MintName
    feePayerKey: PublicKey
    instructionIndex?: number
  }) {
    const instructions = await createTransferInstructions({
      amount,
      feePayerKey,
      senderEthAddress: this.web3Manager?.getWalletAddress(),
      senderEthPrivateKey:
        this.web3Manager!.getOwnerWalletPrivateKey() as unknown as string,
      senderSolanaAddress,
      recipientSolanaAddress,
      claimableTokenPDA: this.claimableTokenPDAs[mint],
      solanaTokenProgramKey: this.solanaTokenKey,
      claimableTokenProgramKey: this.claimableTokenProgramKey,
      connection: this.connection,
      mintKey: this.mints[mint],
      instructionIndex
    })
    return instructions
  }
}
