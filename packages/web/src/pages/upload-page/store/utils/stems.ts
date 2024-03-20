import {
  StemCategory,
  ID,
  StemUpload,
  Track,
  StemTrack
} from '@audius/common/models'

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
        stemCategory: stem.category ?? StemCategory.OTHER
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
    stem_of: {
      parent_track_id: parentTrackId,
      category: stemCategory
    }
  }
}
