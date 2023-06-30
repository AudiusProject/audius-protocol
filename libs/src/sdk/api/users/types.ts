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
