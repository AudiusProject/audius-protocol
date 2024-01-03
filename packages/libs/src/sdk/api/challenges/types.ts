import { z } from 'zod'
import { HashId } from '../../types/HashId'

// @ts-ignore:next-line ignore the unused import, used in jsdoc
import type { ChallengesApi } from './ChallengesApi'

export enum ChallengeRewardID {
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
    ChallengeRewardID.COMPLETE_PROFILE,
    ChallengeRewardID.CONNECT_VERIFIED_ACCOUNT,
    ChallengeRewardID.CREATE_FIRST_PLAYLIST,
    ChallengeRewardID.LISTEN_STREAK,
    ChallengeRewardID.MOBILE_INSTALL,
    ChallengeRewardID.REFERRED,
    ChallengeRewardID.SEND_FIRST_TIP,
    ChallengeRewardID.TRACK_UPLOADS
  ]),
  /** The user ID of the user completing the challenge. */
  userId: HashId
})

const ReferralSpecifier = z.object({
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.enum([
    ChallengeRewardID.REFERRALS,
    ChallengeRewardID.VERIFIED_REFERRALS
  ]),
  /** The user ID of the user that was referred. */
  referredUserId: HashId,
  /** The user ID of the user completing the challenge. */
  userId: HashId
})

const TrackSellerSpecifier = z.object({
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.enum([ChallengeRewardID.AUDIO_MATCHING_BUYER]),
  /** The user ID of the owner of the track purchased. */
  sellerUserId: HashId,
  /** The track ID that was purchased. */
  trackId: HashId
})

const TrackBuyerSpecifier = z.object({
  /** The challenge identifier. As in, the challenge "name." */
  challengeId: z.enum([ChallengeRewardID.AUDIO_MATCHING_SELLER]),
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
    challengeId: z.nativeEnum(ChallengeRewardID),
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
