import { z } from 'zod'
import { ChallengeId } from '../../api/challenges/types'
// @ts-ignore:next-line ignore the unused import, used in jsdoc
import type { ChallengesApi } from '../../api/challenges/ChallengesApi'

export const GetAttestationSchema = z.object({
  /** The user's handle. */
  handle: z.string(),
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.nativeEnum(ChallengeId),
  /**
   * Identifier for the completed challenge instance.
   *
   * @see {@link ChallengesApi.generateSpecifier}
   */
  specifier: z.string(),
  /** The amount being claimed, in decimal wAUDIO. */
  amount: z.number()
})

export type AttestationRequest = z.input<typeof GetAttestationSchema>

export type AttestationResponse = {
  /** The signature attesting to the challenge redemption, or false. */
  signature: string | false
  /** The error code of the failed attestation, if applicable. */
  errorCode?: number
}

/**
 * API Client for the Anti Abuse Oracle Service.
 */
export type AntiAbuseOracleService = {
  getChallengeAttestation: (
    args: AttestationRequest
  ) => Promise<AttestationResponse>
}
