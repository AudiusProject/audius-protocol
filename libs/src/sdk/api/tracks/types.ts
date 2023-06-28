import { z } from 'zod'
import type {
  CrossPlatformFile,
  CrossPlatformFile as File
} from '../../types/File'
import { Genre } from '../../types/Genre'
import { HashId } from '../../types/HashId'
import { Mood } from '../../types/Mood'
import { isFileValid } from '../../utils/file'

export const PremiumConditionsEthNFTCollection = z.object({
  chain: z.literal('eth'),
  address: z.string(),
  standard: z.union([z.literal('ERC721'), z.literal('ERC1155')]),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.optional(z.string()),
  externalLink: z.optional(z.string())
})

export const PremiumConditionsSolNFTCollection = z.object({
  chain: z.literal('sol'),
  address: z.string(),
  name: z.string(),
  imageUrl: z.optional(z.string()),
  externalLink: z.optional(z.string())
})

export const PremiumConditionsNFTCollection = z.union([
  PremiumConditionsEthNFTCollection,
  PremiumConditionsSolNFTCollection
])

export const PremiumConditionsFollowUserId = z.object({
  followUserId: z.number()
})

export const PremiumConditionsTipUserId = z.object({
  tipUserId: z.number()
})

export const createUploadTrackMetadataSchema = () =>
  z
    .object({
      aiAttributionUserId: z.optional(z.number()),
      description: z.optional(z.string().max(1000)),
      download: z.optional(
        z.object({
          cid: z.string(),
          isDownloadable: z.boolean(),
          requiresFollow: z.boolean()
        })
      ),
      isPremium: z.optional(z.boolean()),
      isrc: z.optional(z.string()),
      isUnlisted: z.optional(z.boolean()),
      iswc: z.optional(z.string()),
      license: z.optional(z.string()),
      mood: z.optional(z.enum(Object.values(Mood) as [Mood, ...Mood[]])),
      fieldVisibility: z.optional(
        z.object({
          mood: z.optional(z.boolean()),
          tags: z.optional(z.boolean()),
          genre: z.optional(z.boolean()),
          share: z.optional(z.boolean()),
          playCount: z.optional(z.boolean()),
          remixes: z.optional(z.boolean())
        })
      ),
      genre: z.enum(Object.values(Genre) as [Genre, ...Genre[]]),
      premiumConditions: z.optional(
        z.union([
          PremiumConditionsNFTCollection,
          PremiumConditionsFollowUserId,
          PremiumConditionsTipUserId
        ])
      ),
      releaseDate: z.optional(
        z.date().max(new Date(), { message: 'should not be in the future' })
      ),
      remixOf: z.optional(
        z.object({
          tracks: z
            .array(
              z.object({
                parentTrackId: z.number()
              })
            )
            .min(1)
        })
      ),
      tags: z.optional(z.string()),
      title: z.string()
    })
    .strict()

export type TrackMetadataType = z.input<
  ReturnType<typeof createUploadTrackMetadataSchema>
>

export const createUploadTrackSchema = () =>
  z
    .object({
      userId: HashId,
      coverArtFile: z.custom<File>((data: unknown) =>
        isFileValid(data as CrossPlatformFile)
      ),
      metadata: createUploadTrackMetadataSchema(),
      onProgress: z.optional(z.function().args(z.number())),
      trackFile: z.custom<File>((data: unknown) =>
        isFileValid(data as CrossPlatformFile)
      )
    })
    .strict()

export type UploadTrackRequest = Omit<
  z.input<ReturnType<typeof createUploadTrackSchema>>,
  'onProgress'
> & {
  // Typing function manually because z.function() does not
  // support argument names
  onProgress?: (progress: number) => void
}

export const createUpdateTrackSchema = () =>
  createUploadTrackSchema()
    .pick({
      userId: true,
      coverArtFile: true,
      metadata: true,
      onProgress: true
    })
    .merge(
      z.object({
        trackId: HashId
      })
    )
    .strict()

export type UpdateTrackRequest = Omit<
  z.input<ReturnType<typeof createUpdateTrackSchema>>,
  'onProgress'
> & {
  onProgress?: (progress: number) => void
}

export const DeleteTrackSchema = z
  .object({
    userId: HashId,
    trackId: HashId
  })
  .strict()

export type DeleteTrackRequest = z.input<typeof DeleteTrackSchema>

export const SaveTrackSchema = z
  .object({
    userId: HashId,
    trackId: HashId,
    metadata: z.optional(
      z.object({
        isSaveOfRepost: z.boolean()
      })
    )
  })
  .strict()

export type SaveTrackRequest = z.input<typeof SaveTrackSchema>

export const UnsaveTrackSchema = z
  .object({
    userId: HashId,
    trackId: HashId
  })
  .strict()

export type UnsaveTrackRequest = z.input<typeof UnsaveTrackSchema>
