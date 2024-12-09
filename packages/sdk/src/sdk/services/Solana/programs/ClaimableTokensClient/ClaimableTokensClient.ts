import {
  ClaimableTokensErrorCode,
  ClaimableTokensErrorMessages,
  ClaimableTokensInstruction,
  ClaimableTokensProgram
} from '@audius/spl'
import { SendTransactionOptions } from '@solana/wallet-adapter-base'
import {
  VersionedTransaction,
  Secp256k1Program,
  PublicKey,
  Transaction,
  SendTransactionError,
  ComputeBudgetProgram
} from '@solana/web3.js'

import { productionConfig } from '../../../../config/production'
import { mergeConfigWithDefaults } from '../../../../utils/mergeConfigs'
import { mintFixedDecimalMap } from '../../../../utils/mintFixedDecimalMap'
import { parseMintToken } from '../../../../utils/parseMintToken'
import { parseParams } from '../../../../utils/parseParams'
import type { AudiusWalletClient } from '../../../AudiusWalletClient'
import type { LoggerService } from '../../../Logger'
import type { TokenName } from '../../types'
import { CustomInstructionError } from '../CustomInstructionError'
import { SolanaClient } from '../SolanaClient'

import { getDefaultClaimableTokensConfig } from './getDefaultConfig'
import {
  type GetOrCreateUserBankRequest,
  GetOrCreateUserBankSchema,
  type DeriveUserBankRequest,
  type CreateTransferRequest,
  CreateTransferSchema,
  type CreateSecpRequest,
  CreateSecpSchema,
  ClaimableTokensConfig
} from './types'

export class ClaimableTokensError extends Error {
  override name = 'ClaimableTokensError'
  public code: number
  public instructionName: string
  public customErrorName?: string
  constructor({
    code,
    instructionName,
    cause
  }: {
    code: number
    instructionName: string
    cause?: Error
  }) {
    super(
      ClaimableTokensErrorMessages[code as ClaimableTokensErrorCode] ??
        `Unknown error: ${code}`,
      { cause }
    )
    this.code = code
    this.instructionName = instructionName
    this.customErrorName = ClaimableTokensErrorCode[code]
  }
}

/**
 * Connected client to the ClaimableTokens Solana program.
 *
 * The ClaimableTokens program is responsible for creation of program-owned
 * associated token accounts that are permissioned to users by their Ethereum
 * hedgehog wallet private keys.
 */
export class ClaimableTokensClient {
  private readonly client: SolanaClient
  /** The program ID of the ClaimableTokensProgram instance. */
  private readonly programId: PublicKey
  /** Map from token mint name to public key address. */
  private readonly mints: Record<TokenName, PublicKey>
  /** Map from token mint name to derived user bank authority. */
  private readonly authorities: Record<TokenName, PublicKey>
  private readonly logger: LoggerService
  private readonly audiusWalletClient: AudiusWalletClient

  /**
   * Map of user banks to user bank creation promises.
   * Prevents concurrent attempts to create the same user bank.
   */
  private _pendingUserBankCreationPromises: Partial<
    Record<
      string,
      Promise<{
        userBank: PublicKey
        didExist: boolean
      }>
    >
  > = {}

  constructor(config: ClaimableTokensConfig) {
    const configWithDefaults = mergeConfigWithDefaults(
      config,
      getDefaultClaimableTokensConfig(productionConfig)
    )
    this.client = configWithDefaults.solanaClient
    this.programId = configWithDefaults.programId
    this.mints = configWithDefaults.mints
    this.authorities = {
      wAUDIO: ClaimableTokensProgram.deriveAuthority({
        programId: configWithDefaults.programId,
        mint: configWithDefaults.mints.wAUDIO
      }),
      USDC: ClaimableTokensProgram.deriveAuthority({
        programId: configWithDefaults.programId,
        mint: configWithDefaults.mints.USDC
      })
    }
    this.audiusWalletClient = configWithDefaults.audiusWalletClient
    this.logger = configWithDefaults.logger.createPrefixedLogger(
      '[claimable-tokens-client]'
    )
  }

