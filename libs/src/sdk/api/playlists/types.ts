import { z } from 'zod'
import type { CrossPlatformFile as File } from '../../types/File'
import { Genre } from '../../types/Genre'
import { HashId } from '../../types/HashId'
import { Mood } from '../../types/Mood'
import { isFileValid } from '../../utils/file'
import { createUploadTrackMetadataSchema } from '../tracks/types'

const createUploadPlaylistMetadataSchema = () =>
  z
    .object({
      description: z.optional(z.string().max(1000)),
      genre: z.enum(Object.values(Genre) as [Genre, ...Genre[]]),
      /**
       * Is this playlist an album?
       */
      isAlbum: z.optional(z.boolean()),
      //   isPrivate: z.optional(z.boolean()),
      isrc: z.optional(z.string()),
      iswc: z.optional(z.string()),
      license: z.optional(z.string()),
      mood: z.optional(z.enum(Object.values(Mood) as [Mood, ...Mood[]])),
      playlistName: z.string(),
      releaseDate: z.optional(
        z.date().max(new Date(), { message: 'should not be in the future' })
      ),
      tags: z.optional(z.string()),
      upc: z.optional(z.string())
    })
    .strict()

export type PlaylistMetadata = z.input<
  ReturnType<typeof createUploadPlaylistMetadataSchema>
>

export const createUploadPlaylistSchema = () =>
  z
    .object({
      userId: HashId,
      coverArtFile: z.custom<File>((data: unknown) =>
        isFileValid(data as File)
      ),
      metadata: createUploadPlaylistMetadataSchema(),
      onProgress: z.optional(z.function().args(z.number())),
      trackMetadatas: z.array(createUploadTrackMetadataSchema()),
      trackFiles: z.array(
        z.custom<File>((data: unknown) => isFileValid(data as File))
      )
    })
    .strict()

export type UploadPlaylistRequest = z.input<
  ReturnType<typeof createUploadPlaylistSchema>
>

export const SavePlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId,
    metadata: z.optional(
      z.object({
        /**
         * Is this a save of a repost? Used to dispatch notifications
         * when a user favorites another user's repost
         */
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
         * Is this a repost of a repost? Used to dispatch notifications
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
