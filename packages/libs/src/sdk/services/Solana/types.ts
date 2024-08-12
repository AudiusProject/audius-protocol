import type { WalletAdapterProps } from '@solana/wallet-adapter-base'
import {
  PublicKey,
  VersionedTransaction,
  SendOptions,
  Transaction
} from '@solana/web3.js'
import { z } from 'zod'

import type { Prettify } from '../../utils/prettify'
import { DiscoveryNodeSelectorService } from '../DiscoveryNodeSelector'

import type { SolanaRelay } from './SolanaRelay'

export type SolanaWalletAdapter = WalletAdapterProps

export type SolanaConfig = {
  /**
   * Selector that finds a healthy discovery node.
   */
  discoveryNodeSelector: DiscoveryNodeSelectorService
}

export type SolanaRelayService = SolanaRelay

export const PublicKeySchema = z.union([
  z.string().transform<PublicKey>((data, ctx) => {
    try {
      return new PublicKey(data)
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: e instanceof Error ? e.message : 'Invalid PublicKey input'
      })
    }
    return z.NEVER
  }),
  z.custom<PublicKey>((data) => {
    return data instanceof PublicKey
  })
])

export const TokenNameSchema = z.enum(['wAUDIO', 'USDC'])

export type TokenName = z.input<typeof TokenNameSchema>

export const MintSchema = z.union([TokenNameSchema, PublicKeySchema])

export type Mint = z.input<typeof MintSchema>

export const RelaySchema = z
  .object({
    transaction: z.custom<VersionedTransaction | Transaction>(),
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
