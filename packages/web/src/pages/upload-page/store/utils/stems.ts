import { StemCategory, ID, StemUploadWithFile } from '@audius/common/models'

import { TrackForUpload } from 'pages/upload-page/types'

export const updateAndFlattenStems = (
  stems: StemUploadWithFile[][],
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
        ...stem,
        metadata
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
  track: TrackForUpload['metadata']
  stemCategory: StemCategory
}): TrackForUpload['metadata'] => {
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
