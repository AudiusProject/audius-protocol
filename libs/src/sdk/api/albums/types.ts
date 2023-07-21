import { z } from 'zod'
import type { CrossPlatformFile as File } from '../../types/File'
import { HashId } from '../../types/HashId'
import { Mood } from '../../types/Mood'
import { isFileValid } from '../../utils/file'
import { createUploadTrackMetadataSchema } from '../tracks/types'

export const getAlbumSchema = z.object({
  userId: z.string(),
  albumId: z.string()
})

export type getAlbumRequest = z.input<typeof getAlbumSchema>

export const getAlbumTracksSchema = z.object({
  albumId: z.string()
})

export type getAlbumTracksRequest = z.input<typeof getAlbumTracksSchema>

export const createUploadAlbumMetadataSchema = () =>
  z
    .object({
      description: z.optional(z.string().max(1000)),
      mood: z.optional(z.enum(Object.values(Mood) as [Mood, ...Mood[]])),
      albumName: z.string(),
      releaseDate: z.optional(
        z.date().max(new Date(), { message: 'should not be in the future' })
      ),
      tags: z.optional(z.string()),
      upc: z.optional(z.string())
    })
    .strict()

export type AlbumMetadata = z.input<
  ReturnType<typeof createUploadAlbumMetadataSchema>
>

const createAlbumTrackMetadataSchema = () =>
  createUploadTrackMetadataSchema().partial({
    genre: true,
    mood: true,
    tags: true
  })

export const createUploadAlbumSchema = () =>
  z
    .object({
      userId: HashId,
      coverArtFile: z.custom<File>((data: unknown) =>
        isFileValid(data as File)
      ),
      metadata: createUploadAlbumMetadataSchema(),
      onProgress: z.optional(z.function().args(z.number())),
      /**
       * Track metadata is populated from the album if fields are missing
       */
      trackMetadatas: z.array(createAlbumTrackMetadataSchema()),
      trackFiles: z.array(
        z.custom<File>((data: unknown) => isFileValid(data as File))
      )
    })
    .strict()

export type UploadAlbumRequest = z.input<
  ReturnType<typeof createUploadAlbumSchema>
>

export const createUpdateAlbumSchema = () =>
  z
    .object({
      userId: HashId,
      albumId: HashId,
      coverArtFile: z.optional(
        z.custom<File>((data: unknown) => isFileValid(data as File))
      ),
      metadata: createUploadAlbumMetadataSchema().merge(
        z.object({
          coverArtSizes: z.optional(z.string())
        })
      ),
      onProgress: z.optional(z.function().args(z.number()))
    })
    .strict()

export type UpdateAlbumRequest = z.input<
  ReturnType<typeof createUpdateAlbumSchema>
>

export const DeleteAlbumSchema = z
  .object({
    userId: HashId,
    albumId: HashId
  })
  .strict()

export type DeleteAlbumRequest = z.input<typeof DeleteAlbumSchema>

export const FavoriteAlbumSchema = z
  .object({
    userId: HashId,
    albumId: HashId,
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

export type FavoriteAlbumRequest = z.input<typeof FavoriteAlbumSchema>

export const UnfavoriteAlbumSchema = z
  .object({
    userId: HashId,
    albumId: HashId
  })
  .strict()

export type UnfavoriteAlbumRequest = z.input<typeof UnfavoriteAlbumSchema>

export const RepostAlbumSchema = z
  .object({
    userId: HashId,
    albumId: HashId,
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

export type RepostAlbumRequest = z.input<typeof RepostAlbumSchema>

export const UnrepostAlbumSchema = z
  .object({
    userId: HashId,
    albumId: HashId
  })
  .strict()

export type UnrepostAlbumRequest = z.input<typeof UnrepostAlbumSchema>
