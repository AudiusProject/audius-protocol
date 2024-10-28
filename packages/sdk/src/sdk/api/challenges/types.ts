import { z } from 'zod'

import { HashId } from '../../types/HashId'

// @ts-ignore:next-line ignore the unused import, used in jsdoc
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ChallengesApi } from './ChallengesApi'

export enum ChallengeId {
  TRACK_UPLOADS = 'u',
  REFERRALS = 'r',
  VERIFIED_REFERRALS = 'rv',
  REFERRED = 'rd',
  MOBILE_INSTALL = 'm',
  CONNECT_VERIFIED_ACCOUNT = 'v',
  LISTEN_STREAK = 'l',
  COMPLETE_PROFILE = 'p',
  SEND_FIRST_TIP = 'ft',
  CREATE_FIRST_PLAYLIST = 'fp',
  AUDIO_MATCHING_BUYER = 'b',
  AUDIO_MATCHING_SELLER = 's',
  TRENDING_TRACK = 'tt',
  TRENDING_PLAYLIST = 'tp',
  TRENDING_UNDERGROUND_TRACK = 'tut',
  DEPRECATED_TRACK_UPLOADS = 'track-upload',
  DEPRECATED_REFERRALS = 'referrals',
  DEPRECATED_VERIFIED_REFERRALS = 'ref-v',
  DEPRECATED_REFERRED = 'referred',
  DEPRECATED_MOBILE_INSTALL = 'mobile-install',
  DEPRECATED_CONNECT_VERIFIED_ACCOUNT = 'connect-verified',
  DEPRECATED_LISTEN_STREAK = 'listen-streak',
  DEPRECATED_COMPLETE_PROFILE = 'profile-completion',
  DEPRECATED_SEND_FIRST_TIP = 'send-first-tip',
  DEPRECATED_CREATE_FIRST_PLAYLIST = 'first-playlist'
}

const DefaultSpecifier = z.object({
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.enum([
    ChallengeId.COMPLETE_PROFILE,
    ChallengeId.CONNECT_VERIFIED_ACCOUNT,
    ChallengeId.CREATE_FIRST_PLAYLIST,
    ChallengeId.LISTEN_STREAK,
    ChallengeId.MOBILE_INSTALL,
    ChallengeId.REFERRED,
    ChallengeId.SEND_FIRST_TIP,
    ChallengeId.TRACK_UPLOADS
  ]),
  /** The user ID of the user completing the challenge. */
  userId: HashId
})

const ReferralSpecifier = z.object({
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.enum([ChallengeId.REFERRALS, ChallengeId.VERIFIED_REFERRALS]),
  /** The user ID of the user completing the challenge. */
  userId: HashId,
  /** The user ID of the user that was referred. */
  referredUserId: HashId
})

const AudioMatchSpecifier = z.object({
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.enum([
    ChallengeId.AUDIO_MATCHING_BUYER,
    ChallengeId.AUDIO_MATCHING_SELLER
  ]),
  /** The user ID of the user completing the challenge. */
  userId: HashId,
  /** The content ID that was purchased. */
  contentId: HashId
})

export const GenerateSpecifierSchema = z.union([
  DefaultSpecifier,
  ReferralSpecifier,
  AudioMatchSpecifier
])

export type GenerateSpecifierRequest = z.input<typeof GenerateSpecifierSchema>

export const ClaimRewardsSchema = z
  .object({
    /** The challenge identifier. As in, the challenge "name." */
    challengeId: z.nativeEnum(ChallengeId),
    /**
     * Identifier for the completed challenge instance.
     *
     * @see {@link ChallengesApi.generateSpecifier}
     */
    specifier: z.string(),
    /** Reward amount, in either wAUDIO (number) or wAUDIO Wei (bigint) */
    amount: z.union([z.bigint(), z.number()]),
    /** The user ID of the claimee. */
    userId: HashId
  })
  .strict()

export type ClaimRewardsRequest = z.input<typeof ClaimRewardsSchema>

export type AttestationTransactionSignature = {
  transactionSignature: string
  antiAbuseOracleEthAddress: string
}

export type AAOErrorResponse = {
  aaoErrorCode: number
}
