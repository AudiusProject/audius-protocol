import { PaymentRouterProgram } from '@audius/spl'
import {
  Account,
  TokenAccountNotFoundError,
  TokenInvalidMintError,
  TokenInvalidOwnerError,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'

import { productionConfig } from '../../../../config/production'
import { mergeConfigWithDefaults } from '../../../../utils/mergeConfigs'
import { mintFixedDecimalMap } from '../../../../utils/mintFixedDecimalMap'
import { parseParams } from '../../../../utils/parseParams'
import { Prettify } from '../../../../utils/prettify'
import { MEMO_V2_PROGRAM_ID } from '../../constants'
import { Mint } from '../../types'
import { BaseSolanaProgramClient } from '../BaseSolanaProgramClient'

import { getDefaultPaymentRouterClientConfig } from './getDefaultConfig'
import {
  CreateMemoInstructionRequest,
  CreateMemoInstructionSchema,
  CreatePurchaseContentInstructionsRequest,
  CreatePurchaseContentInstructionsSchema,
  CreateRouteInstructionRequest,
  CreateRouteInstructionSchema,
  CreateSplitDonationInstructionsSchema,
  CreateSplitDonationsInstructionsRequest,
  CreateTransferInstructionRequest,
  CreateTransferInstructionSchema,
  GetOrCreateProgramTokenAccountRequest,
  GetOrCreateProgramTokenAccountSchema,
  PaymentRouterClientConfig
} from './types'

export class PaymentRouterClient extends BaseSolanaProgramClient {
  private readonly programId: PublicKey

  /** The intermediate account where funds are sent to and routed from. */
  private readonly programAccount: PublicKey
  private readonly programAccountBumpSeed: number

  private readonly mints: Prettify<Partial<Record<Mint, PublicKey>>>

  private existingTokenAccounts: Prettify<Partial<Record<Mint, Account>>>

  constructor(config: PaymentRouterClientConfig) {
    const configWithDefaults = mergeConfigWithDefaults(
      config,
      getDefaultPaymentRouterClientConfig(productionConfig)
    )
    super(configWithDefaults, config.solanaWalletAdapter)
    this.programId = configWithDefaults.programId
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode('payment_router')],
      this.programId
    )
    this.programAccount = pda
    this.programAccountBumpSeed = bump
    this.mints = configWithDefaults.mints
    this.existingTokenAccounts = {}
  }

  public async createTransferInstruction(
    params: CreateTransferInstructionRequest
  ) {
    const args = await parseParams(
      'crateTransferInstruction',
      CreateTransferInstructionSchema
    )(params)
    const mint = this.mints[args.mint]
    if (!mint) {
      throw Error('Mint not configured')
    }
    const programTokenAccount = await this.getOrCreateProgramTokenAccount({
      mint: args.mint
    })
    const sourceWallet = args.sourceWallet
    const sourceTokenAccount = getAssociatedTokenAddressSync(
      mint,
      sourceWallet,
      false
    )
    const amount = mintFixedDecimalMap[args.mint](args.total)
    return createTransferCheckedInstruction(
      sourceTokenAccount,
      mint,
      programTokenAccount.address,
      sourceWallet,
      amount.value,
      amount.decimalPlaces
    )
  }

  public async createRouteInstruction(params: CreateRouteInstructionRequest) {
    const args = await parseParams(
      'createRouteInstruction',
      CreateRouteInstructionSchema
    )(params)
    const programTokenAccount = await this.getOrCreateProgramTokenAccount({
      mint: args.mint
    })
    const recipients: PublicKey[] = []
    const amounts: bigint[] = []
    for (const split of args.splits) {
      recipients.push(split.wallet)
      amounts.push(split.amount)
    }
    const totalAmount = mintFixedDecimalMap[args.mint](args.total).value
    return PaymentRouterProgram.createRouteInstruction({
      sender: programTokenAccount.address,
      senderOwner: this.programAccount,
      paymentRouterPdaBump: this.programAccountBumpSeed,
      recipients,
      amounts,
      totalAmount,
      programId: this.programId
    })
  }

  public async createPurchaseMemoInstruction(
    params: CreateMemoInstructionRequest
  ) {
    const {
      contentType,
      contentId,
      blockNumber,
      buyerUserId,
      accessType,
      signer
    } = await parseParams(
      'createMemoInstructionSchema',
      CreateMemoInstructionSchema
    )(params)
    const memoString = `${contentType}:${contentId}:${blockNumber}:${buyerUserId}:${accessType}`
    return new TransactionInstruction({
      keys: signer
        ? [{ pubkey: signer, isSigner: true, isWritable: true }]
        : [],
      programId: MEMO_V2_PROGRAM_ID,
      data: Buffer.from(memoString)
    })
  }

  public async createPurchaseContentInstructions(
    params: CreatePurchaseContentInstructionsRequest
  ) {
    const {
      mint,
      splits,
      total,
      contentId,
      contentType,
      blockNumber,
      buyerUserId,
      accessType,
      sourceWallet
    } = await parseParams(
      'createPurchaseContentInstructions',
      CreatePurchaseContentInstructionsSchema
    )(params)
    return [
      await this.createTransferInstruction({
        total,
        mint,
        sourceWallet
      }),
      await this.createRouteInstruction({ splits, total, mint }),
      await this.createPurchaseMemoInstruction({
        contentId,
        contentType,
        blockNumber,
        buyerUserId,
        accessType
      })
    ]
  }

  public async createSplitDonationsInstructions(
    params: CreateSplitDonationsInstructionsRequest
  ) {
    const { mint, splits, total, sourceWallet } = await parseParams(
      'createSplitDonationsInstructions',
      CreateSplitDonationInstructionsSchema
    )(params)

    return [
      await this.createTransferInstruction({
        total,
        mint,
        sourceWallet
      }),
      await this.createRouteInstruction({ splits, total, mint })
    ]
  }

  /**
   * Creates or gets the intermediate funds token account for the program.
   * Only needs to be created once per mint.
   * @see {@link https://github.com/solana-labs/solana-program-library/blob/d72289c79a04411c69a8bf1054f7156b6196f9b3/token/js/src/actions/getOrCreateAssociatedTokenAccount.ts getOrCreateAssociatedTokenAccount}
   */
  public async getOrCreateProgramTokenAccount(
    params: GetOrCreateProgramTokenAccountRequest
  ): Promise<Account> {
    const args = await parseParams(
      'getOrCreateProgramTokenAccount',
      GetOrCreateProgramTokenAccountSchema
    )(params)

    // Check for cached account
    const existingTokenAccount = this.existingTokenAccounts[args.mint]
    if (existingTokenAccount) {
      return existingTokenAccount
    }

    const mint = this.mints[args.mint]
    if (!mint) {
      throw new Error(`Mint ${args.mint} not configured`)
    }
    const associatedTokenAdddress = getAssociatedTokenAddressSync(
      mint,
      this.programAccount,
      true
    )

    let account: Account | null = null
    try {
      account = await getAccount(this.connection, associatedTokenAdddress)
      this.existingTokenAccounts[args.mint] = account
    } catch (error: unknown) {
      if (error instanceof TokenAccountNotFoundError) {
        // As this isn't atomic, it's possible others can create associated accounts meanwhile.
        try {
          const instruction = createAssociatedTokenAccountIdempotentInstruction(
            await this.getFeePayer(),
            associatedTokenAdddress,
            this.programAccount,
            mint
          )
          const { lastValidBlockHeight, blockhash } =
            await this.connection.getLatestBlockhash()
          const msg = new TransactionMessage({
            payerKey: await this.getFeePayer(),
            recentBlockhash: blockhash,
            instructions: [instruction]
          })
          const transaction = new VersionedTransaction(msg.compileToV0Message())
          const signature = await this.sendTransaction(transaction)
          await this.connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            'finalized'
          )
        } catch (e: unknown) {
          // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
          // instruction error if the associated account exists already.
        }

        // Now this should always succeed
        account = await getAccount(this.connection, associatedTokenAdddress)
      } else {
        throw error
      }
    }

    if (!account.mint.equals(mint)) throw new TokenInvalidMintError()
    if (!account.owner.equals(this.programAccount))
      throw new TokenInvalidOwnerError()
    return account
  }
}
