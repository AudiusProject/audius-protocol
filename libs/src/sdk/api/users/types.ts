import { z } from 'zod'
import { HashId } from '../../types/HashId'

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
