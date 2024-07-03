import {
  AddressLookupTableAccount,
  TransactionInstruction,
  type ConnectionConfig
} from '@solana/web3.js'
import { z } from 'zod'

import { PublicKeySchema } from '../types'

export type BaseSolanaProgramConfigInternal = {
  /** Connection to interact with the Solana RPC */
  rpcEndpoint: string
  /** Configuration to use for the RPC connection. */
  rpcConfig?: ConnectionConfig
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
    priorityFee: z
      .union([
        z.object({
          microLamports: z.number()
        }),
        z.object({
          percentile: z.number().min(0).max(100)
        }),
        z.object({
          priority: PrioritySchema
        })
      ])
      .optional()
  })
  .strict()

export type BuildTransactionRequest = z.infer<typeof BuildTransactionSchema>
