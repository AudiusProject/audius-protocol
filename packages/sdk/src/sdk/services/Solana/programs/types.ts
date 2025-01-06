import {
  AddressLookupTableAccount,
  TransactionInstruction,
  type ConnectionConfig
} from '@solana/web3.js'
import { z } from 'zod'

import { PublicKeySchema, type SolanaWalletAdapter } from '../types'

export type SolanaClientConfigInternal = {
  /** Connection to interact with the Solana RPC */
  rpcEndpoints: string[]
  /** Configuration to use for the RPC connection. */
  rpcConfig?: ConnectionConfig
}

export type SolanaClientConfig = Partial<SolanaClientConfigInternal> & {
  solanaWalletAdapter: SolanaWalletAdapter
}

export const PrioritySchema = z.enum([
  'MIN',
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERY_HIGH',
  'UNSAFE_MAX'
])

// Note: Don't just use a custom object w/ `instanceof TransactionInstruction`
// as mismatching versions of @solana/web3.js would fail the instanceof check.
const TransactionInstructionSchema = z
  .object({
    data: z.custom<Buffer>(),
    keys: z.array(
      z.object({
        pubkey: PublicKeySchema,
        isSigner: z.boolean(),
        isWritable: z.boolean()
      })
    ),
    programId: PublicKeySchema
  })
  .transform<TransactionInstruction>((arg) =>
    arg instanceof TransactionInstruction
      ? arg
      : new TransactionInstruction(arg)
  )

// Note: Don't just use a custom object w/ `instanceof AddressLookupTableAccount`
// as mismatching versions of @solana/web3.js would fail the instanceof check.
const AddressLookupTableAccountSchema = z
  .object({
    key: PublicKeySchema,
    state: z.object({
      addresses: z.array(PublicKeySchema),
      authority: z.optional(PublicKeySchema),
      deactivationSlot: z.bigint(),
      lastExtendedSlot: z.number(),
      lastExtendedSlotStartIndex: z.number()
    })
  })
  .transform<AddressLookupTableAccount>((arg) =>
    arg instanceof AddressLookupTableAccount
      ? arg
      : new AddressLookupTableAccount(arg)
  )

export const BuildTransactionSchema = z
  .object({
    instructions: z.array(TransactionInstructionSchema).min(1),
    recentBlockhash: z.string().optional(),
    feePayer: PublicKeySchema.optional(),
    /**
     * Either the public keys or actual account data for related address lookup tables.
     */
    addressLookupTables: z
      .union([
        z.array(PublicKeySchema).default([]),
        z.array(AddressLookupTableAccountSchema).default([])
      ])
      .optional(),
    /**
     * Adds a ComputeBudget instruction to set the compute unit price for the
     * transaction. Can specify a percentile or percentile enum to use recent
     * prioritization fees to programatically set the price.
     */
    priorityFee: z
      .union([
        z.object({
          /**
           * The exact amount of microLamports to add per compute unit.
           */
          microLamports: z.number().min(0)
        }),
        z.object({
          /**
           * Specify the precise percentile (0-100) of recent priority fees
           * to use as this transactions priority fee per compute unit.
           */
          percentile: z.number().min(0).max(100),
          /**
           * The minimum microLamports to use as the priority fee per compute
           * unit, regardless of the percentiles.
           */
          minimumMicroLamports: z.number().min(0).optional(),
          /**
           * The maximum microLamports to use as the priority fee per compute
           * unit, regardless of the percentiles.
           */
          maximumMicroLamports: z.number().min(0).optional()
        }),
        z.object({
          /**
           * Specify an enum-based percentile of recent priority fees to use as
           * this transactions priority fee per compute unit.
           */
          priority: PrioritySchema,
          /**
           * The minimum microLamports to use as the priority fee per compute
           * unit, regardless of the percentiles.
           */
          minimumMicroLamports: z.number().min(0).optional(),
          /**
           * The maximum microLamports to use as the priority fee per compute
           * unit, regardless of the percentiles.
           */
          maximumMicroLamports: z.number().min(0).optional()
        })
      ])
      .nullable()
      .optional()
  })
  .strict()

export type BuildTransactionRequest = z.infer<typeof BuildTransactionSchema>
