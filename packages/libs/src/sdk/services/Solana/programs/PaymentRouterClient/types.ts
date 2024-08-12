import { PublicKey } from '@solana/web3.js'
import { z } from 'zod'

import { HashId } from '../../../../types/HashId'
import { Prettify } from '../../../../utils/prettify'
import {
  MintName,
  MintSchema,
  PublicKeySchema,
  SolanaWalletAdapter
} from '../../types'
import { BaseSolanaProgramConfigInternal } from '../types'

export type PaymentRouterClientConfigInternal = {
  programId: PublicKey
  mints: Prettify<Partial<Record<MintName, PublicKey>>>
} & BaseSolanaProgramConfigInternal

export type PaymentRouterClientConfig =
  Partial<PaymentRouterClientConfigInternal> & {
    solanaWalletAdapter: SolanaWalletAdapter
  }

export const CreateTransferInstructionSchema = z.object({
  mint: MintSchema,
  total: z.union([z.bigint(), z.number()]),
  sourceWallet: PublicKeySchema
})

export type CreateTransferInstructionRequest = z.input<
  typeof CreateTransferInstructionSchema
>

export const CreateRouteInstructionSchema = z.object({
  mint: MintSchema,
  splits: z.array(z.object({ wallet: PublicKeySchema, amount: z.bigint() })),
  total: z.union([z.bigint(), z.number()])
})

export type CreateRouteInstructionRequest = z.input<
  typeof CreateRouteInstructionSchema
>

export const CreateMemoInstructionSchema = z.object({
  contentType: z.enum(['track', 'album']),
  contentId: HashId.or(z.number()),
  blockNumber: z.number(),
  buyerUserId: HashId.or(z.number()),
  accessType: z.enum(['stream', 'download']),
  signer: PublicKeySchema.optional()
})

export type CreateMemoInstructionRequest = z.input<
  typeof CreateMemoInstructionSchema
>

export const CreatePurchaseContentInstructionsSchema =
  CreateTransferInstructionSchema.extend(
    CreateRouteInstructionSchema.shape
  ).extend(CreateMemoInstructionSchema.shape)

export type CreatePurchaseContentInstructionsRequest = z.input<
  typeof CreatePurchaseContentInstructionsSchema
>

export const GetOrCreateProgramTokenAccountSchema = z.object({
  mint: MintSchema
})

export type GetOrCreateProgramTokenAccountRequest = z.input<
  typeof GetOrCreateProgramTokenAccountSchema
>
