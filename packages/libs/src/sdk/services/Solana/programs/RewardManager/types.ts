import type { PublicKey } from '@solana/web3.js'
import type { SolanaProgramConfigInternal } from '../types'
import { z } from 'zod'
import { PublicKeySchema } from '../../types'

export type RewardManagerConfigInternal = {
  programId: PublicKey
  rewardManagerState: PublicKey
} & SolanaProgramConfigInternal

export type RewardManagerConfig = Partial<RewardManagerConfigInternal>

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
