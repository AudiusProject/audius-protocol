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
    /**
     * Either the public keys or actual account data for related address lookup tables.
     */
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
          minimumMicroLamports: z.number().min(0).optional()
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
          minimumMicroLamports: z.number().min(0).optional()
        })
      ])
      .nullable()
      .optional()
  })
  .strict()

export type BuildTransactionRequest = z.infer<typeof BuildTransactionSchema>
