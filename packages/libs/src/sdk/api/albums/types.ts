import { z } from 'zod'

import { AudioFile, ImageFile } from '../../types/File'
import { Genre } from '../../types/Genre'
import { HashId } from '../../types/HashId'
import { Mood } from '../../types/Mood'
import { createUploadTrackMetadataSchema } from '../tracks/types'
import { DDEXResourceContributor, DDEXCopyright } from '../../types/DDEX'

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
      albumName: z.string(),
      description: z.optional(z.string().max(1000)),
      genre: z.enum(Object.values(Genre) as [Genre, ...Genre[]]),
      license: z.optional(z.string()),
      mood: z.optional(z.enum(Object.values(Mood) as [Mood, ...Mood[]])),
      releaseDate: z.optional(
        z.date().max(new Date(), { message: 'should not be in the future' })
      ),
      ddexReleaseIds: z.optional(z.record(z.string()).nullable()),
      tags: z.optional(z.string()),
      upc: z.optional(z.string()),
      artists: z.optional(z.array(DDEXResourceContributor)),
      copyrightLine: z.optional(DDEXCopyright),
      producerCopyrightLine: z.optional(DDEXCopyright),
      parentalWarningType: z.optional(z.string())
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
      coverArtFile: ImageFile,
      metadata: createUploadAlbumMetadataSchema(),
      onProgress: z.optional(z.function().args(z.number())),
      /**
       * Track metadata is populated from the album if fields are missing
       */
      trackMetadatas: z.array(createAlbumTrackMetadataSchema()),
      trackFiles: z.array(AudioFile)
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
      coverArtFile: z.optional(ImageFile),
      metadata: createUploadAlbumMetadataSchema().partial(),
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
