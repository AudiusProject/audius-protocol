import { z } from 'zod'

import { HashId } from '../../types/HashId'

// @ts-ignore:next-line ignore the unused import, used in jsdoc
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ChallengesApi } from './ChallengesApi'

export enum ChallengeId {
  TRACK_UPLOADS = 'track-upload',
  REFERRALS = 'referrals',
  VERIFIED_REFERRALS = 'ref-v',
  REFERRED = 'referred',
  MOBILE_INSTALL = 'mobile-install',
  CONNECT_VERIFIED_ACCOUNT = 'connect-verified',
  LISTEN_STREAK = 'listen-streak',
  COMPLETE_PROFILE = 'profile-completion',
  SEND_FIRST_TIP = 'send-first-tip',
  CREATE_FIRST_PLAYLIST = 'first-playlist',
  AUDIO_MATCHING_BUYER = 'b',
  AUDIO_MATCHING_SELLER = 's',
  TRENDING_TRACK = 'tt',
  TRENDING_PLAYLIST = 'tp',
  TRENDING_UNDERGROUND_TRACK = 'tut'
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
  /** The user ID of the user that was referred. */
  referredUserId: HashId,
  /** The user ID of the user completing the challenge. */
  userId: HashId
})

const TrackSellerSpecifier = z.object({
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.enum([ChallengeId.AUDIO_MATCHING_BUYER]),
  /** The user ID of the owner of the track purchased. */
  sellerUserId: HashId,
  /** The track ID that was purchased. */
  trackId: HashId
})

const TrackBuyerSpecifier = z.object({
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.enum([ChallengeId.AUDIO_MATCHING_SELLER]),
  /** The user ID of the user that bought the track. */
  buyerUserId: HashId,
  /** The track ID that was purchased. */
  trackId: HashId
})

export const GenerateSpecifierSchema = z.union([
  DefaultSpecifier,
  ReferralSpecifier,
  TrackSellerSpecifier,
  TrackBuyerSpecifier
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
