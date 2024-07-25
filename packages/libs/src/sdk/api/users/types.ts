import { WalletAdapter } from '@solana/wallet-adapter-base'
import { z } from 'zod'

import { PublicKeySchema } from '../../services'
import { ImageFile } from '../../types/File'
import { HashId } from '../../types/HashId'
import { getReaction, reactionsMap } from '../../utils/reactionsMap'

export const UpdateProfileSchema = z
  .object({
    userId: HashId,
    profilePictureFile: z.optional(ImageFile),
    coverArtFile: z.optional(ImageFile),
    onProgress: z.optional(z.function().args(z.number())),
    metadata: z
      .object({
        name: z.optional(z.string()),
        bio: z.optional(z.string()),
        location: z.optional(z.string()),
        isDeactivated: z.optional(z.boolean()),
        artistPickTrackId: z.optional(HashId)
      })
      .strict()
  })
  .strict()

export type UpdateProfileRequest = Omit<
  z.input<typeof UpdateProfileSchema>,
  'onProgress'
> & {
  // Typing function manually because z.function() does not
  // support argument names
  onProgress?: (progress: number) => void
}

export const FollowUserSchema = z
  .object({
    userId: HashId,
    followeeUserId: HashId
  })
  .strict()

export type FollowUserRequest = z.input<typeof FollowUserSchema>

export const UnfollowUserSchema = z
  .object({
    userId: HashId,
    followeeUserId: HashId
  })
  .strict()

export type UnfollowUserRequest = z.input<typeof UnfollowUserSchema>

export const SubscribeToUserSchema = z
  .object({
    userId: HashId,
    subscribeeUserId: HashId
  })
  .strict()

export type SubscribeToUserRequest = z.input<typeof SubscribeToUserSchema>

export const UnsubscribeFromUserSchema = z
  .object({
    userId: HashId,
    subscribeeUserId: HashId
  })
  .strict()

export type UnsubscribeFromUserRequest = z.input<
  typeof UnsubscribeFromUserSchema
>

export const SendTipSchema = z
  .object({
    amount: z.number().positive().int(),
    senderUserId: HashId,
    receiverUserId: HashId
  })
  .strict()

export type SendTipRequest = z.input<typeof SendTipSchema>

export type ReactionTypes = keyof typeof reactionsMap

const ReactionTypeSchema = z
  .custom<ReactionTypes>(
    (value) => {
      const validReactions = Object.keys(reactionsMap) as ReactionTypes[]
      return validReactions.includes(value as ReactionTypes)
    },
    {
      message: 'Invalid reaction type'
    }
  )
  .transform<number>((data, ctx) => {
    const value = getReaction(data)
    if (value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'reactionValue invalid'
      })
      return z.NEVER
    }
    return value
  })

export const SendTipReactionRequestSchema = z.object({
  userId: HashId,
  metadata: z.object({
    reactedTo: z.string().nonempty(),
    reactionValue: ReactionTypeSchema
  })
})

export type SendTipReactionRequest = z.input<
  typeof SendTipReactionRequestSchema
>

const SplitDonationsRequestBase = z.object({
  /** The ID of the user purchasing the album. */
  // userId: HashId,
  /**
   * The price of the album at the time of purchase (in dollars if number, USDC if bigint).
   * Used to check against current album price in case it changed,
   * effectively setting a "max price" for the purchase.
   */
  splits: z.array(z.object({ wallet: PublicKeySchema, amount: z.bigint() })),
  total: z.union([z.bigint(), z.number()])
})

export const SplitDonationsRequestSchema = z
  .object({
    splits: z.array(z.object({ id: z.string(), amount: z.bigint() })),
    total: z.union([z.bigint(), z.number()]),
    /** A wallet to use to purchase (defaults to the authed user's user bank if not specified) */
    walletAdapter: z
      .custom<Pick<WalletAdapter, 'publicKey' | 'sendTransaction'>>()
      .optional()
  })
  .strict()

export type SplitDonationsRequest = z.input<typeof SplitDonationsRequestSchema>

export const GetSplitDonationsTransactionSchema = z
  .object({
    /** A wallet to use to purchase (defaults to the authed user's user bank if not specified) */
    wallet: PublicKeySchema.optional()
  })
  .merge(SplitDonationsRequestBase)
  .strict()

export type GetSplitDonationsTransactionRequest = z.input<
  typeof GetSplitDonationsTransactionSchema
>
