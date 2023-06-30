import { z } from 'zod'
import { HashId } from '../../types/HashId'

export const SavePlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId,
    metadata: z.optional(
      z.object({
        isSaveOfRepost: z.boolean()
      })
    )
  })
  .strict()

export type SavePlaylistRequest = z.input<typeof SavePlaylistSchema>

export const UnsavePlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId
  })
  .strict()

export type UnsavePlaylistRequest = z.input<typeof UnsavePlaylistSchema>

export const RepostPlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId,
    metadata: z.optional(
      z.object({
        /**
         * Is this a save of a repost? Used to dispatch notifications
         * when a user favorites another user's repost
         */
        isRepostOfRepost: z.boolean()
      })
    )
  })
  .strict()

export type RepostPlaylistRequest = z.input<typeof RepostPlaylistSchema>

export const UnrepostPlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId
  })
  .strict()

export type UnrepostPlaylistRequest = z.input<typeof UnrepostPlaylistSchema>
