import {
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
  ConnectionConfig,
  SendOptions,
  AddressLookupTableAccount
} from '@solana/web3.js'
import type * as runtime from '../../api/generated/default/runtime'
import { z } from 'zod'
import type { Prettify } from '../../utils/prettify'
import type { Solana } from './Solana'

export type SolanaConfigInternal = {
  /**
   * Middleware for HTTP requests to the Solana relay service.
   */
  middleware?: runtime.Middleware[]
  /**
   * Map from token mint name to public key address.
   */
  mints: Record<Mint, PublicKey>
  /**
   * Map from program name to program ID public key address.
   */
  programIds: Record<Program, PublicKey>
  /**
   * The endpoint to use for the RPC.
   */
  rpcEndpoint: string
  /**
   * Configuration to use for the RPC connection.
   */
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
    /**
     * Confirmation options used when sending the transaction on the server.
     * @see {@link https://solana-labs.github.io/solana-web3.js/classes/Connection.html#confirmTransaction confirmTransaction}
     */
    confirmationOptions: z
      .object({
        /**
         * The confirmation strategy to use when confirming.
         * @see {@link https://solana-labs.github.io/solana-web3.js/types/TransactionConfirmationStrategy.html ConfirmationStrategy}
         * @see {@link https://solana-labs.github.io/solana-web3.js/types/DurableNonceTransactionConfirmationStrategy.html DurableNonceTransactionConfirmationStrategy}
         * @see {@link https://solana-labs.github.io/solana-web3.js/types/BlockheightBasedTransactionConfirmationStrategy.html BlockhashBasedTransactionConfirmationStrategy}
         */
        strategy: z
          .union([
            z.object({
              blockhash: z.string(),
              lastValidBlockHeight: z.number()
            }),
            z.object({
              minContextSlot: z.number(),
              nonceAccountPubkey: PublicKeySchema,
              nonceValue: z.string()
            })
          ])
          .optional(),
        /**
         * The commitment the server should confirm before responding.
         * Leave unset to have the server respond immediately after sending.
         * @see {@link https://solana-labs.github.io/solana-web3.js/types/Commitment.html Commitment}
         */
        commitment: z
          .enum([
            'processed',
            'confirmed',
            'finalized',
            'recent',
            'single',
            'singleGossip',
            'root',
            'max'
          ])
          .optional()
      })
      .optional(),
    /**
     * Custom send options used when sending the transaction on the relay.
     * @see {@link https://solana-labs.github.io/solana-web3.js/types/SendOptions.html SendOptions}
     */
    sendOptions: z.custom<SendOptions>().optional()
  })
  .strict()

export type RelayRequest = z.infer<typeof RelaySchema>
export type RelayRequestBody = Prettify<
  Omit<RelayRequest, 'transaction'> & {
    /**
     * Base64 encoded serialized VersionedTransaction object.
     */
    transaction: string
  }
>

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
      .optional()
  })
  .strict()

export type BuildTransactionRequest = z.infer<typeof BuildTransactionSchema>
