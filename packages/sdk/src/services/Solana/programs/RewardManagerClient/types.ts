import type { PublicKey } from '@solana/web3.js'
import { z } from 'zod'

import type { LoggerService } from '../../../Logger'
import { PublicKeySchema } from '../../types'
import type { SolanaClient } from '../SolanaClient'

export type RewardManagerClientConfigInternal = {
  programId: PublicKey
  rewardManagerState: PublicKey
  rewardManagerLookupTable: PublicKey
  logger: LoggerService
}

export type RewardManagerClientConfig =
  Partial<RewardManagerClientConfigInternal> & {
    solanaClient: SolanaClient
  }

export const CreateSenderInstructionSchema = z.object({
  manager: PublicKeySchema,
  sender: z.string(),
  operator: z.string(),
  feePayer: PublicKeySchema.optional()
})

export type CreateSenderInstructionRequest = z.input<
  typeof CreateSenderInstructionSchema
>

export const CreateSubmitAttestationInstructionSchema = z.object({
  challengeId: z.string(),
  specifier: z.string(),
  senderEthAddress: z.string(),
  feePayer: PublicKeySchema.optional()
})

export type CreateSubmitAttestationRequest = z.input<
  typeof CreateSubmitAttestationInstructionSchema
>

export const CreateSubmitAttestationSecpInstructionSchema = z.object({
  challengeId: z.string(),
  specifier: z.string(),
  recipientEthAddress: z.string(),
  senderEthAddress: z.string(),
  amount: z.bigint(),
  antiAbuseOracleEthAddress: z.string().optional(),
  senderSignature: z.string(),
  instructionIndex: z.number().optional()
})

export type CreateSubmitAttestationSecpInstructionRequest = z.input<
  typeof CreateSubmitAttestationSecpInstructionSchema
>

export const CreateEvaluateAttestationsInstructionSchema = z.object({
  challengeId: z.string(),
  specifier: z.string(),
  recipientEthAddress: z.string(),
  destinationUserBank: PublicKeySchema,
  antiAbuseOracleEthAddress: z.string(),
  amount: z.bigint(),
  feePayer: PublicKeySchema.optional()
})

export type CreateEvaluateAttestationsInstructionRequest = z.input<
  typeof CreateEvaluateAttestationsInstructionSchema
>

export const GetSubmittedAttestationsSchema = z.object({
  challengeId: z.string(),
  specifier: z.string()
})

export type GetSubmittedAttestationsRequest = z.input<
  typeof GetSubmittedAttestationsSchema
>
