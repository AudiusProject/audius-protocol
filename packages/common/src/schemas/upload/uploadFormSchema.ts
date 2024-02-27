import {
  Genre,
  Mood,
  EthCollectibleGatedConditions,
  SolCollectibleGatedConditions
} from '@audius/sdk'
import { z } from 'zod'

import { imageBlank } from '~/assets'
import { NativeFile, TrackForUpload } from '~/store/upload/types'

const messages = {
  artworkRequiredError: 'Artwork is required.',
  genreRequiredError: 'Genre is required.',
  track: {
    titleRequiredError: 'Your track must have a name.'
  },
  playlist: {
    nameRequiredError: 'Your playlist must have a name.'
  },
  album: {
    nameRequiredError: 'Your album must have a name.'
  }
}

/** Same as SDK but snake-cased */
const CollectibleGatedConditions = z
  .object({
    nft_collection: z.optional(
      z.union([EthCollectibleGatedConditions, SolCollectibleGatedConditions])
    )
  })
  .strict()

/** Same as SDK but snake-cased */
const FollowGatedConditionsSchema = z
  .object({
    follow_user_id: z.number()
  })
  .strict()

/** Same as SDK but snake-cased */
const TipGatedConditionsSchema = z
  .object({
    tip_user_id: z.number()
  })
  .strict()

/** Same as SDK but snake-cased */
const USDCPurchaseConditionsSchema = z
  .object({
    usdc_purchase: z.object({
      price: z.number().positive(),
      splits: z.any()
    })
  })
  .strict()

/** Same as SDK. */
const GenreSchema = z
  .enum(Object.values(Genre) as [Genre, ...Genre[]])
  .nullable()
  .refine((val) => val !== null, {
    message: messages.genreRequiredError
  })

/** Same as SDK. */
const MoodSchema = z
  .optional(z.enum(Object.values(Mood) as [Mood, ...Mood[]]))
  .nullable()

// TODO: KJ - Need to update the schema in sdk and then import here
/**
 * Creates a schema for validating tracks to be uploaded.
 * 
 * Used on the EditTrackForm of the upload page, for single/multiple
 * track uploads.
 * 
 * Note that it doesn't produce the same type as that used by those
 * forms and their consumers - the form actually submits more data than
 * is validated here. Note the differences between this and the SDK or common 
 * metadata schema for tracks:
 * - This is snake cased, save for a few fields (remixOf, namely)
 * - IDs are numeric
 */
const createSdkSchema = () =>
  z.object({
    ai_attribution_user_id: z.optional(z.number()).nullable(),
    description: z.optional(z.string().max(1000)),
    field_visibility: z.optional(
      z.object({
        mood: z.optional(z.boolean()),
        tags: z.optional(z.boolean()),
        genre: z.optional(z.boolean()),
        share: z.optional(z.boolean()),
        play_count: z.optional(z.boolean()),
        remixes: z.optional(z.boolean())
      })
    ),
    genre: GenreSchema,
    isrc: z.optional(z.string().nullable()),
    is_scheduled_release: z.optional(z.boolean()),
    is_unlisted: z.optional(z.boolean()),
    iswc: z.optional(z.string().nullable()),
    license: z.optional(z.string().nullable()),
    mood: MoodSchema,
    is_stream_gated: z.optional(z.boolean()),
    stream_conditions: z
      .optional(
        z.union([
          CollectibleGatedConditions,
          FollowGatedConditionsSchema,
          TipGatedConditionsSchema,
          USDCPurchaseConditionsSchema
        ])
      )
      .nullable(),
    is_download_gated: z.optional(z.boolean()),
    download_conditions: z
      .optional(
        z.union([
          CollectibleGatedConditions,
          FollowGatedConditionsSchema,
          TipGatedConditionsSchema,
          USDCPurchaseConditionsSchema
        ])
      )
      .nullable(),
    release_date: z.optional(z.string()).nullable(),
    remixOf: z.optional(
      z
        .object({
          tracks: z
            .array(
              z.object({
                parentTrackId: z.number()
              })
            )
            .min(1)
        })
        .strict()
    ),
    tags: z.optional(z.string()),
    title: z.string({
      required_error: messages.track.titleRequiredError
    }),
    previewStartSeconds: z.optional(z.number()),
    audioUploadId: z.optional(z.string()),
    previewCid: z.optional(z.string()),
    orig_file_cid: z.optional(z.string()),
    orig_filename: z.optional(z.string()),
    is_downloadable: z.optional(z.boolean()),
    is_original_available: z.optional(z.boolean())
  })

  /**
   * This is not really used as it is, since we pick out the title only of it
   * for collections and make the artwork required for non-collections.
   * 
   * It does produce a more "validated" correct type for the form but that
   * wasn't used anywhere.
   */
const TrackMetadataSchema = createSdkSchema().merge(
  z.object({
    artwork: z
      .object({
        url: z.string().optional()
      })
      .nullable()
  })
)

/**
 * This is what's actually used on the EditTrackForm.
 * It makes the artwork required from the TrackMetadataSchema.
 */
export const TrackMetadataFormSchema = TrackMetadataSchema.refine(
  (form) => form.artwork?.url != null,
  {
    message: messages.artworkRequiredError,
    path: ['artwork']
  }
)

const CollectionTrackMetadataSchema = TrackMetadataSchema.pick({ title: true })

/**
 * Produces a schema that validates a collection metadata for upload.
 * Note the differences between this schema and the normal collection type:
 * - This one is snake cased.
 * - It has artwork (only validates the url, not the file for some reason).
 * - There's extra track details to be validated.
 * - The tracks are only validated for their titles.
 * - The release date can be in the future.
 */
export const createCollectionSchema = (collectionType: 'playlist' | 'album') =>
  z.object({
    artwork: z
      .object({
        url: z.string()
      })
      .nullable()
      .refine(
        (artwork) => {
          return (
            collectionType === 'playlist' ||
            (artwork !== null && artwork.url !== imageBlank)
          )
        },
        {
          message: messages.artworkRequiredError
        }
      ),
    playlist_name: z.string({
      required_error: messages[collectionType].nameRequiredError
    }),
    description: z.optional(z.string().max(1000)),
    release_date: z.optional(z.string()).nullable(),
    trackDetails: z.object({
      genre: GenreSchema,
      mood: MoodSchema,
      tags: z.optional(z.string())
    }),
    is_album: z.literal(collectionType === 'album'),
    tracks: z.array(z.object({ metadata: CollectionTrackMetadataSchema }))
  })

/**
 * Extra metadata on the collection that doesn't get validated to
 * the types that are used.
 * - Playlist ID isn't on the schema.
 * - Artwork is more than just a URL.
 * - Tracks are full TrackForUploads, not just titles.
 */
type UnvalidatedCollectionMetadata = {
  playlist_id?: number
  artwork: {
    file: File | NativeFile
  } | null
  tracks: TrackForUpload[]
}

export const PlaylistSchema = createCollectionSchema('playlist')
export type PlaylistValues = z.input<typeof PlaylistSchema> &
  UnvalidatedCollectionMetadata

export const AlbumSchema = createCollectionSchema('album')
export type AlbumValues = z.input<typeof AlbumSchema> &
  UnvalidatedCollectionMetadata

/** Values produced by the collection form. */
export type CollectionValues = PlaylistValues | AlbumValues