  /**
   * Creates a user bank or returns the existing user bank for a user.
   */
  async getOrCreateUserBank(params: GetOrCreateUserBankRequest) {
    const args = await parseParams(
      'getOrCreateUserBank',
      GetOrCreateUserBankSchema
    )(params)
    const {
      ethWallet = await this.getDefaultWalletAddress(),
      feePayer: feePayerOverride
    } = args
    const { mint, token } = parseMintToken(args.mint, this.mints)
    const feePayer = feePayerOverride ?? (await this.client.getFeePayer())
    const userBank = await this.deriveUserBank(args)

    // If already fetching/creating this user bank, wait for the existing promise.
    // Then assume the user bank has been created and return with didExist=true.
    // Don't attempt to catch and retry or concurrency will again be introduced.
    if (this._pendingUserBankCreationPromises[userBank.toBase58()]) {
      await this._pendingUserBankCreationPromises[userBank.toBase58()]
      return { userBank, didExist: true }
    }

    // Create a new lock on the fetch/creation process for this user bank
    this._pendingUserBankCreationPromises[userBank.toBase58()] = (async () => {
      const userBankAccount = await this.client.connection.getAccountInfo(
        userBank
      )
      if (!userBankAccount) {
        this.logger.debug(`User bank ${userBank} does not exist. Creating...`)
        const createUserBankInstruction =
          ClaimableTokensProgram.createAccountInstruction({
            ethAddress: ethWallet,
            payer: feePayer,
            mint,
            authority: this.authorities[token],
            userBank,
            programId: this.programId
          })
        const computeBudgetLimitInstruction =
          ComputeBudgetProgram.setComputeUnitLimit({
            units: 50000
          })
        const { blockhash, lastValidBlockHeight } =
          await this.client.connection.getLatestBlockhash()
        const transaction = await this.client.buildTransaction({
          instructions: [
            createUserBankInstruction,
            computeBudgetLimitInstruction
          ],
          recentBlockhash: blockhash
        })
        const signature = await this.sendTransaction(transaction)
        await this.client.connection.confirmTransaction(
          { blockhash, lastValidBlockHeight, signature },
          'finalized'
        )
        return { userBank, didExist: false }
      }
      this.logger.debug(`User bank ${userBank} already exists.`)
      return { userBank, didExist: true }
    })()
    try {
      // Wait for the promise and return the result.
      // Note that the lock is not removed on success. Keep it as an in-memory
      // cache that the user bank exists. Reduces RPC calls to check existence.
      return await this._pendingUserBankCreationPromises[userBank.toBase58()]!
    } catch (e) {
      // Remove lock on error so that the next attempt retries creation.
      delete this._pendingUserBankCreationPromises[userBank.toBase58()]
      throw e
    }
  }

  /**
   * Creates a claimable tokens program transfer instruction using configured
   * program ID, mint addresses, derived nonce, and derived authorities.
   *
   * Must be paired with a matching Secp256k1 instruction.
   * @see {@link createTransferSecpInstruction}
   */
  async createTransferInstruction(params: CreateTransferRequest) {
    const {
      feePayer: feePayerOverride,
      ethWallet = await this.getDefaultWalletAddress(),
      mint,
      destination
    } = await parseParams(
      'createTransferInstruction',
      CreateTransferSchema
    )(params)
    const { token } = parseMintToken(mint, this.mints)
    const feePayer = feePayerOverride ?? (await this.client.getFeePayer())
    const source = await this.deriveUserBank({ ethWallet, mint })
    const nonceKey = ClaimableTokensProgram.deriveNonce({
      ethAddress: ethWallet,
      authority: this.authorities[token],
      programId: this.programId
    })
    return ClaimableTokensProgram.createTransferInstruction({
      payer: feePayer,
      sourceEthAddress: ethWallet,
      sourceUserBank: source,
      destination,
      nonceAccount: nonceKey,
      authority: this.authorities[token],
      programId: this.programId
    })
  }

