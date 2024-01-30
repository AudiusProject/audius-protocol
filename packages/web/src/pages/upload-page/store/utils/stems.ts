import {
  StemCategory,
  ID,
  StemUpload,
  Track,
  StemTrack
} from '@audius/common/models'
import {} from '@audius/common'

export const updateAndFlattenStems = (
  stems: StemUpload[][],
  parentTrackIds: ID[]
) => {
  return stems.flatMap((stemList, i) => {
    const parentTrackId = parentTrackIds[i]

    return stemList.map((stem) => {
      const metadata = createStemMetadata({
        parentTrackId,
        track: stem.metadata,
        stemCategory: stem.category
      })
      return {
        metadata,
        track: {
          ...stem,
          metadata
        }
      }
    })
  })
}

export const createStemMetadata = ({
  parentTrackId,
  track,
  stemCategory
}: {
  parentTrackId: ID
  track: Track
  stemCategory: StemCategory
}): StemTrack => {
  return {
    ...track,
    is_downloadable: true,
    download: {
      cid: null,
      is_downloadable: true,
      // IMPORTANT: Stems never require a follow to download in their metadata
      // but should determine their downloadability based on the parent track's
      // requirements.
      requires_follow: false
    },
    stem_of: {
      parent_track_id: parentTrackId,
      category: stemCategory
    }
  }
}
