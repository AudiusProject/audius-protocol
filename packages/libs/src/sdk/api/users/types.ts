import { z } from 'zod'

import { ImageFile } from '../../types/File'
import { HashId } from '../../types/HashId'

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
