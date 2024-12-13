import { z } from 'zod'

import { DDEXResourceContributor, DDEXCopyright } from '../../types/DDEX'
import { AudioFile, ImageFile } from '../../types/File'
import { Genre } from '../../types/Genre'
import { HashId } from '../../types/HashId'
import { Mood } from '../../types/Mood'
import { UploadTrackMetadataSchema } from '../tracks/types'

const CreatePlaylistMetadataSchema = z
  .object({
    description: z.optional(z.string().max(1000)),
    playlistName: z.string(),
    isPrivate: z.optional(z.boolean()),
    coverArtCid: z.optional(z.string())
  })
  .strict()

export type CreatePlaylistMetadata = z.input<
  typeof CreatePlaylistMetadataSchema
>

export const CreatePlaylistSchema = z
  .object({
    playlistId: z.optional(HashId),
    coverArtFile: z.optional(ImageFile),
    metadata: CreatePlaylistMetadataSchema,
    onProgress: z.optional(z.function()),
    trackIds: z.optional(z.array(HashId)),
    userId: HashId
  })
  .strict()

export type CreatePlaylistRequest = z.input<typeof CreatePlaylistSchema>

export const createUpdatePlaylistMetadataSchema = () =>
  UploadPlaylistMetadataSchema.partial()
    .merge(
      z.object({
        isPrivate: z.optional(z.boolean()),
        playlistContents: z.optional(
          z.array(
            z.object({
              timestamp: z.number(),
              metadataTimestamp: z.optional(z.number()),
              trackId: HashId
            })
          )
        ),
        coverArtCid: z.optional(z.string())
      })
    )
    .strict()

export const createUpdatePlaylistSchema = () =>
  z
    .object({
      userId: HashId,
      playlistId: HashId,
      coverArtFile: z.optional(ImageFile),
      metadata: createUpdatePlaylistMetadataSchema(),
      onProgress: z.optional(z.function())
    })
    .strict()

export type UpdatePlaylistRequest = z.input<
  ReturnType<typeof createUpdatePlaylistSchema>
>

export const UploadPlaylistMetadataSchema = z
  .object({
    description: z.optional(z.string().max(1000)),
    genre: z.enum(Object.values(Genre) as [Genre, ...Genre[]]),
    license: z.optional(z.string()),
    mood: z.optional(z.enum(Object.values(Mood) as [Mood, ...Mood[]])),
    playlistName: z.string(),
    releaseDate: z.optional(z.date()),
    ddexReleaseIds: z.optional(z.record(z.string()).nullable()),
    ddexApp: z.optional(z.string()),
    tags: z.optional(z.string()),
    upc: z.optional(z.string()),
    artists: z.optional(z.array(DDEXResourceContributor).nullable()),
    copyrightLine: z.optional(DDEXCopyright.nullable()),
    producerCopyrightLine: z.optional(DDEXCopyright.nullable()),
    parentalWarningType: z.optional(z.string().nullable())
  })
  .strict()

export type PlaylistMetadata = z.input<typeof UploadPlaylistMetadataSchema>

const PlaylistTrackMetadataSchema = UploadTrackMetadataSchema.partial({
  genre: true,
  mood: true,
  tags: true
})

/**
 * PlaylistTrackMetadata is less strict than TrackMetadata because
 * `genre`, `mood`, and `tags` are optional
 */
export type PlaylistTrackMetadata = z.infer<typeof PlaylistTrackMetadataSchema>

export const createUploadPlaylistSchema = () =>
  z
    .object({
      userId: HashId,
      coverArtFile: ImageFile,
      metadata: UploadPlaylistMetadataSchema,
      onProgress: z.optional(z.function()),
      /**
       * Track metadata is populated from the playlist if fields are missing
       */
      trackMetadatas: z.array(PlaylistTrackMetadataSchema),
      trackFiles: z.array(AudioFile)
    })
    .strict()

export type UploadPlaylistRequest = z.input<
  ReturnType<typeof createUploadPlaylistSchema>
>

export const PublishPlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId
  })
  .strict()

export type PublishPlaylistRequest = z.input<typeof PublishPlaylistSchema>

export const AddTrackToPlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId,
    trackId: HashId
  })
  .strict()

export type AddTrackToPlaylistRequest = z.input<typeof AddTrackToPlaylistSchema>

export const RemoveTrackFromPlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId,
    trackIndex: z.number()
  })
  .strict()

export type RemoveTrackFromPlaylistRequest = z.input<
  typeof RemoveTrackFromPlaylistSchema
>

export const DeletePlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId
  })
  .strict()

export type DeletePlaylistRequest = z.input<typeof DeletePlaylistSchema>

export const FavoritePlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId,
    metadata: z.optional(
      z
        .object({
          /**
           * Is this a save of a repost? Used to dispatch notifications
           * when a user favorites another user's repost
           */
          isSaveOfRepost: z.boolean()
        })
        .strict()
    )
  })
  .strict()

export type FavoritePlaylistRequest = z.input<typeof FavoritePlaylistSchema>

export const UnfavoritePlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId
  })
  .strict()

export type UnfavoritePlaylistRequest = z.input<typeof UnfavoritePlaylistSchema>

export const RepostPlaylistSchema = z
  .object({
    userId: HashId,
    playlistId: HashId,
    metadata: z.optional(
      z
        .object({
          /**
           * Is this a repost of a repost? Used to dispatch notifications
           * when a user favorites another user's repost
           */
          isRepostOfRepost: z.boolean()
        })
        .strict()
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
