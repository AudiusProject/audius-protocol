import {
  DurableNonceTransactionConfirmationStrategy,
  BaseTransactionConfirmationStrategy,
  BlockhashWithExpiryBlockHeight,
  Commitment,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
  ConnectionConfig,
  SendOptions,
  AddressLookupTableAccount
} from '@solana/web3.js'
import type * as runtime from '../../api/generated/default/runtime'
import { z } from 'zod'
import type { AuthService } from '../Auth'
import type { Prettify } from '../../utils/prettify'
import type { Solana } from './Solana'

export type RelayRequestBody = {
  transaction: string
  confirmationOptions?: {
    confirmationStrategy?: Prettify<
      | Omit<
          DurableNonceTransactionConfirmationStrategy,
          keyof BaseTransactionConfirmationStrategy
        >
      | BlockhashWithExpiryBlockHeight
    >
    commitment?: Commitment
  }
  sendOptions?: SendOptions
}

export type SolanaConfigInternal = {
  middleware?: runtime.Middleware[]
  mints: Record<Mint, PublicKey>
  programIds: Record<Program, PublicKey>
  rpcEndpoint: string
  rpcConfig?: ConnectionConfig
}

export type SolanaConfig = Prettify<
  Partial<Omit<SolanaConfigInternal, 'mints' | 'programIds'>> & {
    mints?: Prettify<Partial<Record<Mint, PublicKey>>>
    programIds?: Prettify<Partial<Record<Program, PublicKey>>>
  }
>

export type SolanaService = Solana

export type Program =
  | 'claimableTokens'
  | 'rewardManager'
  | 'paymentRouter'
  | 'trackListenCount'

export const MintSchema = z.enum(['wAUDIO', 'USDC']).default('wAUDIO')

export type Mint = z.infer<typeof MintSchema>

export const PublicKeySchema = z.custom<PublicKey>((data) => {
  try {
    new PublicKey(data as PublicKey)
    return true
  } catch {
    return false
  }
})

export const RelaySchema = z
  .object({
    transaction: z.custom<VersionedTransaction>(
      (tx) => tx instanceof VersionedTransaction
    ),
    confirmationOptions: z
      .object({
        confirmationStrategy: z
          .object({
            blockhash: z.string(),
            lastValidBlockHeight: z.number()
          })
          .optional()
      })
      .optional()
  })
  .strict()

export type RelayRequest = z.infer<typeof RelaySchema>

export const BuildTransactionSchema = z
  .object({
    instructions: z
      .array(
        z.custom<TransactionInstruction>(
          (instr) => instr instanceof TransactionInstruction
        )
      )
      .min(1),
    recentBlockhash: z.string().optional(),
    feePayer: PublicKeySchema.optional(),
    addressLookupTables: z
      .union([
        z.array(PublicKeySchema).default([]),
        z
          .array(
            z.custom<AddressLookupTableAccount>(
              (arg) => arg instanceof AddressLookupTableAccount
            )
          )
          .default([])
      ])
      .optional()
  })
  .strict()

export type BuildTransactionRequest = z.infer<typeof BuildTransactionSchema>

export const GetOrCreateUserBankSchema = z
  .object({
    ethWallet: z.string(),
    mint: MintSchema,
    feePayer: PublicKeySchema.optional()
  })
  .strict()

export type GetOrCreateUserBankRequest = z.infer<
  typeof GetOrCreateUserBankSchema
>

export const DeriveUserBankSchema = z
  .object({
    ethWallet: z.string(),
    mint: MintSchema
  })
  .strict()

export type DeriveUserBankRequest = z.infer<typeof DeriveUserBankSchema>

export const CreateTransferSchema = z.object({
  feePayer: PublicKeySchema.optional(),
  ethWallet: z.string(),
  mint: MintSchema,
  destination: PublicKeySchema
})

export type CreateTransferRequest = z.infer<typeof CreateTransferSchema>

export const CreateSecpSchema = z
  .object({
    ethWallet: z.string(),
    destination: PublicKeySchema,
    amount: z.union([z.bigint(), z.number()]),
    mint: MintSchema,
    instructionIndex: z.number().optional(),
    auth: z.custom<AuthService>()
  })
  .strict()

export type CreateSecpRequest = z.infer<typeof CreateSecpSchema>