  /**
   * Creates a signed Secp256k1 instruction for a claimable tokens transfer
   * using configured program ID, derived nonce, and derived authorities.
   *
   * @see {@link createTransferInstruction}
   */
  async createTransferSecpInstruction(params: CreateSecpRequest) {
    const {
      ethWallet = (await this.audiusWalletClient.getAddresses())[0]!,
      destination,
      amount,
      mint,
      instructionIndex
    } = await parseParams(
      'createTransferSecpInstruction',
      CreateSecpSchema
    )(params)

    const { token } = parseMintToken(mint, this.mints)

    let nonce = BigInt(0)
    const nonceKey = ClaimableTokensProgram.deriveNonce({
      ethAddress: ethWallet,
      authority: this.authorities[token],
      programId: this.programId
    })
    const nonceAccount = await this.client.connection.getAccountInfo(nonceKey)
    const encodedNonceData = nonceAccount?.data
    if (encodedNonceData) {
      const nonceData =
        ClaimableTokensProgram.layouts.nonceAccountData.decode(encodedNonceData)
      nonce = nonceData.nonce
    }
    const data = ClaimableTokensProgram.createSignedTransferInstructionData({
      destination,
      amount: mintFixedDecimalMap[token](amount).value,
      nonce
    })
    const [signature, recoveryId] = await this.audiusWalletClient.sign({
      message: { raw: data }
    })
    return Secp256k1Program.createInstructionWithEthAddress({
      ethAddress: ethWallet,
      message: data,
      signature,
      recoveryId,
      instructionIndex
    })
  }

  /**
   * Derives the user bank of a user from their Ethereum wallet and the token mint.
   *
   * Use {@link getOrCreateUserBank} instead if you want to ensure the userBank exists.
   */
  public async deriveUserBank(params: DeriveUserBankRequest) {
    const {
      ethWallet = (await this.audiusWalletClient.getAddresses())[0]!,
      mint
    } = await parseParams('deriveUserBank', GetOrCreateUserBankSchema)(params)

    const { token } = parseMintToken(mint, this.mints)

    return await ClaimableTokensProgram.deriveUserBank({
      ethAddress: ethWallet,
      claimableTokensPDA: this.authorities[token]
    })
  }

  /**
   * Override the sendTransaction method to provide some more friendly errors
   * back to the consumer for ClaimableTokens instructions
   */
  public async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    sendOptions?: SendTransactionOptions | undefined
  ): Promise<string> {
    try {
      return await this.client.sendTransaction(transaction, sendOptions)
    } catch (e) {
      if (e instanceof SendTransactionError) {
        try {
          const error = CustomInstructionError.parseSendTransactionError(e)
          if (error) {
            const instructions = await this.client.getInstructions(transaction)
            const instruction = instructions[error.instructionIndex]
            if (instruction && instruction.programId.equals(this.programId)) {
              const decodedInstruction =
                ClaimableTokensProgram.decodeInstruction(instruction)
              throw new ClaimableTokensError({
                code: error.code,
                instructionName:
                  ClaimableTokensInstruction[
                    decodedInstruction.data.instruction
                  ] ?? 'Unknown',
                cause: e
              })
            }
          }
        } catch (nestedError) {
          if (nestedError instanceof ClaimableTokensError) {
            throw nestedError
          } else {
            // If failed to provide user friendly error, surface original error
            this.logger.warn(
              'Failed to parse ClaimableTokensError error',
              nestedError
            )
          }
        }
      }
      throw e
    }
  }

  private async getDefaultWalletAddress() {
    const addresses = await this.audiusWalletClient.getAddresses()
    if (!addresses || !addresses[0]) {
      throw new Error(
        'Failed to infer wallet address. Did you forget the "ethAddress" argument?'
      )
    }
    return addresses[0]
  }
}
