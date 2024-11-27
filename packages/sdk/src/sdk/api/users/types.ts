import { z } from 'zod'

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

// Email-related types
export interface EmailRequest {
  emailOwnerUserId: number
  primaryUserId: number
  encryptedEmail: string
  encryptedKey: string
  delegatedUserIds?: number[]
  delegatedKeys?: string[]
}

export const EmailSchema = z.object({
  emailOwnerUserId: z.number(),
  primaryUserId: z.number(),
  encryptedEmail: z.string(),
  encryptedKey: z.string(),
  delegatedUserIds: z.array(z.number()).optional(),
  delegatedKeys: z.array(z.string()).optional()
})
