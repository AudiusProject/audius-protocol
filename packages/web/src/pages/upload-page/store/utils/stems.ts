import { StemCategory, ID, StemUploadWithFile } from '@audius/common/models'
import { TrackForUpload } from '@audius/common/store'

export const prepareStemsForUpload = (
  stems: StemUploadWithFile[],
  parentTrackId: ID
) => {
  return stems.map((stem) => {
    const metadata = createStemMetadata({
      parentTrackId,
      track: stem.metadata,
      stemCategory: stem.category ?? StemCategory.OTHER
    })
    return {
      ...stem,
      metadata
    }
  })
}

export const createStemMetadata = ({
  parentTrackId,
  track,
  stemCategory
}: {
  parentTrackId: ID
  track: TrackForUpload['metadata']
  stemCategory: StemCategory
}): TrackForUpload['metadata'] => {
  return {
    ...track,
    is_downloadable: true,
    stem_of: {
      parent_track_id: parentTrackId,
      category: stemCategory
    }
  }
}
